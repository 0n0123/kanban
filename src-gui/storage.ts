import { Emitter } from './emitter.ts';

export const Storage = new class {
  #inner = window.sessionStorage;
  #timer: number | null = null;

  store(tasks: Array<Record<string, unknown>>) {
    const all = this.get();
    all.push(...tasks);
    this.#inner.setItem('tasks', JSON.stringify(all));
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
    }
    this.#timer = window.setTimeout(() => {
      this.clear();
    }, 1000 * 10);
  }

  get(): Array<Record<string, unknown>> {
    const tasks = this.#inner.getItem('tasks');
    return tasks ? JSON.parse(tasks) : [];
  }

  restore() {
    const tasks = this.get();
    for (const { pos, text, color } of tasks as Array<{ pos: { top: number; left: number }; text: string; color: string }>) {
      Emitter.create(pos.top, pos.left, color, text);
    }
    this.clear();
  }

  clear() {
    this.#inner.removeItem('tasks');
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }
}();
