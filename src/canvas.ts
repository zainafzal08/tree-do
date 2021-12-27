import { Vector } from "./vector";
import { Gesture } from "./gesture";
import { AppState } from "./app_state/app_state";
import { IS_DEBUG } from "./debug";

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

/** Takes over a HTMLCanvasElement to render arbitrary items. */
export class Canvas {
  private scale: number = 1;
  // Tracks actions we've completed in the last frame to help us debounce events
  // which fire quickly.
  private actionPerformedInFrame = new Set<string>();
  private currentGesture: Gesture | null = null;
  private offset = new Vector(0, 0);
  private appState = new AppState();

  private domElement: HTMLCanvasElement;
  private width: number;
  private height: number;
  private mousePosition: Vector | null = null;
  private pointerPressed = false;
  private dragAllowed = false;

  constructor(element: HTMLCanvasElement) {
    this.domElement = element;

    // Event Listeners.
    window.addEventListener("resize", () => this.onResize());
    this.domElement.addEventListener("wheel", (e) => this.onScroll(e));
    this.domElement.addEventListener("pointerdown", (e) => {
      this.onGestureStart(e);
      this.pointerPressed = true;
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
      this.pointerPressed = false;
    });

    this.appState.hydrate().then(() => {
      this.onResize();
      this.paint();
    });
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
    this.currentGesture.update(e);
  }

  onGestureEnd(e: PointerEvent) {
    if (!this.currentGesture) return;

    this.offset = this.offset.add(this.currentGesture.getDelta());
    this.currentGesture = null;
  }

  onScroll(e: WheelEvent) {
    if (this.actionPerformedInFrame.has("scroll")) return;
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
    // Assume canvas takes up whole screen.
    const pan = this.getCurrentPan();
    this.mousePosition = new Vector(
      (e.clientX * RESOLUTION_MULTIPLIER - this.offset.x - pan.x) / this.scale,
      (e.clientY * RESOLUTION_MULTIPLIER - this.offset.y - pan.y) / this.scale
    );
  }

  onPointerLeave() {
    this.mousePosition = null;
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

    const root = this.appState.getRootNode();
    const totalHeight = root.getTotalHeight(ctx);
    const y = this.height/2 - totalHeight/2;
    const itemHovered = root.draw(ctx, HORIZONTAL_PADDING, y, {
      position: !this.currentGesture ? this.mousePosition : null,
      pressed: this.pointerPressed
    });
    if (itemHovered) {
      // We shouldn't register any drags on items as pans.
      this.dragAllowed = false;
      this.domElement.setAttribute("data-cursor", "pointer");
    } else {
      this.dragAllowed = true;
      this.domElement.setAttribute("data-cursor", "grabber");
    }
  }
}
