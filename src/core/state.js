// src/core/state.js — Centralized immutable state
const CUE_STATE = (() => {
  let _s = {
    tabId:        null,
    isOpen:       false,
    isLoading:    false,
    isStreaming:  false,
    messages:     [],
    pageContext:  "",
    pageMeta:     { title:"", url:"", domain:"", wordCount:0, readTime:0 },
    currentMode:  "chat",
    error:        null,
    selectionText:"",
    suggestions:  [],
    dnaReady:     false,
  };

  const get  = ()    => _s;
  const set  = patch => { _s = { ..._s, ...patch }; };

  const pushMsg = (role, content, meta = {}) => {
    const msg = { id: `m_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, role, content, ts: Date.now(), ...meta };
    set({ messages: [..._s.messages, msg] });
    return msg;
  };

  const updateLastMsg = patch => {
    const msgs = [..._s.messages];
    if (!msgs.length) return;
    msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...patch };
    set({ messages: msgs });
  };

  const clearMsgs = () => set({ messages: [] });

  return { get, set, pushMsg, updateLastMsg, clearMsgs };
})();