import { useState, useEffect } from 'react';
import { organizerAPI, authAPI } from '../../services/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState('profile');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await organizerAPI.getProfile();
        setProfile(res.data.organizer || res.data);
        setForm({
          organizerName: res.data.organizer?.organizerName || res.data.organizerName || '',
          description: res.data.organizer?.description || res.data.description || '',
          contactEmail: res.data.organizer?.contactEmail || res.data.contactEmail || '',
          contactNumber: res.data.organizer?.contactNumber || res.data.contactNumber || '',
          category: res.data.organizer?.category || res.data.category || '',
          discordWebhook: res.data.organizer?.discordWebhook || res.data.discordWebhook || '',
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await organizerAPI.updateProfile(form);
      setMessage({ type: 'success', text: 'Profile updated!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <h2>Organizer Profile</h2>

      <div className="tabs">
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile</button>
        <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>Password</button>
      </div>

      {message && <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>{message.text}</div>}

      {tab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="form-card">
          <div className="form-group">
            <label>Club / Organization Name</label>
            <input type="text" value={form.organizerName} onChange={e => setForm({ ...form, organizerName: e.target.value })}
              className="form-input" />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input">
              <option value="">Select</option>
              <option value="technical">Technical</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="academic">Academic</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="form-input" rows={4} />
          </div>
          <div className="form-group">
            <label>Contact Email</label>
            <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })}
              className="form-input" />
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input type="text" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })}
              className="form-input" />
          </div>
          <div className="form-group">
            <label>Discord Webhook URL</label>
            <input type="url" value={form.discordWebhook} onChange={e => setForm({ ...form, discordWebhook: e.target.value })}
              className="form-input" placeholder="https://discord.com/api/webhooks/..." />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="form-card">
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" value={passwordForm.currentPassword}
              onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="form-input" required />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={passwordForm.newPassword}
              onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="form-input" required minLength={6} />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" value={passwordForm.confirmPassword}
              onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="form-input" required minLength={6} />
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default Profile;
