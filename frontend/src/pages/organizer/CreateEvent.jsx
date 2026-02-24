import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { organizerAPI } from '../../services/api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    eventName: '', eventDescription: '', eventType: 'normal', eligibility: 'all',
    eventStartDate: '', eventEndDate: '', registrationStartDate: '', registrationEndDate: '',
    venue: '', registrationLimit: '', registrationFee: 0, eventTags: ''
  });
  const [customFields, setCustomFields] = useState([]);
  const [merchItems, setMerchItems] = useState([]);
  const [hackathonDetails, setHackathonDetails] = useState({
    minTeamSize: 2, maxTeamSize: 4, prizePool: '', theme: '', problemStatements: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Custom form field management
  const addCustomField = () => {
    setCustomFields([...customFields, {
      fieldName: '', fieldType: 'text', isRequired: false, options: '', order: customFields.length
    }]);
  };

  const updateCustomField = (index, field, value) => {
    setCustomFields(customFields.map((f, i) => i === index ? { ...f, [field]: value } : f));
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Merchandise items management
  const addMerchItem = () => {
    setMerchItems([...merchItems, { itemName: '', price: 0, sizes: '', availableStock: '' }]);
  };

  const updateMerchItem = (index, field, value) => {
    setMerchItems(merchItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeMerchItem = (index) => {
    setMerchItems(merchItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        ...formData,
        registrationLimit: formData.registrationLimit ? parseInt(formData.registrationLimit) : undefined,
        registrationFee: parseFloat(formData.registrationFee) || 0,
        eventTags: formData.eventTags ? formData.eventTags.split(',').map(t => t.trim()).filter(Boolean) : [],
        customFormFields: customFields
          .filter(f => f.fieldName && f.fieldName.trim() !== '')
          .map(f => ({
          ...f,
          options: f.options ? f.options.split(',').map(o => o.trim()).filter(Boolean) : []
        }))
      };

      if (formData.eventType === 'merchandise') {
        data.merchandiseDetails = merchItems.map(item => ({
          ...item,
          price: parseFloat(item.price) || 0,
          sizes: item.sizes ? item.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
          availableStock: item.availableStock ? parseInt(item.availableStock) : undefined
        }));
      }

      if (formData.eventType === 'hackathon') {
        data.hackathonDetails = {
          minTeamSize: parseInt(hackathonDetails.minTeamSize) || 2,
          maxTeamSize: parseInt(hackathonDetails.maxTeamSize) || 4,
          prizePool: parseFloat(hackathonDetails.prizePool) || 0,
          theme: hackathonDetails.theme || '',
          problemStatements: hackathonDetails.problemStatements
            ? hackathonDetails.problemStatements.split('\n').filter(Boolean)
            : []
        };
      }

      await organizerAPI.createEvent(data);
      navigate('/organizer/events');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2>Create Event</h2>
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="create-event-form">
        {/* Basic Info*/}
        <div className="card">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Event Name *</label>
            <input type="text" name="eventName" value={formData.eventName}
              onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea name="eventDescription" value={formData.eventDescription}
              onChange={handleChange} required rows={4} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Event Type *</label>
              <select name="eventType" value={formData.eventType} onChange={handleChange}>
                <option value="normal">Normal</option>
                <option value="merchandise">Merchandise</option>
                <option value="hackathon">Hackathon</option>
              </select>
            </div>
            <div className="form-group">
              <label>Eligibility</label>
              <select name="eligibility" value={formData.eligibility} onChange={handleChange}>
                <option value="all">Open to All</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="card">
          <h3>Dates & Venue</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Event Start</label>
              <input type="datetime-local" name="eventStartDate" value={formData.eventStartDate}
                onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Event End</label>
              <input type="datetime-local" name="eventEndDate" value={formData.eventEndDate}
                onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Registration Start</label>
              <input type="datetime-local" name="registrationStartDate" value={formData.registrationStartDate}
                onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Registration End</label>
              <input type="datetime-local" name="registrationEndDate" value={formData.registrationEndDate}
                onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Venue</label>
              <input type="text" name="venue" value={formData.venue} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Registration Limit</label>
              <input type="number" name="registrationLimit" value={formData.registrationLimit}
                onChange={handleChange} min={1} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Registration Fee (₹)</label>
              <input type="number" name="registrationFee" value={formData.registrationFee}
                onChange={handleChange} min={0} step={0.01} />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input type="text" name="eventTags" value={formData.eventTags}
                onChange={handleChange} placeholder="tech, coding, hackathon" />
            </div>
          </div>
        </div>

        {/* Custom Form Builder */}
        <div className="card">
          <h3>Custom Registration Form Fields</h3>
          <p className="text-muted">Add custom fields that participants must fill during registration.</p>
          {customFields.map((field, index) => (
            <div key={index} className="custom-field-row">
              <input type="text" placeholder="Field Name"
                value={field.fieldName}
                onChange={e => updateCustomField(index, 'fieldName', e.target.value)} />
              <select value={field.fieldType}
                onChange={e => updateCustomField(index, 'fieldType', e.target.value)}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="textarea">Textarea</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>
              {field.fieldType === 'select' && (
                <input type="text" placeholder="Options (comma-separated)"
                  value={field.options}
                  onChange={e => updateCustomField(index, 'options', e.target.value)} />
              )}
              <label className="checkbox-label">
                <input type="checkbox" checked={field.isRequired}
                  onChange={e => updateCustomField(index, 'isRequired', e.target.checked)} />
                Required
              </label>
              <button type="button" onClick={() => removeCustomField(index)}
                className="btn btn-sm btn-danger">×</button>
            </div>
          ))}
          <button type="button" onClick={addCustomField} className="btn btn-sm btn-secondary">
            + Add Field
          </button>
        </div>

        {/* Merchandise Details */}
        {formData.eventType === 'merchandise' && (
          <div className="card">
            <h3>Merchandise Items</h3>
            {merchItems.map((item, index) => (
              <div key={index} className="merch-field-row">
                <input type="text" placeholder="Item Name" value={item.itemName}
                  onChange={e => updateMerchItem(index, 'itemName', e.target.value)} />
                <input type="number" placeholder="Price" value={item.price}
                  onChange={e => updateMerchItem(index, 'price', e.target.value)} min={0} />
                <input type="text" placeholder="Sizes (comma-separated)" value={item.sizes}
                  onChange={e => updateMerchItem(index, 'sizes', e.target.value)} />
                <input type="number" placeholder="Stock" value={item.availableStock}
                  onChange={e => updateMerchItem(index, 'availableStock', e.target.value)} />
                <button type="button" onClick={() => removeMerchItem(index)}
                  className="btn btn-sm btn-danger">×</button>
              </div>
            ))}
            <button type="button" onClick={addMerchItem} className="btn btn-sm btn-secondary">
              + Add Item
            </button>
          </div>
        )}

        {/* Hackathon Details */}
        {formData.eventType === 'hackathon' && (
          <div className="card">
            <h3>Hackathon Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Min Team Size</label>
                <input type="number" value={hackathonDetails.minTeamSize}
                  onChange={e => setHackathonDetails({ ...hackathonDetails, minTeamSize: e.target.value })}
                  min={1} />
              </div>
              <div className="form-group">
                <label>Max Team Size</label>
                <input type="number" value={hackathonDetails.maxTeamSize}
                  onChange={e => setHackathonDetails({ ...hackathonDetails, maxTeamSize: e.target.value })}
                  min={1} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Theme</label>
                <input type="text" placeholder="e.g. AI for Social Good"
                  value={hackathonDetails.theme}
                  onChange={e => setHackathonDetails({ ...hackathonDetails, theme: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Prize Pool (₹)</label>
                <input type="number" placeholder="e.g. 50000"
                  value={hackathonDetails.prizePool}
                  onChange={e => setHackathonDetails({ ...hackathonDetails, prizePool: e.target.value })} min={0} />
              </div>
            </div>
            <div className="form-group">
              <label>Problem Statements (one per line)</label>
              <textarea value={hackathonDetails.problemStatements}
                onChange={e => setHackathonDetails({ ...hackathonDetails, problemStatements: e.target.value })}
                rows={4} />
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? 'Creating...' : 'Create Event (Draft)'}
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
