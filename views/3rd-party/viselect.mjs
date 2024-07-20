/*! @viselect/vanilla v3.5.1 MIT | https://github.com/Simonwep/selection/tree/master/packages/vanilla */
var q = Object.defineProperty;
var K = (l, n, e) => n in l ? q(l, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : l[n] = e;
var u = (l, n, e) => (K(l, typeof n != "symbol" ? n + "" : n, e), e);
class O {
  constructor() {
    u(this, "_listeners", /* @__PURE__ */ new Map());
    // Let's also support on, off and emit like node
    /* eslint-disable no-invalid-this */
    u(this, "on", this.addEventListener);
    u(this, "off", this.removeEventListener);
    u(this, "emit", this.dispatchEvent);
  }
  addEventListener(n, e) {
    const t = this._listeners.get(n) ?? /* @__PURE__ */ new Set();
    return this._listeners.set(n, t), t.add(e), this;
  }
  removeEventListener(n, e) {
    var t;
    return (t = this._listeners.get(n)) == null || t.delete(e), this;
  }
  dispatchEvent(n, ...e) {
    let t = !0;
    for (const s of this._listeners.get(n) ?? [])
      t = s(...e) !== !1 && t;
    return t;
  }
  unbindAllListeners() {
    this._listeners.clear();
  }
}
const M = (l, n = "px") => typeof l == "number" ? l + n : l;
function y({ style: l }, n, e) {
  if (typeof n == "object")
    for (const [t, s] of Object.entries(n))
      s !== void 0 && (l[t] = M(s));
  else
    e !== void 0 && (l[n] = M(e));
}
const B = (l) => (n, e, t, s = {}) => {
  n instanceof HTMLCollection || n instanceof NodeList ? n = Array.from(n) : Array.isArray(n) || (n = [n]), Array.isArray(e) || (e = [e]);
  for (const i of n)
    if (i)
      for (const o of e)
        i[l](o, t, { capture: !1, ...s });
  return [n, e, t, s];
}, x = B("addEventListener"), E = B("removeEventListener"), A = (l) => {
  var s;
  const { clientX: n, clientY: e, target: t } = ((s = l.touches) == null ? void 0 : s[0]) ?? l;
  return { x: n, y: e, target: t };
};
function C(l, n, e = "touch") {
  switch (e) {
    case "center": {
      const t = n.left + n.width / 2, s = n.top + n.height / 2;
      return t >= l.left && t <= l.right && s >= l.top && s <= l.bottom;
    }
    case "cover":
      return n.left >= l.left && n.top >= l.top && n.right <= l.right && n.bottom <= l.bottom;
    case "touch":
      return l.right >= n.left && l.left <= n.right && l.bottom >= n.top && l.top <= n.bottom;
  }
}
function S(l, n = document) {
  const e = Array.isArray(l) ? l : [l];
  let t = [];
  for (let s = 0, i = e.length; s < i; s++) {
    const o = e[s];
    typeof o == "string" ? t = t.concat(Array.from(n.querySelectorAll(o))) : o instanceof Element && t.push(o);
  }
  return t;
}
const H = () => matchMedia("(hover: none), (pointer: coarse)").matches, F = () => "safari" in window, I = (l) => {
  let n, e = -1, t = !1;
  return {
    next(...s) {
      n = s, t || (t = !0, e = requestAnimationFrame(() => {
        l(...n), t = !1;
      }));
    },
    cancel() {
      cancelAnimationFrame(e), t = !1;
    }
  };
};
function W(l, n) {
  for (const e of n) {
    if (typeof e == "number")
      return l.button === e;
    if (typeof e == "object") {
      const t = e.button === l.button, s = e.modifiers.every((i) => {
        switch (i) {
          case "alt":
            return l.altKey;
          case "ctrl":
            return l.ctrlKey || l.metaKey;
          case "shift":
            return l.shiftKey;
        }
      });
      return t && s;
    }
  }
  return !1;
}
const { abs: b, max: R, min: k, ceil: D } = Math;
class X extends O {
  constructor(e) {
    var o, r, c, h, _;
    super();
    // Options
    u(this, "_options");
    // Selection store
    u(this, "_selection", {
      stored: [],
      selected: [],
      touched: [],
      changed: {
        added: [],
        // Added elements since last selection
        removed: []
        // Removed elements since last selection
      }
    });
    // Area element and clipping element
    u(this, "_area");
    u(this, "_clippingElement");
    // Target container (element) and boundary (cached)
    u(this, "_targetElement");
    u(this, "_targetRect");
    u(this, "_selectables", []);
    u(this, "_latestElement");
    // Caches the position of the selection-area
    u(this, "_areaRect", new DOMRect());
    // Dynamically constructed area rect
    u(this, "_areaLocation", { y1: 0, x2: 0, y2: 0, x1: 0 });
    // If a single click is being performed.
    // It's a single-click until the user dragged the mouse.
    u(this, "_singleClick", !0);
    u(this, "_frame");
    // Is getting set on movement.
    u(this, "_scrollAvailable", !0);
    u(this, "_scrollingActive", !1);
    u(this, "_scrollSpeed", { x: 0, y: 0 });
    u(this, "_scrollDelta", { x: 0, y: 0 });
    /* eslint-disable no-invalid-this */
    u(this, "disable", this._bindStartEvents.bind(this, !1));
    u(this, "enable", this._bindStartEvents);
    this._options = {
      selectionAreaClass: "selection-area",
      selectionContainerClass: void 0,
      selectables: [],
      document: window.document,
      startAreas: ["html"],
      boundaries: ["html"],
      container: "body",
      ...e,
      behaviour: {
        overlap: "invert",
        intersect: "touch",
        triggers: [0],
        ...e.behaviour,
        startThreshold: (o = e.behaviour) != null && o.startThreshold ? typeof e.behaviour.startThreshold == "number" ? e.behaviour.startThreshold : { x: 10, y: 10, ...e.behaviour.startThreshold } : { x: 10, y: 10 },
        scrolling: {
          speedDivider: 10,
          manualSpeed: 750,
          ...(r = e.behaviour) == null ? void 0 : r.scrolling,
          startScrollMargins: {
            x: 0,
            y: 0,
            ...(h = (c = e.behaviour) == null ? void 0 : c.scrolling) == null ? void 0 : h.startScrollMargins
          }
        }
      },
      features: {
        range: !0,
        touch: !0,
        ...e.features,
        singleTap: {
          allow: !0,
          intersect: "native",
          ...(_ = e.features) == null ? void 0 : _.singleTap
        }
      }
    };
    for (const p of Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
      typeof this[p] == "function" && (this[p] = this[p].bind(this));
    const { document: t, selectionAreaClass: s, selectionContainerClass: i } = this._options;
    this._area = t.createElement("div"), this._clippingElement = t.createElement("div"), this._clippingElement.appendChild(this._area), this._area.classList.add(s), i && this._clippingElement.classList.add(i), y(this._area, {
      willChange: "top, left, bottom, right, width, height",
      top: 0,
      left: 0,
      position: "fixed"
    }), y(this._clippingElement, {
      overflow: "hidden",
      position: "fixed",
      transform: "translate3d(0, 0, 0)",
      // https://stackoverflow.com/a/38268846
      pointerEvents: "none",
      zIndex: "1"
    }), this._frame = I((p) => {
      this._recalculateSelectionAreaRect(), this._updateElementSelection(), this._emitEvent("move", p), this._redrawSelectionArea();
    }), this.enable();
  }
  _bindStartEvents(e = !0) {
    const { document: t, features: s } = this._options, i = e ? x : E;
    i(t, "mousedown", this._onTapStart), s.touch && i(t, "touchstart", this._onTapStart, {
      passive: !1
    });
  }
  _onTapStart(e, t = !1) {
    const { x: s, y: i, target: o } = A(e), { _options: r } = this, { document: c } = this._options, h = o.getBoundingClientRect();
    if (e instanceof MouseEvent && !W(e, r.behaviour.triggers))
      return;
    const _ = S(r.startAreas, r.document), p = S(r.boundaries, r.document);
    this._targetElement = p.find(
      (g) => C(g.getBoundingClientRect(), h)
    );
    const m = e.composedPath();
    if (!this._targetElement || !_.find((g) => m.includes(g)) || !p.find((g) => m.includes(g)) || !t && this._emitEvent("beforestart", e) === !1)
      return;
    this._areaLocation = { x1: s, y1: i, x2: 0, y2: 0 };
    const a = c.scrollingElement ?? c.body;
    this._scrollDelta = { x: a.scrollLeft, y: a.scrollTop }, this._singleClick = !0, this.clearSelection(!1, !0), x(c, ["touchmove", "mousemove"], this._delayedTapMove, { passive: !1 }), x(c, ["mouseup", "touchcancel", "touchend"], this._onTapStop), x(c, "scroll", this._onScroll);
  }
  _onSingleTap(e) {
    const { singleTap: { intersect: t }, range: s } = this._options.features, i = A(e);
    let o;
    if (t === "native")
      o = i.target;
    else if (t === "touch") {
      this.resolveSelectables();
      const { x: c, y: h } = i;
      o = this._selectables.find((_) => {
        const { right: p, left: m, top: a, bottom: g } = _.getBoundingClientRect();
        return c < p && c > m && h < g && h > a;
      });
    }
    if (!o)
      return;
    for (this.resolveSelectables(); !this._selectables.includes(o); ) {
      if (!o.parentElement)
        return;
      o = o.parentElement;
    }
    const { stored: r } = this._selection;
    if (this._emitEvent("start", e), e.shiftKey && s && this._latestElement) {
      const c = this._latestElement, [h, _] = c.compareDocumentPosition(o) & 4 ? [o, c] : [c, o], p = [...this._selectables.filter(
        (m) => m.compareDocumentPosition(h) & 4 && m.compareDocumentPosition(_) & 2
      ), h, _];
      this.select(p), this._latestElement = c;
    } else
      r.includes(o) && (r.length === 1 || e.ctrlKey || r.every((c) => this._selection.stored.includes(c))) ? this.deselect(o) : (this.select(o), this._latestElement = o);
  }
  _delayedTapMove(e) {
    const { container: t, document: s, behaviour: { startThreshold: i } } = this._options, { x1: o, y1: r } = this._areaLocation, { x: c, y: h } = A(e);
    if (
      // Single number for both coordinates
      typeof i == "number" && b(c + h - (o + r)) >= i || // Different x and y threshold
      typeof i == "object" && b(c - o) >= i.x || b(h - r) >= i.y
    ) {
      if (E(s, ["mousemove", "touchmove"], this._delayedTapMove, { passive: !1 }), this._emitEvent("beforedrag", e) === !1) {
        E(s, ["mouseup", "touchcancel", "touchend"], this._onTapStop);
        return;
      }
      x(s, ["mousemove", "touchmove"], this._onTapMove, { passive: !1 }), y(this._area, "display", "block"), S(t, s)[0].appendChild(this._clippingElement), this.resolveSelectables(), this._singleClick = !1, this._targetRect = this._targetElement.getBoundingClientRect(), this._scrollAvailable = this._targetElement.scrollHeight !== this._targetElement.clientHeight || this._targetElement.scrollWidth !== this._targetElement.clientWidth, this._scrollAvailable && (x(this._targetElement, "wheel", this._manualScroll, { passive: !1 }), this._selectables = this._selectables.filter((_) => this._targetElement.contains(_))), this._setupSelectionArea(), this._emitEvent("start", e), this._onTapMove(e);
    }
    this._handleMoveEvent(e);
  }
  _setupSelectionArea() {
    const { _clippingElement: e, _targetElement: t, _area: s } = this, i = this._targetRect = t.getBoundingClientRect();
    this._scrollAvailable ? (y(e, {
      top: i.top,
      left: i.left,
      width: i.width,
      height: i.height
    }), y(s, {
      marginTop: -i.top,
      marginLeft: -i.left
    })) : (y(e, {
      top: 0,
      left: 0,
      width: "100%",
      height: "100%"
    }), y(s, {
      marginTop: 0,
      marginLeft: 0
    }));
  }
  _onTapMove(e) {
    const { x: t, y: s } = A(e), { _scrollSpeed: i, _areaLocation: o, _options: r, _frame: c } = this, { speedDivider: h } = r.behaviour.scrolling, _ = this._targetElement;
    if (o.x2 = t, o.y2 = s, this._scrollAvailable && !this._scrollingActive && (i.y || i.x)) {
      this._scrollingActive = !0;
      const p = () => {
        if (!i.x && !i.y) {
          this._scrollingActive = !1;
          return;
        }
        const { scrollTop: m, scrollLeft: a } = _;
        i.y && (_.scrollTop += D(i.y / h), o.y1 -= _.scrollTop - m), i.x && (_.scrollLeft += D(i.x / h), o.x1 -= _.scrollLeft - a), c.next(e), requestAnimationFrame(p);
      };
      requestAnimationFrame(p);
    } else
      c.next(e);
    this._handleMoveEvent(e);
  }
  _handleMoveEvent(e) {
    const { features: t } = this._options;
    (t.touch && H() || this._scrollAvailable && F()) && e.preventDefault();
  }
  _onScroll() {
    const { _scrollDelta: e, _options: { document: t } } = this, { scrollTop: s, scrollLeft: i } = t.scrollingElement ?? t.body;
    this._areaLocation.x1 += e.x - i, this._areaLocation.y1 += e.y - s, e.x = i, e.y = s, this._setupSelectionArea(), this._frame.next(null);
  }
  _manualScroll(e) {
    const { manualSpeed: t } = this._options.behaviour.scrolling, s = e.deltaY ? e.deltaY > 0 ? 1 : -1 : 0, i = e.deltaX ? e.deltaX > 0 ? 1 : -1 : 0;
    this._scrollSpeed.y += s * t, this._scrollSpeed.x += i * t, this._onTapMove(e), e.preventDefault();
  }
  _recalculateSelectionAreaRect() {
    const { _scrollSpeed: e, _areaLocation: t, _areaRect: s, _targetElement: i, _options: o } = this, { scrollTop: r, scrollHeight: c, clientHeight: h, scrollLeft: _, scrollWidth: p, clientWidth: m } = i, a = this._targetRect, { x1: g, y1: T } = t;
    let { x2: f, y2: d } = t;
    const { behaviour: { scrolling: { startScrollMargins: v } } } = o;
    f < a.left + v.x ? (e.x = _ ? -b(a.left - f + v.x) : 0, f = f < a.left ? a.left : f) : f > a.right - v.x ? (e.x = p - _ - m ? b(a.left + a.width - f - v.x) : 0, f = f > a.right ? a.right : f) : e.x = 0, d < a.top + v.y ? (e.y = r ? -b(a.top - d + v.y) : 0, d = d < a.top ? a.top : d) : d > a.bottom - v.y ? (e.y = c - r - h ? b(a.top + a.height - d - v.y) : 0, d = d > a.bottom ? a.bottom : d) : e.y = 0;
    const w = k(g, f), L = k(T, d), P = R(g, f), j = R(T, d);
    s.x = w, s.y = L, s.width = P - w, s.height = j - L;
  }
  _redrawSelectionArea() {
    const { x: e, y: t, width: s, height: i } = this._areaRect, { style: o } = this._area;
    o.left = `${e}px`, o.top = `${t}px`, o.width = `${s}px`, o.height = `${i}px`;
  }
  _onTapStop(e, t) {
    var r;
    const { document: s, features: i } = this._options, { _singleClick: o } = this;
    E(s, ["mousemove", "touchmove"], this._delayedTapMove), E(s, ["touchmove", "mousemove"], this._onTapMove), E(s, ["mouseup", "touchcancel", "touchend"], this._onTapStop), E(s, "scroll", this._onScroll), this._keepSelection(), e && o && i.singleTap.allow ? this._onSingleTap(e) : !o && !t && (this._updateElementSelection(), this._emitEvent("stop", e)), this._scrollSpeed.x = 0, this._scrollSpeed.y = 0, E(this._targetElement, "wheel", this._manualScroll, { passive: !0 }), this._clippingElement.remove(), (r = this._frame) == null || r.cancel(), y(this._area, "display", "none");
  }
  _updateElementSelection() {
    const { _selectables: e, _options: t, _selection: s, _areaRect: i } = this, { stored: o, selected: r, touched: c } = s, { intersect: h, overlap: _ } = t.behaviour, p = _ === "invert", m = [], a = [], g = [];
    for (let f = 0; f < e.length; f++) {
      const d = e[f];
      if (C(i, d.getBoundingClientRect(), h)) {
        if (r.includes(d))
          o.includes(d) && !c.includes(d) && c.push(d);
        else if (p && o.includes(d)) {
          g.push(d);
          continue;
        } else
          a.push(d);
        m.push(d);
      }
    }
    p && a.push(...o.filter((f) => !r.includes(f)));
    const T = _ === "keep";
    for (let f = 0; f < r.length; f++) {
      const d = r[f];
      !m.includes(d) && !// Check if user wants to keep previously selected elements, e.g.
      // not make them part of the current selection as soon as they're touched.
      (T && o.includes(d)) && g.push(d);
    }
    s.selected = m, s.changed = { added: a, removed: g }, this._latestElement = void 0;
  }
  _emitEvent(e, t) {
    return this.emit(e, {
      event: t,
      store: this._selection,
      selection: this
    });
  }
  _keepSelection() {
    const { _options: e, _selection: t } = this, { selected: s, changed: i, touched: o, stored: r } = t, c = s.filter((h) => !r.includes(h));
    switch (e.behaviour.overlap) {
      case "drop": {
        t.stored = [
          ...c,
          ...r.filter((h) => !o.includes(h))
          // Elements not touched
        ];
        break;
      }
      case "invert": {
        t.stored = [
          ...c,
          ...r.filter((h) => !i.removed.includes(h))
          // Elements not removed from selection
        ];
        break;
      }
      case "keep": {
        t.stored = [
          ...r,
          ...s.filter((h) => !r.includes(h))
          // Newly added
        ];
        break;
      }
    }
  }
  /**
   * Manually triggers the start of a selection
   * @param evt A MouseEvent / TouchEvent -like object
   * @param silent If beforestart should be fired,
   */
  trigger(e, t = !0) {
    this._onTapStart(e, t);
  }
  /**
   * Can be used if during a selection elements have been added.
   * Will update everything which can be selected.
   */
  resolveSelectables() {
    this._selectables = S(this._options.selectables, this._options.document);
  }
  /**
   * Same as deselect, but for all elements currently selected.
   * @param includeStored If the store should also get cleared
   * @param quiet If move / stop events should be fired
   */
  clearSelection(e = !0, t = !1) {
    const { selected: s, stored: i, changed: o } = this._selection;
    o.added = [], o.removed.push(
      ...s,
      ...e ? i : []
    ), t || (this._emitEvent("move", null), this._emitEvent("stop", null)), this._selection = {
      stored: e ? [] : i,
      selected: [],
      touched: [],
      changed: { added: [], removed: [] }
    };
  }
  /**
   * @returns {Array} Selected elements
   */
  getSelection() {
    return this._selection.stored;
  }
  /**
   * @returns {HTMLElement} The selection area element
   */
  getSelectionArea() {
    return this._area;
  }
  /**
   * Cancel the current selection process.
   * @param keepEvent {boolean} true to fire a stop event after cancel.
   */
  cancel(e = !1) {
    this._onTapStop(null, !e);
  }
  /**
   * Unbinds all events and removes the area-element.
   */
  destroy() {
    this.cancel(), this.disable(), this._clippingElement.remove(), super.unbindAllListeners();
  }
  /**
   * Adds elements to the selection
   * @param query - CSS Query, can be an array of queries
   * @param quiet - If this should not trigger the move event
   */
  select(e, t = !1) {
    const { changed: s, selected: i, stored: o } = this._selection, r = S(e, this._options.document).filter(
      (c) => !i.includes(c) && !o.includes(c)
    );
    return o.push(...r), i.push(...r), s.added.push(...r), s.removed = [], this._latestElement = void 0, t || (this._emitEvent("move", null), this._emitEvent("stop", null)), r;
  }
  /**
   * Removes a particular element from the selection.
   * @param query - CSS Query, can be an array of queries
   * @param quiet - If this should not trigger the move event
   */
  deselect(e, t = !1) {
    const { selected: s, stored: i, changed: o } = this._selection, r = S(e, this._options.document).filter(
      (c) => s.includes(c) || i.includes(c)
    );
    r.length && (this._selection.stored = i.filter((c) => !r.includes(c)), this._selection.selected = s.filter((c) => !r.includes(c)), this._selection.changed.added = [], this._selection.changed.removed.push(
      ...r.filter((c) => !o.removed.includes(c))
    ), this._latestElement = void 0, t || (this._emitEvent("move", null), this._emitEvent("stop", null)));
  }
}
u(X, "version", "3.5.1");
export {
  X as default
};
//# sourceMappingURL=viselect.mjs.map
