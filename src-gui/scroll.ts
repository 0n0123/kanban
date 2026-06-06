export const Scroll = new class {
  elm = document.getElementById('scroll');
  #resolve: ((value: unknown) => void) | null = null;
  observer: IntersectionObserver;

  constructor() {
    if (!this.elm) {
      throw new Error('Could not find #scroll element.');
    }
    this.elm.onclick = () => Scroll.doScroll();
    const onScroll = (entries: IntersectionObserverEntry[]) => {
      const intersectingElm = entries.find(entry => entry.isIntersecting);
      if (!intersectingElm) {
        return;
      }
      this.#resolve?.(undefined);
      if (intersectingElm.target.id === 'container-stock') {
        this.elm.classList.add('on');
      } else {
        this.elm.classList.remove('on');
      }
    };
    this.observer = new IntersectionObserver(onScroll, {
      threshold: 1,
    });
    const containerMain = document.getElementById('container-main');
    const containerStock = document.getElementById('container-stock');
    if (containerMain) {
      this.observer.observe(containerMain);
    }
    if (containerStock) {
      this.observer.observe(containerStock);
    }
  }

  doScroll(to?: 0 | 1) {
    const y = (to && document.documentElement.clientHeight) ||
      (window.pageYOffset > 0 ? 0 : document.documentElement.clientHeight);
    window.scroll(0, y);
    return new Promise(resolve => { this.#resolve = resolve; });
  }
}();
