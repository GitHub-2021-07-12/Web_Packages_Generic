import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';
import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';


export class Resizable extends Component {
    static _components = [GestureArea];
    static _cssUrl = true;
    static _htmlUrl = true;
    static _url = import.meta.url;

    static _eventHandlerDescriptors = {
        shadow: {
            capture: function (event) {
                event.detail.pointer.magnetRect = this.constructor.getDomRect(this.target, true);

                // let magnetRect = {...this.constructor.getDomRect(this.target, true)};

                // switch (event.target) {
                //     case this._elements.cornerLeftBottom: {
                //         magnetRect.right = magnetRect.left;
                //         magnetRect.top = magnetRect.bottom;

                //         break;
                //     }
                //     case this._elements.cornerLeftTop: {
                //         magnetRect.right = magnetRect.left;
                //         magnetRect.bottom = magnetRect.top;

                //         break;
                //     }
                //     case this._elements.cornerRightBottom: {
                //         magnetRect.left = magnetRect.right;
                //         magnetRect.top = magnetRect.bottom;

                //         break;
                //     }
                //     case this._elements.cornerRightTop: {
                //         magnetRect.left = magnetRect.right;
                //         magnetRect.bottom = magnetRect.top;

                //         break;
                //     }
                //     case this._elements.edgeBottom: {
                //         magnetRect.top = magnetRect.bottom;

                //         break;
                //     }
                //     case this._elements.edgeLeft: {
                //         magnetRect.right = magnetRect.left;

                //         break;
                //     }
                //     case this._elements.edgeRight: {
                //         magnetRect.left = magnetRect.right;

                //         break;
                //     }
                //     case this._elements.edgeTop: {
                //         magnetRect.bottom = magnetRect.top;

                //         break;
                //     }
                // }

                // event.detail.pointer.magnetRect = magnetRect;
            },

            swipeMain: function (event) {
                let keepProportions = this.keepProportions ^ event.detail.originalEvent.shiftKey;
                let pointer = event.detail.pointer;
                let magnetVector = pointer._magnetVector;
                let positionDelta = pointer._positionDelta.clone();

                event.target.magnetAreas.delete(this);

                switch (event.target) {
                    case this._elements.cornerLeftBottom: {
                        pointer.updateMagnetVector({bottom: positionDelta.y, left: positionDelta.x});
                        // pointer.updateMagnetVector({bottom: positionDelta.y, left: positionDelta.x, right: positionDelta.x, top: positionDelta.y});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(-positionDelta.x, positionDelta.y, true, false, keepProportions);

                        break;
                    }
                    case this._elements.cornerLeftTop: {
                        pointer.updateMagnetVector({left: positionDelta.x, top: positionDelta.y});
                        // pointer.updateMagnetVector({bottom: positionDelta.y, left: positionDelta.x, right: positionDelta.x, top: positionDelta.y});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(-positionDelta.x, -positionDelta.y, true, true, keepProportions);

                        break;
                    }
                    case this._elements.cornerRightBottom: {
                        pointer.updateMagnetVector({bottom: positionDelta.y, right: positionDelta.x});
                        // pointer.updateMagnetVector({bottom: positionDelta.y, left: positionDelta.x, right: positionDelta.x, top: positionDelta.y});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(positionDelta.x, positionDelta.y, false, false, keepProportions);

                        break;
                    }
                    case this._elements.cornerRightTop: {
                        pointer.updateMagnetVector({right: positionDelta.x, top: positionDelta.y});
                        // pointer.updateMagnetVector({bottom: positionDelta.y, left: positionDelta.x, right: positionDelta.x, top: positionDelta.y});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(positionDelta.x, -positionDelta.y, false, true, keepProportions);

                        break;
                    }
                    case this._elements.edgeBottom: {
                        pointer.updateMagnetVector({bottom: positionDelta.y});
                        // pointer.updateMagnetVector({bottom: positionDelta.y, top: positionDelta.y});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(NaN, positionDelta.y, false, false, keepProportions);

                        break;
                    }
                    case this._elements.edgeLeft: {
                        pointer.updateMagnetVector({left: positionDelta.x});
                        // pointer.updateMagnetVector({left: positionDelta.x, right: positionDelta.x});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(-positionDelta.x, NaN, true, true, keepProportions);

                        break;
                    }
                    case this._elements.edgeRight: {
                        pointer.updateMagnetVector({right: positionDelta.x});
                        // pointer.updateMagnetVector({left: positionDelta.x, right: positionDelta.x});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(positionDelta.x, NaN, false, false, keepProportions);

                        break;
                    }
                    case this._elements.edgeTop: {
                        pointer.updateMagnetVector({top: positionDelta.y});
                        // pointer.updateMagnetVector({bottom: positionDelta.y, top: positionDelta.y});
                        positionDelta.sum(magnetVector);
                        this._increaseSize(NaN, -positionDelta.y, true, true, keepProportions);

                        break;
                    }
                }

                this.dispatchEvent('resize', event.detail);
            },

            swipeStartMain: function (event) {
                this._resizing = true;
                this._calcMetrics();
                this.dispatchEvent('resizeStart', {...event.detail, targetNames: this._getTargetNames(event.target)});
            },

            swipeStopMain: function (event) {
                this._resizing = false;
                this.dispatchEvent('resizeStop', event.detail);
            },

            tap: function (event) {
                if (!this.resettable || event.detail.tapsCount < 2) return;

                switch (event.target) {
                    case this._elements.cornerLeftBottom: {
                        this.resetWidth(true);
                        this.resetHeight();

                        break;
                    }
                    case this._elements.cornerLeftTop: {
                        this.resetWidth(true);
                        this.resetHeight(true);

                        break;
                    }
                    case this._elements.cornerRightBottom: {
                        this.resetWidth();
                        this.resetHeight();

                        break;
                    }
                    case this._elements.cornerRightTop: {
                        this.resetWidth();
                        this.resetHeight(true);

                        break;
                    }
                    case this._elements.edgeBottom: {
                        this.resetHeight();

                        break;
                    }
                    case this._elements.edgeLeft: {
                        this.resetWidth(true);

                        break;
                    }
                    case this._elements.edgeRight: {
                        this.resetWidth();

                        break;
                    }
                    case this._elements.edgeTop: {
                        this.resetHeight(true);

                        break;
                    }
                }

                this.dispatchEvent('reset', {targetNames: this._getTargetNames(event.target)});
            },
        },
    };

