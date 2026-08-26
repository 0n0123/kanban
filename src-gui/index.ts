import { Emitter } from './emitter.ts';
import { Popup, Status } from './status.ts';
import { Task } from './task.ts';
import { io } from 'socket.io-client';

const socket = (() => {
  const url = new URL(window.location.href);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return io(url.origin + url.pathname);
})();
Emitter.init(socket);

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
      readonly: true,
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
      readonly: true,
    });
  }
});

socket.on('error', async () => {
  await Popup.show({
    text: 'Failed to update. Click here to refresh screen.',
    clickable: true
  });
  window.location.reload();
});
