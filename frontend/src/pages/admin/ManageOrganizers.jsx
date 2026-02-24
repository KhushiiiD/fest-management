import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const ManageOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    email: '',
    organizerName: '',
    category: 'technical',
    description: '',
    contactEmail: '',
    contactNumber: '',
  });

  const fetchOrganizers = async () => {
    try {
      const res = await adminAPI.getAllOrganizers();
      setOrganizers(res.data.organizers || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrganizers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const res = await adminAPI.createOrganizer(form);
      setMessage({ type: 'success', text: `Organizer created! Password: ${res.data.organizer?.temporaryPassword || 'Sent via email'}` });
      setForm({ email: '', organizerName: '', category: 'technical', description: '', contactEmail: '', contactNumber: '' });
      setShowForm(false);
      fetchOrganizers();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create organizer' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this organizer?')) return;
    try {
      await adminAPI.deactivateOrganizer(id);
      fetchOrganizers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReactivate = async (id) => {
    try {
      await adminAPI.reactivateOrganizer(id);
      fetchOrganizers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this organizer and all their events? This cannot be undone.')) return;
    try {
      await adminAPI.deleteOrganizer(id);
      fetchOrganizers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Manage Organizers</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ Create Organizer'}
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
          {message.text}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="form-card" style={{ marginBottom: '2rem' }}>
          <h3>Create New Organizer</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Login Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="form-input" required />
            </div>
            <div className="form-group">
              <label>Organization/Club Name *</label>
              <input type="text" value={form.organizerName} onChange={e => setForm({ ...form, organizerName: e.target.value })}
                className="form-input" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input">
                <option value="technical">Technical</option>
                <option value="cultural">Cultural</option>
                <option value="sports">Sports</option>
                <option value="academic">Academic</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contact Email</label>
              <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input type="text" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })}
              className="form-input" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="form-input" rows={3} />
          </div>
          <button type="submit" disabled={creating} className="btn btn-primary">
            {creating ? 'Creating...' : 'Create Organizer'}
          </button>
          <p className="help-text">A random password will be generated and emailed to the organizer.</p>
        </form>
      )}

      {/* Organizers List */}
      {organizers.length === 0 ? (
        <div className="empty-state"><p>No organizers yet. Create one above.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizers.map(org => (
                <tr key={org._id}>
                  <td><strong>{org.organizerName || '—'}</strong></td>
                  <td>{org.email}</td>
                  <td>{org.category || '—'}</td>
                  <td>
                    <span className={`badge ${org.isActive !== false ? 'badge-active' : 'badge-inactive'}`}>
                      {org.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {org.isActive !== false ? (
                      <button onClick={() => handleDeactivate(org._id)} className="btn btn-sm btn-warning">Deactivate</button>
                    ) : (
                      <button onClick={() => handleReactivate(org._id)} className="btn btn-sm btn-primary">Reactivate</button>
                    )}
                    <button onClick={() => handleDelete(org._id)} className="btn btn-sm btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageOrganizers;
