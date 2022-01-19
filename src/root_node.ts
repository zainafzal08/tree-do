import { drawBox, LAYOUT, wrapText } from './drawing_helpers';
import {BaseNode} from './node';

export class RootNode extends BaseNode {
    projectName: string;
    objectId: number;

    constructor(name: string) {
        super();
        this.id = '__ROOT__';
        this.projectName = name;
    }

    getOutgoingConnectorColor() {
        return "#DEDEDE";
    }

    getTextBoxHeight(ctx: CanvasRenderingContext2D) {
        const { rootFontSize, lineBreakHeight } = LAYOUT.box;
        const lines = wrapText(ctx, this.projectName, LAYOUT.box.textWidth, rootFontSize);
        const height =
          lines.length * rootFontSize + lineBreakHeight * (lines.length - 1);
        return height;
    }

    getDimentionsOnCanvas(ctx: CanvasRenderingContext2D) {
        const {rootVPadding, rootHPadding, textWidth, minRootWidth} = LAYOUT.box;
        const height = this.getTextBoxHeight(ctx) + 2 * rootVPadding;
        const width = Math.max(
          2 * rootHPadding + textWidth,
          minRootWidth
        );
        return {
            width,
            height
        };
    }

    drawMyself(ctx: CanvasRenderingContext2D, x: number, y: number, state: 'hover' | 'active') {
        const { rootFontSize,  textWidth, lineBreakHeight, rootVPadding} = LAYOUT.box;
        const dims = this.getDimentionsOnCanvas(ctx);
        drawBox(ctx, x, y, dims.width, dims.height, dims.height);
        ctx.fillStyle = "#FFD9D9";
        ctx.fill();

        // Render text box.
        let currLinePos = { x: x + dims.width/2, y: y + rootVPadding };
        const lines = wrapText(ctx, this.projectName, textWidth, rootFontSize);
        for (const line of lines) {
            ctx.fillStyle = "#E24646";
            ctx.textBaseline = 'top';
            ctx.font = `${rootFontSize}px 'Ubuntu'`;
            ctx.textAlign = "center";
            ctx.fillText(line, currLinePos.x, currLinePos.y);
            currLinePos.y += rootFontSize + lineBreakHeight;
        }
    }
}
