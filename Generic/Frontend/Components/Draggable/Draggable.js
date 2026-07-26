import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class Draggable extends GestureArea {
    static _eventHandlerDescriptors = {
        host: {
            swipeMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                let magnetVector = this._pointerMain._magnetVector;
                let positionDelta = this._pointerMain._positionDelta.clone();

                let magnetRectDelta = {};
                magnetRectDelta.bottom = magnetRectDelta.top = this.axis != 'x' ? positionDelta.y : 0;
                magnetRectDelta.left = magnetRectDelta.right = this.axis != 'y' ? positionDelta.x : 0;
                this._pointerMain.updateMagnetVector(magnetRectDelta);
                positionDelta.sum(magnetVector).toRangeLength(0, this.radius);

                if (this.axis != 'x') {
                    let step = magnetVector.y == undefined ? this.stepY || this.step : 1;
                    this._positionCurrent.y = this._positionInitial.y + Math.round(positionDelta.y / step) * step;
                }

                if (this.axis != 'y') {
                    let step = magnetVector.x == undefined ? this.stepX || this.step : 1;
                    this._positionCurrent.x = this._positionInitial.x + Math.round(positionDelta.x / step) * step;
                }

                this._positionCurrent.toRange(this._positionMin, this._positionMax).round();

                if (this._position.isEqual(this._positionCurrent)) return;

                this._position = this._positionCurrent;
                this._detectDropTarget();
                this.dispatchEvent('drag', event.detail);

                if (this._dropTarget != this._dropTargetPrev) {
                    this.dispatchEvent('dropTarget', event.detail);
                }
            },

            swipeStartMain: function (event) {
                this._pointerMainIsBlocked = !this._pointerMain || !this._checkHandle(this._pointerMain._target);

                if (this._pointerMainIsBlocked) return;

                let domRect = this.constructor.getDomRect(this.target, true);
                this._dragging = true;
                this._pointerMain.magnetRect = domRect;
                this._positionCurrent.set(this.constructor.getLeft(this.target), this.constructor.getTop(this.target));
                this._positionInitial.setVector(this._positionCurrent);

                if (this.bound) {
                    let domRectBound = this.constructor.getDomRect(this.bound);
                    this._positionMax.x = this._positionInitial.x + domRectBound.right - domRect.right;
                    this._positionMax.y = this._positionInitial.y + domRectBound.bottom - domRect.bottom;
                    this._positionMin.x = this._positionInitial.x + domRectBound.left - domRect.left;
                    this._positionMin.y = this._positionInitial.y + domRectBound.top - domRect.top;
                }
                else {
                    this._positionMax.set(Infinity);
                    this._positionMin.set(-Infinity);
                }

                if (this.dynamicEnvironment) {
                    this._defineDropAreaDomRects();
                    this._defineMagnetAreaRects();
                }

                this.dispatchEvent('dragStart', event.detail);
            },

            swipeStopMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                this._dragging = false;
                this.dispatchEvent('dragStop', event.detail);
                this._dropTarget = null;

                if (this.springy) {
                    this._position = this._positionInitial;
                }
            },
        },
    };

    static _fieldDescriptors = {
        _dragging: false,


        springy: false,
        wideDrop: false,

        axis: {
            default: 'none',
            enum: ['none', 'x', 'y'],
        },

        bound: {
            default: '',
            extra: true,

            updateBefore() {
                if (!(this._valuePrepared instanceof Node)) {
                    let selector = this._valuePrepared + '';

                    try {
                        this._valuePrepared = this._component.closest(selector);
                    }
                    catch {
                        this._valuePrepared = null;
                    }
                }
            },
        },

        dropAreas: class Field extends super._fieldDescriptors.magnetAreas {
            _updateAfter() {
                if (this._component.dynamicEnvironment) return;

                this._component._defineDropAreaDomRects();
            }
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

            updateBefore() {
                if (!(this._valuePrepared instanceof Node)) {
                    let selector = this._valuePrepared + '';

                    try {
                        this._valuePrepared = this._component.closest(selector) || this._component.querySelector(selector);
                    }
                    catch {
                        this._valuePrepared = null;
                    }

                    this._valuePrepared ||= this._component;
                }
            },
        },
    };


    static getIntersectionSquare(rect1, rect2) {
        let height = Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top);
        let width = Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left);

        return height > 0 && width > 0 ? height * width : 0;
    }


    static {
        this.init();
    }


    __dropTarget = null;
    __position = new Vector2d();


    _dropAreaDomRects = new Map();
    _dropTargetPrev = null;
    _pointerMainIsBlocked = false;
    _pointerRect = null;
    _positionCurrent = new Vector2d();
    _positionInitial = new Vector2d();
    _positionMax = new Vector2d();
    _positionMin = new Vector2d();


    get _dropTarget() {
        return this.__dropTarget;
    }
    set _dropTarget(dropTarget) {
        this._dropTargetPrev = this._dropTarget;
        this.__dropTarget = dropTarget;

        if (this._dropTarget == this._dropTargetPrev) return;

        this._dropTargetPrev?.removeAttribute('_Draggable_dropTarget');
        this._dropTarget?.setAttribute('_Draggable_dropTarget', '');
    }

    get _position() {
        return this.__position;
    }
    set _position(position) {
        this.__position.setVector(position);
        this.constructor.setLeft(this.target, this._position.x);
        this.constructor.setTop(this.target, this._position.y);
    }


    _checkHandle(target) {
        let handle = null;

        try {
            handle = this.handle instanceof Node ? this.handle : target.closest(this.handle);
        }
        catch {
            return true;
        }

        return this.target.contains(handle) && handle.contains(target);
    }

    _defineDropAreaDomRects() {
        if (!this.dropAreas || !this.wideDrop) return;

        this._dropAreaDomRects.clear();

        for (let dropArea of this.dropAreas) {
            this._dropAreaDomRects.set(dropArea, this.constructor.getDomRect(dropArea, true));
        }
    }

    _detectDropTarget() {
        if (!this.dropAreas) return;

        if (this.wideDrop) {
            let domRect = this.constructor.getDomRect(this, true);
            let dropTarget = null;
            let intersectionSquareMax = 0;

            for (let dropArea of this.dropAreas) {
                let intersectionSquare = this.constructor.getIntersectionSquare(domRect, this._dropAreaDomRects.get(dropArea));

                if (intersectionSquare <= intersectionSquareMax) continue;

                dropTarget = dropArea;
                intersectionSquareMax = intersectionSquare;
            }

            this._dropTarget = dropTarget;
        }
        else {
            let nodes = document.elementsFromPoint(this._pointerMain._positionOuter.x, this._pointerMain._positionOuter.y);
            this._dropTarget = nodes[0] == this && this.dropAreas.has(nodes[1]) ? nodes[1] : null;
        }
    }


    reset() {
        this._position = new Vector2d();
    }
}
