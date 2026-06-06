export const Emitter = new class {
  socket?: any;

  init(socket: unknown) {
    this.socket = socket;
  }

  create(top: number, left: number, color = 'white', text = '') {
    this.socket?.emit('create', {
      tasks: [{
        pos: { top, left },
        color,
        text,
      }]
    });
  }

  createAll(tasks: Array<Record<string, unknown>>) {
    this.socket?.emit('create', { tasks });
  }

  changeColor(ids: string[], color: string) {
    this.socket?.emit('color', {
      tasks: ids.map(id => ({ id, color }))
    });
  }

  editText(id: string, text: string) {
    this.socket?.emit('text', {
      tasks: [{ id, text }]
    });
  }

  moveTask(tasks: Array<Record<string, unknown>>) {
    this.socket?.emit('move', { tasks });
  }

  toFront(ids: string[]) {
    this.socket?.emit('tofront', {
      tasks: ids.map(id => ({ id }))
    });
  }

  delete(ids: string[]) {
    this.socket?.emit('delete', {
      tasks: ids.map(id => ({ id }))
    });
  }
}();
