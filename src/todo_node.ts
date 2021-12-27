import { ItemColorPalette, PointerContext, TodoItem } from "./data_types";
import { IS_DEBUG } from "./debug";
import { Vector } from "./vector";

/**
 * Note that these values are in canvas coordinates which are not 1:1 with
 * screen pixels. Each one is adjusted by a RESOLUTION_MULTIPLIER in canvas.ts
 * which maps multiple canvas pixels to each real screen pixel to reduce
 * blurryness.
 */
const LAYOUT = {
  box: {
    borderRadius: 16,
    defaultShadowOffset: 8,
    hoverShadowOffset: 12,
    activeShadowOffset: 4,
    minWidth: 400,
    fontSize: 28,
    lineBreakHeight: 4,
    // |<h_pad><text_width><between_pad><icon_width><h_pad>|<connector_pad>o-->
    hPadding: 24,
    vPadding: 32,
    textWidth: 256,
    betweenPadding: 64,
    iconWidth: 28,
    connectorPadding: 32,
  },
  verticalItemPadding: 64,
  horizontalItemPadding: 164,
};

const COLORS: ItemColorPalette = {
  fillColor: "#FFD9D9",
  strokeColor: "#E24646",
  shadowColor: "#E24646",
  textColor: "#E24646",
  connectorColor: "#DEDEDE"
};

// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
function drawBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Wraps `text` so it never extends past `maxWidth`. Adds line breaks after
 * words. Likely to break if maxWidth is too small. Will add an ellipse if text
 * extends past 3 lines.
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
) {
  const { fontSize } = LAYOUT.box;
  ctx.font = `${fontSize}px 'Ubuntu'`;
  const tokens = [];
  // Do a quick pass and break any words that are longer then maxWidth.
  for (const token of text.split(" ")) {
    if (token.length <= maxWidth) {
      tokens.push(token);
    } else {
      let word = token;
      while (word.length > maxWidth) {
        tokens.push(word.substr(0, maxWidth - 1) + "-");
        word = word.substr(maxWidth - 1);
      }
    }
  }
  const lines = [];
  let currLine = "";
  while (tokens.length > 0) {
    const token = tokens.shift();
    if (lines.length === 3) {
      break;
    }
    const proposedLine = currLine !== "" ? `${currLine} ${token}` : token;
    if (ctx.measureText(proposedLine).width > maxWidth) {
      lines.push(currLine);
      currLine = token;
    } else {
      currLine = proposedLine;
    }
  }
  lines.push(currLine);

  if (lines.length >= 3 || tokens.length > 0) {
    let trailingLine = lines[2];
    while (ctx.measureText(trailingLine + "...").width > maxWidth) {
      trailingLine = trailingLine.substr(0, trailingLine.length - 1);
    }
    lines[2] = trailingLine + "...";
  }
  return lines.slice(0, 3);
}

export class TodoNode {
  private root = false;
  private children: TodoNode[] = [];
  private cachedLines: string[] | null = null;
  private calculationCache = new Map<string, number>();

  id: string;
  text: string;
  done: boolean;
  /** Unix timestamp */
  creationTime: number;

  constructor(item: TodoItem | null) {
    if (!item) {
      this.root = true;
      this.id = "__ROOT_NODE__";
      return;
    }
    this.id = item.id;
    this.text = item.text;
    this.done = item.done;
    this.creationTime = item.creationTime;
  }

  addChild(node: TodoNode) {
    this.children.push(node);
  }

  dropChild(id: string) {
    this.children = this.children.filter((child) => child.id !== id);
  }

  dropAllChildren() {
    const cpy = this.children;
    this.children = [];
    return cpy;
  }

  getChildren() {
    return this.children;
  }

  // TODO: move rendering logic into a seperate class so we seperate model and
  // view more cleanly.

