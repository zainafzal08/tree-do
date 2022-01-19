import { Vector } from "./vector";
import { Gesture } from "./gesture";
import { appState } from "./app_state/app_state";
import { IS_DEBUG } from "./debug";
import { ContextMenu } from "./web_ui/context-menu";
import { AppDialog } from "./web_ui/app-dialog";
import { v4 as uuidv4 } from "uuid";
import { TodoNode } from "./todo_node";
import { ADD_CIRCLE_ICON, DELETE_ALL_ICON, DELETE_ICON } from "./web_ui/icons";
import { RootNode } from "./root_node";
import { BoundingBox } from "./data_types";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_SPEED = 0.01;
/**
 * We give the canvas a larger coordinate space then the screen so multiple
 * canvas pixels map to 1 css pixel. This ends up producing more sharp shapes
 * with less blurryness.
 */
const RESOLUTION_MULTIPLIER = 2;
const HORIZONTAL_PADDING = 32;

const DEFAULT_MENU_ITEMS = [
  {
    label: "Add Child",
    id: "add",
    icon: ADD_CIRCLE_ICON,
  },
  {
    label: "Delete Item",
    id: "delete",
    icon: DELETE_ICON,
  },
  {
    label: "Delete Item & Children",
    id: "delete-all",
    icon: DELETE_ALL_ICON,
  },
];

const ROOT_MENU_ITEMS = [
  {
    label: "Add Child",
    id: "add",
    icon: ADD_CIRCLE_ICON,
  },
  {
    label: "Clear Project",
    id: "clear",
    icon: DELETE_ALL_ICON,
  },
];

/** Takes over a HTMLCanvasElement to render arbitrary items. */
export class Canvas {
  private scale: number = 1;
  // Tracks actions we've completed in the last frame to help us debounce events
  // which fire quickly.
  private actionPerformedInFrame = new Set<string>();
  private currentGesture: Gesture | null = null;
  private offset = new Vector(0, 0);
  private contextMenuOver: TodoNode | null = null;

  private domElement: HTMLCanvasElement;
  private contextMenu: ContextMenu;
  private dialog: AppDialog;
  private width: number;
  private height: number;
  private mousePosition: Vector | null = null;
  private pointerPressed = false;
  private dragAllowed = false;

  constructor(element: HTMLCanvasElement) {
    this.domElement = element;
    this.contextMenu = document.querySelector("context-menu") as ContextMenu;
    this.contextMenu.addEventListener(
      "context-menu-selection",
      (e: CustomEvent) => {
        this.onContextMenuSelection(e.detail);
      }
    );

    this.dialog = document.querySelector("app-dialog") as AppDialog;

    // Event Listeners.
    window.addEventListener("resize", () => this.onResize());
    this.domElement.addEventListener("contextmenu", (e) => {
      this.onRightClick(e);
    });
    this.domElement.addEventListener("wheel", (e) => this.onScroll(e));
    this.domElement.addEventListener("pointerdown", (e) => {
      this.onGestureStart(e);
      if (e.button === 0) {
        this.contextMenu.hide();
        this.pointerPressed = true;
      }
    });
    this.domElement.addEventListener("pointermove", (e) => {
      this.onGestureUpdate(e);
      this.onPointerMove(e);
    });
    this.domElement.addEventListener("pointerleave", () =>
      this.onPointerLeave()
    );
    this.domElement.addEventListener("pointerup", (e) => {
      this.onGestureEnd(e);
      this.onPointerUp(e);
      this.pointerPressed = false;
    });
    this.onResize();
    this.paint();
  }

  onContextMenuSelection(selection: string) {
    if (selection === "add") {
      this.dialog.show({
        title: "Add New Item",
        content: {
          type: "text-input",
          label: "Title",
          validationFn: (t: string) => t.length > 0,
        },
        action: "add",
        callback: (text: string) => this.addNewItem(text),
      });
    } else if (selection === "delete") {
      appState.removeTodoItem(this.contextMenuOver.id, "mv2parent");
    } else if (selection === "delete-all") {
      appState.removeTodoItem(this.contextMenuOver.id, "killall");
    } else if (selection === "clear") {
      appState.clearProject();
    }
  }

  onRightClick(e: MouseEvent) {
    const windowPosition = new Vector(e.clientX, e.clientY);
    const canvasPosition = this.fromPointerEventToMousePosition(e);
    const item = appState.getRootNode().getItemByPoint(canvasPosition);
    if (item) {
      this.contextMenuOver = item;
      if (item instanceof RootNode) {
        this.contextMenu.show(windowPosition, ROOT_MENU_ITEMS);
      } else {
        this.contextMenu.show(windowPosition, DEFAULT_MENU_ITEMS);
      }
    }
    e.preventDefault();
  }

