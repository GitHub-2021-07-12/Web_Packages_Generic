import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class Draggable extends GestureArea {
    static _eventHandlerDescriptors = {
        host: {
            capture: function (event) {
                let pointer = event.detail.pointer;
                pointer._Draggable_blocked ??= !this._checkHandle(pointer._target);

                if (pointer._Draggable_blocked) return;

                this._positionCurrent.set(this.constructor.getLeft(this.target), this.constructor.getTop(this.target));
                this._positionInitial.setVector(this._positionCurrent);

                if (this.bound) {
                    let domRect = this.constructor.getDomRect(this.target, true);
                    let domRectParent = this.constructor.getDomRect(this.bound);
                    this._positionMax.x = this._positionInitial.x + domRectParent.right - domRect.right;
                    this._positionMax.y = this._positionInitial.y + domRectParent.bottom - domRect.bottom;
                    this._positionMin.x = this._positionInitial.x + domRectParent.left - domRect.left;
                    this._positionMin.y = this._positionInitial.y + domRectParent.top - domRect.top;
                }
                else {
                    this._positionMax.set(Infinity);
                    this._positionMin.set(-Infinity);
                }
            },

            swipeMain: function (event) {
                let pointer = event.detail.pointer;

                if (pointer._Draggable_blocked) return;

                let positionDelta = pointer._positionDeltaMagnetized.clone().toRangeLength(0, this.radius);

                if (this.axis != 'x') {
                    let step = this.stepY || this.step;
                    this._positionCurrent.y = this._positionInitial.y + Math.round(positionDelta.y / step) * step;
                }

                if (this.axis != 'y') {
                    let step = this.stepX || this.step;
                    this._positionCurrent.x = this._positionInitial.x + Math.round(positionDelta.x / step) * step;
                }

                this._positionCurrent.toRange(this._positionMin, this._positionMax).round();

                if (this._position.isEqual(this._positionCurrent)) return;

                this._position = this._positionCurrent;
                this.dispatchEvent('drag', {originalEvent: event.detail.originalEvent});
            },

            swipeStartMain: function (event) {
                if (event.detail.pointer._Draggable_blocked) return;

                this._dragging = true;
                this.dispatchEvent('dragStart', {originalEvent: event.detail.originalEvent});
            },

            swipeStopMain: function (event) {
                if (event.detail.pointer._Draggable_blocked) return;

                this._dragging = false;
                this.dispatchEvent('dragStop', {originalEvent: event.detail.originalEvent});

                if (!this.springy) return;

                this._position = this._positionInitial;
            },
        },
    };

    static _fieldDescriptors = {
        _dragging: false,


        springy: false,

        axis: {
            default: 'none',
            enum: ['none', 'x', 'y'],
        },

        bound: {
            default: '',
            extra: true,

            process(value) {
                if (!(value instanceof Node)) {
                    let selector = value + '';

                    try {
                        value = this._component.closest(selector);
                    }
                    catch {
                        value = null;
                    }
                }

                return value;
            },
        },

        handle: {
            default: '',
            extra: true,
        },

        radius: {
            default: Infinity,
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

        target: {
            default: '',
            extra: true,

            process(value) {
                if (!(value instanceof Node)) {
                    let selector = value + '';

                    try {
                        value = this._component.closest(selector) || this._component.querySelector(selector);
                    }
                    catch {
                        value = null;
                    }

                    value ||= this._component;
                }

                return value;
            },
        },
    };


    static {
        this.init();
    }


    __position = new Vector2d();


    _positionCurrent = new Vector2d();
    _positionInitial = new Vector2d();
    _positionMax = new Vector2d();
    _positionMin = new Vector2d();


    get _position() {
        return this.__position;
    }
    set _position(position) {
        this.__position.setVector(position);
        this.constructor.setLeft(this.target, this._position.x);
        this.constructor.setTop(this.target, this._position.y);
    }


    _checkHandle(target) {
        try {
            let handle = this.handle instanceof Node ? this.handle : target.closest(this.handle);

            return this.target.contains(handle) && handle.contains(target);
        }
        catch {}

        return true;
    }


    reset() {
        this._position = new Vector2d();
    }
}
