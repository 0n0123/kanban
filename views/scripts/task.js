import { Emitter } from './emitter.js';
import { Scroll } from './scroll.js';
import './3rd-party/marked.min.js';

const $tasks = document.getElementById('tasks');
const CLASS_TASK = 'task';
const CLASS_FOCUSED = 'focused';
const CLASS_EDITING = 'editing';
const CLASS_MOVING = 'moving';
const CLASS_COLOR = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'white', 'black'];

export class Task {
    static #onDocumentKeyUp = null;

    constructor(id) {
        this.id = id;
        this.elm = document.getElementById(id);
        this.input = this.elm.querySelector('textarea');
        this.displayText = this.elm.querySelector('.display-text');

        this.origin = {
            x: 0,
            y: 0,
            pos: {},
        };
    }

    static create(id, option) {
        const { top = 0, left = 0, text = '', color = '', menu } = option;
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
        // @ts-ignore
        displayText.innerHTML = marked.parse(txt);
        newTask.appendChild(displayText);
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Press Ctrl+Enter or Ctrl+Alt+Enter to start a new line,\nCtrl+Shift+Enter to input a hover comment.';
        textarea.value = txt;
        newTask.appendChild(textarea);
        $tasks.appendChild(newTask);
        const instance = new Task(id);
        instance.#registerEventListener();
        if (menu) {
            newTask.oncontextmenu = e => menu(e);
        }
        return instance;
    }

    #registerEventListener() {
        let focused = [];
        const getMousePosition = event => {
            return {
                x: (event.pageX / window.innerWidth) * 100,
                y: (event.pageY / window.innerHeight) * 100
            }
        };

        const mousedown = event => {
            if (event.ctrlKey) {
                this.elm.classList.toggle(CLASS_FOCUSED);
            } else if (!this.isFocused()) {
                Task.unfocusAll();
                this.focus();
            }
            const focusedTasks = Task.getAllFocused();
            focusedTasks.forEach(focused => focused.elm.classList.add(CLASS_MOVING));
            focused = focusedTasks;
            document.onmousemove = move;
            document.onmouseup = drop;

            const mousePos = getMousePosition(event);
            this.origin.x = mousePos.x;
            this.origin.y = mousePos.y;
            for (const f of focused) {
                f.origin.pos = f.getPosition();
            }
        };
        let scrolling = null;
        const move = event => {
            if ((event.clientY >= window.innerHeight && window.scrollY === 0) ||
                (event.clientY <= 0 && window.scrollY > 0) &&
                scrolling === null) {
                scrolling = Scroll.doScroll();
                scrolling.then(() => scrolling = null);
            }
            const mousePos = getMousePosition(event);
            for (const f of focused) {
                f.setPosition({
                    left: f.origin.pos.left + (mousePos.x - this.origin.x),
                    top: f.origin.pos.top + (mousePos.y - this.origin.y)
                });
            }
            event.stopPropagation();
        };
        const comeback = (pos, max) => {
            if (pos < 0) {
                return 0;
            } else if (pos > max) {
                return max - 10;
            }
            return pos;
        };

        const drop = event => {
            window.getSelection().collapse(document.body, 0);
                Emitter.moveTask(focused.map(f => {
                    const pos = f.getPosition();
                    const newLeft = comeback(pos.left, 100);
                    const newTop = comeback(pos.top, 200);
                    f.elm.classList.remove(CLASS_MOVING);
                    return {
                        id: f.id,
                        pos: {
                            left: newLeft,
                            top: newTop
                        }
                    };
                }));
            document.onmousemove = null;
            document.onmouseup = null;
            focused.length = 0;
        };

        const hover = event => {
            const comment = this.elm.querySelector('comment');
            if (!comment) {
                return;
            }
            const rect = this.elm.getBoundingClientRect();
            comment.style.top = (event.clientY - rect.top) / rect.height * 100 + 1 + '%';
            comment.style.left = (event.clientX - rect.left) / rect.width * 100 + 1 + '%';
        };

        this.elm.onmousemove = hover;

        this.elm.onmousedown = mousedown;
        this.elm.ondblclick = _ => this.edit();

        this.input.onkeydown = event => {
            if (event.code === 'Tab') {
                applyText();
                event.preventDefault();
            } else if (event.ctrlKey && event.code === 'Enter') {
                if (event.shiftKey) {
                    this.input.value = this.input.value + '\n\n' + '<comment>\n\n</comment>';
                    this.input.selectionEnd = this.input.value.length - '</comment>'.length - 1;
                } else {
                    const br = event.altKey ? '<br>\n' : '  \n';
                    const cursor = this.input.selectionEnd;
                    this.input.value = this.input.value.substring(0, cursor) + br + this.input.value.substring(cursor);
                    this.input.selectionEnd = cursor + br.length;
                }
                event.preventDefault();
            }
            event.stopPropagation();
        };
        this.input.onkeyup = event => {
            if (event.code === 'Escape') {
                const input = event.target;
                this.elm.classList.remove(CLASS_EDITING);
                input.value = input.dataset.originalValue;
                document.onkeyup = Task.#onDocumentKeyUp;
                this.elm.onmousedown = mousedown;
            }
        };
        this.input.onblur = _ => applyText();
        const applyText = () => {
            Emitter.editText(this.id, this.input.value);
            document.onkeyup = Task.#onDocumentKeyUp;
            this.elm.onmousedown = mousedown;
        };
    }

    edit() {
        if (!this.elm.classList.contains(CLASS_EDITING)) {
            Task.#onDocumentKeyUp = document.onkeyup;
            this.input.dataset.originalValue = this.input.value;
            this.input.style.height = this.elm.getBoundingClientRect().height + 'px';
            document.onkeyup = null;
            this.elm.onmousedown = null;
            this.elm.classList.add(CLASS_EDITING);
            this.input.focus();
        }
    }

    setColor(color) {
        this.elm.classList.remove(...CLASS_COLOR);
        this.elm.classList.add(color);
    }

    setText(text) {
        this.elm.classList.remove(CLASS_EDITING);
        // @ts-ignore
        this.displayText.innerHTML = marked.parse(text);
        this.input.value = text;
    }

    getPosition() {
        return {
            left: Number(this.elm.style.left.replace('%', '')),
            top: Number(this.elm.style.top.replace('%', ''))
        };
    }

    setPosition(pos) {
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

    static getAllFocused() {
        return Array.from(document.querySelectorAll(`.task.${CLASS_FOCUSED}`))
            .map(t => new Task(t.id));
    }
}
