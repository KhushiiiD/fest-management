import { useState, useEffect } from 'react';
import { participantAPI } from '../../services/api';
import { authAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', contactNumber: '', collegeName: '', interests: []
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [message, setMessage] = useState('');
  const [pwMessage, setPwMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await participantAPI.getProfile();
        const u = res.data.user;
        setFormData({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          contactNumber: u.contactNumber || '',
          collegeName: u.collegeName || '',
          interests: u.interests || []
        });
      } catch (err) {
        console.error('fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await participantAPI.updateProfile(formData);
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMessage('Passwords do not match');
      return;
    }
    setChangingPw(true);
    setPwMessage('');
    try {
      await authAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPwMessage('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwMessage(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const interestOptions = [
    'Technology', 'Music', 'Dance', 'Art', 'Sports', 'Literature',
    'Photography', 'Gaming', 'Coding', 'Robotics', 'Debate', 'Drama'
  ];

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="page-container">
      <h2>My Profile</h2>

      <div className="card">
        <div className="profile-info">
          <p><strong>Email:</strong> {user?.email} <span className="text-muted">(cannot change)</span></p>
          <p><strong>Type:</strong> {user?.participantType} <span className="text-muted">(cannot change)</span></p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card">
        <h3>Edit Profile</h3>
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Contact Number</label>
          <input type="tel" value={formData.contactNumber}
            onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} />
        </div>
        {user?.participantType === 'non-iiit' && (
          <div className="form-group">
            <label>College Name</label>
            <input type="text" value={formData.collegeName}
              onChange={e => setFormData({ ...formData, collegeName: e.target.value })} />
          </div>
        )}
        <div className="form-group">
          <label>Interests</label>
          <div className="tags-grid">
            {interestOptions.map(interest => (
              <button key={interest} type="button"
                className={`tag-btn ${formData.interests.includes(interest) ? 'active' : ''}`}
                onClick={() => toggleInterest(interest)}>
                {interest}
              </button>
            ))}
          </div>
        </div>
        {message && <div className="alert">{message}</div>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="card">
        <h3>Change Password</h3>
        <div className="form-group">
          <label>Current Password</label>
          <input type="password" value={passwords.currentPassword}
            onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={passwords.newPassword}
            onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input type="password" value={passwords.confirmPassword}
            onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
        </div>
        {pwMessage && <div className="alert">{pwMessage}</div>}
        <button type="submit" className="btn btn-secondary" disabled={changingPw}>
          {changingPw ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
