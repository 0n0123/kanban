import { Emitter } from './emitter.js';

export const Storage = new class {
    #inner;
    #timer;

    constructor() {
        this.#inner = window.sessionStorage;
    }

    /**
     * @param {object[]} tasks
     */
    store(tasks) {
        const all = this.get();
        all.push(...tasks);
        this.#inner.setItem('tasks', JSON.stringify(all));
        if (this.#timer) {
            clearTimeout(this.#timer);
        }
        this.#timer = setTimeout(() => {
            this.clear();
        }, 1000 * 10);
    }

    get() {
        const tasks = this.#inner.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    restore() {
        const tasks = this.get();
        for (const { pos, text, color } of tasks) {
            Emitter.create(pos.top, pos.left, color, text);
        }
        this.clear();
    }

    clear() {
        this.#inner.removeItem('tasks');
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
    }
}();