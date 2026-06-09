import { Emitter } from './emitter.ts';
import { Scroll } from './scroll.ts';
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

type TaskOption = {
  top?: number;
  left?: number;
  text?: string;
  color?: string;
  menu?: (e: MouseEvent) => void;
  readonly?: boolean;
};

type TaskPosition = {
  left: number;
  top: number;
};

const $tasks = document.getElementById('tasks')!;

const CLASS_TASK = 'task';
const CLASS_FOCUSED = 'focused';
const CLASS_EDITING = 'editing';
const CLASS_MOVING = 'moving';
const CLASS_COLOR = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'white', 'black'];

export class Task {
  static #onDocumentKeyUp: ((this: Document, ev: KeyboardEvent) => unknown) | null = null;

  id: string;
  elm: HTMLElement;
  input: HTMLTextAreaElement | null;
  displayText: HTMLElement;
  origin: {
    x: number;
    y: number;
    pos: TaskPosition;
  };

  constructor(id: string) {
    this.id = id;
    const elm = document.getElementById(id);
    if (!elm) {
      throw new Error(`Task element not found: ${id}`);
    }
    this.elm = elm;
    const input = this.elm.querySelector('textarea');
    const displayText = this.elm.querySelector('.display-text');
    if (!displayText || !(displayText instanceof HTMLElement)) {
      throw new Error(`Task display text element not found for ${id}`);
    }
    this.input = input;
    this.displayText = displayText;
    this.origin = {
      x: 0,
      y: 0,
      pos: { left: 0, top: 0 },
    };
  }

  static create(id: string, option: TaskOption): Task {
    const { top = 0, left = 0, text = '', color = '', menu, readonly = false } = option;
    const txt = text || '';
    const col = color || 'white';
    const newTask = document.createElement('div');
    newTask.style.top = top + '%';
    newTask.style.left = left + '%';
    newTask.classList.add(CLASS_TASK);
    newTask.classList.add(col);
    newTask.id = id;

    const displayText = document.createElement('div');
    displayText.className = 'display-text';
    displayText.innerHTML = marked.parse(txt);
    newTask.appendChild(displayText);

    if (!readonly) {
      const textarea = document.createElement('textarea');
      textarea.placeholder = 'Press Ctrl+Enter or Ctrl+Alt+Enter to start a new line.';
      textarea.value = txt;
      newTask.appendChild(textarea);
    }

    $tasks.appendChild(newTask);
    const instance = new Task(id);
    
    if (!readonly) {
      instance.#registerEventListener();
    }

    if (menu) {
      newTask.oncontextmenu = e => {
        e.preventDefault();
        menu(e);
      };
    }
    return instance;
  }

  toObject() {
    return {
      id: this.id,
      pos: this.getPosition(),
      text: this.input?.value || '',
      color: Array.from(this.elm.classList).find(c => CLASS_COLOR.includes(c)) || 'white',
    };
  }

  #registerEventListener() {
    let focused: Task[] = [];

    const getMousePosition = (event: MouseEvent): { x: number; y: number } => ({
      x: (event.pageX / window.innerWidth) * 100,
      y: (event.pageY / window.innerHeight) * 100,
    });

    const mousedown = (event: MouseEvent) => {
      if (event.ctrlKey) {
        this.elm.classList.toggle(CLASS_FOCUSED);
      } else if (!this.isFocused()) {
        Task.unfocusAll();
        this.focus();
      }
      const focusedTasks = Task.getAllFocused();
      focusedTasks.forEach(task => task.elm.classList.add(CLASS_MOVING));
      focused = focusedTasks;
      document.onmousemove = move;
      document.onmouseup = drop;

      const mousePos = getMousePosition(event);
      this.origin.x = mousePos.x;
      this.origin.y = mousePos.y;
      focused.forEach(f => {
        f.origin.pos = f.getPosition();
      });
    };

    let scrolling: Promise<unknown> | null = null;

