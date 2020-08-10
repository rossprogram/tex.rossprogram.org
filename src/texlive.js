import LRU from 'lru-cache';
import https from 'https';

const cache = new LRU({
  max: 1024 * 1024 * 50,
  length(n, key) { return n.length; },
  maxAge: 1000 * 60 * 60,
});

const agent = new https.Agent({
  keepAlive: true,
});

export async function download(url) {
  const result = cache.get(url);
  if (result !== undefined) {
    return result;
  }

  let fetched = await fetch(url);
  let buffer = fetched.arrayBuffer();
  cache.set(url, buffer);
  return buffer;
}
