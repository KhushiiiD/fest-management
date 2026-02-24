import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamAPI, eventAPI } from '../../services/api';

const MyTeams = () => {
  const [activeTeams, setActiveTeams] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState({ teamName: '', eventId: '' });
  const [hackathonEvents, setHackathonEvents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await teamAPI.getMyTeams();
      setActiveTeams(res.data.activeTeams || []);
      setPendingInvites(res.data.pendingInvites || []);
    } catch (err) {
      console.error('fetch teams error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        const res = await eventAPI.browse({ eventType: 'hackathon' });
        const openEvents = (res.data.events || []).filter(e =>
          e.status === 'published' || e.status === 'ongoing'
        );
        setHackathonEvents(openEvents);
      } catch (err) {
        console.error('fetch hackathon events error:', err);
      }
    };
    fetchHackathons();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createData.eventId || !createData.teamName.trim()) {
      setCreateError('Please fill in all fields');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await teamAPI.createTeam(createData);
      setSuccess(`Team "${res.data.team.teamName}" created! Invite code: ${res.data.team.inviteCode}`);
      setShowCreateForm(false);
      setCreateData({ teamName: '', eventId: '' });
      fetchTeams();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setError('');
    setSuccess('');
    try {
      const res = await teamAPI.joinByInviteCode({ inviteCode: joinCode });
      setSuccess(res.data.message);
      setJoinCode('');
      fetchTeams();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join');
    }
  };

  const handleRespond = async (teamId, response) => {
    try {
      await teamAPI.respondToInvite(teamId, { response });
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleLeave = async (teamId) => {
    if (!window.confirm('Leave this team?')) return;
    try {
      await teamAPI.leaveTeam(teamId);
      fetchTeams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div className="loading">Loading teams...</div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ margin: 0 }}>My Teams</h2>
        <button className="btn btn-primary" onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(''); }}>
          {showCreateForm ? 'Cancel' : '+ Create Team'}
        </button>
      </div>

      {/* Create Team Form */}
      {showCreateForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Create New Team</h3>
          {hackathonEvents.length === 0 ? (
            <p className="text-muted">No open hackathon events available to create a team for.</p>
          ) : (
            <form onSubmit={handleCreateTeam}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Team Name *</label>
                <input type="text" placeholder="e.g. Code Warriors" value={createData.teamName}
                  onChange={e => setCreateData({ ...createData, teamName: e.target.value })} required />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Hackathon Event *</label>
                <select value={createData.eventId}
                  onChange={e => setCreateData({ ...createData, eventId: e.target.value })} required>
                  <option value="">Select an event...</option>
                  {hackathonEvents.map(ev => (
                    <option key={ev._id} value={ev._id}>{ev.eventName}</option>
                  ))}
                </select>
              </div>
              {createError && <div className="alert alert-error">{createError}</div>}
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Join by code */}
      <div className="card">
        <h3>Join Team by Invite Code</h3>
        <form onSubmit={handleJoinByCode} className="inline-form">
          <input type="text" placeholder="Enter invite code" value={joinCode}
            onChange={e => setJoinCode(e.target.value)} />
          <button type="submit" className="btn btn-primary">Join</button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <section className="dashboard-section">
          <h3>📩 Pending Invitations</h3>
          {pendingInvites.map(team => (
            <div key={team._id} className="team-card invite-card">
              <div className="team-header">
                <h4>{team.teamName}</h4>
                <span className="badge">{team.event?.eventName}</span>
              </div>
              <p>Leader: {team.teamLeader?.firstName} {team.teamLeader?.lastName}</p>
              <div className="invite-actions">
                <button onClick={() => handleRespond(team._id, 'accept')}
                  className="btn btn-sm btn-primary">Accept</button>
                <button onClick={() => handleRespond(team._id, 'reject')}
                  className="btn btn-sm btn-danger">Reject</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Active Teams */}
      {activeTeams.length === 0 ? (
        <div className="empty-state">
          <p>You're not in any teams yet.</p>
        </div>
      ) : (
        <div className="teams-list">
          {activeTeams.map(team => (
            <div key={team._id} className="team-card">
              <div className="team-header">
                <h4>{team.teamName}</h4>
                <span className={`badge badge-status-${team.status}`}>{team.status}</span>
              </div>
              <p className="team-event">
                <Link to={`/participant/events/${team.event?._id}`}>
                  {team.event?.eventName}
                </Link>
              </p>
              <p>Invite Code: <code>{team.inviteCode}</code></p>
              <div className="team-members">
                <strong>Members ({team.members?.filter(m => m.status === 'accepted').length}/{team.maxTeamSize}):</strong>
                <ul>
                  {team.members?.map((member, i) => (
                    <li key={i} className={`member-${member.status}`}>
                      {member.user?.firstName} {member.user?.lastName}
                      <span className="badge badge-sm">{member.role}</span>
                      <span className="badge badge-sm">{member.status}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="team-actions">
                {team.status === 'forming' && (
                  <button onClick={() => handleLeave(team._id)} className="btn btn-sm btn-danger">
                    Leave Team
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTeams;
