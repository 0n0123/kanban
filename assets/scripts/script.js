import { Emitter } from './emitter.js';
import { Popup, Status } from './status.js';
import { Task } from './task.js';
import { Menu } from './menu.js';
import { io } from './3rd-party/socket.io.esm.min.js';
import SelectionArea from './3rd-party/viselect.mjs';

const socket = io();
Emitter.init(socket);

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
            menu: e => Menu.show(e)
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
            menu: e => Menu.show(e)
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

const selection = new SelectionArea({
    selectables: ['.task'],
    boundaries: ['#container'],
}).on('start', () => {
    Task.unfocusAll();
    selection.clearSelection();
}).on('move', ({ store: { changed: { added, removed } } }) => {
    for (const el of added.filter(el => document.body.contains(el))) {
        new Task(el.id).focus();
    }
    for (const el of removed.filter(el => document.body.contains(el))) {
        new Task(el.id).unfocus();
    }
});
