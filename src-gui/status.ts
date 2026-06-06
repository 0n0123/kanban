export type PopupOption = string | {
  text?: string;
  clickable?: boolean;
  autoHide?: boolean;
  timeout?: number;
  onClick?: () => void;
};

export const Popup = new class {
  #elm = document.getElementById('popup');
  #timer: number | null = null;

  async show(option: PopupOption) {
    if (!this.#elm) {
      throw new Error('Could not find #popup element.');
    }
    const config = typeof option === 'string' ? { text: option } : option;
    this.#elm.innerText = config.text ?? '';
    this.#elm.classList.add('show');

    const promises: Promise<void>[] = [];
    if (config.clickable) {
      this.#elm.classList.add('clickable');
      promises.push(new Promise(resolve => {
        this.#elm.onclick = () => {
          config.onClick?.();
          this.hide();
          resolve();
        };
      }));
    } else {
      this.#elm.onclick = null;
      this.#elm.classList.remove('clickable');
    }

    if (config.timeout) {
      promises.push(new Promise(resolve => {
        this.#timer = window.setTimeout(() => {
          this.hide();
          resolve();
        }, config.timeout);
      }));
    }

    await Promise.all(promises);
  }

  hide() {
    if (!this.#elm) {
      return;
    }
    this.#elm.classList.remove('show');
    if (this.#timer !== null) {
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
    this.offline?.classList.add('hidden');
    this.online?.classList.remove('hidden');
  }

  setDisconnected() {
    this.online?.classList.add('hidden');
    this.offline?.classList.remove('hidden');
  }
}();
