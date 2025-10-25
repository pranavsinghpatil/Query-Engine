import time

class QueryCache:
    def __init__(self, ttl_seconds: int = 300, max_size: int = 1000):
        self.cache = {}
        self.ttl_seconds = ttl_seconds
        self.max_size = max_size

    def get(self, key: str):
        if key in self.cache:
            entry = self.cache[key]
            if time.time() - entry["timestamp"] < self.ttl_seconds:
                return entry["value"]
            else:
                # Entry expired
                del self.cache[key]
        return None

    def set(self, key: str, value: any):
        if len(self.cache) >= self.max_size:
            # Simple eviction policy: remove the oldest entry
            oldest_key = min(self.cache, key=lambda k: self.cache[k]["timestamp"])
            del self.cache[oldest_key]
        self.cache[key] = {"value": value, "timestamp": time.time()}

    def invalidate(self, key: str):
        if key in self.cache:
            del self.cache[key]

    def clear(self):
        self.cache = {}