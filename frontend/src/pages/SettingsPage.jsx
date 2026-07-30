import { useState } from 'react';
import { loginFroglog, logoutFroglog, syncFroglogLabels, testFroglogConnection } from '../api';
import { useAuth } from '../context/AuthContext';
import { useComicsRefresh } from '../context/ComicsRefreshContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { configured, loading, username, apiUrl, setUsername, setApiUrl, setConfigured, clearConfigured } = useAuth();
  const { push } = useToast();
  const { bumpRefresh } = useComicsRefresh();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  if (!loading && configured) {
    // Still show settings when configured - don't redirect
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const status = await loginFroglog({ username, password, apiUrl });
      setConfigured(status);
      setPassword('');
      push('Froglog connected', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      await testFroglogConnection({ username, password: password || undefined, apiUrl });
      push('Connection successful', 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setTesting(false);
    }
  }

  async function handleSyncLabels() {
    setSyncing(true);
    try {
      const result = await syncFroglogLabels();
      bumpRefresh();
      push(`Updated ${result.updated} Froglog ${result.updated === 1 ? 'entry' : 'entries'}`, 'success');
    } catch (err) {
      push(err.message, 'error');
    } finally {
      setSyncing(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutFroglog();
      clearConfigured();
      setPassword('');
      push('Disconnected from Froglog', 'info');
    } catch (err) {
      push(err.message, 'error');
    }
  }

  if (loading) {
    return <div className="empty-state">Checking connection...</div>;
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="page-lead">
          Connect your Froglog account. Set <code>FROGLOG_USERNAME</code>, <code>FROGLOG_PASSWORD</code>, and optionally <code>FROGLOG_API_URL</code> as environment variables, or save credentials here.
        </p>
      </div>

      {!configured && (
        <div className="alert info panel">
          <strong>Setup required.</strong> Add your Froglog login to start managing your pull list.
        </div>
      )}

      {configured && (
        <div className="status-card panel">
          <div>
            <p className="status-card__label">Signed in as</p>
            <p className="status-card__value">{username}</p>
          </div>
          <span className="connection-pill connected">Active</span>
        </div>
      )}

      <form className="settings-form panel" onSubmit={handleSave}>
        <h2>Froglog Login</h2>

        <label>
          Username
          <input
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          Password
          <input
            required={!configured}
            type="password"
            autoComplete={configured ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={configured ? 'Leave blank to keep current password' : ''}
          />
        </label>

        <label>
          API URL
          <input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.froglog.co.uk/api"
          />
        </label>

        <p className="form-help">
          Use the production API unless you run your own Froglog instance. Settings are saved to the server data volume in Docker.
        </p>

        <div className="form-actions">
          <button type="button" className="ghost-btn" onClick={handleTest} disabled={testing || !username}>
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Saving...' : configured ? 'Update Login' : 'Connect'}
          </button>
        </div>
      </form>

      {configured && (
        <section className="panel froglog-guide">
          <h2>Reading your Froglog profile</h2>
          <p className="form-help">
            Anyone viewing your public Froglog account can use it as a shopping list:
          </p>
          <dl className="froglog-guide__list">
            <dt>Live Service</dt>
            <dd>Comics to purchase — active pull list items</dd>
            <dt>Completed Games</dt>
            <dd>Comics you have already bought</dd>
            <dt>Developer</dt>
            <dd>Publisher (Marvel, DC, Image, etc.)</dd>
            <dt>Genre</dt>
            <dd>Series name</dd>
            <dt>Platform</dt>
            <dd>Issue number</dd>
            <dt>Description</dt>
            <dd>Cover variant, release date, and purchase status</dd>
          </dl>
          <button
            type="button"
            className="secondary-btn"
            onClick={handleSyncLabels}
            disabled={syncing}
          >
            {syncing ? 'Updating…' : 'Refresh Froglog labels'}
          </button>
          <p className="form-help">
            Rewrites titles and descriptions on Froglog so pull list entries say what to buy.
            Run this once to update comics added before the latest label format.
          </p>
        </section>
      )}

      {configured && (
        <div className="panel settings-danger-zone">
          <h2>Disconnect</h2>
          <p className="form-help">Removes saved credentials from this server. Your Froglog data is not deleted.</p>
          <button type="button" className="ghost-btn danger-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
