export class Common {
    static compare(value1, value2) {
        if (value1 === value2 || Object.is(value1, value2)) return true;

        if (value1?.constructor == Array && value2?.constructor == Array) {
            return value1.length == value2.length && value1.every((item, index) => this.compare(value1[index], value2[index]));
        }
        else if (value1?.constructor == Object && value2?.constructor == Object) {
            let value1Keys = Object.keys(value1);
            let value2Keys = Object.keys(value2);

            return value1Keys.length == value2Keys.length && value1Keys.every((key) => this.compare(value1[key], value2[key]));
        }

        return false;
    }

    static getRandom(valueMin, valueMax) {
        valueMax = Math.floor(valueMax);
        valueMin = Math.ceil(valueMin);

        return Math.floor(valueMin + Math.random() * (valueMax - valueMin + 1));
    }

    static inRange(value, valueMin, valueMax) {
        return value >= valueMin && value <= valueMax;
    }

    static inRangeStrict(value, valueMin, valueMax) {
        return value > valueMin && value < valueMax;
    }

    static isType(value, type) {
        return value instanceof type || typeof value == type;
    }

    static isTypeStrict(value, type) {
        return value?.constructor == type || typeof value == type;
    }

    static toCamel(identifier) {
        return identifier.replace(/-([a-z])/gi, (match, char) => char.toUpperCase());
    }

    static toDash(identifier) {
        return identifier.replace(/[A-Z]/g, '-$&').toLowerCase();
    }

    static toRange(value, valueMin, valueMax) {
        return value < valueMin ? valueMin : (value > valueMax ? valueMax : value);
    }

    static toRing(num, numMin, numMax) {
        let base = Math.max(numMin, numMax) - numMin + 1;

        return (base + (num - numMin) % base) % base + numMin;
    }
}
