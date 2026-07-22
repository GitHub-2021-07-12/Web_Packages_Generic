import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Vector2d} from '/Packages/Generic/Js/Vector2d/Vector2d.js';


export class Draggable extends GestureArea {
    static _eventHandlerDescriptors = {
        host: {
            capture: function () {
                this._pointerMainIsBlocked = !this._pointerMain || !this._checkHandle(this._pointerMain._target);

                if (this._pointerMainIsBlocked) return;

                // if (!this._pointerMain || !this._checkHandle(this._pointerMain._target)) return;

                // console.log('capture', this, this._pointerMain)

                this._pointerMain.magnetRect = this.constructor.getDomRect(this, true);

                this._domRect = this.constructor.getDomRect(this, true);
                this._positionCurrent.set(this.constructor.getLeft(this.target), this.constructor.getTop(this.target));
                this._positionInitial.setVector(this._positionCurrent);

                if (this.bound) {
                    let domRect = this.constructor.getDomRect(this.target, true);
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

                if (!this.dynamicEnvironment) return;

                this._defineDropAreaDomRects();
                this._defineMagnetAreaRects();
            },

            swipeMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                // this._pointerMain._checkMagnetism();

                // console.log('swipeMain', this, this._pointerMain)

                // this._definePointerRect();
                // this._detectMagnetAreaTarget();
                // let positionDelta = this._pointerMain._positionDeltaMagnetized.clone().toRangeLength(0, this.radius);
                let positionDelta = this._pointerMain._positionDelta.clone().toRangeLength(0, this.radius);

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

                // this._pointerMain.magnetRect = this.constructor.getDomRect(this, true);
                // this._pointerMain._checkMagnetism();

                this._definePointerRect();
                // this._detectMagnetAreaTarget();
                this._position = this._positionCurrent;
                this._detectDropTarget();
                this.dispatchEvent('drag', event.detail);

                if (this._dropTarget == this._dropTargetPrev) return;

                this.dispatchEvent('dropTarget', event.detail);
            },

            swipeStartMain: function (event) {
                // console.log('swipeStartMain', this, this._pointerMain)

                if (this._pointerMainIsBlocked) return;

                // console.log('swipeStartMain', this, this._pointerMain)

                // this._domRect = this.constructor.getDomRect(this, true);
                this._dragging = true;
                // this._definePointerShifts();
                this.dispatchEvent('dragStart', event.detail);
            },

            swipeStopMain: function (event) {
                // console.log('swipeStopMain', this, this._pointerMain)

                if (this._pointerMainIsBlocked) return;

                // console.log('swipeStopMain', this, this._pointerMain)

                this._dragging = false;
                this.dispatchEvent('dragStop', event.detail);

                if (this.dropAreas) {
                    this.dispatchEvent('drop', event.detail);
                    this._dropTarget = null;
                }

                if (!this.springy) return;

                this._position = this._positionInitial;
            },
        },
    };

