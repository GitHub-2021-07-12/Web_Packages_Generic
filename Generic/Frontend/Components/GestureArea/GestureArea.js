import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';

import {Common} from '/Packages/Generic/Js/Common/Common.js';
import {Executor} from '/Packages/Generic/Js/Executor/Executor.js';
import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class GestureArea extends Component {
    static _Pointer = class {
        static _idsCaptured = new Set();


        static pointsCountMax = 4;


        _component = null;
        _id = 0;
        // _magnetLinesX = [];
        // _magnetLinesY = [];
        // _magnetPoints = [];
        _magnetRect = null;
        _points = [];
        _positionDelta = new Vector2d();
        // _positionDeltaMagnetized = new Vector2d();
        _positionInner = new Vector2d();
        _positionInnerInitial = new Vector2d();
        _positionMagnetized = new Vector2d();
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
            this._positionInnerInitial.sum(this._positionDelta);
            this._positionOuterInitial.sum(this._positionDelta);
            this._positionDelta.set(0);
        }

        _updatePoints() {
            let point = {
                position: this._positionOuter.clone(),
                timeStamp: this._timeStamp,
            };
            this._points.push(point);

            if (this._points.length > this.constructor.pointsCountMax) {
                this._points.shift();
            }
        }

        _updatePositionMagnetized() {
            let magnetAreas = this._component.magnetAreas;
            let magnetism = this._component.magnetism;
            this._positionMagnetized.setVector(this._positionOuter);

            if (!this.magnetRect || !magnetAreas || !magnetism) return;

            let magnetRect = {
                bottom: this.magnetRect.bottom + this._positionDelta.y,
                left: this.magnetRect.left + this._positionDelta.x,
                right: this.magnetRect.right + this._positionDelta.x,
                top: this.magnetRect.top + this._positionDelta.y,
            };

            for (let magnetArea of magnetAreas) {
                let magnetAreaRect = this._component._magnetAreaRects.get(magnetArea);

                if (
                    magnetAreaRect.left - magnetRect.right > magnetism
                    || magnetAreaRect.top - magnetRect.bottom > magnetism
                    || magnetRect.left - magnetAreaRect.right > magnetism
                    || magnetRect.top - magnetAreaRect.bottom > magnetism
                ) continue;

                if (Math.abs(magnetRect.left - magnetAreaRect.left) <= magnetism) {
                    // this._positionDelta.x = magnetAreaRect.left;
                    this._positionDelta.x -= magnetRect.left - magnetAreaRect.left;
                }
                else if (Math.abs(magnetRect.left - magnetAreaRect.right) <= magnetism) {
                    this._positionDelta.x -= magnetRect.left - magnetAreaRect.right;
                }




            }
        }

        _updatePositions(event) {
            if (this._component.vertical) {
                if (this._component.invertedX) {
                    // this._positionInner.x = this._component.clientWidth - event.offsetY - 1;
                    // this._positionOuter.x = document.scrollingElement.scrollWidth - event.pageY - 1;
                    this._positionInner.x = this._component.clientHeight - event.offsetY - 1;
                    this._positionOuter.x = document.scrollingElement.scrollHeight - event.pageY - 1;
                }
                else {
                    this._positionInner.x = event.offsetY;
                    this._positionOuter.x = event.pageY;
                }

                if (this._component.invertedY) {
                    this._positionInner.y = this._component.clientWidth - event.offsetX - 1;
                    // this._positionOuter.y = document.scrollingElement.scrollHeight - event.pageX - 1;
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
                    // this._positionInner.y = this._component.clientWidth - event.offsetY - 1;
                    this._positionInner.y = this._component.clientHeight - event.offsetY - 1;
                    this._positionOuter.y = document.scrollingElement.scrollHeight - event.pageY - 1;
                }
                else {
                    this._positionInner.y = event.offsetY;
                    this._positionOuter.y = event.pageY;
                }
            }

            console.log(this._positionInner, this._positionOuter)
        }


        capture() {
            let idsCaptured = this.constructor._idsCaptured;

            if (!this._target || idsCaptured.has(this._id)) return;

            this._target.setPointerCapture(this._id);
            idsCaptured.add(this._id);
        }

        constructor(component, event, magnetRect = null) {
            this._component = component;
            this._id = event.pointerId;
            this._magnetRect = magnetRect;
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
    };

    static _eventHandlerDescriptors = {
        host: {
            pointerdown: function (event) {
                // if (!this.gestures.size || this.constructor._Pointer._idsCaptured.has(event.pointerId)) return;
                if (!this.gestures.size) return;

                if (this._pointerMain && !this.multiPoint) {
                    this._deletePointer(this._pointerMain);
                }

                this._eventHandlers.host.pointermove.disabled = false;
                this._addPointer(event);
                this._initPress(this._pointerMain, event);

                if (this.dynamicEnvironment) {
                    this._defineMagnetAreaRects();
                }

                this.dispatchEvent('capture', {originalEvent: event, pointer: this._pointerMain});
            },

            pointermove: function (event) {
                let pointer = this._pointers.get(event.pointerId);

                if (!pointer) return;

                pointer.update(event);

                this._cancelPress(pointer);
                this._detectSwipe(pointer, event);
            },

            pointerup: function (event) {
                let pointer = this._pointers.get(event.pointerId);
                this._pointerTarget = null;

                if (!pointer) return;

                pointer.update(event);

                this._detectTap(pointer, event);
                this._detectSwipeStop(pointer, event);
                this._detectFlick(pointer, event);
                this._dispatchEventDouble('releaseMain', 'release', pointer, event);

                this._deletePointer(pointer);
                this._cancelPress(pointer);
                this._eventHandlers.host.pointermove.disabled = !this._pointers.size;
            },
        },

        shadow: {
            pointerdown: function (event) {
                this._pointerTarget = event.target;
            },
        },
    };

    static _fieldDescriptors = {
        dynamicEnvironment: false,
        invertedX: false,
        invertedY: false,
        jumping: false,
        multiPoint: false,
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
            extra: true,

            updateAfter() {
                if (this._component.dynamicEnvironment) return;

                this._component._defineMagnetAreaRects();
            },

            updateBefore() {
                if (this._valuePrepared?.constructor == String) {
                    try {
                        this._valuePrepared = new Set(document.querySelectorAll(this._valuePrepared));
                        this._valuePrepared.delete(this._component);
                    }
                    catch {
                        this._valuePrepared = null;
                    }
                }
                else if (this._valuePrepared?.[Symbol.iterator]) {
                    this._valuePrepared = new Set(this._valuePrepared);
                }
                else {
                    this._valuePrepared = null;
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

    static getIntersectionSquare(rect1, rect2) {
        let height = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
        let width = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);

        return height > 0 && width > 0 ? height * width : 0;
    }


    static {
        this.init();
    }


    _magnetAreaRects = new Map();
    _pointerMain = null;
    _pointerTarget = null;
    _pointers = new Map();
    _tapFirstPosition = new Vector2d();
    _tapPrevTimeStamp = 0;
    _tapsCount = 0;


    _addPointer(event) {
        this._pointerMain = new this.constructor._Pointer(this, event);
        this._pointerMain.capture();
        this._pointers.set(this._pointerMain._id, this._pointerMain);
    }

    _cancelPress(pointer) {
        if (!pointer._shifted && this._pointers.has(pointer._id)) return;

        Executor.cancelTask(pointer._GestureArea_detectPress);
    }

    _defineMagnetAreaRects() {
        if (!this.magnetAreas) return;

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
