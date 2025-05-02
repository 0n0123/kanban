export const Emitter = new class {
    init(socket) {
        this.socket = socket;
    }

    create(top, left, color = 'white', text = '') {
        this.socket.emit('create', {
            tasks: [{
                pos: {
                    top: top,
                    left: left
                },
                color,
                text,
            }]
        });
    }

    createAll(tasks) {
        this.socket.emit('create', { tasks });
    }

    changeColor(ids, color) {
        this.socket.emit('color', {
            tasks: ids.map(id => ({
                id,
                color
            }))
        });
    }

    editText(id, text) {
        this.socket.emit('text', {
            tasks: [{
                id: id,
                text: text
            }]
        });
    }

    moveTask(tasks) {
        this.socket.emit('move', {
            tasks: tasks
        });
    }

    toFront(ids) {
        this.socket.emit('tofront', {
            tasks: ids.map(id => ({
                id
            }))
        });
    }

    delete(ids) {
        this.socket.emit('delete', {
            tasks: ids.map(id => ({
                id
            }))
        });
    }
}();
