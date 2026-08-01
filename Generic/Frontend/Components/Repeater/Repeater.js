import {Component} from '/Packages/Generic/Frontend/Components/Component/Component.js';

import {EventManager} from '/Packages/Generic/Frontend/Units/EventManager/EventManager.js';
import {Model} from '/Packages/Generic/Frontend/Units/Model/Model.js';

import {Executor} from '/Packages/Generic/Js/Executor/Executor.js';


export class Repeater extends Component {
    static _eventHandlerDescriptors = {
        model: {
            add: function (event) {
                if (!this.delegate || !this.target) return;

                let index = Infinity;
                let items = [];

                for (let modelItem of event.detail.items) {
                    index = Math.min(index, modelItem.index);
                    let item = this._createItem(modelItem);
                    items.push(item);
                }

                let item = this.target.children[index];
                item ? item.before(...items) : this.target.append(...items);
                this._initItems(items);
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
                if (!this.delegate || !this.target) return;

                let item = this._items.get(event.detail.item);
                let propsUpdated = new Set([...Object.keys(event.detail.dataPrev)]);

                if (this._modelPropsInterpolated.intersection(propsUpdated).size) {
                    let itemPrev = item;
                    item = this._createItem(event.detail.item);
                    itemPrev?.replaceWith(item);
                }

                item.Repeater_manager.applyData();
            },
        },
    };

    static _fieldDescriptors = {
        interpolationKey: {
            default: '',

            updateAfter() {
                this._component._modelPropsInterpolated.clear();

                if (this._component.interpolationKey) {
                    let interpolations = this._component._delegateHtml.matchAll(this._component.constructor._interpolationRegExp);

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
            extra: true,
            range: [0, Infinity],

            getInitialValue() {
                return this._component.querySelector('[Repeater_model]') || undefined;
            },

            updateAfter() {
                this._component._refreshAuto();
                EventManager.applyEventHandlers(this._component._eventHandlers.model, this._component.model);
            },

            updateBefore() {
                switch (this._valuePrepared?.constructor) {
                    case Array: {
                        let modelItems = this._valuePrepared;
                        this._valuePrepared = new Model();
                        this._valuePrepared.add(modelItems);

                        break;
                    }
                    case HTMLTemplateElement: {
                        let modelTemplate = this._valuePrepared;
                        this._valuePrepared = new Model();

                        let script = modelTemplate.content.querySelector('script');
                        let modelItems = Executor.executeExpression(script?.text);

                        if (modelItems) {
                            this._valuePrepared.add(modelItems);
                        }

                        break;
                    }
                    case Model: break;
                    case Number: {
                        let modelItems = [];
                        let modelItemsCount = this._valuePrepared;
                        this._valuePrepared = new Model();

                        for (let i = 0; i < modelItemsCount; i++) {
                            modelItems.push(i + 1);
                        }

                        this._valuePrepared.add(modelItems);

                        break;
                    }
                    default: {
                        // this._valuePrepared = new Model();
                        this._valuePrepared = null;
                    }
                }
            },
        },

        target: {
            default: '',
            extra: true,

            updateAfter() {
                if (this._valuePrev instanceof Node) {
                    this._valuePrev.textContent = '';
                }

                this._component._refreshAuto();
            },

            updateBefore() {
                if (!(this._valuePrepared instanceof Node)) {
                    let selector = this._valuePrepared + '';

                    try {
                        this._valuePrepared = this._component.parentElement.querySelector(selector);
                    }
                    catch {
                        this._valuePrepared = null;
                    }

                    this._valuePrepared ||= this._component;
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
        }

        init() {}

        updateData() {}
    };


    static {
        this.init();
    }


    __delegate = null;


    _delegateHtml = '';
    _itemTemplate = document.createElement('template');
    _items = new Map();
    _modelPropsInterpolated = new Set();


    Manager = this.constructor.Manager;


    get delegate() {
        return this.__delegate;
    }
    set delegate(delegate) {
        if (delegate instanceof HTMLTemplateElement) {
            this.__delegate = delegate.content.firstElementChild;

            let script = delegate.content.querySelector('script');
            this.Manager = Executor.executeExpression(script?.text, {Repeater: this.constructor}) || this.Manager;
        }
        else {
            this.__delegate = delegate;
        }

        this._delegateHtml = this.delegate?.outerHTML ?? '';
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
        let item = null;

        if (this.interpolationKey) {
            this._itemTemplate.innerHTML = this.constructor.interpolate(this._delegateHtml, this.interpolationKey, modelItem);
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

    _defineItems() {
        this._clear();

        // if (!this.delegate || !this.target) return;
        if (!this.delegate || !this.model || !this.target) return;

        for (let modelItem of this.model._items) {
            this._createItem(modelItem);
        }

        if (!this._items.size) return;

        let items = [...this._items.values()];
        this.target.append(...items);
        this._initItems(items);
    }

    _init() {
        this.delegate = this.querySelector('[Repeater_delegate]');
    }

    _initItems(items) {
        for (let item of items) {
            item.Repeater_manager.init();
        }
    }


    refresh() {
        this._defineItems();
    }
}
