export class ExternalPromise extends Promise {
    _fulfill = null;
    _reject = null;
    _resolved = false;
    _value = undefined;


    constructor(executor = null) {
        if (executor) {
            super(executor);

            return;
        }

        let fulfill = null;
        let reject = null;
        super((...args) => [fulfill, reject] = args);
        this._fulfill = fulfill;
        this._reject = reject;
    }

    fulfill(value = undefined) {
        this._fulfill?.(value);
        this._resolved = true;
        this._value = value;
    }

    reject(reason = undefined) {
        this._reject?.(reason);
        this._resolved = true;
    }
}
