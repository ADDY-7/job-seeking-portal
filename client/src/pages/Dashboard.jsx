import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast';

const STATUS_COLORS = {
  applied: 'applied',
  reviewing: 'reviewing',
  accepted: 'accepted',
  rejected: 'rejected',
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications);
    } catch (err) {
      console.error('Failed to fetch applications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleRemove = async (id) => {
    try {
      await api.delete(`/applications/${id}`);
      setApplications((prev) => prev.filter((a) => a._id !== id));
      showToast('Application removed', '🗑️');
    } catch (err) {
      showToast('Could not remove application', '⚠️');
    }
  };

  const reviewCount = Math.floor(applications.length * 0.4);
  const thisMonth = applications.filter((a) => {
    const d = new Date(a.appliedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <ul className="sidebar-menu">
          <li><Link to="/dashboard" className="active">📊 &nbsp;Dashboard</Link></li>
          <li><Link to="/jobs">🔍 &nbsp;Browse Jobs</Link></li>
          <li><a href="#">📄 &nbsp;My Resume</a></li>
          <li><a href="#">🔔 &nbsp;Alerts</a></li>
          <div className="sidebar-label">Account</div>
          <li><a href="#">⚙️ &nbsp;Settings</a></li>
          <li>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', font: 'inherit', padding: '10px 16px', width: '100%', textAlign: 'left' }}
            >
              🚪 &nbsp;Sign Out
            </button>
          </li>
        </ul>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px' }}>
          My Applications
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
          Welcome back, {user?.name?.split(' ')[0]}! Track every application and its current status.
        </p>

        {/* STATS ROW */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="label">Total Applied</div>
            <div className="value">{applications.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Under Review</div>
            <div className="value" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {reviewCount}
            </div>
          </div>
          <div className="stat-card">
            <div className="label">This Month</div>
            <div className="value">{thisMonth}</div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {applications.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <span>Profile Completeness</span>
              <span>72%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: '72%', transition: 'width 1s ease' }} />
            </div>
          </div>
        )}

        {/* APPLICATION LIST */}
        <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '18px' }}>Recent Applications</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            Loading applications…
          </div>
        ) : applications.length === 0 ? (
          <div className="applications-grid">
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <span className="empty-icon">📭</span>
              <h3>No Applications Yet</h3>
              <p>You haven't applied to any jobs yet. Start exploring!</p>
              <Link to="/jobs" className="primary-btn"><span>Browse Open Jobs</span></Link>
            </div>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map((app, i) => (
              <div
                className="application-card"
                key={app._id}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="app-card-header">
                  <div className="app-icon">{app.job?.icon || '🏢'}</div>
                  <div>
                    <div className="app-title">{app.job?.title}</div>
                    <div className="app-company">{app.job?.company}</div>
                  </div>
                </div>
                <span className={`status-badge ${app.status}`}>
                  <span className="status-dot" />
                  {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </span>
                <div className="app-date">
                  📅 Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    onClick={() => handleRemove(app._id)}
                    style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Toast message={toast.message} icon={toast.icon} show={toast.show} onHide={hideToast} />
    </div>
  );
};

export default Dashboard;
