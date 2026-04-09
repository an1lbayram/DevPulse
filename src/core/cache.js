import Store from 'electron-store';
const store = new Store();

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
