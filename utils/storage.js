// ============================================================
//  storage.js — Thin wrapper over chrome.storage for the popup
// ============================================================

window.ATSStorage = {
  /** Get merged settings (sync) */
  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, resolve);
    });
  },

  /** Persist settings (sync) */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, resolve);
    });
  },

  /** Lifetime token-savings counter */
  async getStats() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_STATS' }, resolve);
    });
  },

  /** Rate-limit status for a given hostname */
  async getRateStatus(hostname) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_RATE_STATUS', hostname }, resolve);
    });
  },

  /** Saved prompt library */
  async getLibrary() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_PROMPT_LIBRARY' }, resolve);
    });
  },

  async deletePrompt(id) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'DELETE_PROMPT', id }, resolve);
    });
  },

  async resetStats() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'RESET_STATS' }, resolve);
    });
  }
};