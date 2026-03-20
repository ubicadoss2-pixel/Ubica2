"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheClear = exports.cacheDel = exports.cacheGet = exports.cacheSet = void 0;
const store = new Map();
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutos
const cacheSet = (key, value, ttl = DEFAULT_TTL) => {
    const expiresAt = Date.now() + ttl;
    store.set(key, { value, expiresAt });
};
exports.cacheSet = cacheSet;
const cacheGet = (key) => {
    const entry = store.get(key);
    if (!entry)
        return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.value;
};
exports.cacheGet = cacheGet;
const cacheDel = (key) => {
    store.delete(key);
};
exports.cacheDel = cacheDel;
const cacheClear = () => {
    store.clear();
};
exports.cacheClear = cacheClear;
exports.default = {
    get: exports.cacheGet,
    set: exports.cacheSet,
    del: exports.cacheDel,
    clear: exports.cacheClear,
};
