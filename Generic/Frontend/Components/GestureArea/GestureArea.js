import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';

import {Executor} from '/Packages/Generic/Js/Executor/Executor.js';
import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class GestureArea extends Component {
    static _Pointer = class {
        static _idsCaptured = new Set();


        static pointsCountMax = 4;


        _component = null;
        _id = 0;
        _magnetAreasBottom = new Set();
        _magnetAreasLeft = new Set();
        _magnetAreasRight = new Set();
        _magnetAreasTop = new Set();
        _magnetVector = new Vector2d();
        _points = [];
        _positionDelta = new Vector2d();
        _positionInner = new Vector2d();
        _positionInnerInitial = new Vector2d();
        _positionOuter = new Vector2d();
        _positionOuterInitial = new Vector2d();
        _shifted = false;
        _target = null;
        _timeStamp = performance.now();
        _timeStampInitial = this._timeStamp;
        _velocity = new Vector2d();


        magnetRect = null;


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

            if (this._component.jumping || this._component.shift <= 1) return;

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


        capture() {
            let idsCaptured = this.constructor._idsCaptured;

            if (!this._target || idsCaptured.has(this._id)) return;

            this._target.setPointerCapture(this._id);
            idsCaptured.add(this._id);
        }

        constructor(component, event) {
            this._component = component;
            this._id = event.pointerId;
            this._target = this._component._pointerTarget || event.target;
            this._updatePositions(event);
            this._positionInnerInitial.setVector(this._positionInner);
            this._positionOuterInitial.setVector(this._positionOuter);
        }

        release() {
            if (!this._target) return;

            this._target.releasePointerCapture(this._id);
            this.constructor._idsCaptured.delete(this._id);
        }

        update(event) {
            this._timeStamp = performance.now();
            this._updatePositions(event);
            this._positionDelta.setVector(this._positionOuter).sub(this._positionOuterInitial);
            this._detectShift();

            if (!this._shifted) return;

            this._updatePoints();
            this._defineVelocity();
            this._positionDelta.prod(this._component.swipeFactor);
        }

        updateMagnetVector(magnetRectDelta) {
            let magnetAreas = this._component.magnetAreas;
            let magnetism = this._component.magnetism;
            this._magnetAreasBottom.clear();
            this._magnetAreasLeft.clear();
            this._magnetAreasRight.clear();
            this._magnetAreasTop.clear();
            this._magnetVector.set(null);

            if (!this.magnetRect || !magnetAreas?.size || !magnetism) return;

            let magnetAreasBottom = new Map();
            let magnetAreasLeft = new Map();
            let magnetAreasRight = new Map();
            let magnetAreasTop = new Map();
            let magnetRect = {
                bottom: this.magnetRect.bottom + (magnetRectDelta.bottom || 0),
                left: this.magnetRect.left + (magnetRectDelta.left || 0),
                right: this.magnetRect.right + (magnetRectDelta.right || 0),
                top: this.magnetRect.top + (magnetRectDelta.top || 0),
            };
            let magnetVector = new Vector2d(Infinity);

            for (let magnetArea of magnetAreas) {
                let magnetAreaRect = this._component._magnetAreaRects.get(magnetArea);
                let deltaBottomTop = magnetAreaRect.bottom - magnetRect.top;
                let deltaLeftRight = magnetAreaRect.left - magnetRect.right;
                let deltaRightLeft = magnetAreaRect.right - magnetRect.left;
                let deltaTopBottom = magnetAreaRect.top - magnetRect.bottom;

                if (deltaLeftRight > magnetism || deltaTopBottom > magnetism || deltaRightLeft < -magnetism || deltaBottomTop < -magnetism) continue;

                if (magnetRectDelta.bottom != undefined) {
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

                if (magnetRectDelta.left != undefined) {
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

                if (magnetRectDelta.right != undefined) {
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

                if (magnetRectDelta.top != undefined) {
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
    };

    static _eventHandlerDescriptors = {
        host: {
            pointerdown: function (event) {
                if (!this.gestures.size || !this.receptive && this.constructor._Pointer._idsCaptured.has(event.pointerId)) return;

                if (this._pointerMain && !this.multiPoint) {
                    this._deletePointer(this._pointerMain);
                }

                this._eventHandlers.host.pointermove.disabled = false;
                this._addPointer(event);
                this._initPress(this._pointerMain, event);
                this.dispatchEvent('capture', {originalEvent: event, pointer: this._pointerMain});
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
                pointer.update(event);

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
        dynamicEnvironment: false,
        invertedX: false,
        invertedY: false,
        jumping: false,
        multiPoint: false,
        receptive: false,
        vertical: false,

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
                if (this._component.dynamicEnvironment || !this.magnetism) return;

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

        shift: {
            cssPropUnit: 'px',
            default: 1,
            range: [1, Infinity],
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
        this._pointerMain = new this.constructor._Pointer(this, pointerEvent);
        this._pointerMain.capture();
        this._pointers.set(this._pointerMain._id, this._pointerMain);
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
        if (!this.gestures.has('swipe')) return;
        if (!pointer._shifted) return;

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
        if (!this.gestures.has('tap')) return;
        if (pointer._shifted || pointer._timeStamp - pointer._timeStampInitial > this.tapDuration) return;

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
