import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await participantAPI.getDashboard();
        setData(res.data);
      } catch (err) {
        console.error('dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="error">Failed to load dashboard</div>;

  return (
    <div className="page-container">
      <h2>Welcome, {user?.firstName}!</h2>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <h3>{data.totalRegistrations}</h3>
          <p>Total Registrations</p>
        </div>
        <div className="stat-card">
          <h3>{data.upcomingEvents?.length || 0}</h3>
          <p>Upcoming Events</p>
        </div>
        <div className="stat-card">
          <h3>{data.followedClubs?.length || 0}</h3>
          <p>Followed Clubs</p>
        </div>
      </div>

      {/* Trending Events */}
      {data.trendingEvents?.length > 0 && (
        <section className="dashboard-section">
          <h3>🔥 Trending Events</h3>
          <div className="events-grid">
            {data.trendingEvents.map(event => (
              <Link to={`/participant/events/${event._id}`} key={event._id} className="event-card">
                <h4>{event.eventName}</h4>
                <span className="badge badge-type">{event.eventType}</span>
                <p className="event-date">
                  {new Date(event.eventStartDate).toLocaleDateString()}
                </p>
                <p className="event-organizer">{event.organizer?.organizerName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommended */}
      {data.recommendedEvents?.length > 0 && (
        <section className="dashboard-section">
          <h3>✨ Recommended for You</h3>
          <div className="events-grid">
            {data.recommendedEvents.map(event => (
              <Link to={`/participant/events/${event._id}`} key={event._id} className="event-card">
                <h4>{event.eventName}</h4>
                <span className="badge badge-type">{event.eventType}</span>
                <p className="event-date">
                  {new Date(event.eventStartDate).toLocaleDateString()}
                </p>
                <p className="event-organizer">{event.organizer?.organizerName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Registrations */}
      {data.upcomingEvents?.length > 0 && (
        <section className="dashboard-section">
          <h3>📅 Your Upcoming Events</h3>
          <div className="events-grid">
            {data.upcomingEvents.map(({ event, registration }) => (
              <Link to={`/participant/events/${event._id}`} key={registration._id} className="event-card">
                <h4>{event.eventName}</h4>
                <span className={`badge badge-status-${registration.status}`}>
                  {registration.status}
                </span>
                <p className="event-date">
                  {new Date(event.eventStartDate).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Links */}
      <section className="dashboard-section">
        <h3>Quick Links</h3>
        <div className="quick-links">
          <Link to="/participant/events" className="btn btn-primary">Browse Events</Link>
          <Link to="/participant/registrations" className="btn btn-secondary">My Registrations</Link>
          <Link to="/participant/clubs" className="btn btn-secondary">Explore Clubs</Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
