import {Vector} from './vector';

export class Gesture {
    private startPoint: Vector;
    private endPoint: Vector|null = null;

    constructor(startEvent: PointerEvent) {
        this.startPoint = new Vector(startEvent.clientX, startEvent.clientY);
    }

    update(e: PointerEvent) {
        this.endPoint = new Vector(e.clientX, e.clientY);
    }

    getDelta() {
        if (!this.endPoint) {
            return new Vector(0, 0);
        }
        return new Vector(
            this.endPoint.x - this.startPoint.x,
            this.endPoint.y - this.startPoint.y
        );
    }
}