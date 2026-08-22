import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';

import {EventManager} from '/Packages/Generic/Frontend/Units/EventManager/EventManager.js';
import {Model} from '/Packages/Generic/Frontend/Units/Model/Model.js';

import {Executor} from '/Packages/Generic/Js/Executor/Executor.js';


export class Repeater extends Component {
    static _eventHandlerDescriptors = {
        model: {
            add: function (event) {
                if (!this._condition) return;

                let itemRelative = this.target.children[event.detail.index];

                // for (let modelItem of event.detail.items) {
                //     let item = this._createItem(modelItem);
                //     itemRelative ? itemRelative.before(item) : this.target.append(item);
                // }
                let items = this._createItems(event.detail.items);
                itemRelative ? itemRelative.before(...items) : this.target.append(...items);
                this._applyIndexes();
            },

            clear: function () {
                this._clear();
            },

            delete: function (event) {
                if (this._modelPropsInterpolated.has('index')) {
                    this._defineItems();

                    return;
                }

                for (let modelItem of event.detail.items) {
                    this._items.get(modelItem).remove();
                    this._items.delete(modelItem);
                }

                this._applyIndexes();
            },

            filter: function () {
                for (let [modelItem, item] of this._items) {
                    this.constructor.setAttribute(item, '_Repeater_excluded', modelItem.excluded ? '' : null);
                }
            },

            order: function () {
                if (this._modelPropsInterpolated.has('index')) {
                    this._defineItems();

                    return;
                }

                let items = this.model._items.map((modelItem) => this._items.get(modelItem));
                this.target.textContent = '';
                this.target.append(...items);
                this._applyIndexes();
            },

            update: function (event) {
                if (!this._condition) return;

                let item = this._items.get(event.detail.item);
                let propsUpdated = new Set([...Object.keys(event.detail.dataPrev)]);

                if (this._modelPropsInterpolated.intersection(propsUpdated).size) {
                    let itemPrev = item;
                    item = this._createItem(event.detail.item);
                    itemPrev.replaceWith(item);
                }
                else {
                    item.Repeater_manager.applyData();
                    item.Repeater_manager.applyIndex();
                }
            },
        },
    };

    static _fieldDescriptors = {
        interpolationKey: {
            default: '',

            updateAfter() {
                this._component._modelPropsInterpolated.clear();

                if (this._value && this._component.delegate) {
                    let interpolations = this._component.delegate.outerHTML.matchAll(this._component.constructor._interpolationRegExp);

                    for (let interpolation of interpolations) {
                        let propName = interpolation.groups.value;
                        let propNameProcessed = propName.replace('data.', '');

                        if (propName == propNameProcessed) continue;

                        this._component._modelPropsInterpolated.add(propNameProcessed);
                    }
                }

                this._component._refreshAuto();
            },
        },

        model: {
            default: 0,
            range: [0, Infinity],

            getInitialValue() {
                return this._component.querySelector('[Repeater_model]') || undefined;
            },

            updateAfter() {
                this._component._refreshAuto();
                EventManager.applyEventHandlers(this._component._eventHandlers.model, this._value);
            },

            updateBefore(value) {
                switch (value?.constructor) {
                    case Array: {
                        let modelItems = value;
                        this._valueExtra = new Model();
                        this._valueExtra.add(modelItems);

                        break;
                    }
                    case HTMLTemplateElement: {
                        let modelTemplate = value;
                        let jsExpression = modelTemplate.content.querySelector('script')?.text;
                        let modelItems = Executor.executeExpression(jsExpression);
                        this._valueExtra = new Model();

                        if (modelItems) {
                            this._valueExtra.add(modelItems);
                        }

                        break;
                    }
                    case Model: {
                        this._valueExtra = value;

                        break;
                    }
                    case Number: {
                        let modelItems = [];
                        let modelItemsCount = value;
                        this._valueExtra = new Model();

                        for (let i = 0; i < modelItemsCount; i++) {
                            modelItems.push(i + 1);
                        }

                        this._valueExtra.add(modelItems);

                        break;
                    }
                    default: {
                        this._valueExtra = null;
                    }
                }
            },
        },

        target: {
            default: '',

            updateAfter() {
                if (this._valuePrev instanceof Node) {
                    this._valuePrev.textContent = '';
                }

                this._component._refreshAuto();
            },

            updateBefore(value) {
                if (value instanceof Node) {
                    this._valueExtra = value;
                }
                else {
                    let rootNode = this._component.getRootNode(this._component);
                    let selector = value + '';

                    try {
                        this._valueExtra = rootNode.querySelector(selector);
                    }
                    catch {
                        this._valueExtra = null;
                    }

                    this._valueExtra ||= this._component;
                }
            },
        },
    };


