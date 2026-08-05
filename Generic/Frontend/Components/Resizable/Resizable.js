import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';
import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Common} from '/Packages/Generic/Js/Common/Common.js';


export class Resizable extends GestureArea {
    static _cssUrl = true;
    static _htmlUrl = true;
    static _url = import.meta.url;

    static _eventHandlerDescriptors = {
        host: {
            capture: function () {
                this._pointerMainIsBlocked = !this._pointerMain;

                if (this._pointerMainIsBlocked) return;

                this._defineEdgeTarget(this._pointerMain._target);
                this._pointerMainIsBlocked ||= !this._edgeTargetNames;

                if (this._pointerMainIsBlocked) {
                    this._pointerMain.release();
                }
            },

            swipeMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                let positionDelta = this._pointerMain._positionDelta;
                this._rectDelta.bottom = this._edgeTargetNames.has('edgeBottom') ? positionDelta.y : undefined;
                this._rectDelta.left = this._edgeTargetNames.has('edgeLeft') ? positionDelta.x : undefined;
                this._rectDelta.right = this._edgeTargetNames.has('edgeRight') ? positionDelta.x : undefined;
                this._rectDelta.top = this._edgeTargetNames.has('edgeTop') ? positionDelta.y : undefined;

                if (this.keepProportions ^ event.detail.originalEvent.shiftKey) {
                    if (this._rectDelta.bottom == undefined && this._rectDelta.right == undefined) {
                        if (this._rectDelta.top == undefined || this._rectDelta.left < this._rectDelta.top * this._aspectRatio) {
                            this._rectDelta.top = this._rectDelta.left / this._aspectRatio;
                        }
                        else {
                            this._rectDelta.left = this._rectDelta.top * this._aspectRatio;
                        }
                    }
                    else if (this._rectDelta.left == undefined && this._rectDelta.top == undefined) {
                        if (this._rectDelta.bottom == undefined || this._rectDelta.right > this._rectDelta.bottom * this._aspectRatio) {
                            this._rectDelta.bottom = this._rectDelta.right / this._aspectRatio;
                        }
                        else {
                            this._rectDelta.right = this._rectDelta.bottom * this._aspectRatio;
                        }
                    }
                    else if (this._rectDelta.left != undefined) {
                        if (this._rectDelta.left < -this._rectDelta.bottom * this._aspectRatio) {
                            this._rectDelta.bottom = -this._rectDelta.left / this._aspectRatio;
                        }
                        else {
                            this._rectDelta.left = -this._rectDelta.bottom * this._aspectRatio;
                        }
                    }
                    else if (this._rectDelta.right != undefined) {
                        if (this._rectDelta.right > -this._rectDelta.top * this._aspectRatio) {
                            this._rectDelta.top = -this._rectDelta.right / this._aspectRatio;
                        }
                        else {
                            this._rectDelta.right = -this._rectDelta.top * this._aspectRatio;
                        }
                    }
                }

                this._rectDelta.bottom = Common.toRange(this._rectDelta.bottom, this._heightDeltaMin, this._heightDeltaMax);
                this._rectDelta.left = Common.toRange(this._rectDelta.left, -this._widthDeltaMax, -this._widthDeltaMin);
                this._rectDelta.right = Common.toRange(this._rectDelta.right, this._widthDeltaMin, this._widthDeltaMax);
                this._rectDelta.top = Common.toRange(this._rectDelta.top, -this._heightDeltaMax, -this._heightDeltaMin);
                this._pointerMain.updateMagnetVector(this._rectDelta);

                if (!this.deferredMagnetism) {
                    let magnetVector = this._pointerMain._magnetVector;
                    this._rectDelta.bottom += magnetVector.y;
                    this._rectDelta.left += magnetVector.x;
                    this._rectDelta.right += magnetVector.x;
                    this._rectDelta.top += magnetVector.y;
                }

                this._updateSize();
                this.dispatchEvent('resize', event.detail);
            },

            swipeStartMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                this._heightInitial = this.constructor.getHeight(this.target, true);
                this._leftInitial = this.constructor.getLeft(this.target);
                this._resizing = true;
                this._topInitial = this.constructor.getTop(this.target);
                this._widthInitial = this.constructor.getWidth(this.target, true);
                this._aspectRatio = this._widthInitial / this._heightInitial;
                this._pointerMain.magnetRect = this.constructor.getDomRect(this.target, true);

                this._elements.display.style.contentVisibility = 'hidden';
                // this.constructor.setCssProp(this._elements.display, 'height', this.constructor.getCssProp(this._elements.display, 'height'), true);
                // this.constructor.setCssProp(this._elements.display, 'width', this.constructor.getCssProp(this._elements.display, 'width'), true);

                this.constructor.setHeight(this.target, Number.MIN_SAFE_INTEGER, true);
                this.constructor.setWidth(this.target, Number.MIN_SAFE_INTEGER, true);
                let heightMin = this.constructor.getHeight(this.target, true);
                let widthMin = this.constructor.getWidth(this.target, true);
                this.constructor.setHeight(this.target, Number.MAX_SAFE_INTEGER, true);
                this.constructor.setWidth(this.target, Number.MAX_SAFE_INTEGER, true);
                let heightMax = this.constructor.getWidth(this.target, true);
                let widthMax = this.constructor.getWidth(this.target, true);
                this.constructor.setHeight(this.target, this._heightInitial, true);
                this.constructor.setWidth(this.target, this._widthInitial, true);
                this._heightDeltaMax = heightMax - this._heightInitial;
                this._heightDeltaMin = heightMin - this._heightInitial;
                this._widthDeltaMax = widthMax - this._widthInitial;
                this._widthDeltaMin = widthMin - this._widthInitial;

                this._elements.display.style.contentVisibility = null;
                // this.constructor.setCssProp(this._elements.display, 'height', null);
                // this.constructor.setCssProp(this._elements.display, 'width', null);

                if (this.dynamicEnvironment && this.magnetism) {
                    this.refreshField('magnetAreas', true);
                    this._defineMagnetAreaRects();
                }

                this.dispatchEvent('resizeStart', {...event.detail, targetNames: this._edgeTargetNames});
            },

