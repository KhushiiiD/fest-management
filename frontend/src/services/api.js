import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===================== AUTH =====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// ===================== EVENTS (public) =====================
export const eventAPI = {
  browse: (params) => api.get('/events/browse', { params }),
  getDetails: (eventId) => api.get(`/events/${eventId}`),
  exportCalendar: (eventId, format) => api.get(`/events/${eventId}/export-calendar`, { params: { format } }),
};

// ===================== REGISTRATIONS =====================
export const registrationAPI = {
  getMyRegistrations: () => api.get('/registrations/my'),
  registerForEvent: (eventId, data) => api.post(`/registrations/event/${eventId}`, data),
  purchaseMerchandise: (eventId, data) => api.post(`/registrations/merchandise/${eventId}`, data),
  uploadPaymentProof: (registrationId, formData) =>
    api.post(`/registrations/${registrationId}/payment-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  getDetails: (registrationId) => api.get(`/registrations/${registrationId}`),
  cancel: (registrationId) => api.delete(`/registrations/${registrationId}`),
};

// ===================== PARTICIPANT =====================
export const participantAPI = {
  getDashboard: () => api.get('/participants/dashboard'),
  getProfile: () => api.get('/participants/profile'),
  updateProfile: (data) => api.put('/participants/profile', data),
  completeOnboarding: (data) => api.post('/participants/onboarding', data),
  followClub: (clubId) => api.post(`/participants/follow/${clubId}`),
  unfollowClub: (clubId) => api.post(`/participants/unfollow/${clubId}`),
  getAllClubs: (params) => api.get('/participants/clubs', { params }),
  getClubDetails: (clubId) => api.get(`/participants/clubs/${clubId}`),
};

// ===================== ORGANIZER =====================
export const organizerAPI = {
  getDashboard: () => api.get('/organizers/dashboard'),
  getProfile: () => api.get('/organizers/profile'),
  updateProfile: (data) => api.put('/organizers/profile', data),
  requestPasswordReset: (data) => api.post('/organizers/password-reset-request', data),
  getMyEvents: () => api.get('/organizers/events'),
  createEvent: (data) => api.post('/organizers/events', data),
  updateEvent: (eventId, data) => api.put(`/organizers/events/${eventId}`, data),
  publishEvent: (eventId) => api.post(`/organizers/events/${eventId}/publish`),
  updateEventStatus: (eventId, data) => api.post(`/organizers/events/${eventId}/status`, data),
  getEventWithParticipants: (eventId) => api.get(`/organizers/events/${eventId}`),
  exportParticipantsCSV: (eventId) => api.get(`/organizers/events/${eventId}/export-csv`, { responseType: 'blob' }),
  getPendingPayments: () => api.get('/organizers/pending-payments'),
  approvePayment: (registrationId) => api.post(`/organizers/payments/${registrationId}/approve`),
  rejectPayment: (registrationId, data) => api.post(`/organizers/payments/${registrationId}/reject`, data),
};

// ===================== ADMIN =====================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: () => api.get('/admin/organizers'),
  deactivateOrganizer: (organizerId) => api.post(`/admin/organizers/${organizerId}/deactivate`),
  reactivateOrganizer: (organizerId) => api.post(`/admin/organizers/${organizerId}/reactivate`),
  deleteOrganizer: (organizerId) => api.delete(`/admin/organizers/${organizerId}`),
  getPasswordResetRequests: () => api.get('/admin/password-reset-requests'),
  approvePasswordReset: (requestId) => api.post(`/admin/password-reset-requests/${requestId}/approve`),
  rejectPasswordReset: (requestId, data) => api.post(`/admin/password-reset-requests/${requestId}/reject`, data),
};

// ===================== TEAMS =====================
export const teamAPI = {
  createTeam: (data) => api.post('/teams', data),
  joinByInviteCode: (data) => api.post('/teams/join', data),
  getMyTeams: () => api.get('/teams/my'),
  getTeamDetails: (teamId) => api.get(`/teams/${teamId}`),
  inviteMember: (teamId, data) => api.post(`/teams/${teamId}/invite`, data),
  respondToInvite: (teamId, data) => api.post(`/teams/${teamId}/respond`, data),
  registerTeam: (teamId, data) => api.post(`/teams/${teamId}/register`, data),
  leaveTeam: (teamId) => api.post(`/teams/${teamId}/leave`),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
};

// ===================== FORUM =====================
export const forumAPI = {
  getMessages: (eventId, params) => api.get(`/forum/${eventId}/messages`, { params }),
  postMessage: (eventId, data) => api.post(`/forum/${eventId}/messages`, data),
  pinMessage: (messageId) => api.post(`/forum/messages/${messageId}/pin`),
  deleteMessage: (messageId) => api.delete(`/forum/messages/${messageId}`),
  addReaction: (messageId, data) => api.post(`/forum/messages/${messageId}/react`, data),
};

// ===================== ATTENDANCE =====================
export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  manualAttendance: (data) => api.post('/attendance/manual', data),
  getDashboard: (eventId) => api.get(`/attendance/event/${eventId}`),
  exportCSV: (eventId) => api.get(`/attendance/event/${eventId}/export`, { responseType: 'blob' }),
};

export default api;
