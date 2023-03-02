/*! @viselect/vanilla v3.2.5 MIT | https://github.com/Simonwep/selection/tree/master/packages/vanilla */
var H = Object.defineProperty;
var q = (l, n, e) => n in l ? H(l, n, { enumerable: !0, configurable: !0, writable: !0, value: e }) : l[n] = e;
var u = (l, n, e) => (q(l, typeof n != "symbol" ? n + "" : n, e), e);
class F {
  constructor() {
    u(this, "_listeners", /* @__PURE__ */ new Map());
    u(this, "on", this.addEventListener);
    u(this, "off", this.removeEventListener);
    u(this, "emit", this.dispatchEvent);
  }
  addEventListener(n, e) {
    const t = this._listeners.get(n) || /* @__PURE__ */ new Set();
    return this._listeners.set(n, t), t.add(e), this;
  }
  removeEventListener(n, e) {
    var t;
    return (t = this._listeners.get(n)) == null || t.delete(e), this;
  }
  dispatchEvent(n, ...e) {
    let t = !0;
    for (const s of this._listeners.get(n) || [])
      t = s(...e) !== !1 && t;
    return t;
  }
  unbindAllListeners() {
    this._listeners.clear();
  }
}
const C = (l, n = "px") => typeof l == "number" ? l + n : l;
function y({ style: l }, n, e) {
  if (typeof n == "object")
    for (const [t, s] of Object.entries(n))
      s !== void 0 && (l[t] = C(s));
  else
    e !== void 0 && (l[n] = C(e));
}
function B(l) {
  return (n, e, t, s = {}) => {
    n instanceof HTMLCollection || n instanceof NodeList ? n = Array.from(n) : Array.isArray(n) || (n = [n]), Array.isArray(e) || (e = [e]);
    for (const o of n)
      for (const i of e)
        o[l](i, t, { capture: !1, ...s });
    return [n, e, t, s];
  };
}
const x = B("addEventListener"), E = B("removeEventListener"), T = (l) => {
  const { clientX: n, clientY: e, target: t } = l.touches && l.touches[0] || l;
  return { x: n, y: e, target: t };
};
function M(l, n, e = "touch") {
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
  for (let s = 0, o = e.length; s < o; s++) {
    const i = e[s];
    typeof i == "string" ? t = t.concat(Array.from(n.querySelectorAll(i))) : i instanceof Element && t.push(i);
  }
  return t;
}
const W = () => matchMedia("(hover: none), (pointer: coarse)").matches, X = () => "safari" in window, j = (l, n) => {
  for (const [e, t] of Object.entries(l)) {
    const s = n[e];
    l[e] = s === void 0 ? l[e] : typeof s == "object" && typeof t == "object" && t !== null && !Array.isArray(t) ? j(t, s) : s;
  }
  return l;
}, Y = (l) => {
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
}, { abs: b, max: R, min: k, ceil: D } = Math;
class $ extends F {
  constructor(e) {
    super();
    u(this, "_options");
    u(this, "_selection", {
      stored: [],
      selected: [],
      touched: [],
      changed: {
        added: [],
        removed: []
      }
    });
    u(this, "_area");
    u(this, "_clippingElement");
    u(this, "_targetElement");
    u(this, "_targetRect");
    u(this, "_selectables", []);
    u(this, "_latestElement");
    u(this, "_areaRect", new DOMRect());
    u(this, "_areaLocation", { y1: 0, x2: 0, y2: 0, x1: 0 });
    u(this, "_singleClick", !0);
    u(this, "_frame");
    u(this, "_scrollAvailable", !0);
    u(this, "_scrollingActive", !1);
    u(this, "_scrollSpeed", { x: 0, y: 0 });
    u(this, "_scrollDelta", { x: 0, y: 0 });
    u(this, "disable", this._bindStartEvents.bind(this, !1));
    u(this, "enable", this._bindStartEvents);
    this._options = j({
      selectionAreaClass: "selection-area",
      selectionContainerClass: void 0,
      selectables: [],
      document: window.document,
      behaviour: {
        overlap: "invert",
        intersect: "touch",
        startThreshold: { x: 10, y: 10 },
        scrolling: {
          speedDivider: 10,
          manualSpeed: 750,
          startScrollMargins: { x: 0, y: 0 }
        }
      },
      features: {
        range: !0,
        touch: !0,
        singleTap: {
          allow: !0,
          intersect: "native"
        }
      },
      startAreas: ["html"],
      boundaries: ["html"],
      container: "body"
    }, e);
    for (const i of Object.getOwnPropertyNames(Object.getPrototypeOf(this)))
      typeof this[i] == "function" && (this[i] = this[i].bind(this));
    const { document: t, selectionAreaClass: s, selectionContainerClass: o } = this._options;
    this._area = t.createElement("div"), this._clippingElement = t.createElement("div"), this._clippingElement.appendChild(this._area), this._area.classList.add(s), o && this._clippingElement.classList.add(o), y(this._area, {
      willChange: "top, left, bottom, right, width, height",
      top: 0,
      left: 0,
      position: "fixed"
    }), y(this._clippingElement, {
      overflow: "hidden",
      position: "fixed",
      transform: "translate3d(0, 0, 0)",
      pointerEvents: "none",
      zIndex: "1"
    }), this._frame = Y((i) => {
      this._recalculateSelectionAreaRect(), this._updateElementSelection(), this._emitEvent("move", i), this._redrawSelectionArea();
    }), this.enable();
  }
  _bindStartEvents(e = !0) {
    const { document: t, features: s } = this._options, o = e ? x : E;
    o(t, "mousedown", this._onTapStart), s.touch && o(t, "touchstart", this._onTapStart, {
      passive: !1
    });
  }
  _onTapStart(e, t = !1) {
    const { x: s, y: o, target: i } = T(e), { _options: c } = this, { document: r } = this._options, d = i.getBoundingClientRect(), p = S(c.startAreas, c.document), m = S(c.boundaries, c.document);
    this._targetElement = m.find(
      (g) => M(g.getBoundingClientRect(), d)
    );
    const f = e.composedPath();
    if (!this._targetElement || !p.find((g) => f.includes(g)) || !m.find((g) => f.includes(g)) || !t && this._emitEvent("beforestart", e) === !1)
      return;
    this._areaLocation = { x1: s, y1: o, x2: 0, y2: 0 };
    const a = r.scrollingElement || r.body;
    this._scrollDelta = { x: a.scrollLeft, y: a.scrollTop }, this._singleClick = !0, this.clearSelection(!1, !0), x(r, ["touchmove", "mousemove"], this._delayedTapMove, { passive: !1 }), x(r, ["mouseup", "touchcancel", "touchend"], this._onTapStop), x(r, "scroll", this._onScroll);
  }
  _onSingleTap(e) {
    const { singleTap: { intersect: t }, range: s } = this._options.features, o = T(e);
    let i;
    if (t === "native")
      i = o.target;
    else if (t === "touch") {
      this.resolveSelectables();
      const { x: r, y: d } = o;
      i = this._selectables.find((p) => {
        const { right: m, left: f, top: a, bottom: g } = p.getBoundingClientRect();
        return r < m && r > f && d < g && d > a;
      });
    }
    if (!i)
      return;
    for (this.resolveSelectables(); !this._selectables.includes(i); ) {
      if (!i.parentElement)
        return;
      i = i.parentElement;
    }
    const { stored: c } = this._selection;
    if (this._emitEvent("start", e), e.shiftKey && c.length && s) {
      const r = this._latestElement ?? c[0], [d, p] = r.compareDocumentPosition(i) & 4 ? [i, r] : [r, i], m = [...this._selectables.filter(
        (f) => f.compareDocumentPosition(d) & 4 && f.compareDocumentPosition(p) & 2
      ), d, p];
      this.select(m);
    } else
      c.includes(i) && (c.length === 1 || e.ctrlKey || c.every((r) => this._selection.stored.includes(r))) ? this.deselect(i) : (this._latestElement = i, this.select(i));
    this._emitEvent("stop", e);
  }
  _delayedTapMove(e) {
    const { container: t, document: s, behaviour: { startThreshold: o } } = this._options, { x1: i, y1: c } = this._areaLocation, { x: r, y: d } = T(e), p = typeof o;
    if (p === "number" && b(r + d - (i + c)) >= o || p === "object" && b(r - i) >= o.x || b(d - c) >= o.y) {
      if (E(s, ["mousemove", "touchmove"], this._delayedTapMove, { passive: !1 }), this._emitEvent("beforedrag", e) === !1) {
        E(s, ["mouseup", "touchcancel", "touchend"], this._onTapStop);
        return;
      }
      x(s, ["mousemove", "touchmove"], this._onTapMove, { passive: !1 }), y(this._area, "display", "block"), S(t, s)[0].appendChild(this._clippingElement), this.resolveSelectables(), this._singleClick = !1, this._targetRect = this._targetElement.getBoundingClientRect(), this._scrollAvailable = this._targetElement.scrollHeight !== this._targetElement.clientHeight || this._targetElement.scrollWidth !== this._targetElement.clientWidth, this._scrollAvailable && (x(s, "wheel", this._manualScroll, { passive: !1 }), this._selectables = this._selectables.filter((m) => this._targetElement.contains(m))), this._setupSelectionArea(), this._emitEvent("start", e), this._onTapMove(e);
    }
    this._handleMoveEvent(e);
  }
  _setupSelectionArea() {
    const { _clippingElement: e, _targetElement: t, _area: s } = this, o = this._targetRect = t.getBoundingClientRect();
    this._scrollAvailable ? (y(e, {
      top: o.top,
      left: o.left,
      width: o.width,
      height: o.height
    }), y(s, {
      marginTop: -o.top,
      marginLeft: -o.left
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
    const { x: t, y: s } = T(e), { _scrollSpeed: o, _areaLocation: i, _options: c, _frame: r } = this, { speedDivider: d } = c.behaviour.scrolling, p = this._targetElement;
    if (i.x2 = t, i.y2 = s, this._scrollAvailable && !this._scrollingActive && (o.y || o.x)) {
      this._scrollingActive = !0;
      const m = () => {
        if (!o.x && !o.y) {
          this._scrollingActive = !1;
          return;
        }
        const { scrollTop: f, scrollLeft: a } = p;
        o.y && (p.scrollTop += D(o.y / d), i.y1 -= p.scrollTop - f), o.x && (p.scrollLeft += D(o.x / d), i.x1 -= p.scrollLeft - a), r.next(e), requestAnimationFrame(m);
      };
      requestAnimationFrame(m);
    } else
      r.next(e);
    this._handleMoveEvent(e);
  }
  _handleMoveEvent(e) {
    const { features: t } = this._options;
    (t.touch && W() || this._scrollAvailable && X()) && e.preventDefault();
  }
  _onScroll() {
    const { _scrollDelta: e, _options: { document: t } } = this, { scrollTop: s, scrollLeft: o } = t.scrollingElement || t.body;
    this._areaLocation.x1 += e.x - o, this._areaLocation.y1 += e.y - s, e.x = o, e.y = s, this._setupSelectionArea(), this._frame.next(null);
  }
  _manualScroll(e) {
    const { manualSpeed: t } = this._options.behaviour.scrolling, s = e.deltaY ? e.deltaY > 0 ? 1 : -1 : 0, o = e.deltaX ? e.deltaX > 0 ? 1 : -1 : 0;
    this._scrollSpeed.y += s * t, this._scrollSpeed.x += o * t, this._onTapMove(e), e.preventDefault();
  }
  _recalculateSelectionAreaRect() {
    const { _scrollSpeed: e, _areaLocation: t, _areaRect: s, _targetElement: o, _options: i } = this, { scrollTop: c, scrollHeight: r, clientHeight: d, scrollLeft: p, scrollWidth: m, clientWidth: f } = o, a = this._targetRect, { x1: g, y1: A } = t;
    let { x2: _, y2: h } = t;
    const { behaviour: { scrolling: { startScrollMargins: v } } } = i;
    _ < a.left + v.x ? (e.x = p ? -b(a.left - _ + v.x) : 0, _ = _ < a.left ? a.left : _) : _ > a.right - v.x ? (e.x = m - p - f ? b(a.left + a.width - _ - v.x) : 0, _ = _ > a.right ? a.right : _) : e.x = 0, h < a.top + v.y ? (e.y = c ? -b(a.top - h + v.y) : 0, h = h < a.top ? a.top : h) : h > a.bottom - v.y ? (e.y = r - c - d ? b(a.top + a.height - h - v.y) : 0, h = h > a.bottom ? a.bottom : h) : e.y = 0;
    const w = k(g, _), L = k(A, h), O = R(g, _), P = R(A, h);
    s.x = w, s.y = L, s.width = O - w, s.height = P - L;
  }
  _redrawSelectionArea() {
    const { x: e, y: t, width: s, height: o } = this._areaRect, { style: i } = this._area;
    i.left = `${e}px`, i.top = `${t}px`, i.width = `${s}px`, i.height = `${o}px`;
  }
  _onTapStop(e, t) {
    var c;
    const { document: s, features: o } = this._options, { _singleClick: i } = this;
    E(s, ["mousemove", "touchmove"], this._delayedTapMove), E(s, ["touchmove", "mousemove"], this._onTapMove), E(s, ["mouseup", "touchcancel", "touchend"], this._onTapStop), E(s, "scroll", this._onScroll), this._keepSelection(), e && i && o.singleTap.allow ? this._onSingleTap(e) : !i && !t && (this._updateElementSelection(), this._emitEvent("stop", e)), this._scrollSpeed.x = 0, this._scrollSpeed.y = 0, this._scrollAvailable && E(s, "wheel", this._manualScroll, { passive: !0 }), this._clippingElement.remove(), (c = this._frame) == null || c.cancel(), y(this._area, "display", "none");
  }
  _updateElementSelection() {
    const { _selectables: e, _options: t, _selection: s, _areaRect: o } = this, { stored: i, selected: c, touched: r } = s, { intersect: d, overlap: p } = t.behaviour, m = p === "invert", f = [], a = [], g = [];
    for (let _ = 0; _ < e.length; _++) {
      const h = e[_];
      if (M(o, h.getBoundingClientRect(), d)) {
        if (c.includes(h))
          i.includes(h) && !r.includes(h) && r.push(h);
        else if (m && i.includes(h)) {
          g.push(h);
          continue;
        } else
          a.push(h);
        f.push(h);
      }
    }
    m && a.push(...i.filter((_) => !c.includes(_)));
    const A = p === "keep";
    for (let _ = 0; _ < c.length; _++) {
      const h = c[_];
      !f.includes(h) && !(A && i.includes(h)) && g.push(h);
    }
    s.selected = f, s.changed = { added: a, removed: g }, this._latestElement = f[f.length - 1];
  }
  _emitEvent(e, t) {
    return this.emit(e, {
      event: t,
      store: this._selection,
      selection: this
    });
  }
  _keepSelection() {
    const { _options: e, _selection: t } = this, { selected: s, changed: o, touched: i, stored: c } = t, r = s.filter((d) => !c.includes(d));
    switch (e.behaviour.overlap) {
      case "drop": {
        t.stored = [
          ...r,
          ...c.filter((d) => !i.includes(d))
        ];
        break;
      }
      case "invert": {
        t.stored = [
          ...r,
          ...c.filter((d) => !o.removed.includes(d))
        ];
        break;
      }
      case "keep": {
        t.stored = [
          ...c,
          ...s.filter((d) => !c.includes(d))
        ];
        break;
      }
    }
  }
  trigger(e, t = !0) {
    this._onTapStart(e, t);
  }
  resolveSelectables() {
    this._selectables = S(this._options.selectables, this._options.document);
  }
  clearSelection(e = !0, t = !1) {
    const { selected: s, stored: o, changed: i } = this._selection;
    i.added = [], i.removed.push(
      ...s,
      ...e ? o : []
    ), t || (this._emitEvent("move", null), this._emitEvent("stop", null)), this._latestElement = void 0, this._selection = {
      stored: e ? [] : o,
      selected: [],
      touched: [],
      changed: { added: [], removed: [] }
    };
  }
  getSelection() {
    return this._selection.stored;
  }
  getSelectionArea() {
    return this._area;
  }
  cancel(e = !1) {
    this._onTapStop(null, !e);
  }
  destroy() {
    this.cancel(), this.disable(), this._clippingElement.remove(), super.unbindAllListeners();
  }
  select(e, t = !1) {
    const { changed: s, selected: o, stored: i } = this._selection, c = S(e, this._options.document).filter(
      (r) => !o.includes(r) && !i.includes(r)
    );
    return i.push(...c), o.push(...c), s.added.push(...c), s.removed = [], this._latestElement = void 0, t || (this._emitEvent("move", null), this._emitEvent("stop", null)), c;
  }
  deselect(e, t = !1) {
    const { selected: s, stored: o, changed: i } = this._selection, c = S(e, this._options.document).filter(
      (r) => s.includes(r) || o.includes(r)
    );
    c.length && (this._selection.stored = o.filter((r) => !c.includes(r)), this._selection.selected = s.filter((r) => !c.includes(r)), this._selection.changed.added = [], this._selection.changed.removed.push(
      ...c.filter((r) => !i.removed.includes(r))
    ), this._latestElement = void 0, t || (this._emitEvent("move", null), this._emitEvent("stop", null)));
  }
}
u($, "version", "3.2.5");
export {
  $ as default
};
//# sourceMappingURL=viselect.mjs.map
