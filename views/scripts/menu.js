import { Emitter } from './emitter.js';
import { Task } from './task.js';
import { Scroll } from './scroll.js';

export const Menu = new class {
    constructor() {
        this.elm = document.getElementById('menu');

        this.binds = Array.from(document.getElementsByClassName('menu-item'))
            .concat(Array.from(document.getElementsByClassName('menu-color')))
            .map(m => ({
                key: m.dataset.key,
                func: _ => m.click()
            }));
        
        const onColorMenuClick = e => {
            const focusedTaskIds = Task.getAllFocused().map(task => task.id);
            Emitter.changeColor(focusedTaskIds, e.currentTarget.dataset.color);
        };
        this.elm.querySelectorAll('.menu-color').forEach(menu => menu.onclick = onColorMenuClick);

        const onToFrontMenuClick = () => {
            const focusedTasks = Task.getAllFocused();
            if (focusedTasks.length === 1) {
                Emitter.toFront([focusedTasks[0].id]);
                return;
            }
            const sorted = focusedTasks.map(task => ({
                elm: task,
                pos: task.getPosition()
            }))
                .sort((t1, t2) => t1.pos.top - t2.pos.top)
                .map(task => task.elm)
                .map(task => task.id);
            Emitter.toFront(sorted);
        };
        document.getElementById('menu-tofront').onclick = onToFrontMenuClick;

        const onMoveMenuClick = () => {
            const focused = Task.getAllFocused().map(t => ({ id: t.id, ...t.getPosition() }));
            if (focused[0].top < 100 && window.pageYOffset === 0) {
                Scroll.doScroll(1);
            } else if (focused[0].top >= 100 && window.pageYOffset > 0) {
                Scroll.doScroll(0);
            }
            Emitter.moveTask(focused.map(task => ({
                id: task.id,
                pos: {
                    left: task.left,
                    top: task.top < 100 ? task.top + 100 : task.top - 100
                }
            })));
        };
        document.getElementById('menu-move').onclick = onMoveMenuClick;

        const onDeleteMenuClick = () => {
            const ids = Task.getAllFocused().map(task => task.id);
            Emitter.delete(ids);
        };
        document.getElementById('menu-delete').onclick = onDeleteMenuClick;
    }

    keyCommand(keycode) {
        this.binds.find(bind => bind.key === keycode)?.func();
    }

    show(e) {
        e.preventDefault();
        const x = e.clientX;
        const y = e.clientY;
        const innerHeight = window.innerHeight;
        const innerWidth = window.innerWidth;
        if (y + this.elm.offsetHeight > innerHeight) {
            this.elm.style.bottom = (innerHeight - y - window.pageYOffset) + 'px';
            this.elm.style.top = 'auto';
        } else {
            this.elm.style.bottom = 'auto';
            this.elm.style.top = y + window.pageYOffset + 'px';
        }
        if (x + this.elm.offsetWidth > innerWidth) {
            this.elm.style.right = (innerWidth - x) + 'px';
            this.elm.style.left = 'auto';
        } else {
            this.elm.style.right = 'auto';
            this.elm.style.left = x + 'px';
        }
        this.elm.classList.add('show');
    }

    hide() {
        this.elm.classList.remove('show');
    }
}();
