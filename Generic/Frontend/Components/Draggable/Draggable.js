import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class Draggable extends GestureArea {
    static _eventHandlerDescriptors = {
        host: {
            swipeMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                this._positionDeltaPrev.setVector(this._positionDelta);
                this._positionDelta = this._pointerMain._positionDelta;
                this._detectDropTarget();

                if (this.axis != 'x') {
                    let step = this.stepY || this.step;
                    this._positionDelta.y = Math.round(this._positionDelta.y / step) * step;
                }

                if (this.axis != 'y') {
                    let step = this.stepX || this.step;
                    this._positionDelta.x = Math.round(this._positionDelta.x / step) * step;
                }

                this._pointerMain.updateMagnetVector({
                    bottom: this._positionDelta.y,
                    left: this._positionDelta.x,
                    right: this._positionDelta.x,
                    top: this._positionDelta.y,
                });
                this._magnetAreas = this._pointerMain._magnetAreas;

                if (!this.deferredMagnetism) {
                    this._positionDelta = this._positionDelta.sum(this._pointerMain._magnetVector);
                }

                if (this._positionDelta.isEqual(this._positionDeltaPrev)) return;

                this._position = this._position.setVector(this._positionInitial).sum(this._positionDelta);
                this.dispatchEvent('drag', event.detail);
            },

            swipeStartMain: function (event) {
                this._pointerMainIsBlocked = !this._pointerMain || !this._checkHandle(this._pointerMain._target);

                if (this._pointerMainIsBlocked) return;

                let domRect = this.constructor.getDomRect(this.target, true);
                this._dragging = true;
                this._pointerMain.magnetRect = domRect;
                this._positionInitial.set(this.constructor.getLeft(this.target), this.constructor.getTop(this.target));

                if (this.bound) {
                    let boundDomRect = this.constructor.getDomRect(this.bound);
                    this._positionDeltaMax.set(boundDomRect.right - domRect.right, boundDomRect.bottom - domRect.bottom);
                    this._positionDeltaMin.set(boundDomRect.left - domRect.left, boundDomRect.top - domRect.top);
                }
                else {
                    this._positionDeltaMax.set(Infinity);
                    this._positionDeltaMin.set(-Infinity);
                }

                if (this.dynamicEnvironment) {
                    this._defineDropAreaDomRects();
                    this._defineMagnetAreaRects();
                }

                this.dispatchEvent('dragStart', event.detail);
            },

            swipeStopMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                if (this.deferredMagnetism) {
                    this._positionDelta = this._positionDelta.sum(this._pointerMain._magnetVector);
                    this._position = this._position.setVector(this._positionInitial).sum(this._positionDelta);
                }

                this._magnetAreas = null;
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


        deferredMagnetism: false,
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
    __magnetAreas = null;
    __position = new Vector2d();
    __positionDelta = new Vector2d();


    _dropAreaDomRects = new Map();
    _dropTargetPrev = null;
    // _magnetAreasPrev = null;
    _pointerMainIsBlocked = false;
    _positionDeltaMax = new Vector2d();
    _positionDeltaMin = new Vector2d();
    _positionDeltaPrev = new Vector2d();
    _positionInitial = new Vector2d();


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

    get _magnetAreas() {
        return this.__magnetAreas;
    }
    set _magnetAreas(magnetAreas) {
        if (this._magnetAreas) {
            for (let magnetArea of this._magnetAreas) {
                magnetArea.removeAttribute('_Draggable_magnetArea');
            }
        }

        this.__magnetAreas = new Set(magnetAreas);

        if (this._magnetAreas) {
            for (let magnetArea of this._magnetAreas) {
                magnetArea.setAttribute('_Draggable_magnetArea', '');
            }
        }
    }

    get _position() {
        return this.__position;
    }
    set _position(position) {
        this.__position.setVector(position);
        this.constructor.setLeft(this.target, this._position.x);
        this.constructor.setTop(this.target, this._position.y);
    }

    get _positionDelta() {
        return this.__positionDelta;
    }
    set _positionDelta(positionDelta) {
        this.__positionDelta
            .set(this.axis != 'y' ? positionDelta.x : 0, this.axis != 'x' ? positionDelta.y : 0)
            .toRange(this._positionDeltaMin, this._positionDeltaMax)
            .toRangeLength(0, this.radius)
            .round()
        ;
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
            this._dropTarget = nodes.find((node) => this.dropAreas.has(node));
        }

        if (this._dropTarget != this._dropTargetPrev) {
            this.dispatchEvent('dropTarget', event.detail);
        }
    }


    reset() {
        this._position = new Vector2d();
    }
}
