import { Mutation, Project, SerializedItem, SerializedProject, SerializedState, TodoItem } from "../data_types";
import { BaseNode } from "../node";
import { RootNode } from "../root_node";
import { TodoNode } from "../todo_node";
import { v4 as uuidv4 } from "uuid";
import { PersistantStorageManager } from "./persistant_storage";

const MAX_UNDO_QUEUE_LENGTH = 100;

function bfs(startQueue: BaseNode[]) {
  const queue = [...startQueue];
  const visited = new Set();
  const result = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    result.push(curr);
    for (const child of curr.getChildren()) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        queue.push(child);
      }
    }
  }
  return result;
}

function deserializeProject(p: SerializedProject):Project {
  let rootNode = new RootNode(p.name);
  const todoItemLookup = new Map<string, TodoNode>();
  const todoItemParentLookup = new Map<string, BaseNode>();
  // Set up todoItemLookup and convert all items into nodes.
  for (const item of p.items) {
    todoItemLookup.set(item.id, new TodoNode(item));
  }
  // Set up root node.
  for (const childId of p.rootChildren) {
    const childNode = todoItemLookup.get(childId)
    rootNode.addChild(childNode);
    todoItemParentLookup.set(childNode.id, rootNode);
  }
  // Set up all other nodes
  for (const item of p.items) {
    const node = todoItemLookup.get(item.id);
    for (const childId of item.children) {
      const childNode = todoItemLookup.get(childId);
      node.addChild(childNode);
      todoItemParentLookup.set(childId, node);
    }
  }

  return {
    id: p.id,
    name: p.name,
    rootNode,
    todoItemLookup,
    todoItemParentLookup
  }
}

/**
 * Tracks app state and provides methods for safe state mutations.
 *
 * This class assumes that the number of todo items is low (< 100) and as such
 * is not optimised. Eachtime we copy our app state to localstorage we
 * reserialize our whole app state. To extend the app to support larger numbers
 * of items we need to shift to interacting with a indexedDB table and only
 * updating what needs to for a specific mutation.
 */
export class AppState {
  currentProjectId: string | null = null;
  allProjects: Record<string, Project> = {};

  private undoQueue: Mutation[] = [];
  private redoQueue: Mutation[] = [];
  private hydrated = false;
  private persistantStorageManager = new PersistantStorageManager()

  /**
   * List of todo items that have been directly or indirectly deleted in the
   * current session. Useful for performing Undos or Redos.
   */
  private todoItemsTrash = new Map<string, BaseNode>();

  get currentProject() {
    if (!this.currentProjectId) {
      throw new Error("No project set");
    }
    const project = this.allProjects[this.currentProjectId];
    if (!project) {
      throw new Error("Invalid current project id");
    }
    return project;
  }

  get todoItemLookup() {
    return this.currentProject.todoItemLookup;
  }

  get todoItemParentLookup() {
    return this.currentProject.todoItemParentLookup;
  }

  getRootNode() {
    return this.currentProject.rootNode;
  }

  addTodoItem(item: TodoItem, parentId: string) {
    const newNode = new TodoNode(item);
    let parentNode;
    if (parentId === "__ROOT__") {
      parentNode = this.getRootNode();
    } else if (this.todoItemLookup.has(parentId)) {
      parentNode = this.todoItemLookup.get(parentId);
    } else {
      throw new Error("Non-existant parent id supplied");
    }
    parentNode.addChild(newNode);

    this.todoItemLookup.set(newNode.id, newNode);
    this.todoItemParentLookup.set(newNode.id, parentNode);

    this.undoQueue.push({
      type: "todo",
      newItem: {
        itemId: item.id,
        parent: parentId,
      },
    });
    this.clearRedoQueue();
    this.save();
  }