    static Manager = class {
        static _eventHandlerDescriptors = {
            elements: {},
            item: {},
        };


        static init() {
            EventManager.normalizeEventHandlerDescriptors(this._eventHandlerDescriptors);
        }


        static {
            this.init();
        }


        _idAttribute = 'Repeater_element';
        _elements = {};
        _eventHandlers = null;
        _item = null;
        _model = null;
        _modelItem = null;


        _init() {}


        applyData() {}

        applyIndex() {}

        constructor(item, model, modelItem) {
            this._item = item;
            this._elements = Repeater.getElements(this._item, this._idAttribute);
            this._eventHandlers = EventManager.createEventHandlers({
                context: this,
                eventHandlerDescriptors: this.constructor._eventHandlerDescriptors,
                normalize: false,

                eventTarget: {
                    elements: this._elements,
                    item: this._item,
                },
            });
            this._model = model;
            this._modelItem = modelItem;
            this._init();
        }

        updateData() {}
    };


    static {
        this.init();
    }


    __delegate = null;


    _itemTemplate = document.createElement('template');
    _items = new Map();
    _modelPropsInterpolated = new Set();


    Manager = this.constructor.Manager;


    get _condition() {
        return !!(this.delegate && this.model && this.target);
    }


    get delegate() {
        return this.__delegate;
    }
    set delegate(delegate) {
        if (delegate instanceof HTMLTemplateElement) {
            this.__delegate = delegate.content.firstElementChild;

            let jsExpression = delegate.content.querySelector('script')?.text;
            this.Manager = jsExpression ? Executor.executeExpression(jsExpression, {Repeater: this.constructor}) : this.Manager;
        }
        else {
            this.__delegate = delegate;
        }

        this._refreshAuto();
    }


    _applyIndexes() {
        for (let item of this._items.values()) {
            item.Repeater_manager.applyIndex();
        }
    }

    _clear() {
        this.target.textContent = '';
        this._items.clear();
    }

    _createItem(modelItem) {
        if (!this._condition) return null;

        let item = null;

        if (this.interpolationKey) {
            this._itemTemplate.innerHTML = this.constructor.interpolate(this.delegate.outerHTML, this.interpolationKey, modelItem);
            item = this._itemTemplate.content.firstElementChild;
        }
        else {
            item = this.delegate.cloneNode(true);
        }

        item.Repeater_manager = new this.Manager(item, this.model, modelItem);
        item.setAttribute('_Repeater_item', '');
        this.constructor.setAttribute(item, '_Repeater_excluded', modelItem.excluded ? '' : null);
        this._items.set(modelItem, item);

        return item;
    }

    _createItems(modelItems = this.model._items) {
        if (!this._condition) return null;

        let items = [];

        for (let modelItem of modelItems) {
            let item = this._createItem(modelItem);
            items.push(item);
        }

        return items;
    }

    _defineItems() {
        this._clear();

        if (!this._condition) return;

        // for (let modelItem of this.model._items) {
        //     this._createItem(modelItem);
        //     // let item = this._createItem(modelItem);
        //     // this.target.append(item);
        // }

        this._createItems();
        this.target.append(...this._items.values());
    }

    _init() {
        this.delegate = this.querySelector('[Repeater_delegate]');
    }


    refresh() {
        this._defineItems();
    }
}
