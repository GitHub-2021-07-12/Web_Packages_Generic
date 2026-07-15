import {GestureArea} from '/Packages/Generic/Frontend/Components/GestureArea/GestureArea.js';

import {Common} from '/Packages/Generic/Js/Common/Common.js';


export class TrackBar extends GestureArea {
    static _cssUrl = true;
    static _htmlUrl = true;
    static _url = import.meta.url;

    static _eventHandlerDescriptors = {
        host: {
            capture: function (event) {
                let pointer = event.detail.pointer;
                pointer._TrackBar_blocked ??= this.mode == 'normal' && pointer._target != this._elements.puck;

                if (pointer._TrackBar_blocked) return;

                this._active = true;

                if (this.mode == 'precise') {
                    this._defineValue(pointer);
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
                this._active = false;
            },

            swipeMain: function (event) {
                let pointer = event.detail.pointer;

                if (pointer._TrackBar_blocked) return;

                this._defineValue(pointer);
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

            process(value) {
                value[0] = Math.round(value[0]);
                value[1] = Math.round(value[1]);

                if (!Common.inRangeStrict(value[1] - value[0], 0, this._component._freeSpaceLength)) {
                    value = undefined;
                }

                return value;
            },

            updateAfter() {
                this._component.refreshField('value');
            },
        },

        value: {
            default: 0,
            externalFlag: true,

            process(value) {
                if (this._component.range[0] < this._component.range[1]) {
                    value = Common.toRange(Math.round(value), ...this._component.range);
                }
                else {
                    if (this._component.discrete) {
                        value = Math.round(this._component._freeSpaceLength * value) / this._component._freeSpaceLength;
                    }

                    value = Common.toRange(value, 0, 1);
                }

                return value;
            },

            updateAfter() {
                this._component._puck_definePosition();
            },
        },
    };


    static {
        this.init();
    }


    _freeSpaceLength = 0;
    _puck_positionShift = 0;
    _valueCaptured = 0;
    _valueStep = 0;


    _defineValue(pointer) {
        let rangeLength = (this.range[1] - this.range[0]) || 1;
        let value = undefined;

        if (this.mode == 'precise') {
            let pointerPosition = pointer._positionInnerInitial.x + pointer._positionDelta.x + this._puck_positionShift;
            value = this.range[0] + rangeLength * pointerPosition / this._freeSpaceLength;
        }
        else {
            value = this._valueCaptured + rangeLength * pointer._positionDelta.x / this._freeSpaceLength;
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
