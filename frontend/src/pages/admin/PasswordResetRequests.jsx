import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await adminAPI.getPasswordResetRequests();
      setRequests(res.data.requests || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleApprove = async (id) => {
    try {
      const res = await adminAPI.approvePasswordReset(id);
      alert(`Approved! New password: ${res.data.newPassword || 'Sent via email'}`);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (id) => {
    const comment = prompt('Reason for rejection (optional):');
    try {
      await adminAPI.rejectPasswordReset(id, { adminComment: comment || '' });
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <h2>Password Reset Requests</h2>

      {requests.length === 0 ? (
        <div className="empty-state"><p>No password reset requests.</p></div>
      ) : (
        <div className="cards-grid">
          {requests.map(req => (
            <div key={req._id} className="card">
              <div className="card-header">
                <h3>{req.organizer?.organizerName || 'Organizer'}</h3>
                <span className={`badge badge-status-${req.status}`}>{req.status}</span>
              </div>
              <p><strong>Email:</strong> {req.organizer?.email}</p>
              <p><strong>Reason:</strong> {req.reason}</p>
              <p><strong>Requested:</strong> {new Date(req.createdAt).toLocaleString()}</p>

              {req.status === 'pending' && (
                <div className="action-buttons" style={{ marginTop: '1rem' }}>
                  <button onClick={() => handleApprove(req._id)} className="btn btn-primary">✅ Approve</button>
                  <button onClick={() => handleReject(req._id)} className="btn btn-danger">❌ Reject</button>
                </div>
              )}

              {req.status !== 'pending' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p><strong>Processed:</strong> {req.processedAt ? new Date(req.processedAt).toLocaleString() : '—'}</p>
                  {req.adminComment && <p><strong>Comment:</strong> {req.adminComment}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequests;