    static _fieldDescriptors = {
        _resizing: false,


        fixed: false,
        keepProportions: false,
        resettable: false,

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


    _aspectRatio = 0;
    _heightInitial = 0;
    _leftInitial = 0;
    _topInitial = 0;
    _widthInitial = 0;


    _calcMetrics() {
        this._heightInitial = this.constructor.getHeight(this.target, true);
        this._leftInitial = this.constructor.getLeft(this.target);
        this._topInitial = this.constructor.getTop(this.target);
        this._widthInitial = this.constructor.getWidth(this.target, true);
        this._aspectRatio = this._widthInitial / this._heightInitial;
    }

    _getTargetNames(eventTarget) {
        let targetNames = null;

        switch (eventTarget) {
            case this._elements.cornerLeftBottom: {
                targetNames = new Set(['cornerLeftBottom', 'edgeBottom', 'edgeLeft']);

                break;
            }
            case this._elements.cornerLeftTop: {
                targetNames = new Set(['cornerLeftTop', 'edgeLeft', 'edgeTop']);

                break;
            }
            case this._elements.cornerRightBottom: {
                targetNames = new Set(['cornerRightBottom', 'edgeBottom', 'edgeRight']);

                break;
            }
            case this._elements.cornerRightTop: {
                targetNames = new Set(['cornerRightTop', 'edgeRight', 'edgeTop']);

                break;
            }
            case this._elements.edgeBottom: {
                targetNames = new Set(['edgeBottom']);

                break;
            }
            case this._elements.edgeLeft: {
                targetNames = new Set(['edgeLeft']);

                break;
            }
            case this._elements.edgeRight: {
                targetNames = new Set(['edgeRight']);

                break;
            }
            case this._elements.edgeTop: {
                targetNames = new Set(['edgeTop']);

                break;
            }
        }

        return targetNames;
    }

    _increaseSize(widthIncrement, heightIncrement, withLeft, withTop, keepProportions) {
        if (keepProportions) {
            let heightIncrementIsFinite = Number.isFinite(heightIncrement);
            let widthIncrementIsFinite = Number.isFinite(widthIncrement);

            if (heightIncrementIsFinite && widthIncrementIsFinite) {
                if (heightIncrement > widthIncrement / this._aspectRatio) {
                    widthIncrement = heightIncrement * this._aspectRatio;
                }
                else {
                    heightIncrement = widthIncrement / this._aspectRatio;
                }
            }
            else if (heightIncrementIsFinite) {
                widthIncrement = heightIncrement * this._aspectRatio;
            }
            else if (widthIncrementIsFinite) {
                heightIncrement = widthIncrement / this._aspectRatio;
            }
        }

        let height = this._heightInitial + (heightIncrement || 0);
        let width = this._widthInitial + (widthIncrement || 0);
        this.constructor.setHeight(this.target, height, true);
        this.constructor.setWidth(this.target, width, true);

        if (withLeft) {
            let left = this._leftInitial + this._widthInitial - this.constructor.getWidth(this.target, true);
            this.constructor.setLeft(this.target, left);
        }

        if (withTop) {
            let top = this._topInitial + this._heightInitial - this.constructor.getHeight(this.target, true);
            this.constructor.setTop(this.target, top);
        }
    }


    resetHeight(withTop = false) {
        if (withTop) {
            let height = this.constructor.getHeight(this.target, true);
            this.constructor.setHeight(this.target, null);
            let top = this.constructor.getTop(this.target) - this.constructor.getHeight(this.target, true) + height;
            this.constructor.setTop(this.target, top);
        }
        else {
            this.constructor.setHeight(this.target, null);
        }
    }

    resetWidth(withLeft = false) {
        if (withLeft) {
            let width = this.constructor.getWidth(this.target, true);
            this.constructor.setWidth(this.target, null);
            let left = this.constructor.getLeft(this.target) - this.constructor.getWidth(this.target, true) + width;
            this.constructor.setLeft(this.target, left);
        }
        else {
            this.constructor.setWidth(this.target, null);
        }
    }
}
