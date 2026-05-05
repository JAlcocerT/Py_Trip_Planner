import { LRUCache } from "lru-cache";

export const stationCache = new LRUCache<string, object>({
  max: 4,
  ttl: 1000 * 60 * 60 * 24, // 24 h
});

export const dailyCache = new LRUCache<string, object>({
  max: 200,
  ttl: 1000 * 60 * 60 * 6, // 6 h
});
