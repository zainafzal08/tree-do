import { Vector } from "./vector";

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
}

export interface TodoItem {
    id: string;
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