import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await organizerAPI.getMyEvents();
      setEvents(res.data.events || []);
    } catch (err) {
      console.error('fetch events error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handlePublish = async (eventId) => {
    if (!window.confirm('Publish this event? Form fields will be locked.')) return;
    try {
      await organizerAPI.publishEvent(eventId);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish');
    }
  };

  const handleStatusChange = async (eventId, status) => {
    try {
      await organizerAPI.updateEventStatus(eventId, { status });
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleExportCSV = async (eventId, eventName) => {
    try {
      const res = await organizerAPI.exportParticipantsCSV(eventId);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventName}-participants.csv`;
      a.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  if (loading) return <div className="loading">Loading events...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>My Events</h2>
        <Link to="/organizer/create-event" className="btn btn-primary">+ Create Event</Link>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className="events-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Registrations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id}>
                  <td>
                    <Link to={`/organizer/events/${event._id}`}>{event.eventName}</Link>
                  </td>
                  <td><span className="badge badge-type">{event.eventType}</span></td>
                  <td><span className={`badge badge-status-${event.status}`}>{event.status}</span></td>
                  <td>{event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{event.registrationCount || '—'}</td>
                  <td className="action-buttons">
                    {event.status === 'draft' && (
                      <button onClick={() => handlePublish(event._id)}
                        className="btn btn-sm btn-primary">Publish</button>
                    )}
                    {event.status === 'published' && (
                      <button onClick={() => handleStatusChange(event._id, 'ongoing')}
                        className="btn btn-sm btn-secondary">Start Event</button>
                    )}
                    {event.status === 'ongoing' && (
                      <>
                        <button onClick={() => handleStatusChange(event._id, 'completed')}
                          className="btn btn-sm btn-secondary">Complete</button>
                        <Link to={`/organizer/attendance/${event._id}`}
                          className="btn btn-sm btn-primary">📱 Attendance</Link>
                      </>
                    )}
                    <button onClick={() => handleExportCSV(event._id, event.eventName)}
                      className="btn btn-sm btn-secondary">📥 CSV</button>
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

export default ManageEvents;
