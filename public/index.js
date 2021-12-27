'use strict';

var Vector = /** @class */ (function () {
    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }
    Vector.prototype.add = function (v) {
        if (typeof v === 'number') {
            return new Vector(this.x + v, this.y + v);
        }
        return new Vector(this.x + v.x, this.y + v.y);
    };
    Vector.prototype.sub = function (v) {
        if (typeof v === 'number') {
            return new Vector(this.x - v, this.y - v);
        }
        return new Vector(this.x - v.x, this.y - v.y);
    };
    Vector.prototype.mult = function (s) {
        if (typeof s === 'number') {
            return new Vector(this.x * s, this.y * s);
        }
        return new Vector(this.x * s.x, this.y * s.y);
    };
    Vector.prototype.isInBox = function (x, y, width, height) {
        var xInBounds = this.x >= x && this.x <= (x + width);
        var yInBounds = this.y >= y && this.y <= (y + height);
        return xInBounds && yInBounds;
    };
    return Vector;
}());

var Gesture = /** @class */ (function () {
    function Gesture(startEvent) {
        this.endPoint = null;
        this.startPoint = new Vector(startEvent.clientX, startEvent.clientY);
    }
    Gesture.prototype.update = function (e) {
        this.endPoint = new Vector(e.clientX, e.clientY);
    };
    Gesture.prototype.getDelta = function () {
        if (!this.endPoint) {
            return new Vector(0, 0);
        }
        return new Vector(this.endPoint.x - this.startPoint.x, this.endPoint.y - this.startPoint.y);
    };
    return Gesture;
}());

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

/**
 * Note that these values are in canvas coordinates which are not 1:1 with
 * screen pixels. Each one is adjusted by a RESOLUTION_MULTIPLIER in canvas.ts
 * which maps multiple canvas pixels to each real screen pixel to reduce
 * blurryness.
 */
