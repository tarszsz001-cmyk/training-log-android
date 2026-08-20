// The app was originally built as a Claude.ai artifact, where
// `window.storage` is provided by the host. Outside that sandbox (a real
// browser or this Android WebView), that API doesn't exist — so we
// polyfill it with the same async get/set/delete/list contract, backed by
// localStorage, before the app ever touches window.storage.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const raw = localStorage.getItem(key);
      if (raw === null) throw new Error(`storage key not found: ${key}`);
      return { key, value: raw, shared: false };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    },
    async delete(key) {
      const existed = localStorage.getItem(key) !== null;
      localStorage.removeItem(key);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix = "") {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix));
      return { keys, prefix, shared: false };
    },
  };
}
