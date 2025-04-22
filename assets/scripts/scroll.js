export const Scroll = new class {
    elm = document.getElementById('scroll');
    #resolve;

    constructor() {
        this.elm.onclick = _ => Scroll.doScroll();
        const onScroll = elms => {
            const intersectingElm = elms.find(el => el.isIntersecting);
            if (!intersectingElm) {
                return;
            }
            this.#resolve?.();
            if (intersectingElm.target.id === 'container-stock') {
                this.elm.classList.add('on');
            } else {
                this.elm.classList.remove('on');
            }
        };
        this.observer = new IntersectionObserver(onScroll, {
            threshold: 1
        });
        this.observer.observe(document.getElementById('container-main'));
        this.observer.observe(document.getElementById('container-stock'));
    }

    doScroll(to) {
        const y = (to && document.documentElement.clientHeight) ||
        (window.pageYOffset > 0 ? 0 : document.documentElement.clientHeight);
        window.scroll(0, y);
        return new Promise(r => this.#resolve = r);
    }
}();