var LAYOUT = {
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
        connectorPadding: 32
    },
    verticalItemPadding: 64,
    horizontalItemPadding: 164
};
var COLORS = {
    fillColor: "#FFD9D9",
    strokeColor: "#E24646",
    shadowColor: "#E24646",
    textColor: "#E24646",
    connectorColor: "#DEDEDE"
};
// https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
function drawBox(ctx, x, y, w, h, r) {
    if (w < 2 * r)
        r = w / 2;
    if (h < 2 * r)
        r = h / 2;
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
function wrapText(ctx, text, maxWidth) {
    var fontSize = LAYOUT.box.fontSize;
    ctx.font = "".concat(fontSize, "px 'Ubuntu'");
    var tokens = [];
    // Do a quick pass and break any words that are longer then maxWidth.
    for (var _i = 0, _a = text.split(" "); _i < _a.length; _i++) {
        var token = _a[_i];
        if (token.length <= maxWidth) {
            tokens.push(token);
        }
        else {
            var word = token;
            while (word.length > maxWidth) {
                tokens.push(word.substr(0, maxWidth - 1) + "-");
                word = word.substr(maxWidth - 1);
            }
        }
    }
    var lines = [];
    var currLine = "";
    while (tokens.length > 0) {
        var token = tokens.shift();
        if (lines.length === 3) {
            break;
        }
        var proposedLine = currLine !== "" ? "".concat(currLine, " ").concat(token) : token;
        if (ctx.measureText(proposedLine).width > maxWidth) {
            lines.push(currLine);
            currLine = token;
        }
        else {
            currLine = proposedLine;
        }
    }
    lines.push(currLine);
    if (lines.length >= 3 || tokens.length > 0) {
        var trailingLine = lines[2];
        while (ctx.measureText(trailingLine + "...").width > maxWidth) {
            trailingLine = trailingLine.substr(0, trailingLine.length - 1);
        }
        lines[2] = trailingLine + "...";
    }
    return lines.slice(0, 3);
}
var TodoNode = /** @class */ (function () {
    function TodoNode(item) {
        this.root = false;
        this.children = [];
        this.cachedLines = null;
        this.calculationCache = new Map();
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
    TodoNode.prototype.addChild = function (node) {
        this.children.push(node);
    };
    TodoNode.prototype.dropChild = function (id) {
        this.children = this.children.filter(function (child) { return child.id !== id; });
    };
    TodoNode.prototype.dropAllChildren = function () {
        var cpy = this.children;
        this.children = [];
        return cpy;
    };
    TodoNode.prototype.getChildren = function () {
        return this.children;
    };
    // TODO: move rendering logic into a seperate class so we seperate model and
    // view more cleanly.
    /**
     * Draws this node and it's children. `x` and `y` spexify the top left
     * position of the bounding box of the whole tree.
     */
    TodoNode.prototype.draw = function (ctx, x, y, pointerContext) {
        var _a;
        var pointerOverItem = false;
        var state = undefined;
        var totalHeight = this.getTotalHeight(ctx);
        var myDimentions = this.getDimentionsOnCanvas(ctx);
        var myPosition = new Vector(x, y + totalHeight / 2 - myDimentions.height / 2);
        if ((_a = pointerContext.position) === null || _a === void 0 ? void 0 : _a.isInBox(myPosition.x, myPosition.y, myDimentions.width, myDimentions.height)) {
            pointerOverItem = true;
            state = pointerContext.pressed ? "active" : "hover";
        }
        this.drawMyself(ctx, myPosition.x, myPosition.y, state);
        // Render children.
        var childY = y;
        // List of the middle left point on each child, used to draw our arrows
        // between items.
        var childrenPositions = [];
        for (var _i = 0, _b = this.children; _i < _b.length; _i++) {
            var child = _b[_i];
            var childHeight = child.getTotalHeight(ctx);
            var myWidth = this.getDimentionsOnCanvas(ctx).width;
            var childX = x + myWidth + LAYOUT.horizontalItemPadding;
            childrenPositions.push(new Vector(childX, childY + childHeight / 2));
            var childHasPointer = child.draw(ctx, childX, childY, pointerContext);
            if (childHasPointer) {
                pointerOverItem = true;
            }
            childY += childHeight + LAYOUT.verticalItemPadding;
        }
        var fromX = x + myDimentions.width + LAYOUT.box.connectorPadding;
        var fromY = y + totalHeight / 2;
        this.drawConnections(ctx, fromX, fromY, childrenPositions);
        return pointerOverItem;
    };
    TodoNode.prototype.getTotalHeight = function (ctx) {
        if (this.calculationCache.has("totalHeight")) {
            return this.calculationCache.get("totalHeight");
        }
        var totalHeight;
        if (this.children.length > 0) {
            totalHeight =
                this.children.reduce(function (acc, child) { return acc + child.getTotalHeight(ctx); }, 0) +
                    (this.children.length - 1) * LAYOUT.verticalItemPadding;
        }
        else {
            totalHeight = this.getDimentionsOnCanvas(ctx).height;
        }
        this.calculationCache.set("totalHeight", totalHeight);
        return totalHeight;
    };
    TodoNode.prototype.getTotalWidth = function (ctx) {
        // TODO: consider children.
        // TODO: cache this value, it's needed often.
        return this.getDimentionsOnCanvas(ctx).width;
    };
    TodoNode.prototype.getDimentionsOnCanvas = function (ctx) {
        var _a = LAYOUT.box, hPadding = _a.hPadding, fontSize = _a.fontSize, minWidth = _a.minWidth, iconWidth = _a.iconWidth, betweenPadding = _a.betweenPadding, textWidth = _a.textWidth, lineBreakHeight = _a.lineBreakHeight, vPadding = _a.vPadding;
        if (this.root) {
            return {
                width: 0,
                height: 0
            };
        }
        var lines = this.getLines(ctx);
        var textBoxHeight = lines.length * fontSize + lineBreakHeight * (lines.length - 1);
        var height = textBoxHeight + 2 * vPadding;
        var width = Math.max(2 * hPadding + textWidth + iconWidth + betweenPadding, minWidth);
        return {
            width: width,
            height: height
        };
    };
    TodoNode.prototype.drawConnections = function (ctx, fromX, fromY, childrenPositions) {
        if (childrenPositions.length === 0) {
            return;
        }
        var connectorRadius = 6;
        var arrowHeadHeight = 16;
        var landingZoneLength = 32;
        ctx.beginPath();
        ctx.fillStyle = COLORS.connectorColor;
        ctx.lineWidth = 4;
        ctx.ellipse(fromX, fromY, connectorRadius, connectorRadius, 0, 0, 360);
        ctx.fill();
        ctx.closePath();
        var startX = fromX;
        var startY = fromY;
        for (var _i = 0, childrenPositions_1 = childrenPositions; _i < childrenPositions_1.length; _i++) {
            var child = childrenPositions_1[_i];
            var toX = child.x - LAYOUT.box.connectorPadding;
            var toY = child.y;
            ctx.beginPath();
            ctx.strokeStyle = COLORS.connectorColor;
            ctx.moveTo(startX, startY);
            ctx.lineTo(toX - landingZoneLength, toY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            ctx.fillStyle = COLORS.connectorColor;
            ctx.beginPath();
            ctx.moveTo(toX, toY - arrowHeadHeight / 2);
            ctx.lineTo(toX + arrowHeadHeight, toY);
            ctx.lineTo(toX, toY + arrowHeadHeight / 2);
            ctx.closePath();
            ctx.fill();
        }
    };
    TodoNode.prototype.drawItem = function (ctx, x, y, state) {
        var _a = LAYOUT.box, borderRadius = _a.borderRadius, defaultShadowOffset = _a.defaultShadowOffset, hoverShadowOffset = _a.hoverShadowOffset, activeShadowOffset = _a.activeShadowOffset, hPadding = _a.hPadding, fontSize = _a.fontSize, lineBreakHeight = _a.lineBreakHeight, vPadding = _a.vPadding;
        ctx.save();
        if (this.text.length < 1) {
            ctx.restore();
            throw new Error("No text to render for this todo item.");
        }
        var _b = this.getDimentionsOnCanvas(ctx), width = _b.width, height = _b.height;
        var shadowOffset = defaultShadowOffset;
        if (state === "hover") {
            shadowOffset = hoverShadowOffset;
        }
        else if (state === "active") {
            shadowOffset = activeShadowOffset;
        }
        // We draw the actual box a bit offset depending on the elevation we are
        // aiming for. This does mean the bounding rect returned by
        // getDimentionsOnCanvas is slightly off since it assumes there is no shadow
        // but it still gets the job done for any layout applications.
        x -= shadowOffset;
        y -= shadowOffset;
        drawBox(ctx, x + shadowOffset, y + shadowOffset, width, height, borderRadius);
        ctx.fillStyle = COLORS.shadowColor;
        ctx.fill();
        drawBox(ctx, x, y, width, height, borderRadius);
        ctx.fillStyle = COLORS.fillColor;
        ctx.strokeStyle = COLORS.strokeColor;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = COLORS.textColor;
        ctx.font = "".concat(fontSize, "px 'Ubuntu'");
        var currLinePos = { x: x + hPadding, y: y + fontSize + vPadding };
        for (var _i = 0, _c = this.getLines(ctx); _i < _c.length; _i++) {
            var line = _c[_i];
            ctx.fillText(line, currLinePos.x, currLinePos.y);
            currLinePos.y += fontSize + lineBreakHeight;
        }
        ctx.restore();
    };
    /** Draw this todo item on screen with it's top left point at x, y. */
    TodoNode.prototype.drawMyself = function (ctx, x, y, state) {
        if (!this.root) {
            this.drawItem(ctx, x, y, state);
        }
    };
    /** Returns the text for this node as an array of wrapped lines. */
    TodoNode.prototype.getLines = function (ctx) {
        if (this.cachedLines) {
            // Avoid rewrapping the text on each frame if we can.
            return this.cachedLines;
        }
        this.cachedLines = wrapText(ctx, this.text, LAYOUT.box.textWidth);
        return this.cachedLines;
    };
    return TodoNode;
}());

var MAX_UNDO_QUEUE_LENGTH = 100;
function bfs(startQueue) {
    var queue = startQueue;
    var visited = new Set();
    var result = [];
    while (queue.length > 0) {
        var curr = queue.pop();
        result.push(curr);
        for (var _i = 0, _a = curr.getChildren(); _i < _a.length; _i++) {
            var child = _a[_i];
            if (!visited.has(child.id)) {
                visited.add(child.id);
                queue.push(child);
            }
        }
    }
    return result;
}
/**
 * Tracks app state and provides methods for safe state mutations.
 *
 * This class assumes that the number of todo items is low (< 100) and as such
 * is not optimised. Eachtime we copy our app state to localstorage we
 * reserialize our whole app state. To extend the app to support larger numbers
 * of items we need to shift to interacting with a indexedDB table and only
 * updating what needs to for a specific mutation.
 */
var AppState = /** @class */ (function () {
    function AppState() {
        this.undoQueue = [];
        this.redoQueue = [];
        /** List of todo nodes with no parent. */
        this.rootNode = new TodoNode(null);
        /** Map to speed up finding a node in the tree given an id. */
        this.todoItemLookup = new Map();
        /** Map to speed up finding a nodes parent in the tree. */
        this.todoItemParentLookup = new Map();
        /**
         * List of todo items that have been directly or indirectly deleted in the
         * current session. Useful for performing Undos or Redos.
         */
        this.todoItemsTrash = new Map();
    }
    AppState.prototype.getRootNode = function () {
        return this.rootNode;
    };
    AppState.prototype.addTodoItem = function (item, parentId) {
        var newNode = new TodoNode(item);
        var parentNode;
        if (parentId === null) {
            parentNode = this.rootNode;
        }
        else if (this.todoItemLookup.has(parentId)) {
            parentNode = this.todoItemLookup.get(parentId);
        }
        else {
            throw new Error("Non-existant parent id supplied");
        }
        parentNode.addChild(newNode);
        this.todoItemLookup.set(newNode.id, newNode);
        this.todoItemParentLookup.set(newNode.id, parentNode);
        this.undoQueue.push({
            type: "todo",
            newItem: {
                itemId: item.id,
                parent: parentId
            }
        });
        this.clearRedoQueue();
        this.upsync();
    };
    AppState.prototype.removeTodoItem = function (itemId, 
    /**
     * Defines what to do if a todo item is deleted while it has children.
     *     killall   : Kill all the children as well.
     *     mv2root   : Make all chilren items children of root
     *     mv2parent : Make all children items children of the deleted items
     *                 parent.
     */
    orphanResolutionStrategy) {
        if (!this.todoItemLookup.has(itemId)) {
            throw new Error("Non-existant id supplied");
        }
        var deadNode = this.todoItemLookup.get(itemId);
        var deadNodeParent = this.todoItemParentLookup.has(deadNode.id)
            ? this.todoItemParentLookup.get(deadNode.id)
            : null;
        var orphans = this.removeNode(deadNode);
        // Deal with orphans.
        if (orphanResolutionStrategy === "killall") {
            var allChildrenNodes = bfs(orphans);
            for (var _i = 0, allChildrenNodes_1 = allChildrenNodes; _i < allChildrenNodes_1.length; _i++) {
                var child = allChildrenNodes_1[_i];
                this.removeNode(child);
            }
        }
        else {
            var target = void 0;
            if (orphanResolutionStrategy === "mv2root") {
                target = this.rootNode;
            }
            else {
                target = deadNodeParent;
            }
            for (var _a = 0, orphans_1 = orphans; _a < orphans_1.length; _a++) {
                var orphan = orphans_1[_a];
                target.addChild(orphan);
                this.todoItemParentLookup.set(orphan.id, target);
            }
        }
        // TODO: update undo queue.
        this.clearRedoQueue();
        this.upsync();
    };
    AppState.prototype.undo = function () {
        if (this.undoQueue.length < 1) {
            return;
        }
        else if (this.undoQueue.length >= MAX_UNDO_QUEUE_LENGTH) {
            this.dropResourcesForMutation(this.undoQueue.shift());
        }
        var mutation = this.undoQueue.pop();
        this.redoQueue.push(__assign({}, mutation));
        // TODO: invert mutation and apply.
    };
    AppState.prototype.redo = function () {
        if (this.redoQueue.length < 1) {
            return;
        }
        this.redoQueue.pop();
        // TODO: apply mutation.
    };
    AppState.prototype.hydrate = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: pull data from local storage.
                this.addTodoItem({
                    id: '1',
                    text: 'Learn code',
                    done: false,
                    creationTime: 0
                }, null);
                this.addTodoItem({
                    id: '4',
                    text: 'Learn boobies lol',
                    done: false,
                    creationTime: 0
                }, '1');
                this.addTodoItem({
                    id: '5',
                    text: 'Learn butts lmao',
                    done: false,
                    creationTime: 0
                }, '1');
                this.addTodoItem({
                    id: '2',
                    text: 'Learn computers',
                    done: false,
                    creationTime: 0
                }, null);
                this.addTodoItem({
                    id: '3',
                    text: 'Learn how to do that thing with the thing and the thing',
                    done: false,
                    creationTime: 0
                }, null);
                return [2 /*return*/];
            });
        });
    };
    /**
     * Disassoicate a node from it's parent and children and return any now
     * orphaned nodes.
     */
    AppState.prototype.removeNode = function (node) {
        var deadNodeParent = this.todoItemParentLookup.has(node.id)
            ? this.todoItemParentLookup.get(node.id)
            : null;
        if (deadNodeParent !== null) {
            deadNodeParent.dropChild(node.id);
            this.todoItemParentLookup["delete"](node.id);
        }
        this.todoItemLookup["delete"](node.id);
        this.todoItemsTrash.set(node.id, node);
        return node.dropAllChildren();
    };
    AppState.prototype.dropResourcesForMutation = function (mutation) {
        if (mutation.type === "todo") {
            for (var _i = 0, _a = (mutation.removedItems || []); _i < _a.length; _i++) {
                var removedItem = _a[_i];
                this.todoItemsTrash["delete"](removedItem.itemId);
            }
        }
    };
    AppState.prototype.clearRedoQueue = function () {
        for (var _i = 0, _a = this.redoQueue; _i < _a.length; _i++) {
            var mutation = _a[_i];
            this.dropResourcesForMutation(mutation);
        }
        this.redoQueue = [];
    };
    AppState.prototype.upsync = function () {
        // TODO: push our local state into localstorage.
    };
    return AppState;
}());

