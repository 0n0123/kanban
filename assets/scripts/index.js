import { Emitter } from './emitter.js';
import { Popup, Status } from './status.js';
import { io } from './3rd-party/socket.io.esm.min.js';
import { marked } from './3rd-party/marked.esm.js';

const socket = io();
Emitter.init(socket);

socket.on('disconnect', () => {
    Status.setDisconnected();
    Popup.show('Network disconnected. Waiting for reconnection...');
});
socket.on('welcome', ({ tasks }) => {
    Status.setConnected();
    Popup.hide();
    document.getElementById('tasks').innerHTML = '';
    for (const task of tasks) {
        Task.create(task.id, {
            top: task.pos.top,
            left: task.pos.left,
            text: task.text,
            color: task.color,
        });
    }
});
socket.on('color', ({ tasks }) => {
    for (const { id, color } of tasks) {
        const task = new Task(id);
        task.setColor(color);
    }
});
socket.on('text', ({ tasks }) => {
    for (const { id, text } of tasks) {
        const task = new Task(id);
        task.setText(text);
    }
});
socket.on('move', ({ tasks }) => {
    for (const { id, pos } of tasks) {
        new Task(id).setPosition(pos);
    }
});
socket.on('tofront', ({ tasks }) => {
    for (const { id } of tasks) {
        new Task(id).toFront()
    }
});
socket.on('delete', ({ tasks }) => {
    for (const { id } of tasks) {
        new Task(id).remove();
    }
});
socket.on('create', ({ tasks }) => {
    for (const { id, pos, text, color } of tasks) {
        Task.create(id, {
            top: pos.top,
            left: pos.left,
            text: text,
            color: color,
        });
    }
});
socket.on('error', async message => {
    await Popup.show({
        text: 'Failed to update. Click to refresh screen.',
        clickable: true
    });
    window.location.reload();
});

const $tasks = document.getElementById('tasks');
const CLASS_TASK = 'task';
const CLASS_COLOR = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'white', 'black'];

export class Task {
    constructor(id) {
        this.id = id;
        this.elm = document.getElementById(id);
        this.displayText = this.elm.querySelector('.display-text');
    }

    static create(id, option) {
        const { top = 0, left = 0, text = '', color = '' } = option;
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
        $tasks.appendChild(newTask);
        const instance = new Task(id);
        return instance;
    }

    setColor(color) {
        this.elm.classList.remove(...CLASS_COLOR);
        this.elm.classList.add(color);
    }

    setText(text) {
        this.displayText.innerHTML = marked.parse(text);
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

}
