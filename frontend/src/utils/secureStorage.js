/**
 * secureStorage.js — Zero-Trust AES-256-GCM Encrypted LocalStorage Manager
 * Uses Web Crypto API for true AES-256-GCM encryption.
 * Falls back to XOR-cipher if Crypto API is unavailable.
 */

const ENCRYPTION_PREFIX = 'ARIA_AES256GCM_v3:';
const LEGACY_PREFIX = 'ARIA_SEC_v2:';
const APP_SECRET = 'ARIA_MASTER_KEY_2026_SECURE_VOICE_ASSISTANT';
const SALT_KEY = 'ARIA_GCM_SALT';

class SecureStorageManager {
  constructor() {
    this._cryptoKey = null;
    this._ready = this._initCryptoKey();
  }

  // ── Key derivation ────────────────────────────────────────────────────────
  async _initCryptoKey() {
    try {
      if (!window.crypto?.subtle) return null;

      // Retrieve or generate a random salt stored in localStorage (unencrypted)
      let saltB64 = localStorage.getItem(SALT_KEY);
      let salt;
      if (saltB64) {
        salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
      } else {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
        localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...salt)));
      }

      // Import raw secret material
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(APP_SECRET),
        'PBKDF2',
        false,
        ['deriveKey']
      );

      // Derive AES-256-GCM key via PBKDF2
      this._cryptoKey = await window.crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      return this._cryptoKey;
    } catch (e) {
      console.warn('[SecureStorage] AES-256-GCM init failed, using XOR fallback:', e);
      return null;
    }
  }

  // ── AES-256-GCM encrypt ───────────────────────────────────────────────────
  async _encrypt(text) {
    const key = this._cryptoKey || await this._ready;
    if (!key) return this._xorCipher(text);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);
    const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    // Pack: 12-byte IV | ciphertext → base64
    const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipher), iv.byteLength);
    return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined));
  }

  // ── AES-256-GCM decrypt ───────────────────────────────────────────────────
  async _decrypt(stored) {
    // Handle new AES-GCM format
    if (stored.startsWith(ENCRYPTION_PREFIX)) {
      const key = this._cryptoKey || await this._ready;
      if (!key) return null;
      try {
        const bytes = Uint8Array.from(atob(stored.slice(ENCRYPTION_PREFIX.length)), c => c.charCodeAt(0));
        const iv = bytes.slice(0, 12);
        const data = bytes.slice(12);
        const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
        return new TextDecoder().decode(plain);
      } catch (e) {
        console.warn('[SecureStorage] Decrypt failed:', e);
        return null;
      }
    }

    // Handle legacy XOR format
    if (stored.startsWith(LEGACY_PREFIX)) {
      return this._xorDecipher(stored.slice(LEGACY_PREFIX.length));
    }

    // Plain JSON fallback
    return stored;
  }

  // ── XOR cipher (fallback) ─────────────────────────────────────────────────
  _xorCipher(text, secret = APP_SECRET) {
    let r = '';
    for (let i = 0; i < text.length; i++)
      r += String.fromCharCode(text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
    return LEGACY_PREFIX + btoa(r);
  }

  _xorDecipher(encoded, secret = APP_SECRET) {
    try {
      const d = atob(encoded);
      let r = '';
      for (let i = 0; i < d.length; i++)
        r += String.fromCharCode(d.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
      return r;
    } catch { return null; }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async setItem(key, value) {
    try {
      const jsonStr = JSON.stringify(value);
      const encrypted = await this._encrypt(jsonStr);
      localStorage.setItem(key, encrypted);
    } catch (e) {
      console.warn('[SecureStorage] setItem failed:', e);
    }
  }

  async getItem(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const decrypted = await this._decrypt(item);
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (e) {
      return null;
    }
  }

  removeItem(key) { localStorage.removeItem(key); }
  clear() { localStorage.clear(); }

  /** Returns true if AES-256-GCM is active, false if XOR fallback. */
  get isAES256() { return !!this._cryptoKey; }
}

export const secureStorage = new SecureStorageManager();


