import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';

const Clubs = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const res = await participantAPI.getAllClubs({ search });
      setClubs(res.data.clubs || []);
    } catch (err) {
      console.error('fetch clubs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClubs(); }, []);

  const handleFollow = async (clubId) => {
    try {
      await participantAPI.followClub(clubId);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleUnfollow = async (clubId) => {
    try {
      await participantAPI.unfollowClub(clubId);
      fetchClubs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="page-container">
      <h2>Clubs & Organizations</h2>

      <div className="search-bar">
        <form onSubmit={e => { e.preventDefault(); fetchClubs(); }} className="search-form">
          <input type="text" placeholder="Search clubs..." value={search}
            onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading clubs...</div>
      ) : clubs.length === 0 ? (
        <div className="empty-state"><p>No clubs found.</p></div>
      ) : (
        <div className="clubs-grid">
          {clubs.map(club => (
            <div key={club._id} className="club-card" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/participant/clubs/${club._id}`)}>
              <h3>{club.organizerName}</h3>
              <span className="badge">{club.category}</span>
              {club.description && <p>{club.description}</p>}
              <p className="text-muted">{club.eventCount} events</p>
              {club.contactEmail && <p>📧 {club.contactEmail}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={(e) => { e.stopPropagation(); club.isFollowing ? handleUnfollow(club._id) : handleFollow(club._id); }}
                  className={`btn btn-sm ${club.isFollowing ? 'btn-danger' : 'btn-primary'}`}>
                  {club.isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate(`/participant/clubs/${club._id}`); }}
                  className="btn btn-sm btn-secondary">View Details</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clubs;
