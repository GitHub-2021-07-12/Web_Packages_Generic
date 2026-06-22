import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';
import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';


export class Resizable extends Component {
    static _components = [GestureArea];
    static _cssUrl = true;
    static _htmlUrl = true;
    static _url = import.meta.url;

    static _eventHandlerDescriptors = {
        shadow: {
            swipeMain: function (event) {
                let keepProportions = this.keepProportions ^ event.detail.originalEvent.shiftKey;
                let pointer = event.detail.pointer;
                let targets = null;

                switch (event.target) {
                    case this._elements.cornerLeftBottom: {
                        targets = new Set(['cornerLeftBottom', 'edgeBottom', 'edgeLeft']);
                        this._increaseSize(-pointer._positionDelta.x, pointer._positionDelta.y, true, false, keepProportions);

                        break;
                    }
                    case this._elements.cornerLeftTop: {
                        targets = new Set(['cornerLeftTop', 'edgeLeft', 'edgeTop']);
                        this._increaseSize(-pointer._positionDelta.x, -pointer._positionDelta.y, true, true, keepProportions);

                        break;
                    }
                    case this._elements.cornerRightBottom: {
                        targets = new Set(['cornerRightBottom', 'edgeBottom', 'edgeRight']);
                        this._increaseSize(pointer._positionDelta.x, pointer._positionDelta.y, false, false, keepProportions);

                        break;
                    }
                    case this._elements.cornerRightTop: {
                        targets = new Set(['cornerRightTop', 'edgeRight', 'edgeTop']);
                        this._increaseSize(pointer._positionDelta.x, -pointer._positionDelta.y, false, true, keepProportions);

                        break;
                    }
                    case this._elements.edgeBottom: {
                        targets = new Set(['edgeBottom']);
                        this._increaseSize(NaN, pointer._positionDelta.y, false, false, keepProportions);

                        break;
                    }
                    case this._elements.edgeLeft: {
                        targets = new Set(['edgeLeft']);
                        this._increaseSize(-pointer._positionDelta.x, NaN, true, true, keepProportions);

                        break;
                    }
                    case this._elements.edgeRight: {
                        targets = new Set(['edgeRight']);
                        this._increaseSize(pointer._positionDelta.x, NaN, false, false, keepProportions);

                        break;
                    }
                    case this._elements.edgeTop: {
                        targets = new Set(['edgeTop']);
                        this._increaseSize(NaN, -pointer._positionDelta.y, true, true, keepProportions);

                        break;
                    }
                }

                this.dispatchEvent('resize', {targets});
            },

            swipeStartMain: function () {
                this._defineMetrics();
            },

            tap: function (event) {
                if (!this.resettable || event.detail.tapsCount < 2) return;

                let targets = null;

                switch (event.target) {
                    case this._elements.cornerLeftBottom: {
                        targets = new Set(['cornerLeftBottom', 'edgeBottom', 'edgeLeft']);
                        this.resetWidth(true);
                        this.resetHeight();

                        break;
                    }
                    case this._elements.cornerLeftTop: {
                        targets = new Set(['cornerLeftTop', 'edgeLeft', 'edgeTop']);
                        this.resetWidth(true);
                        this.resetHeight(true);

                        break;
                    }
                    case this._elements.cornerRightBottom: {
                        targets = new Set(['cornerRightBottom', 'edgeBottom', 'edgeRight']);
                        this.resetWidth();
                        this.resetHeight();

                        break;
                    }
                    case this._elements.cornerRightTop: {
                        targets = new Set(['cornerRightTop', 'edgeRight', 'edgeTop']);
                        this.resetWidth();
                        this.resetHeight(true);

                        break;
                    }
                    case this._elements.edgeBottom: {
                        targets = new Set(['edgeBottom']);
                        this.resetHeight();

                        break;
                    }
                    case this._elements.edgeLeft: {
                        targets = new Set(['edgeLeft']);
                        this.resetWidth(true);

                        break;
                    }
                    case this._elements.edgeRight: {
                        targets = new Set(['edgeRight']);
                        this.resetWidth();

                        break;
                    }
                    case this._elements.edgeTop: {
                        targets = new Set(['edgeTop']);
                        this.resetHeight(true);

                        break;
                    }
                }

                this.dispatchEvent('reset', {targets});
            },
        },
    };

    static _fieldDescriptors = {
        fixed: false,
        keepProportions: false,
        resettable: false,

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


    _aspectRatio = 0;
    _heightInitial = 0;
    _leftInitial = 0;
    _topInitial = 0;
    _widthInitial = 0;


    _defineMetrics() {
        this._heightInitial = this.constructor.getHeight(this.target, true);
        this._leftInitial = this.constructor.getLeft(this.target);
        this._topInitial = this.constructor.getTop(this.target);
        this._widthInitial = this.constructor.getWidth(this.target, true);
        this._aspectRatio = this._widthInitial / this._heightInitial;
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
