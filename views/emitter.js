export const Emitter = new class {
    init(socket) {
        this.socket = socket;
    }

    create(top, left) {
        this.socket.emit('create', {
            pos: {
                top: top,
                left: left
            }
        });
    }

    changeColor(ids, color) {
        this.socket.emit('color', {
            ids: ids,
            color: color
        });
    }
    
    editText(id, text) {
        this.socket.emit('text', {
            id: id,
            text: text
        });
    }
    
    moveTask(tasks) {
        this.socket.emit('move', {
            tasks: tasks
        });
    }

    toFront(ids) {
        this.socket.emit('tofront', { ids });
    }

    delete(ids) {
        this.socket.emit('delete', { ids });
    }
}();
