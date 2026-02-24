import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { participantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Onboarding = () => {
  const [clubs, setClubs] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedClubs, setSelectedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const interestOptions = [
    'Technology', 'Music', 'Dance', 'Art', 'Sports', 'Literature',
    'Photography', 'Gaming', 'Coding', 'Robotics', 'Debate', 'Drama',
    'Fashion', 'Food', 'Quiz', 'Entrepreneurship'
  ];

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await participantAPI.getAllClubs();
        setClubs(res.data.clubs || []);
      } catch (err) {
        console.error('failed to fetch clubs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const toggleInterest = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleClub = (clubId) => {
    setSelectedClubs(prev =>
      prev.includes(clubId)
        ? prev.filter(c => c !== clubId)
        : [...prev, clubId]
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await participantAPI.completeOnboarding({
        interests: selectedInterests,
        followedClubs: selectedClubs
      });
      await refreshUser();
      navigate('/participant/dashboard');
    } catch (err) {
      console.error('onboarding error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await participantAPI.completeOnboarding({ interests: [], followedClubs: [] });
      await refreshUser();
      navigate('/participant/dashboard');
    } catch (err) {
      console.error('skip error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page-container">
      <div className="onboarding-container">
        <h2>Welcome! Let's set up your preferences</h2>
        <p>This helps us recommend events you'll love.</p>

        <div className="onboarding-section">
          <h3>Select your interests</h3>
          <div className="interests-grid">
            {interestOptions.map(interest => (
              <button key={interest} type="button"
                className={`interest-chip ${selectedInterests.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggleInterest(interest)}>
                {interest}
              </button>
            ))}
          </div>
        </div>

        <div className="onboarding-section">
          <h3>Follow clubs / organizations</h3>
          {clubs.length === 0 ? (
            <p className="text-muted">No clubs available yet.</p>
          ) : (
            <div className="clubs-grid">
              {clubs.map(club => {
                const isFollowing = selectedClubs.includes(club._id);
                return (
                  <div key={club._id} className={`club-card ${isFollowing ? 'selected' : ''}`}>
                    <div className="club-card-info">
                      <h4>{club.organizerName}</h4>
                      <span className="badge">{club.category}</span>
                      {club.description && <p>{club.description}</p>}
                    </div>
                    <button
                      type="button"
                      className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleClub(club._id)}>
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <button onClick={handleSkip} className="btn btn-secondary" disabled={saving}>
            Skip for now
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
