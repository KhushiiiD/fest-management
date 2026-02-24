import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Participant pages
import ParticipantDashboard from './pages/participant/Dashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import MyRegistrations from './pages/participant/MyRegistrations';
import MyTeams from './pages/participant/MyTeams';
import ParticipantProfile from './pages/participant/Profile';
import Clubs from './pages/participant/Clubs';
import ClubDetails from './pages/participant/ClubDetails';
import Forum from './pages/participant/Forum';
import Onboarding from './pages/participant/Onboarding';

// Organizer pages
import OrganizerDashboard from './pages/organizer/Dashboard';
import CreateEvent from './pages/organizer/CreateEvent';
import ManageEvents from './pages/organizer/ManageEvents';
import EventRegistrations from './pages/organizer/EventRegistrations';
import AttendanceScanner from './pages/organizer/AttendanceScanner';
import OrganizerProfile from './pages/organizer/Profile';
import PasswordResetRequest from './pages/organizer/PasswordResetRequest';
import PendingPayments from './pages/organizer/PendingPayments';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageOrganizers from './pages/admin/ManageOrganizers';
import PasswordResetRequests from './pages/admin/PasswordResetRequests';

// Other
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Participant */}
              <Route path="/participant/dashboard" element={
                <ProtectedRoute roles={['participant']}><ParticipantDashboard /></ProtectedRoute>
              } />
              <Route path="/participant/events" element={
                <ProtectedRoute roles={['participant']}><BrowseEvents /></ProtectedRoute>
              } />
              <Route path="/participant/events/:eventId" element={
                <ProtectedRoute roles={['participant']}><EventDetails /></ProtectedRoute>
              } />
              <Route path="/participant/registrations" element={
                <ProtectedRoute roles={['participant']}><MyRegistrations /></ProtectedRoute>
              } />
              <Route path="/participant/teams" element={
                <ProtectedRoute roles={['participant']}><MyTeams /></ProtectedRoute>
              } />
              <Route path="/participant/profile" element={
                <ProtectedRoute roles={['participant']}><ParticipantProfile /></ProtectedRoute>
              } />
              <Route path="/participant/clubs" element={
                <ProtectedRoute roles={['participant']}><Clubs /></ProtectedRoute>
              } />
              <Route path="/participant/clubs/:clubId" element={
                <ProtectedRoute roles={['participant']}><ClubDetails /></ProtectedRoute>
              } />
              <Route path="/participant/forum/:eventId" element={
                <ProtectedRoute roles={['participant']}><Forum /></ProtectedRoute>
              } />
              <Route path="/participant/onboarding" element={
                <ProtectedRoute roles={['participant']}><Onboarding /></ProtectedRoute>
              } />

              {/* Organizer */}
              <Route path="/organizer/dashboard" element={
                <ProtectedRoute roles={['organizer']}><OrganizerDashboard /></ProtectedRoute>
              } />
              <Route path="/organizer/create-event" element={
                <ProtectedRoute roles={['organizer']}><CreateEvent /></ProtectedRoute>
              } />
              <Route path="/organizer/events" element={
                <ProtectedRoute roles={['organizer']}><ManageEvents /></ProtectedRoute>
              } />
              <Route path="/organizer/events/:eventId" element={
                <ProtectedRoute roles={['organizer']}><EventRegistrations /></ProtectedRoute>
              } />
              <Route path="/organizer/attendance/:eventId" element={
                <ProtectedRoute roles={['organizer']}><AttendanceScanner /></ProtectedRoute>
              } />
              <Route path="/organizer/pending-payments" element={
                <ProtectedRoute roles={['organizer']}><PendingPayments /></ProtectedRoute>
              } />
              <Route path="/organizer/profile" element={
                <ProtectedRoute roles={['organizer']}><OrganizerProfile /></ProtectedRoute>
              } />
              <Route path="/organizer/password-reset" element={
                <ProtectedRoute roles={['organizer']}><PasswordResetRequest /></ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/organizers" element={
                <ProtectedRoute roles={['admin']}><ManageOrganizers /></ProtectedRoute>
              } />
              <Route path="/admin/password-resets" element={
                <ProtectedRoute roles={['admin']}><PasswordResetRequests /></ProtectedRoute>
              } />

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
