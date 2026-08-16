import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';

import {Common} from '/Packages/Generic/Js/Common/Common.js';
import {Executor} from '/Packages/Generic/Js/Executor/Executor.js';
import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class GestureArea extends Component {
    static _Pointer = class {
        static _exclusiveCaptors = new Map();


        static pointsCountMax = 4;


        __rectInitial = null;


        _component = null;
        _id = 0;
        _magnetAreasBottom = new Set();
        _magnetAreasLeft = new Set();
        _magnetAreasRight = new Set();
        _magnetAreasTop = new Set();
        _magnetVector = new Vector2d();
        _points = [];
        _positionDelta = new Vector2d();
        _positionDeltaModified = new Vector2d();
        _positionInner = new Vector2d();
        _positionInnerInitial = new Vector2d();
        _positionOuter = new Vector2d();
        _positionOuterInitial = new Vector2d();
        _rectDeltaBounded = null;
        _shifted = false;
        _target = null;
        _timeStamp = 0;
        _timeStampInitial = 0;
        _velocity = new Vector2d();

        _rectDelta = {
            bottom: undefined,
            left: undefined,
            right: undefined,
            top: undefined,
        };


        get rectInitial() {
            return this.__rectInitial;
        }
        set rectInitial(rectInitial) {
            this.__rectInitial = rectInitial;
            this._rectDeltaBounded = null;

            if (this.rectInitial && !this._component.bound) return;

            let boundDomRect = GestureArea.getDomRect(this._component.bound);
            this._rectDeltaBounded = {
                bottom: boundDomRect.bottom - this.rectInitial.bottom,
                left: boundDomRect.left - this.rectInitial.left,
                right: boundDomRect.right - this.rectInitial.right,
                top: boundDomRect.top - this.rectInitial.top,
            };
        }

        _defineVelocity() {
            let pointFirst = this._points[0];
            let pointLast = this._points.at(-1);
            let dt = (pointLast?.timeStamp - pointFirst?.timeStamp) / 1e3;

            if (!dt) return;

            this._velocity.setVector(pointLast.position).sub(pointFirst.position).divide(dt);
        }

        _detectShift() {
            if (this._shifted || this._positionDelta.length < this._component.shift) return;

            this._shifted = true;

            if (this._component.shiftJumping || this._component.shift <= 1) return;

            this._positionDelta.length = this._component.shift - 1;
            this._positionDelta.round();
            this._positionInnerInitial.sum(this._positionDelta);
            this._positionOuterInitial.sum(this._positionDelta);
            this._positionDelta.set(0);
        }

        _updatePoints() {
            this._points.push({
                position: this._positionOuter.clone(),
                timeStamp: this._timeStamp,
            });

            if (this._points.length > this.constructor.pointsCountMax) {
                this._points.shift();
            }
        }

        _updatePositions(event) {
            if (this._component.vertical) {
                if (this._component.invertedX) {
                    this._positionInner.x = this._component.clientHeight - event.offsetY - 1;
                    this._positionOuter.x = document.scrollingElement.scrollHeight - event.pageY - 1;
                }
                else {
                    this._positionInner.x = event.offsetY;
                    this._positionOuter.x = event.pageY;
                }

                if (this._component.invertedY) {
                    this._positionInner.y = this._component.clientWidth - event.offsetX - 1;
                    this._positionOuter.y = document.scrollingElement.scrollWidth - event.pageX - 1;
                }
                else {
                    this._positionInner.y = event.offsetX;
                    this._positionOuter.y = event.pageX;
                }
            }
            else {
                if (this._component.invertedX) {
                    this._positionInner.x = this._component.clientWidth - event.offsetX - 1;
                    this._positionOuter.x = document.scrollingElement.scrollWidth - event.pageX - 1;
                }
                else {
                    this._positionInner.x = event.offsetX;
                    this._positionOuter.x = event.pageX;
                }

                if (this._component.invertedY) {
                    this._positionInner.y = this._component.clientHeight - event.offsetY - 1;
                    this._positionOuter.y = document.scrollingElement.scrollHeight - event.pageY - 1;
                }
                else {
                    this._positionInner.y = event.offsetY;
                    this._positionOuter.y = event.pageY;
                }
            }
        }


        _captured = false;

        capture(exclusive = false) {
            let exclusiveCaptors = this.constructor._exclusiveCaptors;

            if (exclusive && !exclusiveCaptors.has(this._id)) {
                if (this._component.exclusiveCapture) {
                    exclusiveCaptors.set(this._id, this._component);
                }
                else {
                    this._captured = true;
                }
            }

            this._target.setPointerCapture(this._id);
        }

        checkCapture() {
            let exclusiveCaptor = this.constructor._exclusiveCaptors.get(this._id);

            return exclusiveCaptor ? exclusiveCaptor == this._component : this._captured;
        }

        constructor(component, event) {
            this._component = component;
            this._id = event.pointerId;
            this._target = this._component._pointerTarget || event.target;
            this._updatePositions(event);
            this.updateTimestamp();
            this._timeStampInitial = this._timeStamp;
            this._positionInnerInitial.setVector(this._positionInner);
            this._positionOuterInitial.setVector(this._positionOuter);
        }

        release() {
            this._captured = false;
            this._target.releasePointerCapture(this._id);
            this.constructor._exclusiveCaptors.delete(this._id);
        }

        update(event) {
            this._updatePositions(event);
            this.updateTimestamp();
            this._positionDelta.setVector(this._positionOuter).sub(this._positionOuterInitial);
            this._detectShift();

            if (!this._shifted) return;

            this._updatePoints();
            this._defineVelocity();
            this._positionDeltaModified.setVector(this._positionDelta);

            if (this._component.axis == 'x') {
                this._positionDeltaModified.y = 0;
            }
            else {
                let step = this._component.stepY || this._component.step;
                this._positionDeltaModified.y = Math.round(this._positionDeltaModified.y / step) * step;
            }

            if (this._component.axis == 'y') {
                this._positionDeltaModified.x = 0;
            }
            else {
                let step = this._component.stepX || this._component.step;
                this._positionDeltaModified.x = Math.round(this._positionDeltaModified.x / step) * step;
            }

            this._positionDeltaModified
                .prod(this._component.swipeFactor)
                .toRangeLength(0, this._component.radius)
                .round()
            ;
        }

        updateMagnetVector() {
            let magnetAreas = this._component.magnetAreas;
            let magnetism = this._component.magnetism;
            this._magnetAreasBottom.clear();
            this._magnetAreasLeft.clear();
            this._magnetAreasRight.clear();
            this._magnetAreasTop.clear();
            this._magnetVector.set(null);

            if (!(magnetism && this._rectDelta && this.rectInitial && magnetAreas?.size)) return;

            let magnetAreasBottom = new Map();
            let magnetAreasLeft = new Map();
            let magnetAreasRight = new Map();
            let magnetAreasTop = new Map();
            let magnetRect = {
                bottom: this.rectInitial.bottom + (this._rectDelta.bottom || 0),
                left: this.rectInitial.left + (this._rectDelta.left || 0),
                right: this.rectInitial.right + (this._rectDelta.right || 0),
                top: this.rectInitial.top + (this._rectDelta.top || 0),
            };
            let magnetVector = new Vector2d(Infinity);

            for (let magnetArea of magnetAreas) {
                let magnetAreaRect = this._component._magnetAreaRects.get(magnetArea);
                let deltaBottomTop = magnetAreaRect.bottom - magnetRect.top;
                let deltaLeftRight = magnetAreaRect.left - magnetRect.right;
                let deltaRightLeft = magnetAreaRect.right - magnetRect.left;
                let deltaTopBottom = magnetAreaRect.top - magnetRect.bottom;

                if (deltaLeftRight > magnetism || deltaTopBottom > magnetism || deltaRightLeft < -magnetism || deltaBottomTop < -magnetism) continue;

                if (Number.isFinite(this._rectDelta.bottom)) {
                    let deltaBottomBottom = magnetAreaRect.bottom - magnetRect.bottom;
                    let deltaBottomBottomAbs = Math.abs(deltaBottomBottom);
                    let deltaTopBottomAbs = Math.abs(deltaTopBottom);

                    if (deltaBottomBottomAbs <= magnetism && deltaBottomBottomAbs <= Math.abs(magnetVector.y)) {
                        magnetVector.y = deltaBottomBottom;
                        magnetAreasBottom.set(magnetArea, magnetVector.y);
                    }
                    else if (deltaTopBottomAbs <= magnetism && deltaTopBottomAbs <= Math.abs(magnetVector.y)) {
                        magnetVector.y = deltaTopBottom;
                        magnetAreasTop.set(magnetArea, magnetVector.y);
                    }
                }

                if (Number.isFinite(this._rectDelta.left)) {
                    let deltaLeftLeft = magnetAreaRect.left - magnetRect.left;
                    let deltaLeftLeftAbs = Math.abs(deltaLeftLeft);
                    let deltaRightLeftAbs = Math.abs(deltaRightLeft);

                    if (deltaLeftLeftAbs <= magnetism && deltaLeftLeftAbs <= Math.abs(magnetVector.x)) {
                        magnetVector.x = deltaLeftLeft;
                        magnetAreasLeft.set(magnetArea, magnetVector.x);
                    }
                    else if (deltaRightLeftAbs <= magnetism && deltaRightLeftAbs <= Math.abs(magnetVector.x)) {
                        magnetVector.x = deltaRightLeft;
                        magnetAreasRight.set(magnetArea, magnetVector.x);
                    }
                }

                if (Number.isFinite(this._rectDelta.right)) {
                    let deltaRightRight = magnetAreaRect.right - magnetRect.right;
                    let deltaRightRightAbs = Math.abs(deltaRightRight);
                    let deltaLeftRightAbs = Math.abs(deltaLeftRight);

                    if (deltaLeftRightAbs <= magnetism && deltaLeftRightAbs <= Math.abs(magnetVector.x)) {
                        magnetVector.x = deltaLeftRight;
                        magnetAreasLeft.set(magnetArea, magnetVector.x);
                    }
                    else if (deltaRightRightAbs <= magnetism && deltaRightRightAbs <= Math.abs(magnetVector.x)) {
                        magnetVector.x = deltaRightRight;
                        magnetAreasRight.set(magnetArea, magnetVector.x);
                    }
                }

                if (Number.isFinite(this._rectDelta.top)) {
                    let deltaTopTop = magnetAreaRect.top - magnetRect.top;
                    let deltaTopTopAbs = Math.abs(deltaTopTop);
                    let deltaBottomTopAbs = Math.abs(deltaBottomTop);

                    if (deltaBottomTopAbs <= magnetism && deltaBottomTopAbs <= Math.abs(magnetVector.y)) {
                        magnetVector.y = deltaBottomTop;
                        magnetAreasBottom.set(magnetArea, magnetVector.y);
                    }
                    else if (deltaTopTopAbs <= magnetism && deltaTopTopAbs <= Math.abs(magnetVector.y)) {
                        magnetVector.y = deltaTopTop;
                        magnetAreasTop.set(magnetArea, magnetVector.y);
                    }
                }
            }

            for (let [magnetArea, magnetVectorY] of magnetAreasBottom) {
                if (magnetVectorY != magnetVector.y) continue;

                this._magnetVector.y = magnetVectorY;
                this._magnetAreasBottom.add(magnetArea);
            }

            for (let [magnetArea, magnetVectorX] of magnetAreasLeft) {
                if (magnetVectorX != magnetVector.x) continue;

                this._magnetVector.x = magnetVectorX;
                this._magnetAreasLeft.add(magnetArea);
            }

            for (let [magnetArea, magnetVectorX] of magnetAreasRight) {
                if (magnetVectorX != magnetVector.x) continue;

                this._magnetVector.x = magnetVectorX;
                this._magnetAreasRight.add(magnetArea);
            }

            for (let [magnetArea, magnetVectorY] of magnetAreasTop) {
                if (magnetVectorY != magnetVector.y) continue;

                this._magnetVector.y = magnetVectorY;
                this._magnetAreasTop.add(magnetArea);
            }
        }

        updatePositionDeltaModified(vector = null) {
            Object.assign(this._positionDeltaModified, vector);

            if (!this._component.bound) return;

            this._positionDeltaModified.x = Common.toRange(this._positionDeltaModified.x, this._rectDeltaBounded.left, this._rectDeltaBounded.right);
            this._positionDeltaModified.y = Common.toRange(this._positionDeltaModified.y, this._rectDeltaBounded.top, this._rectDeltaBounded.bottom);
        }

        updateRectDelta(rect = null) {
            Object.assign(this._rectDelta, rect);

            if (!this._component.bound) return;

            this._rectDelta.bottom = Math.min(this._rectDelta.bottom, this._rectDeltaBounded.bottom);
            this._rectDelta.left = Math.max(this._rectDelta.left, this._rectDeltaBounded.left);
            this._rectDelta.right = Math.min(this._rectDelta.right, this._rectDeltaBounded.right);
            this._rectDelta.top = Math.max(this._rectDelta.top, this._rectDeltaBounded.top);
        }

        updateTimestamp() {
            this._timeStamp = performance.now();
        }
    };

    static _eventHandlerDescriptors = {
        host: {
            pointerdown: function (event) {
                if (!this.gestures.size) return;

                this._addPointer(event);

                if (!this.dispatchEvent('capture', {originalEvent: event, pointer: this._pointerMain})) {
                    this._deletePointer(this._pointerMain);

                    return;
                }

                this._eventHandlers.host.pointermove.disabled = false;
                this._initPress(this._pointerMain, event);
            },

            pointermove: function (event) {
                let pointer = this._pointers.get(event.pointerId);

                if (!pointer) return;

                pointer.update(event);

                this._cancelPress(pointer);
                this._detectSwipe(pointer, event);

                this._updateMagnetAreasActive();
            },

            pointerup: function (event) {
                let pointer = this._pointers.get(event.pointerId);
                this._pointerTarget = null;

                if (!pointer) return;

                this._eventHandlers.host.pointermove.disabled = !this._pointers.size;
                pointer.updateTimestamp();

                this._detectTap(pointer, event);
                this._detectSwipeStop(pointer, event);
                this._detectFlick(pointer, event);
                this._dispatchEventDouble('releaseMain', 'release', pointer, event);

                this._deletePointer(pointer);
                this._cancelPress(pointer);
                this._updateMagnetAreasActive();
            },
        },

        shadow: {
            pointerdown: function (event) {
                this._pointerTarget = event.target;
            },
        },
    };

    static _fieldDescriptors = {
        deferredMagnetism: false,
        exclusiveCapture: false,
        invertedX: false,
        invertedY: false,
        multiPoint: false,
        shiftJumping: false,
        staticEnvironment: false,
        vertical: false,

        axis: {
            default: 'none',
            enum: ['none', 'x', 'y'],
        },

        bound: {
            default: '',

            updateBefore(value) {
                if (value instanceof Node) {
                    this._valueExtra = value;
                }
                else {
                    let selector = value + '';

                    try {
                        this._valueExtra = this._component.closest(selector);
                    }
                    catch {
                        this._valueExtra = null;
                    }
                }
            },
        },

        flickDurationMax: {
            cssPropFactor: 1e3,
            cssPropUnit: 'ms',
            default: Infinity,
            range: [0, Infinity],
        },

        flickVelocityMin: {
            default: 100,
            range: [0, Infinity],
        },

        gestures: {
            default: new Set(['flick', 'press', 'swipe', 'tap']),
            enum: ['flick', 'press', 'swipe', 'tap'],
        },

        magnetAreas: {
            default: '',

            updateAfter() {
                if (!this._component.staticEnvironment || !this.magnetism) return;

                this._component._defineMagnetAreaRects();
            },

            updateBefore(value) {
                if (value?.constructor == String) {
                    let rootNode = this._component.getRootNode(this._component);

                    try {
                        this._valueExtra = new Set(rootNode?.querySelectorAll(value));
                    }
                    catch {
                        this._valueExtra = null;
                    }
                }
                else if (value?.[Symbol.iterator]) {
                    this._valueExtra = new Set(value);
                }
                else {
                    this._valueExtra = null;
                }
            },
        },

        magnetism: {
            cssPropUnit: 'px',
            default: 0,
            range: [0, Infinity],
        },

        pressDuration: {
            cssPropFactor: 1e3,
            cssPropUnit: 'ms',
            default: 800,
            range: [0, Infinity],
        },

        radius: {
            default: Infinity,
            range: [1, Infinity],
        },

        shift: {
            cssPropUnit: 'px',
            default: 1,
            range: [1, Infinity],
        },

        step: {
            default: 1,
            range: [1, Infinity],
        },

        stepX: {
            default: 0,
            range: [0, Infinity],
        },

        stepY: {
            default: 0,
            range: [0, Infinity],
        },

        swipeFactor: {
            default: 1,
            range: [0, Infinity],
        },

        tapDuration: {
            cssPropFactor: 1e3,
            cssPropUnit: 'ms',
            default: 200,
            range: [0, Infinity],
        },
    };


    static checkIntersection(rect1, rect2) {
        return !(rect1.bottom <= rect2.top || rect1.left >= rect2.right || rect1.right <= rect2.left || rect1.top >= rect2.bottom);
    }


    static {
        this.init();
    }


    _magnetAreaRects = new Map();
    _magnetAreasActive = new Set();
    _magnetAreasActiveBottom = new Set();
    _magnetAreasActiveLeft = new Set();
    _magnetAreasActiveRight = new Set();
    _magnetAreasActiveTop = new Set();
    _pointerMain = null;
    _pointerTarget = null;
    _pointers = new Map();
    _tapFirstPosition = new Vector2d();
    _tapPrevTimeStamp = 0;
    _tapsCount = 0;


    _addPointer(pointerEvent) {
        if (this._pointerMain && !this.multiPoint) {
            this._deletePointer(this._pointerMain);
        }

        this._pointerMain = new this.constructor._Pointer(this, pointerEvent);
        this._pointers.set(this._pointerMain._id, this._pointerMain);
        this._pointerMain.capture();
    }

    _cancelPress(pointer) {
        if (!pointer._shifted && this._pointers.has(pointer._id)) return;

        Executor.cancelTask(pointer._GestureArea_detectPress);
    }

    _defineMagnetAreaRects() {
        if (!this.magnetAreas || !this.magnetism) return;

        this._magnetAreaRects.clear();

        for (let magnetArea of this.magnetAreas) {
            this._magnetAreaRects.set(magnetArea, this.constructor.getDomRect(magnetArea, true));
        }
    }

    _deletePointer(pointer) {
        pointer.release();
        this._pointers.delete(pointer._id);

        if (pointer == this._pointerMain) {
            this._pointerMain = null;
        }
    }

    _detectFlick(pointer, originalEvent) {
        if (!this.gestures.has('flick')) return;

        if (
            pointer._velocity.length < this.flickVelocityMin
            || pointer._points.at(-1).timeStamp - pointer._timeStampInitial > this.flickDurationMax
        ) return;

        this._dispatchEventDouble('flickMain', 'flick', pointer, originalEvent);
    }

    _detectPress(pointer, originalEvent) {
        this._updateTapsCount(pointer);
        this.dispatchEvent('press', {originalEvent, pointer, tapsCount: this._tapsCount});
    }

    _detectSwipe(pointer, originalEvent) {
        if (!pointer._shifted || !this.gestures.has('swipe')) return;

        if (!pointer._GestureArea_swiped) {
            pointer._GestureArea_swiped = true;
            this._dispatchEventDouble('swipeStartMain', 'swipeStart', pointer, originalEvent);
        }

        this._dispatchEventDouble('swipeMain', 'swipe', pointer, originalEvent);
    }

    _detectSwipeStop(pointer, originalEvent) {
        if (!pointer._shifted) return;

        this._dispatchEventDouble('swipeStopMain', 'swipeStop', pointer, originalEvent);
    }

    _detectTap(pointer, originalEvent) {
        if (pointer._shifted || pointer._timeStamp - pointer._timeStampInitial > this.tapDuration || !this.gestures.has('tap')) return;

        this._updateTapsCount(pointer);
        this.dispatchEvent('tap', {originalEvent, pointer, tapsCount: this._tapsCount});
    }

    _dispatchEventDouble(eventMainName, eventName, pointer, originalEvent) {
        let eventDetail = {originalEvent, pointer};
        let result = false;

        if (pointer == this._pointerMain) {
            result = this.dispatchEvent(eventMainName, eventDetail);
        }

        if (this.multiPoint) {
            result &&= this.dispatchEvent(eventName, eventDetail);
        }

        return result;
    }

    _init() {
        this._eventHandlers.host.pointermove.disabled = true;
    }

    _initPress(pointer, originalEvent) {
        if (!this.gestures.has('press')) return;

        pointer._GestureArea_detectPress = this._detectPress.bind(this, pointer, originalEvent);
        Executor.queueTask(pointer._GestureArea_detectPress, this.pressDuration);
    }

    _updateMagnetAreasActive() {
        if (!this.magnetAreas || !this.magnetism) return;

        for (let magnetArea of this._magnetAreasActive) {
            magnetArea.removeAttribute('_GestureArea_magnetEdges');
        }

        this._magnetAreasActive.clear();
        this._magnetAreasActiveBottom.clear();
        this._magnetAreasActiveLeft.clear();
        this._magnetAreasActiveRight.clear();
        this._magnetAreasActiveTop.clear();

        for (let pointer of this._pointers.values()) {
            for (let magnetArea of pointer._magnetAreasBottom) {
                this._magnetAreasActive.add(magnetArea);
                this._magnetAreasActiveBottom.add(magnetArea);
            }

            for (let magnetArea of pointer._magnetAreasLeft) {
                this._magnetAreasActive.add(magnetArea);
                this._magnetAreasActiveLeft.add(magnetArea);
            }

            for (let magnetArea of pointer._magnetAreasRight) {
                this._magnetAreasActive.add(magnetArea);
                this._magnetAreasActiveRight.add(magnetArea);
            }

            for (let magnetArea of pointer._magnetAreasTop) {
                this._magnetAreasActive.add(magnetArea);
                this._magnetAreasActiveTop.add(magnetArea);
            }
        }

        for (let magnetArea of this._magnetAreasActive) {
            let edgeNames = [];

            if (this._magnetAreasActiveBottom.has(magnetArea)) {
                edgeNames.push('bottom');
            }

            if (this._magnetAreasActiveLeft.has(magnetArea)) {
                edgeNames.push('left');
            }

            if (this._magnetAreasActiveRight.has(magnetArea)) {
                edgeNames.push('right');
            }

            if (this._magnetAreasActiveTop.has(magnetArea)) {
                edgeNames.push('top');
            }

            if (edgeNames.length) {
                magnetArea.setAttribute('_GestureArea_magnetEdges', edgeNames.join(' '));
            }
        }
    }

    _updateTapsCount(pointer) {
        if (
            pointer._timeStampInitial - this._tapPrevTimeStamp <= this.tapDuration
            && this._tapFirstPosition?.clone().sub(pointer._positionOuter).length <= this.shift
        ) {
            this._tapsCount++;
        }
        else {
            this._tapsCount = 1;
            this._tapFirstPosition.setVector(pointer._positionOuter);
        }

        this._tapPrevTimeStamp = pointer._timeStamp;
    }
}
