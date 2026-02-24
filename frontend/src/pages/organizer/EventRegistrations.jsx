import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

const EventRegistrations = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await organizerAPI.getEventWithParticipants(eventId);
      setEvent(res.data.event);
      setRegistrations(res.data.registrations || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error('fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [eventId]);

  const handleApprovePayment = async (regId) => {
    try {
      await organizerAPI.approvePayment(regId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleRejectPayment = async (regId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    try {
      await organizerAPI.rejectPayment(regId, { reason });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!event) return <div className="error">Event not found</div>;

  return (
    <div className="page-container">
      <h2>{event.eventName} - Registrations</h2>
      <div className="badges">
        <span className="badge badge-type">{event.eventType}</span>
        <span className={`badge badge-status-${event.status}`}>{event.status}</span>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><h3>{stats.total || 0}</h3><p>Total</p></div>
        <div className="stat-card"><h3>{stats.attended || 0}</h3><p>Attended</p></div>
        <div className="stat-card"><h3>{stats.paymentPending || 0}</h3><p>Payment Pending</p></div>
        <div className="stat-card"><h3>{stats.paymentApproved || 0}</h3><p>Payment Approved</p></div>
      </div>

      {/* Actions */}
      <div className="quick-links">
        <Link to={`/organizer/attendance/${eventId}`} className="btn btn-primary">📱 Attendance Scanner</Link>
      </div>

      {/* Registrations Table */}
      {registrations.length === 0 ? (
        <div className="empty-state"><p>No registrations yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg._id}>
                  <td>{reg.participant?.firstName} {reg.participant?.lastName}</td>
                  <td>{reg.participant?.email}</td>
                  <td>{reg.participant?.participantType}</td>
                  <td><span className={`badge badge-status-${reg.status}`}>{reg.status}</span></td>
                  <td>
                    <span className={`badge badge-payment-${reg.paymentVerificationStatus || reg.paymentStatus}`}>
                      {reg.paymentVerificationStatus || reg.paymentStatus}
                    </span>
                    {reg.paymentProof && (
                      <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${reg.paymentProof}`} target="_blank" rel="noopener noreferrer"
                        className="btn btn-sm">View Proof</a>
                    )}
                  </td>
                  <td>{reg.attendanceMarked ? '✅ Present' : '—'}</td>
                  <td className="action-buttons">
                    {reg.paymentVerificationStatus === 'pending' && reg.paymentProof && (
                      <>
                        <button onClick={() => handleApprovePayment(reg._id)}
                          className="btn btn-sm btn-primary">✅ Approve</button>
                        <button onClick={() => handleRejectPayment(reg._id)}
                          className="btn btn-sm btn-danger">❌ Reject</button>
                      </>
                    )}
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

export default EventRegistrations;
