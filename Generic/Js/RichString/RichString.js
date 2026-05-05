export class RichString {
    static _segmenter = new Intl.Segmenter();


    __length = -1;
    __value = '';


    get length() {
        if (this.__length < 0) {
            this.__length = 0;
            let segmentDescriptors = this.constructor._segmenter.segment(this.value);

            for (let segmentDescriptor of segmentDescriptors) {
                this.__length++;
            }
        }

        return this.__length;
    }

    get value() {
        return this.__value;
    }
    set value(value) {
        this.__length = -1;
        this.__value = value + '';
    }


    *[Symbol.iterator]() {
        let iterator = this.constructor._segmenter.segment(this.value)[Symbol.iterator]();
        let item = iterator.next();

        while (!item.done) {
            yield item.value.segment;
            item = iterator.next();
        }
    }

    [Symbol.toPrimitive]() {
        return this.value;
    }


    constructor(value = '') {
        this.value = value;
    }

    getIndex(indexByte) {
        if (indexByte < 0) {
            indexByte += this.value.length;
        }

        let index = -1;
        let segmentDescriptors = this.constructor._segmenter.segment(this.value + ' ');

        for (let segmentDescriptor of segmentDescriptors) {
            if (segmentDescriptor.index > indexByte) break;

            index++;
        }

        return index;
    }

    getIndexByte(index) {
        if (index < 0) {
            index += this.length;
        }

        let indexByte = -1;
        let segmentDescriptors = this.constructor._segmenter.segment(this.value + ' ');
        let segmentsCount = 0;

        for (let segmentDescriptor of segmentDescriptors) {
            if (segmentsCount > index) break;

            indexByte = segmentDescriptor.index;
            segmentsCount++;
        }

        return indexByte;
    }

    replace(index = 0, length = Infinity, subString = '') {
        if (index < 0) {
            index += this.length;
        }

        if (length < 0) {
            length = -length;
            index -= length;
        }

        let indexLast = index + length;
        let segmentDescriptors = this.constructor._segmenter.segment(this.value);
        let segmentsCount = 0;
        let subStringLeft = '';
        let subStringRight = '';

        for (let segmentDescriptor of segmentDescriptors) {
            if (segmentsCount < index) {
                subStringLeft += segmentDescriptor.segment;
            }
            else if (segmentsCount >= indexLast) {
                subStringRight += segmentDescriptor.segment;
            }

            segmentsCount++;
        }

        return new this.constructor(subStringLeft + subString + subStringRight);
    }

    slice(index = 0, length = Infinity) {
        if (index < 0) {
            index += this.length;
        }

        if (length < 0) {
            length = -length;
            index -= length;
        }

        let indexLast = index + length;
        let segmentsCount = 0;
        let segmentDescriptors = this.constructor._segmenter.segment(this.value);
        let subString = '';

        for (let segmentDescriptor of segmentDescriptors) {
            if (segmentsCount >= indexLast) break;

            if (segmentsCount >= index) {
                subString += segmentDescriptor.segment;
            }

            segmentsCount++;
        }

        return new this.constructor(subString);
    }
}
