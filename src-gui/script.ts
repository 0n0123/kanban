import { Emitter } from './emitter.ts';
import { Popup, Status } from './status.ts';
import { Task } from './task.ts';
import { Menu } from './menu.ts';
import { io } from 'socket.io-client';
import SelectionArea from '@viselect/vanilla';

type SelectionAreaInstance = {
  on(event: string, handler: (event: unknown) => unknown): SelectionAreaInstance;
  clearSelection(): void;
};

type SelectionAreaConstructor = new (options: {
  selectables: string[];
  boundaries: string[];
}) => SelectionAreaInstance;

const socket = (() => {
  const url = new URL(window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return io(url.origin + url.pathname);
})();
Emitter.init(socket);

const container = document.getElementById('container');
if (!container) {
  throw new Error('Could not find #container element.');
}

const createTask = (e: MouseEvent) => {
  const top = (e.clientY + window.scrollY) / document.documentElement.clientHeight * 100;
  const left = (e.clientX / document.documentElement.clientWidth) * 100;
  Emitter.create(top, left);
};

container.ondblclick = createTask;
container.onmousedown = () => Task.unfocusAll();
document.onkeyup = e => {
  const key = e.code;
  if (key === 'F2') {
    const focusedTasks = Task.getAllFocused();
    if (focusedTasks.length) {
      focusedTasks[0].edit();
    }
  } else {
    Menu.keyCommand(key);
  }
  Menu.hide();
};
document.onclick = () => Menu.hide();

socket.on('disconnect', () => {
  Status.setDisconnected();
  Popup.show('Network disconnected. Waiting for reconnection...');
});

socket.on('welcome', ({ tasks }: { tasks: Array<{ id: string; pos: { top: number; left: number }; text: string; color: string }> }) => {
  Status.setConnected();
  Popup.hide();
  const tasksElm = document.getElementById('tasks');
  if (tasksElm) {
    tasksElm.innerHTML = '';
  }
  for (const task of tasks) {
    Task.create(task.id, {
      top: task.pos.top,
      left: task.pos.left,
      text: task.text,
      color: task.color,
      menu: e => Menu.show(e as MouseEvent)
    });
  }
});

socket.on('color', ({ tasks }: { tasks: Array<{ id: string; color: string }> }) => {
  for (const { id, color } of tasks) {
    const task = new Task(id);
    task.setColor(color);
  }
});

socket.on('text', ({ tasks }: { tasks: Array<{ id: string; text: string }> }) => {
  for (const { id, text } of tasks) {
    const task = new Task(id);
    task.setText(text);
  }
});

socket.on('move', ({ tasks }: { tasks: Array<{ id: string; pos: { top: number; left: number } }> }) => {
  for (const { id, pos } of tasks) {
    new Task(id).setPosition(pos);
  }
});

socket.on('tofront', ({ tasks }: { tasks: Array<{ id: string }> }) => {
  for (const { id } of tasks) {
    new Task(id).toFront();
  }
});

socket.on('delete', ({ tasks }: { tasks: Array<{ id: string }> }) => {
  for (const { id } of tasks) {
    new Task(id).remove();
  }
});

socket.on('create', ({ tasks }: { tasks: Array<{ id: string; pos: { top: number; left: number }; text: string; color: string }> }) => {
  for (const { id, pos, text, color } of tasks) {
    Task.create(id, {
      top: pos.top,
      left: pos.left,
      text,
      color,
      menu: e => Menu.show(e as MouseEvent)
    });
  }
});

socket.on('error', async () => {
  await Popup.show({
    text: 'Failed to update. Click to refresh screen.',
    clickable: true
  });
  window.location.reload();
});

const selection = new (SelectionArea as unknown as SelectionAreaConstructor)({
  selectables: ['.task'],
  boundaries: ['#container']
}).on('start', () => {
  Task.unfocusAll();
  selection.clearSelection();
}).on('move', ({ store: { changed: { added, removed } } }: any) => {
  for (const el of added.filter((el: HTMLElement) => document.body.contains(el))) {
    new Task(el.id).focus();
  }
  for (const el of removed.filter((el: HTMLElement) => document.body.contains(el))) {
    new Task(el.id).unfocus();
  }
});
