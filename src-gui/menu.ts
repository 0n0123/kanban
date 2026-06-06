import { Emitter } from './emitter.ts';
import { Task } from './task.ts';
import { Scroll } from './scroll.ts';
import { Popup } from './status.ts';
import { Storage } from './storage.ts';

export const Menu = new class {
  elm: HTMLElement;
  binds: Array<{ key?: string; func: () => void }>;

  constructor() {
    const elm = document.getElementById('menu');
    if (!elm) {
      throw new Error('Could not find #menu element.');
    }
    this.elm = elm;

    this.binds = Array.from(document.getElementsByClassName('menu-item'))
      .concat(Array.from(document.getElementsByClassName('menu-color')))
      .map(m => ({
        key: (m as HTMLElement).dataset.key,
        func: () => (m as HTMLElement).click(),
      }));

    const onColorMenuClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement | null;
      if (!target) return;
      const focusedTaskIds = Task.getAllFocused().map(task => task.id);
      Emitter.changeColor(focusedTaskIds, target.dataset.color ?? 'white');
    };
    this.elm.querySelectorAll('.menu-color').forEach(menu => {
      menu.addEventListener('click', onColorMenuClick);
    });

    const onToFrontMenuClick = () => {
      const focusedTasks = Task.getAllFocused();
      if (focusedTasks.length === 1) {
        Emitter.toFront([focusedTasks[0].id]);
        return;
      }
      const sorted = focusedTasks
        .map(task => ({ elm: task, pos: task.getPosition() }))
        .sort((t1, t2) => t1.pos.top - t2.pos.top)
        .map(task => task.elm)
        .map(task => task.id);
      Emitter.toFront(sorted);
    };
    const toFrontButton = document.getElementById('menu-tofront');
    if (toFrontButton) {
      toFrontButton.onclick = onToFrontMenuClick;
    }

    const onMoveMenuClick = () => {
      const focused = Task.getAllFocused().map(t => ({ id: t.id, ...t.getPosition() }));
      if (focused.length === 0) return;
      if (focused[0].top < 100 && window.pageYOffset === 0) {
        Scroll.doScroll(1);
      } else if (focused[0].top >= 100 && window.pageYOffset > 0) {
        Scroll.doScroll(0);
      }
      Emitter.moveTask(focused.map(task => ({
        id: task.id,
        pos: {
          left: task.left,
          top: task.top < 100 ? task.top + 100 : task.top - 100,
        }
      })));
    };
    const moveButton = document.getElementById('menu-move');
    if (moveButton) {
      moveButton.onclick = onMoveMenuClick;
    }

    const onDuplicateMenuClick = () => {
      const focusedTasks = Task.getAllFocused();
      const tasks = focusedTasks.map(task => ({
        ...task.toObject(),
        id: undefined,
        pos: {
          left: task.toObject().pos.left + 1,
          top: task.toObject().pos.top + 1,
        }
      }));
      Emitter.createAll(tasks);
    };
    const duplicateButton = document.getElementById('menu-duplicate');
    if (duplicateButton) {
      duplicateButton.onclick = onDuplicateMenuClick;
    }

    const onDeleteMenuClick = () => {
      const tasks = Task.getAllFocused();
      const ids = tasks.map(task => task.id);
      Emitter.delete(ids);
      Storage.store(tasks.map(task => task.toObject()));
      Popup.show({
        text: 'Click here to restore deleted tasks.',
        clickable: true,
        autoHide: true,
        timeout: 10000,
        onClick: () => {
          Storage.restore();
          Popup.hide();
        }
      });
    };
    const deleteButton = document.getElementById('menu-delete');
    if (deleteButton) {
      deleteButton.onclick = onDeleteMenuClick;
    }
  }

  keyCommand(keycode: string) {
    this.binds.find(bind => bind.key === keycode)?.func();
  }

  show(e: MouseEvent) {
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