    static _fieldDescriptors = {
        _dragging: false,


        dynamicEnvironment: false,
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

        dropAreas: {
            default: '',
            extra: true,

            updateAfter() {
                if (this._component.dynamicEnvironment) return;

                this._component._defineDropAreaDomRects();
            },

            updateBefore() {
                if (this._valuePrepared?.constructor == String) {
                    try {
                        this._valuePrepared = new Set(document.querySelectorAll(this._valuePrepared));
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

        handle: {
            default: '',
            extra: true,
        },

        // magnetAreas: {
        //     default: '',
        //     extra: true,

        //     updateAfter() {
        //         if (this._component.dynamicEnvironment) return;

        //         this._component._defineMagnetAreaRects();
        //     },

        //     updateBefore() {
        //         if (this._valuePrepared?.constructor == String) {
        //             try {
        //                 this._valuePrepared = new Set(document.querySelectorAll(this._valuePrepared));
        //                 this._valuePrepared.delete(this._component);
        //             }
        //             catch {
        //                 this._valuePrepared = null;
        //             }
        //         }
        //         else if (this._valuePrepared?.[Symbol.iterator]) {
        //             this._valuePrepared = new Set(this._valuePrepared);
        //         }
        //         else {
        //             this._valuePrepared = null;
        //         }
        //     },
        // },

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


    static {
        this.init();
    }


    __dropTarget = null;
    __position = new Vector2d();


    _domRect = null;
    _dropAreaDomRects = new Map();
    _dropTargetPrev = null;
    _magnetAreaRects = new Map();
    _magnetAreaTarget = null;
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

    // _defineMagnetAreaRects() {
    //     if (!this.magnetAreas) return;

    //     this._magnetAreaRects.clear();

    //     for (let magnetArea of this.magnetAreas) {
    //         let domRect = this.constructor.getDomRect(magnetArea, true);
    //         let rects = {
    //             bottom: {
    //                 bottom: domRect.bottom + this.magnetism,
    //                 left: domRect.left - this.magnetism,
    //                 right: domRect.right + this.magnetism,
    //                 top: domRect.bottom - this.magnetism,
    //             },
    //             left: {
    //                 bottom: domRect.bottom + this.magnetism,
    //                 left: domRect.left - this.magnetism,
    //                 right: domRect.left + this.magnetism,
    //                 top: domRect.top - this.magnetism,
    //             },
    //             right: {
    //                 bottom: domRect.bottom + this.magnetism,
    //                 left: domRect.right - this.magnetism,
    //                 right: domRect.right + this.magnetism,
    //                 top: domRect.top - this.magnetism,
    //             },
    //             top: {
    //                 bottom: domRect.top + this.magnetism,
    //                 left: domRect.left - this.magnetism,
    //                 right: domRect.right + this.magnetism,
    //                 top: domRect.top - this.magnetism,
    //             },
    //         };
    //         this._magnetAreaRects.set(magnetArea, rects);
    //     }
    // }

    _definePointerRect() {
        if (!this.dropAreas && !this.magnetAreas) return;

        let pointerPositionDelta = this._pointerMain._positionDelta;
        this._pointerRect = {
            bottom: this._domRect.bottom + pointerPositionDelta.y,
            left: this._domRect.left + pointerPositionDelta.x,
            right: this._domRect.right + pointerPositionDelta.x,
            top: this._domRect.top + pointerPositionDelta.y,
        };
    }

    _detectDropTarget() {
        if (!this.dropAreas) return;

        if (this.wideDrop) {
            let dropTarget = null;
            let intersectionSquareMax = 0;

            for (let dropArea of this.dropAreas) {
                let intersectionSquare = this.constructor.getIntersectionSquare(this._pointerRect, this._dropAreaDomRects.get(dropArea));

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

    _detectMagnetAreaTarget() {
        if (!this.magnetAreas) return;

        let rects = {
            bottom: {
                bottom: this._pointerRect.bottom,
                left: this._pointerRect.left,
                right: this._pointerRect.right,
                top: this._pointerRect.bottom,
            },
            left: {
                bottom: this._pointerRect.bottom,
                left: this._pointerRect.left,
                right: this._pointerRect.left,
                top: this._pointerRect.top,
            },
            right: {
                bottom: this._pointerRect.bottom,
                left: this._pointerRect.right,
                right: this._pointerRect.right,
                top: this._pointerRect.top,
            },
            top: {
                bottom: this._pointerRect.top,
                left: this._pointerRect.left,
                right: this._pointerRect.right,
                top: this._pointerRect.top,
            },
        };

        // this._magnetAreaTarget?.removeAttribute('_Draggable_magnetTarget');

        for (let magnetArea of this.magnetAreas) {
            let magnetAreaRects = this._magnetAreaRects.get(magnetArea);

            if (this.constructor.checkIntersection(rects.top, magnetAreaRects.bottom)) {
                this._positionCurrent.y += (magnetAreaRects.bottom.bottom + magnetAreaRects.bottom.top) / 2 - this._pointerRect.top;

                // break;
            }
            else if (this.constructor.checkIntersection(rects.bottom, magnetAreaRects.bottom)) {
                this._positionCurrent.y += (magnetAreaRects.bottom.bottom + magnetAreaRects.bottom.top) / 2 - this._pointerRect.bottom;

                // break;
            }
            else if (this.constructor.checkIntersection(rects.top, magnetAreaRects.top)) {
                this._positionCurrent.y += (magnetAreaRects.top.bottom + magnetAreaRects.top.top) / 2 - this._pointerRect.top;

                // break;
            }
            else if (this.constructor.checkIntersection(rects.bottom, magnetAreaRects.top)) {
                this._positionCurrent.y += (magnetAreaRects.top.bottom + magnetAreaRects.top.top) / 2 - this._pointerRect.bottom;

                // break;
            }

            if (this.constructor.checkIntersection(rects.left, magnetAreaRects.right)) {
                this._positionCurrent.x += (magnetAreaRects.right.right + magnetAreaRects.right.left) / 2 - this._pointerRect.left;

                break;
            }
            else if (this.constructor.checkIntersection(rects.right, magnetAreaRects.right)) {
                this._positionCurrent.x += (magnetAreaRects.right.right + magnetAreaRects.right.left) / 2 - this._pointerRect.right;

                break;
            }
            else if (this.constructor.checkIntersection(rects.left, magnetAreaRects.left)) {
                this._positionCurrent.x += (magnetAreaRects.left.right + magnetAreaRects.left.left) / 2 - this._pointerRect.left;

                break;
            }
            else if (this.constructor.checkIntersection(rects.right, magnetAreaRects.left)) {
                this._positionCurrent.x += (magnetAreaRects.left.right + magnetAreaRects.left.left) / 2 - this._pointerRect.right;

                break;
            }

            // this._magnetAreaTarget?.removeAttribute('_Draggable_magnetTarget');
            // this._magnetAreaTarget = magnetArea;
            // this._magnetAreaTarget?.setAttribute('_Draggable_magnetTarget', '');
        }
    }


    reset() {
        this._position = new Vector2d();
    }
}
