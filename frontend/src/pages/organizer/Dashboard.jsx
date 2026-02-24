import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await organizerAPI.getDashboard();
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
      <h2>Organizer Dashboard</h2>
      <p className="subtitle">Welcome, {data.organizer?.organizerName || data.organizer?.firstName}</p>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card"><h3>{data.stats?.totalEvents || 0}</h3><p>Total Events</p></div>
        <div className="stat-card"><h3>{data.stats?.ongoingEvents || 0}</h3><p>Ongoing</p></div>
        <div className="stat-card"><h3>{data.stats?.upcomingEvents || 0}</h3><p>Upcoming</p></div>
        <div className="stat-card"><h3>{data.stats?.totalRegistrations || 0}</h3><p>Registrations</p></div>
        <div className="stat-card highlight"><h3>{data.stats?.pendingPayments || 0}</h3><p>Pending Payments</p></div>
      </div>

      {/* Quick Actions */}
      <div className="quick-links">
        <Link to="/organizer/create-event" className="btn btn-primary">+ Create Event</Link>
        <Link to="/organizer/pending-payments" className="btn btn-secondary">Review Payments</Link>
      </div>

      {/* Ongoing Events */}
      {data.events?.ongoing?.length > 0 && (
        <section className="dashboard-section">
          <h3>🟢 Ongoing Events</h3>
          <div className="events-grid">
            {data.events.ongoing.map(event => (
              <div key={event._id} className="event-card">
                <Link to={`/organizer/events/${event._id}`}>
                  <h4>{event.eventName}</h4>
                  <span className="badge badge-type">{event.eventType}</span>
                  <p>{new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}</p>
                </Link>
                <Link to={`/organizer/attendance/${event._id}`} className="btn btn-sm btn-primary">
                  📱 Scan Attendance
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {data.events?.upcoming?.length > 0 && (
        <section className="dashboard-section">
          <h3>📅 Upcoming Events</h3>
          <div className="events-grid">
            {data.events.upcoming.map(event => (
              <Link to={`/organizer/events/${event._id}`} key={event._id} className="event-card">
                <h4>{event.eventName}</h4>
                <span className="badge badge-type">{event.eventType}</span>
                <span className={`badge badge-status-${event.status}`}>{event.status}</span>
                <p>{new Date(event.eventStartDate).toLocaleDateString()}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Draft Events */}
      {data.events?.draft?.length > 0 && (
        <section className="dashboard-section">
          <h3>📝 Draft Events</h3>
          <div className="events-grid">
            {data.events.draft.map(event => (
              <Link to={`/organizer/events/${event._id}`} key={event._id} className="event-card">
                <h4>{event.eventName}</h4>
                <span className="badge badge-draft">Draft</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