  removeTodoItem(
    itemId: string,
    /**
     * Defines what to do if a todo item is deleted while it has children.
     *     killall   : Kill all the children as well.
     *     mv2root   : Make all chilren items children of root
     *     mv2parent : Make all children items children of the deleted items
     *                 parent.
     */
    orphanResolutionStrategy: "killall" | "mv2root" | "mv2parent"
  ) {
    if (!this.todoItemLookup.has(itemId)) {
      throw new Error("Non-existant id supplied");
    }
    const deadNode = this.todoItemLookup.get(itemId);
    const deadNodeParent = this.todoItemParentLookup.has(deadNode.id)
      ? this.todoItemParentLookup.get(deadNode.id)
      : null;
    const orphans = this.removeNode(deadNode);

    // Deal with orphans.
    if (orphanResolutionStrategy === "killall") {
      const allChildrenNodes = bfs(orphans);
      for (const child of allChildrenNodes) {
        this.removeNode(child);
      }
    } else {
      let target: BaseNode;
      if (orphanResolutionStrategy === "mv2root") {
        target = this.getRootNode();
      } else {
        target = deadNodeParent;
      }

      for (const orphan of orphans) {
        target.addChild(orphan);
        this.todoItemParentLookup.set(orphan.id, target);
      }
    }

    // TODO: update undo queue.
    this.clearRedoQueue();
    this.save();
  }

  clearProject() {
    const allChildrenNodes = bfs(this.getRootNode().getChildren());
    for (const child of allChildrenNodes) {
      this.removeNode(child);
    }
  }

  undo() {
    if (this.undoQueue.length < 1) {
      return;
    } else if (this.undoQueue.length >= MAX_UNDO_QUEUE_LENGTH) {
      this.dropResourcesForMutation(this.undoQueue.shift());
    }
    const mutation = this.undoQueue.pop();
    this.redoQueue.push({ ...mutation });

    // TODO: invert mutation and apply.
  }

  redo() {
    if (this.redoQueue.length < 1) {
      return;
    }
    const mutation = this.redoQueue.pop();
    // TODO: apply mutation.
  }

  async hydrate() {
    await this.fetch();
    this.hydrated = true;
  }

  addProject(name: string) {
    if (!this.hydrated) {
      throw new Error("App state must be hydrated before mutations.");
    }
    const id = uuidv4();
    this.allProjects[id] = {
      id,
      name,
      rootNode: new RootNode(name),
      todoItemLookup: new Map(),
      todoItemParentLookup: new Map(),
    };
    this.save();
  }

  setProject(id: string) {
    if (!this.hydrated) {
      throw new Error("App state must be hydrated before mutations.");
    }
    const project = this.allProjects[id];
    if (!project) {
      throw new Error("Id does not exist");
    }
    this.currentProjectId = id;
  }

  async downsync() {
    // TODO: Pull from cloud into localstorage.
  }

  upsync() {
    // TODO: Add a mutation to a cloud queue.
  }

  async fetch() {
    const state = await this.persistantStorageManager.getState();
    if (!state) {
      return;
    }
    this.currentProjectId = state.currentProject;
    this.allProjects = {};
    for (const p of state.allProjects.map(p => deserializeProject(p))) {
      this.allProjects[p.id] = p;
    }
  }

  async save() {
    // For now we serialise our whole state.
    const allProjects:SerializedProject[] = [];
    for (const project of Object.values(this.allProjects)) {
      const rootChildren = project.rootNode.getChildren() as TodoNode[];
      const items:SerializedItem[] = bfs(rootChildren).map(node => ({
        id: node.id,
        text: node.text,
        done: node.done,
        creationTime: node.creationTime,
        children: node.getChildren().map(child => child.id)
      }));
      allProjects.push({
        id: project.id,
        name: project.name,
        items,
        rootChildren: rootChildren.map(child => child.id)
      });
    }
    const state: SerializedState = {
      version: 1,
      currentProject: this.currentProjectId,
      allProjects
    };
    this.persistantStorageManager.saveState(state);
  }

  /**
   * Disassoicate a node from it's parent and children and return any now
   * orphaned nodes.
   */
  private removeNode(node: TodoNode) {
    const deadNodeParent = this.todoItemParentLookup.has(node.id)
      ? this.todoItemParentLookup.get(node.id)
      : null;
    if (deadNodeParent !== null) {
      deadNodeParent.dropChild(node.id);
      this.todoItemParentLookup.delete(node.id);
    }
    this.todoItemLookup.delete(node.id);
    this.todoItemsTrash.set(node.id, node);
    return node.dropAllChildren();
  }

  private dropResourcesForMutation(mutation: Mutation) {
    if (mutation.type === "todo") {
      for (const removedItem of mutation.removedItems || []) {
        this.todoItemsTrash.delete(removedItem.itemId);
      }
    }
  }

  private clearRedoQueue() {
    for (const mutation of this.redoQueue) {
      this.dropResourcesForMutation(mutation);
    }
    this.redoQueue = [];
  }
}

export const appState = new AppState();
