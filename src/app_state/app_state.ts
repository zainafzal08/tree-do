import localforage from "localforage";
import { Mutation, TodoItem } from "../data_types";
import { TodoNode } from "../todo_node";

const MAX_UNDO_QUEUE_LENGTH = 100;

function bfs(startQueue: TodoNode[]) {
  const queue = startQueue;
  const visited = new Set();
  const result = [];
  while (queue.length > 0) {
    const curr = queue.pop();
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
  private undoQueue: Mutation[] = [];
  private redoQueue: Mutation[] = [];
  /** List of todo nodes with no parent. */
  private rootNode: TodoNode = new TodoNode(null);
  /** Map to speed up finding a node in the tree given an id. */
  private todoItemLookup = new Map<string, TodoNode>();
  /** Map to speed up finding a nodes parent in the tree. */
  private todoItemParentLookup= new Map<string, TodoNode>();

  /**
   * List of todo items that have been directly or indirectly deleted in the
   * current session. Useful for performing Undos or Redos.
   */
  private todoItemsTrash = new Map<string, TodoNode>();

  getRootNode() {
    return this.rootNode;
  }

  addTodoItem(item: TodoItem, parentId: string | null) {
    const newNode = new TodoNode(item);
    let parentNode;
    if (parentId === null) {
      parentNode = this.rootNode;
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
    this.upsync();
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
      let target: TodoNode | null;
      if (orphanResolutionStrategy === "mv2root") {
        target = this.rootNode;
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
    this.upsync();
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
    // TODO: pull data from local storage.

    this.addTodoItem({
      id: '1',
      text: 'Learn code',
      done: false,
      creationTime: 0
    }, null);


    this.addTodoItem({
      id: '4',
      text: 'Learn boobies lol',
      done: false,
      creationTime: 0
    }, '1');

    this.addTodoItem({
      id: '5',
      text: 'Learn butts lmao',
      done: false,
      creationTime: 0
    }, '1');

    this.addTodoItem({
      id: '2',
      text: 'Learn computers',
      done: false,
      creationTime: 0
    }, null);

    this.addTodoItem({
      id: '3',
      text: 'Learn how to do that thing with the thing and the thing',
      done: false,
      creationTime: 0
    }, null);
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
      for (const removedItem of (mutation.removedItems || [])) {
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

  private upsync() {
    // TODO: push our local state into localstorage.
  }
}
