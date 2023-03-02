import { Emitter } from './emitter.js';
import { io } from '/socket.io/socket.io.esm.min.js';
import { marked } from './3rd-party/marked-4.2.12.min.js';
import SelectionArea from './3rd-party/viselect-3.2.5.mjs';

const socket = io();
Emitter.init(socket);

import { Task } from './task.js';
import { Menu } from './menu.js';

const container = document.getElementById('container');
const createTask = e => {
    const top = (e.clientY + window.scrollY) / document.documentElement.clientHeight * 100;
    const left = (e.clientX / document.documentElement.clientWidth) * 100;
    Emitter.create(top, left);
};
container.ondblclick = createTask;
container.onmousedown = _ => Task.unfocusAll();
document.onkeyup = e => {
    const key = e.code;
    if (key === 'F2') {
        const focusedTasks = Task.getAllFocused();
        focusedTasks.length && focusedTasks[0].edit();
    } else {
        Menu.keyCommand(key);
    }
    Menu.hide();
};
document.onclick = _ => Menu.hide();

const Popup = new class {
    #elm = document.getElementById('popup');

    show(option) {
        this.#elm.innerText = option.text ?? option;
        this.#elm.classList.add('show');
        if (option.clickable) {
            this.#elm.classList.add('clickable');
            return new Promise(r => this.#elm.onclick = r);
        }
        this.#elm.onclick = null;
        this.#elm.classList.remove('clickable');
        return Promise.resolve();
    }

    hide() {
        this.#elm.classList.remove('show');
    }
}();

const Status = new class {
    elm = document.getElementById('status');
    online = document.getElementById('status-online');
    offline = document.getElementById('status-offline');

    setConnected() {
        this.offline.classList.add('hidden');
        this.online.classList.remove('hidden');
    }

    setDisconnected() {
        this.online.classList.add('hidden');
        this.offline.classList.remove('hidden');
    }
}();

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
            top: task.top,
            left: task.left,
            text: task.text,
            color: task.color,
            menu: e => Menu.show(e)
        });
    }
});
socket.on('color', ({ ids, color }) => {
    for (const id of ids) {
        const task = new Task(id);
        task.setColor(color);
    }
});
socket.on('text', ({ id, text }) => {
    const task = new Task(id);
    task.setText(text);
});
socket.on('move', message => {
    for (const { id, pos } of message.tasks) {
        new Task(id).setPosition(pos);
    }
});
socket.on('tofront', ({ ids }) => ids.forEach(id => new Task(id).toFront()));
socket.on('delete', ({ ids }) => ids.forEach(id => new Task(id).remove()));
socket.on('create', ({ id, pos, text, color }) => Task.create(id, {
    top: pos.top,
    left: pos.left,
    text: text,
    color: color,
    menu: e => Menu.show(e)
}));
socket.on('error', async message => {
    await Popup.show({
        text: 'Failed to update. Click to refresh screen.',
        clickable: true
    });
    window.location.reload();
});

document.getElementById('license').onclick = async _ => {
    const popup = window.open('about:blank', '_blank');
    popup.document.title = 'Kanban - 3rd Party Licenses';
    const data = await fetch('LICENSES.md').then(res => res.text());
    popup.document.body.innerHTML = marked.parse(data);
};

const selection = new SelectionArea({
    selectables: ['.task'],
    boundaries: ['#container'],
}).on('start', () => {
    Task.unfocusAll();
    selection.clearSelection();
}).on('move', ({ store: { changed: { added, removed } } }) => {
    for (const el of added) {
        new Task(el.id).focus();
    }
    for (const el of removed) {
        new Task(el.id).unfocus();
    }
});
