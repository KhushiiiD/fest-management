import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await adminAPI.getDashboard();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <h2>Admin Dashboard</h2>

      <div className="stats-row">
        <div className="stat-card"><h3>{stats?.totalUsers || 0}</h3><p>Total Users</p></div>
        <div className="stat-card"><h3>{stats?.totalParticipants || 0}</h3><p>Participants</p></div>
        <div className="stat-card"><h3>{stats?.totalOrganizers || 0}</h3><p>Organizers</p></div>
        <div className="stat-card"><h3>{stats?.totalEvents || 0}</h3><p>Events</p></div>
        <div className="stat-card"><h3>{stats?.totalRegistrations || 0}</h3><p>Registrations</p></div>
        <div className="stat-card"><h3>{stats?.pendingPasswordResets || 0}</h3><p>Pending Resets</p></div>
      </div>

      <div className="quick-links">
        <Link to="/admin/organizers" className="btn btn-primary">Manage Organizers</Link>
        <Link to="/admin/password-resets" className="btn btn-secondary">Password Reset Requests</Link>
      </div>

      {/* Recent Events */}
      {stats?.recentEvents && stats.recentEvents.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Recent Events</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Organizer</th><th>Type</th><th>Status</th><th>Registrations</th></tr>
              </thead>
              <tbody>
                {stats.recentEvents.map(e => (
                  <tr key={e._id}>
                    <td>{e.eventName}</td>
                    <td>{e.organizer?.organizerName || '—'}</td>
                    <td>{e.eventType}</td>
                    <td><span className={`badge badge-status-${e.status}`}>{e.status}</span></td>
                    <td>{e.registrationCount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
