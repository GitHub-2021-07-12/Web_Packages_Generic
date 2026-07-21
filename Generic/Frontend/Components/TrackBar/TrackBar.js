import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Common} from '/Packages/Generic/Js/Common/Common.js';


export class TrackBar extends GestureArea {
    static _cssUrl = true;
    static _htmlUrl = true;
    static _url = import.meta.url;

    static _eventHandlerDescriptors = {
        host: {
            capture: function (event) {
                this._pointerMainIsBlocked = this.mode == 'normal' && this._pointerMain?._target != this._elements.puck;

                if (this._pointerMainIsBlocked) return;

                this._active = true;

                if (this.mode == 'precise') {
                    this._defineValue();
                }
                else {
                    this._valueCaptured = this.value;
                }
            },

            keydown: function (event) {
                if (this._active) return;

                this._active = true;

                switch (event.key) {
                    case 'ArrowLeft':
                    case 'ArrowUp': {
                        event.preventDefault();
                        this.value -= this._valueStep;

                        break;
                    }
                    case 'ArrowDown':
                    case 'ArrowRight': {
                        event.preventDefault();
                        this.value += this._valueStep;

                        break;
                    }
                    case 'End': {
                        event.preventDefault();
                        this.value = Infinity;

                        break;
                    }
                    case 'Home': {
                        event.preventDefault();
                        this.value = -Infinity;

                        break;
                    }
                }

                this._active = false;
            },

            releaseMain: function () {
                if (this._pointerMainIsBlocked) return;

                this._active = false;
            },

            swipeMain: function () {
                if (this._pointerMainIsBlocked) return;

                this._defineValue();
            },
        },
    };

    static _fieldDescriptors = {
        _active: false,

        _filler_positionShift: {
            cssPropUnit: 'px',
            default: 0,
        },

        _puck_position: {
            cssPropUnit: 'px',
            default: 0,
        },


        discrete: {
            default: false,

            updateAfter() {
                if (!this._value) return;

                this._component.refreshField('value');
            },
        },

        mode: {
            default: 'normal',
            enum: ['precise', 'progressive', 'normal'],
        },

        range: {
            default: [0, 0],

            updateAfter() {
                this._component.refreshField('value');
            },

            updateBefore() {
                this._valuePrepared[0] = Math.round(this._valuePrepared[0]);
                this._valuePrepared[1] = Math.round(this._valuePrepared[1]);

                if (!Common.inRangeStrict(this._valuePrepared[1] - this._valuePrepared[0], 0, this._component._freeSpaceLength)) {
                    this._valuePrepared = undefined;
                }
            },
        },

        value: {
            default: 0,
            externalFlag: true,

            updateAfter() {
                this._component._puck_definePosition();
            },

            updateBefore() {
                if (this._component.range[0] < this._component.range[1]) {
                    this._valuePrepared = Common.toRange(Math.round(this._valuePrepared), ...this._component.range);
                }
                else {
                    if (this._component.discrete) {
                        this._valuePrepared = Math.round(this._component._freeSpaceLength * this._valuePrepared) / this._component._freeSpaceLength;
                    }

                    this._valuePrepared = Common.toRange(this._valuePrepared, 0, 1);
                }
            },
        },
    };


    static {
        this.init();
    }


    _freeSpaceLength = 0;
    _pointerMainIsBlocked = false;
    _puck_positionShift = 0;
    _valueCaptured = 0;
    _valueStep = 0;


    _defineValue() {
        let rangeLength = (this.range[1] - this.range[0]) || 1;
        let value = undefined;

        if (this.mode == 'precise') {
            let pointerPosition = this._pointerMain._positionInnerInitial.x + this._pointerMain._positionDelta.x + this._puck_positionShift;
            value = this.range[0] + rangeLength * pointerPosition / this._freeSpaceLength;
        }
        else {
            value = this._valueCaptured + rangeLength * this._pointerMain._positionDelta.x / this._freeSpaceLength;
        }

        if (this.discrete) {
            value = Math.round(this._freeSpaceLength * value) / this._freeSpaceLength;
        }

        this.value = value;
    }

    _init() {
        this.defineMetrics();
    }

    _puck_definePosition() {
        let rangeLength = this.range[1] - this.range[0];
        let puck_position =
            rangeLength
                ? this._freeSpaceLength / rangeLength * (this.value - this.range[0])
                : this._freeSpaceLength * this.value
        ;

        if (this.discrete) {
            puck_position = Math.round(puck_position);
        }

        this._puck_position = puck_position;
    }


    defineMetrics() {
        let puck_length = this.constructor.getSizeInline(this._elements.puck, true);
        let puck_lengthHalf = puck_length / 2;
        let track_length = this.constructor.getSizeInline(this._elements.track, true);
        this._filler_positionShift =
            this.constructor.getCssPropNumber(this._elements.track, 'border-inline-start-width')
            + this.constructor.getCssPropNumber(this._elements.track, 'margin-inline-start')
            + this.constructor.getCssPropNumber(this._elements.track, 'padding-inline-start')
            - puck_lengthHalf
        ;
        this._freeSpaceLength = track_length - puck_length;
        this._puck_positionShift = -this.getCssPropNumber('padding-inline-start') - puck_lengthHalf;
        this._valueStep = this.range[0] < this.range[1] ? 1 : 1 / this._freeSpaceLength;
    }

    refresh() {
        this.defineMetrics();
        this.refreshField('range');
    }
}
