import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { participantAPI } from '../../services/api';

const ClubDetails = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClub = async () => {
    try {
      const res = await participantAPI.getClubDetails(clubId);
      setClub(res.data.club);
      setEvents(res.data.events || []);
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error('fetch club error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClub(); }, [clubId]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await participantAPI.unfollowClub(clubId);
      } else {
        await participantAPI.followClub(clubId);
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">Loading club details...</div>;
  if (!club) return <div className="empty-state"><p>Club not found.</p></div>;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
        ← Back
      </button>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2>{club.organizerName}</h2>
            <span className="badge">{club.category}</span>
            {club.description && <p style={{ marginTop: '0.75rem' }}>{club.description}</p>}
          </div>
          <button
            onClick={handleFollow}
            className={`btn ${isFollowing ? 'btn-danger' : 'btn-primary'}`}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        </div>
        {club.contactEmail && (
          <p style={{ marginTop: '0.75rem' }}>📧 <a href={`mailto:${club.contactEmail}`}>{club.contactEmail}</a></p>
        )}
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>Events by {club.organizerName}</h3>
      {events.length === 0 ? (
        <div className="empty-state"><p>No published events yet.</p></div>
      ) : (
        <div className="events-grid">
          {events.map(ev => (
            <Link key={ev._id} to={`/participant/events/${ev._id}`} className="event-card" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0 }}>{ev.eventName}</h4>
                <span className={`badge badge-status-${ev.status}`}>{ev.status}</span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0' }}>{ev.eventType}</p>
              {ev.description && <p style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>{ev.description.substring(0, 100)}{ev.description.length > 100 ? '...' : ''}</p>}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                📅 {new Date(ev.eventStartDate).toLocaleDateString()}
              </p>
              {ev.registrationFee > 0 ? (
                <p style={{ fontSize: '0.875rem' }}>💰 ₹{ev.registrationFee}</p>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Free</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubDetails;
