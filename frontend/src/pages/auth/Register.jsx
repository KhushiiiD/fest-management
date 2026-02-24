import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    participantType: 'iiit', collegeName: '', contactNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const { confirmPassword, ...data } = formData;
      await register(data);
      navigate('/participant/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register as Participant</h2>
        <p className="auth-subtitle">Join the fest!</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" value={formData.firstName}
                onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" value={formData.lastName}
                onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Participant Type *</label>
            <select name="participantType" value={formData.participantType} onChange={handleChange}>
              <option value="iiit">IIIT Student</option>
              <option value="non-iiit">Non-IIIT Student</option>
            </select>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" value={formData.email}
              onChange={handleChange} required
              placeholder={formData.participantType === 'iiit' ? 'yourname@iiit.ac.in' : 'your@email.com'} />
            {formData.participantType === 'iiit' && (
              <small className="form-hint">Must be an IIIT email address</small>
            )}
          </div>

          {formData.participantType === 'non-iiit' && (
            <div className="form-group">
              <label>College Name *</label>
              <input type="text" name="collegeName" value={formData.collegeName}
                onChange={handleChange} required />
            </div>
          )}

          <div className="form-group">
            <label>Contact Number</label>
            <input type="tel" name="contactNumber" value={formData.contactNumber}
              onChange={handleChange} placeholder="Optional" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <input type="password" name="password" value={formData.password}
                onChange={handleChange} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
