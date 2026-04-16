// src/utils/time.js
const CUE_TIME = (() => {
  function fmt(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60)    return "just now";
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
    return d.toLocaleDateString([], {month:"short", day:"numeric"});
  }
  function fmtExact(ts) {
    return new Date(ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  }
  return { fmt, fmtExact };
})();