  /**
   * Draws this node and it's children. `x` and `y` spexify the top left
   * position of the bounding box of the whole tree.
   */
  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    pointerContext: PointerContext
  ) {
    let pointerOverItem = false;
    let state = undefined;
    const totalHeight = this.getTotalHeight(ctx);
    const myDimentions = this.getDimentionsOnCanvas(ctx);
    const myPosition = new Vector(
      x,
      y + totalHeight / 2 - myDimentions.height / 2
    );
    if (
      pointerContext.position?.isInBox(
        myPosition.x,
        myPosition.y,
        myDimentions.width,
        myDimentions.height
      )
    ) {
      pointerOverItem = true;
      state = pointerContext.pressed ? "active" : "hover";
    }
    this.drawMyself(ctx, myPosition.x, myPosition.y, state);
    if (IS_DEBUG) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(myPosition.x, myPosition.y, myDimentions.width, myDimentions.height);
      ctx.strokeStyle = 'blue';
      ctx.stroke();
      ctx.restore();
    }
    // Render children.
    let childY = y;
    // List of the middle left point on each child, used to draw our arrows
    // between items.
    const childrenPositions:Vector[] = [];
    for (const child of this.children) {
      const childHeight = child.getTotalHeight(ctx);
      const myWidth = this.getDimentionsOnCanvas(ctx).width;
      const childX = x + myWidth + LAYOUT.horizontalItemPadding;
      childrenPositions.push(new Vector(
        childX,
        childY + childHeight/2
      ));
      const childHasPointer = child.draw(
        ctx,
        childX,
        childY,
        pointerContext
      );
      if (childHasPointer) {
        pointerOverItem = true;
      }
      childY += childHeight + LAYOUT.verticalItemPadding;
    }

    const fromX = x + myDimentions.width + LAYOUT.box.connectorPadding;
    const fromY = y + totalHeight/2;
    this.drawConnections(ctx, fromX, fromY, childrenPositions);
    return pointerOverItem;
  }

  getTotalHeight(ctx: CanvasRenderingContext2D) {
    if (this.calculationCache.has("totalHeight")) {
      return this.calculationCache.get("totalHeight");
    }
    let totalHeight;
    if (this.children.length > 0) {
      totalHeight =
        this.children.reduce(
          (acc, child) => acc + child.getTotalHeight(ctx),
          0
        ) +
        (this.children.length - 1) * LAYOUT.verticalItemPadding;
    } else {
      totalHeight = this.getDimentionsOnCanvas(ctx).height;
    }
    this.calculationCache.set("totalHeight", totalHeight);
    return totalHeight;
  }

  getTotalWidth(ctx: CanvasRenderingContext2D) {
    // TODO: consider children.
    // TODO: cache this value, it's needed often.
    return this.getDimentionsOnCanvas(ctx).width;
  }

  getDimentionsOnCanvas(ctx: CanvasRenderingContext2D) {
    const {
      hPadding,
      fontSize,
      minWidth,
      iconWidth,
      betweenPadding,
      textWidth,
      lineBreakHeight,
      vPadding,
    } = LAYOUT.box;
    if (this.root) {
      return {
        width: 0,
        height: 0,
      };
    }
    const lines = this.getLines(ctx);
    const textBoxHeight =
      lines.length * fontSize + lineBreakHeight * (lines.length - 1);
    const height = textBoxHeight + 2 * vPadding;
    const width = Math.max(
      2 * hPadding + textWidth + iconWidth + betweenPadding,
      minWidth
    );
    return {
      width,
      height,
    };
  }

  private drawConnections(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, childrenPositions: Vector[]) {
    if (childrenPositions.length === 0) {
      return
    }
    const connectorRadius = 6;
    const arrowHeadHeight = 16;
    const landingZoneLength = 32;
    ctx.beginPath();
    ctx.fillStyle = COLORS.connectorColor;
    ctx.lineWidth = 4;
    ctx.ellipse(
      fromX,
      fromY,
      connectorRadius,
      connectorRadius,
      0,
      0,
      360
    );
    ctx.fill();
    ctx.closePath();

    const startX = fromX;
    const startY = fromY;
    for (const child of childrenPositions) {
      const toX = child.x - LAYOUT.box.connectorPadding;
      const toY = child.y;
      ctx.beginPath();
      ctx.strokeStyle = COLORS.connectorColor;
      ctx.moveTo(startX, startY);
      ctx.lineTo(toX-landingZoneLength, toY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.fillStyle = COLORS.connectorColor;
      ctx.beginPath();
      ctx.moveTo(toX, toY - arrowHeadHeight/2);
      ctx.lineTo(toX + arrowHeadHeight, toY);
      ctx.lineTo(toX, toY + arrowHeadHeight/2);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawItem(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state?: "hover" | "active"
  ) {
    const {
      borderRadius,
      defaultShadowOffset,
      hoverShadowOffset,
      activeShadowOffset,
      hPadding,
      fontSize,
      lineBreakHeight,
      vPadding,
    } = LAYOUT.box;
    ctx.save();
    if (this.text.length < 1) {
      ctx.restore();
      throw new Error("No text to render for this todo item.");
    }

    const { width, height } = this.getDimentionsOnCanvas(ctx);
    let shadowOffset = defaultShadowOffset;
    if (state === "hover") {
      shadowOffset = hoverShadowOffset;
    } else if (state === "active") {
      shadowOffset = activeShadowOffset;
    }
    // We draw the actual box a bit offset depending on the elevation we are
    // aiming for. This does mean the bounding rect returned by
    // getDimentionsOnCanvas is slightly off since it assumes there is no shadow
    // but it still gets the job done for any layout applications.
    x -= shadowOffset;
    y -= shadowOffset;

    drawBox(
      ctx,
      x + shadowOffset,
      y + shadowOffset,
      width,
      height,
      borderRadius
    );
    ctx.fillStyle = COLORS.shadowColor;
    ctx.fill();
    drawBox(ctx, x, y, width, height, borderRadius);
    ctx.fillStyle = COLORS.fillColor;
    ctx.strokeStyle = COLORS.strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.textColor;
    ctx.font = `${fontSize}px 'Ubuntu'`;
    let currLinePos = { x: x + hPadding, y: y + fontSize + vPadding };
    for (const line of this.getLines(ctx)) {
      ctx.fillText(line, currLinePos.x, currLinePos.y);
      currLinePos.y += fontSize + lineBreakHeight;
    }
    ctx.restore();
  }

  /** Draw this todo item on screen with it's top left point at x, y. */
  private drawMyself(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state?: "hover" | "active"
  ) {
    if (!this.root) {
      this.drawItem(ctx, x, y, state);
    }
  }

  /** Returns the text for this node as an array of wrapped lines. */
  private getLines(ctx: CanvasRenderingContext2D) {
    if (this.cachedLines) {
      // Avoid rewrapping the text on each frame if we can.
      return this.cachedLines;
    }
    this.cachedLines = wrapText(ctx, this.text, LAYOUT.box.textWidth);
    return this.cachedLines;
  }
}
