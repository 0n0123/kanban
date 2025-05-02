export const Popup = new class {
    #elm = document.getElementById('popup');
    #timer = null;

    /**
     * @param {object | string} option
     * @param {string} [option.text]
     * @param {boolean} [option.clickable]
     * @param {boolean} [option.autoHide]
     * @param {number} [option.timeout]
     * @param {function} [option.onClick]
     * @returns {Promise<void>}
     */
    show(option) {
        this.#elm.innerText = option.text ?? option;
        this.#elm.classList.add('show');
        const promises = [];
        if (option.clickable) {
            this.#elm.classList.add('clickable');
            promises.push(new Promise(r => this.#elm.onclick = () => {
                option.onClick?.();
                this.hide();
                r();
            }));
        } else {
            this.#elm.onclick = null;
            this.#elm.classList.remove('clickable');
        }
        if (option.timeout) {
            promises.push(new Promise(r => this.#timer = setTimeout(() => {
                this.hide();
                r();
            }, option.timeout)));
        }
        return Promise.all(promises);
    }

    hide() {
        this.#elm.classList.remove('show');
        if (this.#timer) {
            clearTimeout(this.#timer);
            this.#timer = null;
        }
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

