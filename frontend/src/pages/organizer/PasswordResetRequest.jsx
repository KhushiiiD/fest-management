import { useState } from 'react';
import { organizerAPI } from '../../services/api';

const PasswordResetRequest = () => {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please provide a reason'); return; }
    setLoading(true);
    setError('');
    try {
      await organizerAPI.requestPasswordReset({ reason });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Request Submitted</h2>
          <p style={{ marginTop: '1rem' }}>Your password reset request has been sent to the admin. You will receive an email with your new password once approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Request Password Reset</h2>
      <p>Submit a request to the admin to reset your password. A new password will be emailed to you once approved.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label>Reason for Password Reset *</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            className="form-input" rows={4} placeholder="Explain why you need a password reset..."
            required />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default PasswordResetRequest;