            swipeStopMain: function (event) {
                if (this._pointerMainIsBlocked) return;

                if (this.deferredMagnetism) {
                    let magnetVector = this._pointerMain._magnetVector;
                    this._rectDelta.bottom += magnetVector.y;
                    this._rectDelta.left += magnetVector.x;
                    this._rectDelta.right += magnetVector.x;
                    this._rectDelta.top += magnetVector.y;
                    this._updateSize();
                }

                this._resizing = false;
                this.dispatchEvent('resizeStop', event.detail);
            },

            tap: function (event) {
                if (this._pointerMainIsBlocked || !this.resettable || event.detail.tapsCount < 2) return;

                if (this._edgeTargetNames.has('edgeBottom')) {
                    this.resetHeight();
                }
                else if (this._edgeTargetNames.has('edgeTop')) {
                    this.resetHeight(true);
                }

                if (this._edgeTargetNames.has('edgeLeft')) {
                    this.resetWidth(true);
                }
                else if (this._edgeTargetNames.has('edgeRight')) {
                    this.resetWidth();
                }

                this.dispatchEvent('reset', {targetNames: this._edgeTargetNames});
            },
        },
    };

    static _fieldDescriptors = {
        _resizing: false,


        frozen: false,
        keepProportions: false,
        resettable: false,

        target: {
            default: '',

            updateBefore(value) {
                if (value instanceof Node) {
                    this._valueExtra = value;
                }
                else {
                    let selector = value + '';

                    try {
                        this._valueExtra = this._component.closest(selector) || this._component.querySelector(selector);
                    }
                    catch {
                        this._valueExtra = null;
                    }

                    this._valueExtra ||= this._component;
                }
            },
        },
    };


    static {
        this.init();
    }


    _aspectRatio = 0;
    _edgeTargetNames = null;
    _heightDeltaMax = 0;
    _heightDeltaMin = 0;
    _heightInitial = 0;
    _leftInitial = 0;
    _pointerMainIsBlocked = false;
    _topInitial = 0;
    _widthDeltaMax = 0;
    _widthDeltaMin = 0;
    _widthInitial = 0;

    _rectDelta = {
        bottom: undefined,
        left: undefined,
        right: undefined,
        top: undefined,
    };


    _defineEdgeTarget(eventTarget) {
        this._edgeTargetNames = null;

        switch (eventTarget) {
            case this._elements.cornerLeftBottom: {
                this._edgeTargetNames = new Set(['cornerLeftBottom', 'edgeBottom', 'edgeLeft']);

                break;
            }
            case this._elements.cornerLeftTop: {
                this._edgeTargetNames = new Set(['cornerLeftTop', 'edgeLeft', 'edgeTop']);

                break;
            }
            case this._elements.cornerRightBottom: {
                this._edgeTargetNames = new Set(['cornerRightBottom', 'edgeBottom', 'edgeRight']);

                break;
            }
            case this._elements.cornerRightTop: {
                this._edgeTargetNames = new Set(['cornerRightTop', 'edgeRight', 'edgeTop']);

                break;
            }
            case this._elements.edgeBottom: {
                this._edgeTargetNames = new Set(['edgeBottom']);

                break;
            }
            case this._elements.edgeLeft: {
                this._edgeTargetNames = new Set(['edgeLeft']);

                break;
            }
            case this._elements.edgeRight: {
                this._edgeTargetNames = new Set(['edgeRight']);

                break;
            }
            case this._elements.edgeTop: {
                this._edgeTargetNames = new Set(['edgeTop']);

                break;
            }
        }
    }

    _updateSize() {
        let heightIncrement = (this._rectDelta.bottom || 0) - (this._rectDelta.top || 0);
        let widthIncrement = (this._rectDelta.right || 0) - (this._rectDelta.left || 0);
        this.constructor.setHeight(this.target, this._heightInitial + heightIncrement, true);
        this.constructor.setWidth(this.target, this._widthInitial + widthIncrement, true);

        if (Number.isFinite(this._rectDelta.left)) {
            let left = this._leftInitial + this._widthInitial - this.constructor.getWidth(this.target, true);
            this.constructor.setLeft(this.target, left);
        }

        if (Number.isFinite(this._rectDelta.top)) {
            let top = this._topInitial + this._heightInitial - this.constructor.getHeight(this.target, true);
            this.constructor.setTop(this.target, top);
        }
    }


    resetHeight(fromTop = false) {
        if (fromTop) {
            let height = this.constructor.getHeight(this.target, true);
            this.constructor.setHeight(this.target, null);
            let top = this.constructor.getTop(this.target) + height - this.constructor.getHeight(this.target, true);
            this.constructor.setTop(this.target, top);
        }
        else {
            this.constructor.setHeight(this.target, null);
        }
    }

    resetWidth(fromLeft = false) {
        if (fromLeft) {
            let width = this.constructor.getWidth(this.target, true);
            this.constructor.setWidth(this.target, null);
            let left = this.constructor.getLeft(this.target) + width - this.constructor.getWidth(this.target, true);
            this.constructor.setLeft(this.target, left);
        }
        else {
            this.constructor.setWidth(this.target, null);
        }
    }
}
