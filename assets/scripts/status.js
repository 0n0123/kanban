export const Popup = new class {
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

export const Status = new class {
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

