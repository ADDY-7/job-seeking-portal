import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="navbar">
      <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
        Career<span>Nest</span>
      </Link>
      <nav>
        <Link to="/" className={isActive('/')}>Home</Link>
        <Link to="/jobs" className={isActive('/jobs')}>Jobs</Link>
        {user && <Link to="/dashboard" className={isActive('/dashboard')}>My Applications</Link>}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              👋 {user.name.split(' ')[0]}
            </span>
            <button
              onClick={handleLogout}
              className="nav-cta"
              style={{ cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="nav-cta">Get Started</Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
