// src/utils/dom.js — DOM utilities
const CUE_DOM = (() => {
  // Declarative element builder: el("div", {class:"foo", onClick: fn}, child1, "text")
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class")                          node.className = v;
      else if (k === "html")                      node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== null && v !== undefined)     node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.append(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function setHTML(node, html)   { node.innerHTML = html; }
  function setText(node, text)   { node.textContent = text; }
  function scrollBottom(node)    { requestAnimationFrame(() => { node.scrollTop = node.scrollHeight; }); }
  function addClass(n, c)        { n.classList.add(c); }
  function removeClass(n, c)     { n.classList.remove(c); }
  function toggleClass(n, c, f)  { n.classList.toggle(c, f); }
  function hasClass(n, c)        { return n.classList.contains(c); }

  // Animate a number from start to end
  function animateNum(el, from, to, dur = 600, fmt = v => Math.round(v)) {
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (to - from) * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  return { el, qs, qsa, setHTML, setText, scrollBottom, addClass, removeClass, toggleClass, hasClass, animateNum };
})();