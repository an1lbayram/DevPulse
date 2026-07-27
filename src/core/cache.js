import Store from 'electron-store';

let store;
try {
  store = new Store({ name: 'devpulse-cache' });
} catch {
  const memoryStore = new Map();
  store = {
    get: (k) => memoryStore.get(k),
    set: (k, v) => memoryStore.set(k, v),
    clear: () => memoryStore.clear()
  };
}

function getCache(key) {
  const cached = store.get(key);
  if (!cached) return null;
  
  // Checking 30 mins TTL
  if (Date.now() - cached.timestamp > 30 * 60 * 1000) {
    return null;
  }
  return cached.data;
}

function setCache(key, data) {
  store.set(key, {
    data,
    timestamp: Date.now()
  });
}

function clearCache() {
  store.clear();
}

export { getCache, setCache, clearCache };
