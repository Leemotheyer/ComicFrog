import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { FroglogClient } from './froglog.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

export class SettingsManager {
  constructor() {
    this.settings = null;
    this.client = null;
  }

  async init() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    this.settings = await this.loadSettings();

    if (!this.settings && process.env.FROGLOG_USERNAME && process.env.FROGLOG_PASSWORD) {
      this.settings = {
        apiUrl: process.env.FROGLOG_API_URL || 'https://api.froglog.co.uk/api',
        username: process.env.FROGLOG_USERNAME,
        password: process.env.FROGLOG_PASSWORD,
      };
      await this.saveSettings();
    }

    if (this.settings) {
      this.client = new FroglogClient(
        this.settings.apiUrl,
        this.settings.username,
        this.settings.password,
      );
    }
  }

  async loadSettings() {
    try {
      const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async saveSettings() {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf8');
  }

  isConfigured() {
    return Boolean(this.settings?.username && this.settings?.password);
  }

  getStatus() {
    if (!this.isConfigured()) {
      return { configured: false };
    }

    return {
      configured: true,
      username: this.settings.username,
      apiUrl: this.settings.apiUrl,
    };
  }

  getClient() {
    if (!this.client) {
      throw new Error('Froglog is not configured. Add your login details in Settings.');
    }
    return this.client;
  }

  async configure({ username, password, apiUrl }) {
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    const trimmedApiUrl = (apiUrl?.trim() || this.settings?.apiUrl || 'https://api.froglog.co.uk/api').replace(/\/$/, '');
    const resolvedPassword = trimmedPassword || this.settings?.password;

    if (!trimmedUsername || !resolvedPassword) {
      throw new Error('Username and password are required');
    }

    const testClient = new FroglogClient(trimmedApiUrl, trimmedUsername, resolvedPassword);
    await testClient.ensureAuth();

    this.settings = {
      apiUrl: trimmedApiUrl,
      username: trimmedUsername,
      password: resolvedPassword,
    };
    await this.saveSettings();
    this.client = testClient;

    return this.getStatus();
  }

  async logout() {
    this.settings = null;
    this.client = null;
    try {
      await fs.unlink(SETTINGS_FILE);
    } catch {
      // File may not exist yet.
    }
  }

  async testConnection({ username, password, apiUrl } = {}) {
    const client = new FroglogClient(
      (apiUrl || this.settings?.apiUrl || 'https://api.froglog.co.uk/api').replace(/\/$/, ''),
      username || this.settings?.username,
      password || this.settings?.password,
    );
    await client.ensureAuth();
    return { ok: true };
  }
}
