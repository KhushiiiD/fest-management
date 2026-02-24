import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI } from '../../services/api';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await registrationAPI.getMyRegistrations();
      setRegistrations(res.data.registrations || []);
    } catch (err) {
      console.error('fetch registrations error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    try {
      await registrationAPI.cancel(regId);
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  const handlePaymentUpload = async (regId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(regId);
    try {
      const formData = new FormData();
      formData.append('paymentProof', file);
      await registrationAPI.uploadPaymentProof(regId, formData);
      fetchRegistrations();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="loading">Loading registrations...</div>;

  return (
    <div className="page-container">
      <h2>My Registrations</h2>

      {registrations.length === 0 ? (
        <div className="empty-state">
          <p>You haven't registered for any events yet.</p>
          <Link to="/participant/events" className="btn btn-primary">Browse Events</Link>
        </div>
      ) : (
        <div className="registrations-list">
          {registrations.map(reg => (
            <div key={reg._id} className={`registration-card status-${reg.status}`}>
              <div className="reg-header">
                <h4>
                  <Link to={`/participant/events/${reg.event?._id}`}>
                    {reg.event?.eventName || 'Event'}
                  </Link>
                </h4>
                <span className={`badge badge-status-${reg.status}`}>{reg.status}</span>
              </div>

              <div className="reg-details">
                <span>📅 {reg.event?.eventStartDate
                  ? new Date(reg.event.eventStartDate).toLocaleDateString() : 'N/A'}</span>
                <span>🎫 Ticket: {reg.ticketId?.substring(0, 8)}...</span>
                <span>📋 Type: {reg.event?.eventType}</span>
              </div>

              {/* Payment status */}
              {reg.paymentStatus && reg.paymentStatus !== 'not_required' && (
                <div className="reg-payment">
                  <span className={`badge badge-payment-${reg.paymentVerificationStatus}`}>
                    Payment: {reg.paymentVerificationStatus || reg.paymentStatus}
                  </span>
                  {reg.paymentAmount && <span>Amount: ₹{reg.paymentAmount}</span>}

                  {/* Upload payment proof */}
                  {reg.paymentStatus === 'pending' && !reg.paymentProof && (
                    <div className="upload-section">
                      <label className="btn btn-sm btn-primary">
                        {uploading === reg._id ? 'Uploading...' : '📤 Upload Payment Proof'}
                        <input type="file" accept="image/*,.pdf"
                          onChange={e => handlePaymentUpload(reg._id, e)}
                          style={{ display: 'none' }} />
                      </label>
                    </div>
                  )}
                  {reg.paymentProof && (
                    <span className="text-success">✅ Proof uploaded</span>
                  )}
                </div>
              )}

              {/* Merchandise details */}
              {reg.merchandiseDetails?.length > 0 && (
                <div className="merch-details">
                  <strong>Items:</strong>
                  {reg.merchandiseDetails.map((item, i) => (
                    <span key={i}>{item.itemName} ({item.size}) x{item.quantity} - ₹{item.price * item.quantity}</span>
                  ))}
                </div>
              )}

              {/* QR Code */}
              {reg.qrCode && reg.status !== 'cancelled' && (
                <details className="qr-details">
                  <summary>Show QR Code</summary>
                  <img src={reg.qrCode} alt="QR Code" className="qr-image-sm" />
                </details>
              )}

              {/* Actions */}
              <div className="reg-actions">
                {reg.status !== 'cancelled' && !reg.attendanceMarked && (
                  <button onClick={() => handleCancel(reg._id)} className="btn btn-sm btn-danger">
                    Cancel
                  </button>
                )}
                {reg.status !== 'cancelled' && (
                  <Link to={`/participant/forum/${reg.event?._id}`} className="btn btn-sm btn-secondary">
                    💬 Forum
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
