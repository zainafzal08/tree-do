import { BaseNode } from "./node";
import { RootNode } from "./root_node";
import { TodoNode } from "./todo_node";
import { Vector } from "./vector";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number
}

export interface Queryable {
  id: string;
}

export interface PointerContext {
  position: Vector|null;
  pressed: boolean;
}

export interface ItemColorPalette {
  fillColor: string;
  strokeColor: string;
  shadowColor: string;
  textColor: string;
  connectorColor: string;
  checkCircleStroke: string;
}

export interface TodoItem  extends Queryable {
    text: string;
    done: boolean;
    /** Unix timestamp */
    creationTime: number;
  }
  
  /** Represents 1 mutation to the todo item state. */
  interface TodoMutation {
    type: "todo";
    newItem?: {
      itemId: string;
      parent: string;
    };
    /**
     * This is a order sensitive list, items were removed lower index to high
     * index.
     */
    removedItems?: {
      itemId: string;
      parent: string;
    }[];
    movedItems?: {
      itemId: string;
      oldParent: string;
      newParent: string;
    }[];
  }
  
export interface SettingsMutation {
    type: "settings";
    preferedColor: "blue" | "red";
  }
  
export type Mutation = TodoMutation | SettingsMutation;

export interface Project {
  id: string;
  name: string;
  rootNode: RootNode;
  /** Map to speed up finding a node in the tree given an id. */
  todoItemLookup: Map<string, TodoNode>;
  /** Map to speed up finding a nodes parent in the tree. */
  todoItemParentLookup: Map<string, BaseNode>;
}

export interface SerializedItem extends TodoItem {
  /** Child item IDs. */
  children: string[];
}

export interface SerializedProject {
  id: string;
  name: string;
  items: SerializedItem[];
  rootChildren: string[];
}

export interface SerializedState {
  version: number;
  currentProject: string;
  allProjects: SerializedProject[];
}