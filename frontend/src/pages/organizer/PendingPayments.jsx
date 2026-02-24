import { useState, useEffect } from 'react';
import { organizerAPI } from '../../services/api';

const PendingPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await organizerAPI.getPendingPayments();
      setPayments(res.data.payments || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleApprove = async (regId) => {
    try {
      await organizerAPI.approvePayment(regId);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (regId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await organizerAPI.rejectPayment(regId, { reason });
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <h2>Pending Payments</h2>

      {payments.length === 0 ? (
        <div className="empty-state">
          <p>No pending payment verifications.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {payments.map(reg => (
            <div key={reg._id} className="card">
              <h3>{reg.event?.eventName || 'Event'}</h3>
              <p><strong>Participant:</strong> {reg.participant?.firstName} {reg.participant?.lastName}</p>
              <p><strong>Email:</strong> {reg.participant?.email}</p>
              <p><strong>Amount:</strong> ₹{reg.paymentAmount || 0}</p>
              <p><strong>Ticket ID:</strong> {reg.ticketId}</p>

              {reg.paymentProof && (
                <div style={{ margin: '0.5rem 0' }}>
                  <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${reg.paymentProof}`}
                    target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                    View Payment Proof
                  </a>
                </div>
              )}

              <div className="action-buttons" style={{ marginTop: '1rem' }}>
                <button onClick={() => handleApprove(reg._id)} className="btn btn-primary">✅ Approve</button>
                <button onClick={() => handleReject(reg._id)} className="btn btn-danger">❌ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingPayments;
