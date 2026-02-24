import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to={`/${user.role}/dashboard`} className="nav-brand">🎪 Fest Manager</Link>
      <div className="nav-links">
        {user.role === 'participant' && (
          <>
            <Link to="/participant/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/participant/events" className="nav-link">Events</Link>
            <Link to="/participant/registrations" className="nav-link">Registrations</Link>
            <Link to="/participant/teams" className="nav-link">Teams</Link>
            <Link to="/participant/clubs" className="nav-link">Clubs</Link>
            <Link to="/participant/profile" className="nav-link">Profile</Link>
          </>
        )}
        {user.role === 'organizer' && (
          <>
            <Link to="/organizer/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/organizer/events" className="nav-link">Events</Link>
            <Link to="/organizer/create-event" className="nav-link">Create</Link>
            <Link to="/organizer/pending-payments" className="nav-link">Payments</Link>
            <Link to="/organizer/profile" className="nav-link">Profile</Link>
            <Link to="/organizer/password-reset" className="nav-link">Reset PW</Link>
          </>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/organizers" className="nav-link">Organizers</Link>
            <Link to="/admin/password-resets" className="nav-link">Resets</Link>
          </>
        )}
        <button onClick={handleLogout} className="nav-link logout">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
