export class LocalStorage {
    _name = '';
    _storage = null;


    _processKey(key) {
        return `${this._name}.${key}`;
    }


    clear() {
        for (let i = this._storage.length - 1; i >= 0; i--) {
            let key = this._storage.key(i);

            if (!key.startsWith(this._name)) continue;

            this._storage.removeItem(key);
        }
    }

    constructor(name, temporary = false) {
        this._name = name;
        this._storage = temporary ? sessionStorage : localStorage;
    }

    delete(key) {
        key = this._processKey(key);
        this._storage.removeItem(key);
    }

    restore(key, aim = null) {
        key = this._processKey(key);
        let value = JSON.parse(this._storage.getItem(key));

        switch (aim?.constructor) {
            case Map: {
                let entries = value;
                aim.clear();

                try {
                    for (let [key, value] of entries) {
                        aim.set(key, value);
                    }
                }
                catch {
                    aim.clear();
                }

                break;
            }
            case Set: {
                let values = value;
                aim.clear();

                try {
                    for (let value of values) {
                        aim.add(value);
                    }
                }
                catch {
                    aim.clear();
                }

                break;
            }
        }

        return value;
    }

    save(key, value) {
        key = this._processKey(key);
        let valueConstructor = value?.constructor;

        if (valueConstructor == Map || valueConstructor == Set) {
            value = [...value];
        }

        this._storage.setItem(key, JSON.stringify(value));
    }
}