var MIN_ZOOM = 0.1;
var MAX_ZOOM = 4;
var ZOOM_SPEED = 0.01;
/**
 * We give the canvas a larger coordinate space then the screen so multiple
 * canvas pixels map to 1 css pixel. This ends up producing more sharp shapes
 * with less blurryness.
 */
var RESOLUTION_MULTIPLIER = 2;
var HORIZONTAL_PADDING = 32;
/** Takes over a HTMLCanvasElement to render arbitrary items. */
var Canvas = /** @class */ (function () {
    function Canvas(element) {
        var _this = this;
        this.scale = 1;
        // Tracks actions we've completed in the last frame to help us debounce events
        // which fire quickly.
        this.actionPerformedInFrame = new Set();
        this.currentGesture = null;
        this.offset = new Vector(0, 0);
        this.appState = new AppState();
        this.mousePosition = null;
        this.pointerPressed = false;
        this.dragAllowed = false;
        this.domElement = element;
        // Event Listeners.
        window.addEventListener("resize", function () { return _this.onResize(); });
        this.domElement.addEventListener("wheel", function (e) { return _this.onScroll(e); });
        this.domElement.addEventListener("pointerdown", function (e) {
            _this.onGestureStart(e);
            _this.pointerPressed = true;
        });
        this.domElement.addEventListener("pointermove", function (e) {
            _this.onGestureUpdate(e);
            _this.onPointerMove(e);
        });
        this.domElement.addEventListener("pointerleave", function () {
            return _this.onPointerLeave();
        });
        this.domElement.addEventListener("pointerup", function (e) {
            _this.onGestureEnd(e);
            _this.pointerPressed = false;
        });
        this.appState.hydrate().then(function () {
            _this.onResize();
            _this.paint();
        });
    }
    Canvas.prototype.onResize = function () {
        if (this.actionPerformedInFrame.has("resize"))
            return;
        this.actionPerformedInFrame.add("resize");
        var br = this.domElement.getBoundingClientRect();
        this.width = br.width * RESOLUTION_MULTIPLIER;
        this.height = br.height * RESOLUTION_MULTIPLIER;
        this.domElement.setAttribute("width", String(this.width));
        this.domElement.setAttribute("height", String(this.height));
    };
    Canvas.prototype.onGestureStart = function (e) {
        if (!this.dragAllowed)
            return;
        this.currentGesture = new Gesture(e);
    };
    Canvas.prototype.onGestureUpdate = function (e) {
        if (!this.currentGesture)
            return;
        this.currentGesture.update(e);
    };
    Canvas.prototype.onGestureEnd = function (e) {
        if (!this.currentGesture)
            return;
        this.offset = this.offset.add(this.currentGesture.getDelta());
        this.currentGesture = null;
    };
    Canvas.prototype.onScroll = function (e) {
        if (this.actionPerformedInFrame.has("scroll"))
            return;
        var oldScale = this.scale;
        this.scale += e.deltaY * -1 * ZOOM_SPEED;
        this.scale = Math.min(Math.max(MIN_ZOOM, this.scale), MAX_ZOOM);
        // Adjust offset such that the point we zoomed on remains the same, i.e
        // implement "zoom to point".
        var adjustment = this.mousePosition.mult(this.scale - oldScale);
        this.offset = this.offset.sub(adjustment);
        this.actionPerformedInFrame.add("scroll");
        e.preventDefault();
    };
    Canvas.prototype.onPointerMove = function (e) {
        // Assume canvas takes up whole screen.
        var pan = this.getCurrentPan();
        this.mousePosition = new Vector((e.clientX * RESOLUTION_MULTIPLIER - this.offset.x - pan.x) / this.scale, (e.clientY * RESOLUTION_MULTIPLIER - this.offset.y - pan.y) / this.scale);
    };
    Canvas.prototype.onPointerLeave = function () {
        this.mousePosition = null;
    };
    Canvas.prototype.getCurrentPan = function () {
        var pan = new Vector(0, 0);
        if (this.currentGesture) {
            pan = this.currentGesture.getDelta();
        }
        return pan;
    };
    Canvas.prototype.paint = function () {
        var _this = this;
        requestAnimationFrame(function () { return _this.paint(); });
        this.actionPerformedInFrame.clear();
        var ctx = this.domElement.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var pan = this.getCurrentPan();
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.setTransform(this.scale, 0, 0, this.scale, this.offset.x + pan.x, this.offset.y + pan.y);
        var root = this.appState.getRootNode();
        var totalHeight = root.getTotalHeight(ctx);
        var y = this.height / 2 - totalHeight / 2;
        var itemHovered = root.draw(ctx, HORIZONTAL_PADDING, y, {
            position: !this.currentGesture ? this.mousePosition : null,
            pressed: this.pointerPressed
        });
        if (itemHovered) {
            // We shouldn't register any drags on items as pans.
            this.dragAllowed = false;
            this.domElement.setAttribute("data-cursor", "pointer");
        }
        else {
            this.dragAllowed = true;
            this.domElement.setAttribute("data-cursor", "grabber");
        }
    };
    return Canvas;
}());

// Init code.
window.onload = function () {
    new Canvas(document.querySelector('canvas'));
};
