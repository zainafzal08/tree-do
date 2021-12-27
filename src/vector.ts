export class Vector {
    constructor(readonly x: number, readonly y:number) {}

    add(v: Vector|number) {
        if (typeof v === 'number') {
            return new Vector(
                this.x + v,
                this.y + v
            );
        }
        return new Vector(this.x + v.x, this.y + v.y);
    }

    sub(v: Vector|number) {
        if (typeof v === 'number') {
            return new Vector(
                this.x - v,
                this.y - v
            );
        }
        return new Vector(this.x - v.x, this.y - v.y);
    }

    mult(s: Vector|number) {
        if (typeof s === 'number') {
            return new Vector(
                this.x * s,
                this.y * s
            );
        }
        return new Vector(
            this.x * s.x,
            this.y * s.y
        )
    }

    isInBox(x: number, y: number, width: number, height: number) {
        const xInBounds = this.x >= x && this.x <= (x + width);
        const yInBounds = this.y >= y && this.y <= (y + height);
        return xInBounds && yInBounds;
    }
}