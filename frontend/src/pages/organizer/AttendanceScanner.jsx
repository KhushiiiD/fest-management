import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { attendanceAPI } from '../../services/api';

const AttendanceScanner = () => {
  const { eventId } = useParams();
  const [mode, setMode] = useState('scan');
  const [qrInput, setQrInput] = useState('');
  const [email, setEmail] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await attendanceAPI.getDashboard(eventId);
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchDashboard(); }, [eventId]);

  const handleScanQR = async (e) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await attendanceAPI.scanQR({ qrData: qrInput.trim(), eventId });
      setResult({ success: true, message: res.data.message, participant: res.data.participant });
      setQrInput('');
      fetchDashboard();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Scan failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleManual = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await attendanceAPI.manualAttendance({ email: email.trim(), eventId });
      setResult({ success: true, message: res.data.message });
      setEmail('');
      fetchDashboard();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await attendanceAPI.exportCSV(eventId);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-${eventId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed');
    }
  };

  return (
    <div className="page-container">
      <h2>Attendance Scanner</h2>

      {/* Mode Tabs */}
      <div className="tabs">
        <button className={`tab ${mode === 'scan' ? 'active' : ''}`}
          onClick={() => setMode('scan')}>QR Scan</button>
        <button className={`tab ${mode === 'manual' ? 'active' : ''}`}
          onClick={() => setMode('manual')}>Manual Entry</button>
        <button className={`tab ${mode === 'dashboard' ? 'active' : ''}`}
          onClick={() => setMode('dashboard')}>Dashboard</button>
      </div>

      {/* Result Notification */}
      {result && (
        <div className={`alert ${result.success ? 'alert-success' : 'alert-danger'}`}>
          <p>{result.message}</p>
          {result.participant && (
            <p><strong>{result.participant.firstName} {result.participant.lastName}</strong> — {result.participant.email}</p>
          )}
        </div>
      )}

      {/* QR Scan Mode */}
      {mode === 'scan' && (
        <div className="card">
          <h3>Scan QR Code</h3>
          <p>Paste or scan the QR code data below:</p>
          <form onSubmit={handleScanQR}>
            <div className="form-group">
              <input type="text" value={qrInput} onChange={(e) => setQrInput(e.target.value)}
                placeholder="QR code data..." autoFocus className="form-input" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Processing...' : 'Mark Attendance'}
            </button>
          </form>
        </div>
      )}

      {/* Manual Mode */}
      {mode === 'manual' && (
        <div className="card">
          <h3>Manual Attendance</h3>
          <p>Enter the participant's email address:</p>
          <form onSubmit={handleManual}>
            <div className="form-group">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="participant@email.com" autoFocus className="form-input" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Processing...' : 'Mark Attendance'}
            </button>
          </form>
        </div>
      )}

      {/* Dashboard Mode */}
      {mode === 'dashboard' && dashboard && (
        <div>
          <div className="stats-row">
            <div className="stat-card"><h3>{dashboard.totalRegistrations || 0}</h3><p>Registered</p></div>
            <div className="stat-card"><h3>{dashboard.totalAttended || 0}</h3><p>Attended</p></div>
            <div className="stat-card">
              <h3>{dashboard.totalRegistrations ? Math.round((dashboard.totalAttended / dashboard.totalRegistrations) * 100) : 0}%</h3>
              <p>Rate</p>
            </div>
          </div>
          <button onClick={handleExportCSV} className="btn btn-secondary">📥 Export CSV</button>

          {dashboard.attendees && dashboard.attendees.length > 0 && (
            <div className="table-wrapper" style={{ marginTop: '1rem' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Check-in Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.attendees.map((a, i) => (
                    <tr key={i}>
                      <td>{a.participant?.firstName} {a.participant?.lastName}</td>
                      <td>{a.participant?.email}</td>
                      <td>{a.attendanceTime ? new Date(a.attendanceTime).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceScanner;