  onResize() {
    if (this.actionPerformedInFrame.has("resize")) return;
    this.actionPerformedInFrame.add("resize");
    const br = this.domElement.getBoundingClientRect();
    this.width = br.width * RESOLUTION_MULTIPLIER;
    this.height = br.height * RESOLUTION_MULTIPLIER;
    this.domElement.setAttribute("width", String(this.width));
    this.domElement.setAttribute("height", String(this.height));
  }

  onGestureStart(e: PointerEvent) {
    if (!this.dragAllowed) return;
    this.currentGesture = new Gesture(e);
  }

  onGestureUpdate(e: PointerEvent) {
    if (!this.currentGesture) return;
    this.contextMenu.hide();
    this.currentGesture.update(e);
  }

  onGestureEnd(e: PointerEvent) {
    if (!this.currentGesture) return;
    this.offset = this.offset.add(this.currentGesture.getDelta());
    this.currentGesture = null;
  }

  onScroll(e: WheelEvent) {
    if (this.actionPerformedInFrame.has("scroll")) return;
    this.contextMenu.hide();
    const oldScale = this.scale;
    this.scale += e.deltaY * -1 * ZOOM_SPEED;
    this.scale = Math.min(Math.max(MIN_ZOOM, this.scale), MAX_ZOOM);
    // Adjust offset such that the point we zoomed on remains the same, i.e
    // implement "zoom to point".
    const adjustment = this.mousePosition.mult(this.scale - oldScale);
    this.offset = this.offset.sub(adjustment);
    this.actionPerformedInFrame.add("scroll");
    e.preventDefault();
  }

  onPointerMove(e: PointerEvent) {
    this.mousePosition = this.fromPointerEventToMousePosition(e);
  }

  onPointerLeave() {
    this.mousePosition = null;
  }

  onPointerUp(e: PointerEvent) {
    if (e.button !== 0) return;
    const p = this.fromPointerEventToMousePosition(e);
    const item = appState.getRootNode().getItemByPoint(p);
    if (item) {
      item.done = !item.done;
      appState.save();
    }
  }

  getCurrentPan() {
    let pan = new Vector(0, 0);
    if (this.currentGesture) {
      pan = this.currentGesture.getDelta();
    }
    return pan;
  }

  paint() {
    requestAnimationFrame(() => this.paint());
    this.actionPerformedInFrame.clear();
    const ctx = this.domElement.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const pan = this.getCurrentPan();
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.setTransform(
      this.scale,
      0,
      0,
      this.scale,
      this.offset.x + pan.x,
      this.offset.y + pan.y
    );
    if (IS_DEBUG && this.mousePosition) {
      ctx.beginPath();
      ctx.ellipse(this.mousePosition.x, this.mousePosition.y, 5, 5, 0, 0, 360);
      ctx.fillStyle = "blue";
      ctx.fill();
    }
    const root = appState.getRootNode();
    const totalHeight = root.getTotalHeight(ctx);
    const x = HORIZONTAL_PADDING;
    const y = this.height / 2 - totalHeight / 2;
    const itemHovered = root.draw(ctx, x, y, {
      position: !this.currentGesture ? this.mousePosition : null,
      pressed: this.pointerPressed,
    });
    const boundingBox:BoundingBox = {
      x,
      y,
      width: root.getTotalWidth(ctx),
      height: totalHeight
    };
    if (IS_DEBUG) {
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.rect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
      ctx.stroke();
    }
    if (itemHovered) {
      // We shouldn't register any drags on items as pans.
      this.dragAllowed = false;
      this.domElement.setAttribute("data-cursor", "pointer");
    } else {
      this.dragAllowed = true;
      this.domElement.setAttribute("data-cursor", "grabber");
    }
  }

  private addNewItem(text: string) {
    const parentId = this.contextMenuOver!.id;
    appState.addTodoItem(
      {
        id: uuidv4(),
        text,
        done: false,
        creationTime: Date.now(),
      },
      parentId
    );
  }

  private fromPointerEventToMousePosition(e: MouseEvent) {
    // Assume canvas takes up whole screen.
    const pan = this.getCurrentPan();
    return new Vector(
      (e.clientX * RESOLUTION_MULTIPLIER - this.offset.x - pan.x) / this.scale,
      (e.clientY * RESOLUTION_MULTIPLIER - this.offset.y - pan.y) / this.scale
    );
  }
}
