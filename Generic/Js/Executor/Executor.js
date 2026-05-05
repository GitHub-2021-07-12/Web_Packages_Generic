export class Executor {
    static _renderingIds = new Map();
    static _taskIds = new Map();


    static cancelRendering(callback) {
        cancelAnimationFrame(this._renderingIds.get(callback));
        this._renderingIds.delete(callback);
    }

    static cancelTask(callback) {
        clearTimeout(this._taskIds.get(callback));
        this._taskIds.delete(callback);
    }

    static async delay(duration = 0) {
        await new Promise((fulfill) => setTimeout(fulfill, duration));
    }

    static execute(js, args = {}) {
        try {
            return new Function(Object.keys(args), js)(...Object.values(args));
        }
        catch {}

        return null;
    }

    static executeExpression(jsExpression, args = {}) {
        return this.execute(`return (${jsExpression});`, args);
    }

    static queueRendering(callback) {
        this.cancelRendering(callback);

        let f = () => {
            this._renderingIds.delete(callback);
            callback();
        };
        let renderingId = requestAnimationFrame(f);
        this._renderingIds.set(callback, renderingId);
    }

    static queueTask(callback, delay = 0) {
        this.cancelTask(callback);

        let f = () => {
            callback();
            this._taskIds.delete(callback);
        };
        let tasksId = setTimeout(f, delay);
        this._taskIds.set(callback, tasksId);
    }
}
