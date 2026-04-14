// src/utils/dom.js
// ─────────────────────────────────────────────
// Lightweight DOM helpers.
// Keeps UI code declarative and readable.
// ─────────────────────────────────────────────

const CUE_DOM = (() => {

  /**
   * Create an element with attributes + children in one call.
   * el("div", { class: "foo", id: "bar" }, "Hello", otherEl)
   */
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);

    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k.startsWith("on") && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else {
        node.setAttribute(k, v);
      }
    });

    children.forEach((child) => {
      if (child == null) return;
      node.append(typeof child === "string" ? document.createTextNode(child) : child);
    });

    return node;
  }

  /** Query within a root (defaults to document) */
  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  /** Set inner HTML safely (only use with trusted AI text post-sanitization) */
  function setHTML(node, html) {
    node.innerHTML = html;
  }

  /** Scroll element to its bottom */
  function scrollToBottom(node) {
    node.scrollTop = node.scrollHeight;
  }

  /** Add/remove a class based on a boolean */
  function toggleClass(node, cls, force) {
    node.classList.toggle(cls, force);
  }

  return { el, qs, setHTML, scrollToBottom, toggleClass };

})();