    const move = (event: MouseEvent) => {
      if (((event.clientY >= window.innerHeight && window.scrollY === 0) ||
          (event.clientY <= 0 && window.scrollY > 0)) &&
          scrolling === null) {
        scrolling = Scroll.doScroll();
        scrolling.then(() => { scrolling = null; });
      }
      const mousePos = getMousePosition(event);
      focused.forEach(f => {
        f.setPosition({
          left: f.origin.pos.left + (mousePos.x - this.origin.x),
          top: f.origin.pos.top + (mousePos.y - this.origin.y),
        });
      });
      event.stopPropagation();
    };

    const comeback = (pos: number, max: number) => {
      if (pos < 0) return 0;
      if (pos > max) return max - 10;
      return pos;
    };

    const drop = () => {
      window.getSelection()?.collapse(document.body, 0);
      Emitter.moveTask(focused.map(f => {
        const pos = f.getPosition();
        const newLeft = comeback(pos.left, 100);
        const newTop = comeback(pos.top, 200);
        f.elm.classList.remove(CLASS_MOVING);
        return { id: f.id, pos: { left: newLeft, top: newTop } };
      }));
      document.onmousemove = null;
      document.onmouseup = null;
      focused.length = 0;
    };

    this.elm.onmousedown = mousedown;
    this.elm.ondblclick = () => this.edit();

    if (!this.input) {
      return;
    }
    this.input.onkeydown = event => {
      if (event.code === 'Tab') {
        applyText();
        event.preventDefault();
      } else if (event.ctrlKey && event.code === 'Enter') {
        const br = event.altKey ? '<br>\n' : '  \n';
        const cursor = this.input!.selectionEnd;
        this.input!.value = this.input!.value.substring(0, cursor) + br + this.input!.value.substring(cursor);
        this.input!.selectionEnd = cursor + br.length;
        event.preventDefault();
      }
      event.stopPropagation();
    };

    this.input.onkeyup = event => {
      if (event.code === 'Escape') {
        const input = event.target as HTMLTextAreaElement;
        this.elm.classList.remove(CLASS_EDITING);
        input.value = input.dataset.originalValue ?? input.value;
        document.onkeyup = Task.#onDocumentKeyUp;
        this.elm.onmousedown = mousedown;
      }
    };

    this.input.onblur = () => applyText();

    const applyText = () => {
      Emitter.editText(this.id, this.input!.value);
      document.onkeyup = Task.#onDocumentKeyUp;
      this.elm.onmousedown = mousedown;
    };
  }

  edit() {
    if (!this.elm.classList.contains(CLASS_EDITING)) {
      Task.#onDocumentKeyUp = document.onkeyup;
      this.input!.dataset.originalValue = this.input!.value;
      this.input!.style.height = this.elm.getBoundingClientRect().height + 'px';
      document.onkeyup = null;
      this.elm.onmousedown = null;
      this.elm.classList.add(CLASS_EDITING);
      this.input!.focus();
    }
  }

  setColor(color: string) {
    this.elm.classList.remove(...CLASS_COLOR);
    this.elm.classList.add(color);
  }

  setText(text: string) {
    this.elm.classList.remove(CLASS_EDITING);
    this.displayText.innerHTML = marked.parse(text);
    this.input && (this.input.value = text);
  }

  getPosition(): TaskPosition {
    return {
      left: Number(this.elm.style.left.replace('%', '')),
      top: Number(this.elm.style.top.replace('%', '')),
    };
  }

  setPosition(pos: TaskPosition) {
    this.elm.style.top = pos.top + '%';
    this.elm.style.left = pos.left + '%';
  }

  remove() {
    this.elm.textContent = null;
    $tasks.removeChild(this.elm);
  }

  toFront() {
    $tasks.insertAdjacentElement('beforeend', this.elm);
  }

  focus() {
    this.elm.classList.add(CLASS_FOCUSED);
  }

  unfocus() {
    this.elm.classList.remove(CLASS_FOCUSED);
  }

  static unfocusAll() {
    Task.getAllFocused().forEach(task => task.unfocus());
  }

  isFocused() {
    return this.elm.classList.contains(CLASS_FOCUSED);
  }

  static getAllFocused(): Task[] {
    return Array.from(document.querySelectorAll(`.task.${CLASS_FOCUSED}`))
      .map(t => new Task(t.id));
  }
}
