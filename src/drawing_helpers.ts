import colorInterpolate from "color-interpolate";

/**
 * Note that these values are in canvas coordinates which are not 1:1 with
 * screen pixels. Each one is adjusted by a RESOLUTION_MULTIPLIER in canvas.ts
 * which maps multiple canvas pixels to each real screen pixel to reduce
 * blurryness.
 */
export const LAYOUT = {
  box: {
    borderRadius: 16,
    defaultShadowOffset: 8,
    hoverShadowOffset: 12,
    activeShadowOffset: 4,
    minWidth: 400,
    minRootWidth: 400,
    fontSize: 28,
    rootFontSize: 38,
    lineBreakHeight: 4,
    // |<h_pad><text_width><between_pad><icon_width><h_pad>|<connector_pad>o-->
    hPadding: 24,
    rootHPadding: 48,
    vPadding: 32,
    rootVPadding: 42,
    textWidth: 256,
    betweenPadding: 64,
    iconWidth: 28,
    connectorPadding: 32,
  },
  verticalItemPadding: 64,
  horizontalItemPadding: 164,
};

export const TIMINGS = {
  itemRaiseDuration: 100,
};

export function colorInterp(a: string, b: string, p: number) {
  return colorInterpolate([a, b])(p);
}

export function toRadians(d: number) {
  return (d / 180) * Math.PI;
}

export function linearInterp(a: number, b: number, p: number) {
  return a + (b - a) * Math.min(p, 1);
}

// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
export function drawBox(
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
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
) {
  ctx.font = `${fontSize}px 'Ubuntu'`;
  const tokens = text.split(' ');
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
  return lines.slice(0, 3).map(line => line.replace(/^ /,'').replace(/ $/, ''));
}
