import { colorInterp, drawBox, LAYOUT, linearInterp, TIMINGS, toRadians, wrapText } from './drawing_helpers';
import { TodoItem } from './data_types';
import { BaseNode } from './node';
import { Vector } from './vector';

interface ItemAnimation {
  startTime: number;
  endTime: number;
  startState: 'active' | 'hover' | undefined;
  endState: 'active' | 'hover' | undefined;
}

export class TodoNode extends BaseNode {
  text: string;
  done: boolean;
  /** Unix timestamp */
  creationTime: number;

  private lastState: 'hover' | 'active' | undefined = undefined;
  private runningAnimation: ItemAnimation|null = null;

  constructor(item: TodoItem) {
    super();
    this.id = item.id;
    this.text = item.text;
    this.done = item.done;
    this.creationTime = item.creationTime;
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
    const lines = wrapText(ctx, this.text, LAYOUT.box.textWidth, LAYOUT.box.fontSize);
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

  getOutgoingConnectorColor() {
    return "#DEDEDE";
  }

  private getColors(state?: 'hover' | 'active') {
    const colors = {
      fillColor: "#FFD9D9",
      strokeColor: "#E24646",
      shadowColor: "#E24646",
      textColor: "#E24646",
      checkCircleStroke: "#E24646"
    };
    
    if (this.runningAnimation) {
      const {endState, startTime, endTime} = this.runningAnimation;
      const p = (Date.now() - startTime) / (endTime - startTime);

      if (!this.done && endState === 'active') {
        const fillColor = colorInterp("#FFD9D9", "#E76868", p);
        const strokeColor = colorInterp("#E24646", "#E76868", p);
        const textColor = colorInterp("#E24646", "#FFFFFF", p);
        const checkCircleStroke = colorInterp("#E24646", "#FFFFFF", p);

        return {
          ...colors,
          fillColor: fillColor,
          strokeColor: strokeColor,
          textColor: textColor,
          checkCircleStroke: checkCircleStroke
        };
      } else if (this.done && endState === 'active') {
        const fillColor = colorInterp("#E76868", "#FFD9D9", p);
        const strokeColor = colorInterp("#E76868", "#E24646", p);
        const textColor = colorInterp("#FFFFFF", "#E24646", p);
        const checkCircleStroke = colorInterp("#FFFFFF", "#E24646", p);

        return {
          ...colors,
          fillColor: fillColor,
          strokeColor: strokeColor,
          textColor: textColor,
          checkCircleStroke: checkCircleStroke
        };
      }
    }
    
    if (!this.done && state === 'active') {
      return {
        ...colors,
        fillColor: '#E76868',
        strokeColor: '#E76868',
        textColor: 'white',
        checkCircleStroke: 'white'
      };
    }
    
    if (this.done && state !== 'active') {
      return {
        ...colors,
        fillColor: '#E76868',
        strokeColor: '#E76868',
        textColor: 'white',
        checkCircleStroke: 'white'
      };
    }
  
    return colors;
  }
  
  private getShadowOffset(state: 'hover' | 'active' | undefined) {
    const {
      defaultShadowOffset,
      hoverShadowOffset,
      activeShadowOffset
    } = LAYOUT.box;
    let shadowOffset = defaultShadowOffset;
    if (this.runningAnimation) {
      const {startState, endState, startTime, endTime} = this.runningAnimation;
      let startOffset = defaultShadowOffset;
      let endOffset = defaultShadowOffset;
      if (startState === 'hover') {
        startOffset = hoverShadowOffset;
      } else if (startState === 'active') {
        startOffset = activeShadowOffset;
      }
      if (endState === 'hover') {
        endOffset = hoverShadowOffset;
      } else if (endState === 'active') {
        endOffset = activeShadowOffset;
      }
      const p = (Date.now() - startTime) / (endTime - startTime);
      shadowOffset = linearInterp(startOffset, endOffset, p)
    } else if (state === "hover") {
      shadowOffset = hoverShadowOffset;
    } else if (state === "active") {
      shadowOffset = activeShadowOffset;
    }
    return shadowOffset;
  }

  private drawTick(ctx: CanvasRenderingContext2D, x: number, y: number, state?: 'active' | 'hover') {
    const {textWidth, betweenPadding, iconWidth, hPadding, vPadding} = LAYOUT.box;
    const centerX = x + hPadding + textWidth + betweenPadding + iconWidth/2;
    const centerY = y + vPadding + iconWidth/2;
    ctx.strokeStyle = this.getColors(state).checkCircleStroke;
    ctx.lineWidth = 3;
    ctx.beginPath();

    let circleRotation = 0;
    let circleEndAngle = 2*Math.PI;
    let tickPercentage = 0;
    let animated = false;

    if (this.runningAnimation) {
      const {startTime, endTime, startState, endState} = this.runningAnimation;
      const p = Math.min((Date.now() - startTime) / (endTime - startTime), 1);
      let animating: 'in'|'out'|null = null;

      if (this.done) {
        if (startState === 'hover' && endState === undefined) {
          animating = 'in';
        } else if (startState === 'active' && endState === undefined) {
          animating = 'in';
        } else if (startState === undefined && endState !== undefined) {
          animating = 'out';
        }
      }

      if (!this.done) {
        if (startState === 'hover' && endState === undefined) {
          animating = 'out';
        } else if (startState === 'active' && endState === undefined) {
          animating = 'out';
        } else if (startState === undefined && endState !== undefined) {
          animating = 'in';
        }
      }

      if (animating === 'in') {
        tickPercentage = p;
        animated = true;
      } else if (animating === 'out') {
        tickPercentage = 1 - p;
        animated = true;
      }
    }
    
    if ((this.done && state === undefined) || (!this.done && state !== undefined)) {
      circleRotation = toRadians(-17);
      circleEndAngle = toRadians(320);
      if (!animated) {
        tickPercentage = 1;
      }
    }

    ctx.ellipse(centerX, centerY, 16, 16, circleRotation, 0, circleEndAngle);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 4;
    let p = new Vector(centerX - 7, centerY);
    ctx.moveTo(p.x, p.y);
    // Total length of path is x:20 y:18
    const path = (new Vector(20, 18)).mult(tickPercentage);
    if (path.x > 0 && path.y > 0) {
      ctx.lineTo(p.x + Math.min(path.x, 5), p.y + Math.min(path.y, 5));
    }
    if (path.x >= 5 && path.y >= 5) {
      ctx.lineTo(centerX + Math.min(path.x-5, 15), centerY - Math.min(path.y-5, 13));
    }
    ctx.stroke();
  }

  /** Draw this node on screen with it's top left point at x, y. */
  drawMyself(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state?: "hover" | "active"
  ) {
		if (this.lastState != state) {
      this.runningAnimation = {
        startTime: Date.now(),
        endTime: Date.now() + TIMINGS.itemRaiseDuration,
        startState: this.lastState, 
        endState: state,
      };
      setTimeout(() => {this.runningAnimation = null}, TIMINGS.itemRaiseDuration+5)
      this.lastState = state;
    }

    const {
      borderRadius,
      hPadding,
      fontSize,
      lineBreakHeight,
      vPadding,
    } = LAYOUT.box;
    const colors = this.getColors(state);
    ctx.save();
    if (this.text.length < 1) {
      ctx.restore();
      throw new Error("No text to render for this todo item.");
    }

    const { width, height } = this.getDimentionsOnCanvas(ctx);
    const shadowOffset = this.getShadowOffset(state);
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
    ctx.fillStyle = colors.shadowColor;
    ctx.fill();
    drawBox(ctx, x, y, width, height, borderRadius);
    ctx.fillStyle = colors.fillColor;
    ctx.strokeStyle = colors.strokeColor;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Render text box.
    let currLinePos = { x: x + hPadding, y: y + fontSize + vPadding };
    const lines = wrapText(ctx, this.text, LAYOUT.box.textWidth, LAYOUT.box.fontSize);
    for (const line of lines) {
      ctx.fillStyle = colors.textColor;
      ctx.font = `${fontSize}px 'Ubuntu'`;
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'start';
      ctx.fillText(line, currLinePos.x, currLinePos.y);
      currLinePos.y += fontSize + lineBreakHeight;
    }

    // Render tick.
    this.drawTick(ctx, x, y, state);
    ctx.restore();
  }
}