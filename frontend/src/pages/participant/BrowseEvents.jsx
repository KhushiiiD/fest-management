import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../../services/api';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ eventType: '', eligibility: '' });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = { search };
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.eligibility) params.eligibility = filters.eligibility;
      const res = await eventAPI.browse(params);
      setEvents(res.data.events || []);
      setTrending(res.data.trending || []);
    } catch (err) {
      console.error('browse error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="page-container">
      <h2>Browse Events</h2>

      {/* Search & Filter */}
      <div className="search-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" placeholder="Search events, clubs, tags..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        <div className="filters">
          <select value={filters.eventType}
            onChange={e => setFilters({ ...filters, eventType: e.target.value })}>
            <option value="">All Types</option>
            <option value="normal">Normal</option>
            <option value="merchandise">Merchandise</option>
            <option value="hackathon">Hackathon</option>
          </select>
          <select value={filters.eligibility}
            onChange={e => setFilters({ ...filters, eligibility: e.target.value })}>
            <option value="">All Eligibility</option>
            <option value="all">Open to All</option>
            <option value="iiit-only">IIIT Only</option>
            <option value="non-iiit-only">Non-IIIT Only</option>
          </select>
        </div>
      </div>

      {/* Trending Section — only show when no active search or filters */}
      {trending.length > 0 && !search && !filters.eventType && !filters.eligibility && (
        <section className="dashboard-section">
          <h3>🔥 Trending</h3>
          <div className="events-scroll">
            {trending.map(event => (
              <Link to={`/participant/events/${event._id}`} key={event._id} className="event-card event-card-sm">
                <h4>{event.eventName}</h4>
                <span className="badge badge-type">{event.eventType}</span>
                <p className="event-organizer">{event.organizer?.organizerName}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Events List */}
      {loading ? (
        <div className="loading">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <p>No events found. Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <Link to={`/participant/events/${event._id}`} key={event._id} className="event-card">
              <div className="event-card-header">
                <h4>{event.eventName}</h4>
                <span className="badge badge-type">{event.eventType}</span>
              </div>
              <p className="event-desc">{event.eventDescription?.substring(0, 100)}...</p>
              <div className="event-card-meta">
                <span>📅 {new Date(event.eventStartDate).toLocaleDateString()}</span>
                {event.venue && <span>📍 {event.venue}</span>}
                <span>🏷️ {event.eligibility}</span>
                {event.registrationFee > 0 && <span>💰 ₹{event.registrationFee}</span>}
              </div>
              <p className="event-organizer">By {event.organizer?.organizerName}</p>
              {event.eventTags?.length > 0 && (
                <div className="tags">
                  {event.eventTags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;
