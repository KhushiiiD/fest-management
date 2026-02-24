import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI } from '../../services/api';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [formResponses, setFormResponses] = useState({});
  const [merchItems, setMerchItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await eventAPI.getDetails(eventId);
        setEvent(res.data.event);
        setHasRegistered(res.data.hasRegistered);
        setRegistration(res.data.registration);
      } catch (err) {
        console.error('fetch event error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleFormChange = (fieldName, value) => {
    setFormResponses(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleMerchAdd = (item) => {
    const existing = merchItems.find(m => m.itemName === item.itemName);
    if (existing) {
      setMerchItems(merchItems.map(m =>
        m.itemName === item.itemName ? { ...m, quantity: m.quantity + 1 } : m
      ));
    } else {
      setMerchItems([...merchItems, { itemName: item.itemName, size: item.sizes?.[0] || '', quantity: 1 }]);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError('');
    setSuccess('');
    try {
      if (event.eventType === 'merchandise') {
        if (merchItems.length === 0) {
          setError('Please select at least one item');
          return;
        }
        await registrationAPI.purchaseMerchandise(eventId, {
          selectedItems: merchItems,
          formResponses
        });
      } else {
        await registrationAPI.registerForEvent(eventId, { formResponses });
      }
      setSuccess('Registration successful!');
      // refresh
      const res = await eventAPI.getDetails(eventId);
      setHasRegistered(res.data.hasRegistered);
      setRegistration(res.data.registration);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCalendarExport = async (format) => {
    try {
      if (format === 'ics') {
        const res = await eventAPI.exportCalendar(eventId, 'ics');
        const blob = new Blob([res.data], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.eventName}.ics`;
        a.click();
      } else {
        const res = await eventAPI.exportCalendar(eventId, format);
        window.open(res.data.url, '_blank');
      }
    } catch (err) {
      setError('Failed to export calendar');
    }
  };

  if (loading) return <div className="loading">Loading event details...</div>;
  if (!event) return <div className="error">Event not found</div>;

  return (
    <div className="page-container">
      <button onClick={() => navigate(-1)} className="btn btn-back">← Back</button>

      <div className="event-details">
        <div className="event-header">
          <h2>{event.eventName}</h2>
          <div className="badges">
            <span className="badge badge-type">{event.eventType}</span>
            <span className="badge badge-status">{event.status}</span>
            <span className="badge">{event.eligibility}</span>
          </div>
        </div>

        <div className="event-info-grid">
          <div className="info-item">
            <strong>📅 Start:</strong> {new Date(event.eventStartDate).toLocaleString()}
          </div>
          <div className="info-item">
            <strong>📅 End:</strong> {new Date(event.eventEndDate).toLocaleString()}
          </div>
          {event.venue && (
            <div className="info-item"><strong>📍 Venue:</strong> {event.venue}</div>
          )}
          {event.registrationFee > 0 && (
            <div className="info-item"><strong>💰 Fee:</strong> ₹{event.registrationFee}</div>
          )}
          {event.registrationLimit && (
            <div className="info-item"><strong>👥 Limit:</strong> {event.registrationLimit}</div>
          )}
          <div className="info-item">
            <strong>🏢 Organizer:</strong> {event.organizer?.organizerName}
          </div>
          {event.registrationEndDate && (
            <div className="info-item">
              <strong>⏰ Reg. Deadline:</strong> {new Date(event.registrationEndDate).toLocaleString()}
            </div>
          )}
        </div>

        <div className="event-description">
          <h3>Description</h3>
          <p>{event.eventDescription}</p>
        </div>

        {event.eventTags?.length > 0 && (
          <div className="tags">
            {event.eventTags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
          </div>
        )}

        {/* Merchandise items */}
        {event.eventType === 'merchandise' && event.merchandiseDetails?.length > 0 && (
          <div className="merchandise-section">
            <h3>Merchandise Items</h3>
            <div className="merch-grid">
              {event.merchandiseDetails.map((item, i) => (
                <div key={i} className="merch-card">
                  <h4>{item.itemName}</h4>
                  <p>₹{item.price}</p>
                  {item.sizes?.length > 0 && <p>Sizes: {item.sizes.join(', ')}</p>}
                  {item.availableStock !== undefined && <p>Stock: {item.availableStock}</p>}
                  {!hasRegistered && (
                    <button onClick={() => handleMerchAdd(item)} className="btn btn-sm btn-primary">
                      Add to Cart
                    </button>
                  )}
                </div>
              ))}
            </div>
            {merchItems.length > 0 && (
              <div className="merch-cart">
                <h4>Your Selection:</h4>
                {merchItems.map((m, i) => (
                  <div key={i} className="cart-item">
                    <span>{m.itemName} x{m.quantity}</span>
                    <input type="text" placeholder="Size" value={m.size}
                      onChange={e => setMerchItems(merchItems.map((item, idx) =>
                        idx === i ? { ...item, size: e.target.value } : item
                      ))} />
                    <button onClick={() => setMerchItems(merchItems.filter((_, idx) => idx !== i))}
                      className="btn btn-sm btn-danger">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hackathon details */}
        {event.eventType === 'hackathon' && event.hackathonDetails && (
          <div className="hackathon-section">
            <h3>Hackathon Details</h3>
            <p>Team Size: {event.hackathonDetails.minTeamSize} - {event.hackathonDetails.maxTeamSize} members</p>
            {event.hackathonDetails.problemStatements?.length > 0 && (
              <div>
                <h4>Problem Statements:</h4>
                <ul>
                  {event.hackathonDetails.problemStatements.map((ps, i) => (
                    <li key={i}>{ps}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Custom form fields */}
        {!hasRegistered && event.customFormFields?.length > 0 && (
          <div className="custom-form">
            <h3>Registration Form</h3>
            {event.customFormFields
              .sort((a, b) => a.order - b.order)
              .map((field, i) => (
                <div key={i} className="form-group">
                  <label>{field.fieldName} {field.isRequired && '*'}</label>
                  {field.fieldType === 'text' && (
                    <input type="text" value={formResponses[field.fieldName] || ''}
                      onChange={e => handleFormChange(field.fieldName, e.target.value)}
                      required={field.isRequired} />
                  )}
                  {field.fieldType === 'number' && (
                    <input type="number" value={formResponses[field.fieldName] || ''}
                      onChange={e => handleFormChange(field.fieldName, e.target.value)}
                      required={field.isRequired} />
                  )}
                  {field.fieldType === 'email' && (
                    <input type="email" value={formResponses[field.fieldName] || ''}
                      onChange={e => handleFormChange(field.fieldName, e.target.value)}
                      required={field.isRequired} />
                  )}
                  {field.fieldType === 'textarea' && (
                    <textarea value={formResponses[field.fieldName] || ''}
                      onChange={e => handleFormChange(field.fieldName, e.target.value)}
                      required={field.isRequired} />
                  )}
                  {field.fieldType === 'select' && (
                    <select value={formResponses[field.fieldName] || ''}
                      onChange={e => handleFormChange(field.fieldName, e.target.value)}
                      required={field.isRequired}>
                      <option value="">Select...</option>
                      {field.options?.map((opt, j) => (
                        <option key={j} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {field.fieldType === 'checkbox' && (
                    <label className="checkbox-label">
                      <input type="checkbox" checked={formResponses[field.fieldName] === 'true'}
                        onChange={e => handleFormChange(field.fieldName, e.target.checked ? 'true' : 'false')} />
                      {field.fieldName}
                    </label>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Error / Success */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Actions */}
        <div className="event-actions">
          {hasRegistered ? (
            <div>
              <div className="alert alert-success">
                ✅ You are registered! Status: {registration?.status}
                {registration?.paymentStatus === 'pending' && ' — Payment pending'}
              </div>

              {/* QR Code */}
              {registration?.qrCode && (
                <div className="qr-section">
                  <h4>Your QR Code</h4>
                  <img src={registration.qrCode} alt="Registration QR" className="qr-image" />
                </div>
              )}

              {/* Calendar export */}
              <div className="calendar-actions">
                <h4>Add to Calendar</h4>
                <button onClick={() => handleCalendarExport('ics')} className="btn btn-sm btn-secondary">
                  📥 Download .ics
                </button>
                <button onClick={() => handleCalendarExport('google')} className="btn btn-sm btn-secondary">
                  📅 Google Calendar
                </button>
                <button onClick={() => handleCalendarExport('outlook')} className="btn btn-sm btn-secondary">
                  📅 Outlook
                </button>
              </div>

              {/* Forum link */}
              <button onClick={() => navigate(`/participant/forum/${eventId}`)}
                className="btn btn-primary">
                💬 Event Forum
              </button>
            </div>
          ) : (
            <button onClick={handleRegister} className="btn btn-primary btn-lg"
              disabled={registering}>
              {registering ? 'Registering...' : event.eventType === 'hackathon'
                ? 'Create Team & Register'
                : event.eventType === 'merchandise'
                ? 'Purchase'
                : 'Register Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
