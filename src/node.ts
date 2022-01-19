import { BoundingBox, PointerContext } from "./data_types";
import { IS_DEBUG } from "./debug";
import { Vector } from "./vector";
import { LAYOUT } from "./drawing_helpers";

export abstract class BaseNode {
  id: string;

  private children: BaseNode[] = [];
  private boundingBox: BoundingBox|null = null;

	abstract getDimentionsOnCanvas(ctx: CanvasRenderingContext2D): {
		width: number,
		height: number
	};

	abstract getOutgoingConnectorColor(): string;

	abstract drawMyself(
		ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
		state: 'hover' | 'active'): void;

  addChild(node: BaseNode) {
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
  
  isPointInsideMe(p: Vector) {
    if (!this.boundingBox) {
      throw new Error('isPointInsideMe called before first paint.');
    } 
    return p.isInBox(
      this.boundingBox.x,
      this.boundingBox.y,
      this.boundingBox.width,
      this.boundingBox.height
    )
  }

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
    this.boundingBox = {
      x: myPosition.x,
      y: myPosition.y,
      width: myDimentions.width,
      height: myDimentions.height
    };
    if (pointerContext.position && this.isPointInsideMe(pointerContext.position)) {
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
    return totalHeight;
  }

  getTotalWidth(ctx: CanvasRenderingContext2D) {
    let childrenWidth = 0;
    if (this.children.length > 0) {
      childrenWidth = Math.max(
        ...this.children.map(child => child.getTotalWidth(ctx))
      );
    }
    const myWidth = this.getDimentionsOnCanvas(ctx).width;
    return myWidth + LAYOUT.horizontalItemPadding + childrenWidth;
  }

  /** Returns which todo item the mouse position `p` is over. */
  getItemByPoint(p: Vector) {
    if (this.isPointInsideMe(p)) return this;
    for (const child of this.children) {
      const item = child.getItemByPoint(p);
      if (item) {
        return item;
      }
    }
    return null;
  }

  private drawConnections(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, childrenPositions: Vector[]) {
    if (childrenPositions.length === 0) {
      return
    }
    const connectorRadius = 6;
    const arrowHeadHeight = 16;
    const landingZoneLength = 32;
    const connectorColor = this.getOutgoingConnectorColor();

    ctx.beginPath();
    ctx.fillStyle = connectorColor;
    ctx.lineWidth = 4;
    ctx.ellipse(
      fromX,
      fromY,
      connectorRadius,
      connectorRadius,
      0,
      0,
      2*Math.PI
    );
    ctx.fill();
    ctx.closePath();

    const startX = fromX;
    const startY = fromY;
    for (const child of childrenPositions) {
      const toX = child.x - LAYOUT.box.connectorPadding;
      const toY = child.y;
      ctx.beginPath();
      ctx.strokeStyle = connectorColor;
      ctx.moveTo(startX, startY);
      ctx.lineTo(toX-landingZoneLength, toY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.fillStyle = connectorColor;
      ctx.beginPath();
      ctx.moveTo(toX, toY - arrowHeadHeight/2);
      ctx.lineTo(toX + arrowHeadHeight, toY);
      ctx.lineTo(toX, toY + arrowHeadHeight/2);
      ctx.closePath();
      ctx.fill();
    }
  }

}
