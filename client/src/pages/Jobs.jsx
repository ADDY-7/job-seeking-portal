import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Toast, { useToast } from '../components/Toast';

const FILTERS = [
  { label: 'All Roles', value: 'all' },
  { label: '🌐 Remote', value: 'remote' },
  { label: '🎓 Internship', value: 'intern' },
  { label: '💼 Full-time', value: 'full' },
  { label: '💻 Tech', value: 'tech', isCat: true },
  { label: '🎨 Design', value: 'design', isCat: true },
  { label: '📊 Data', value: 'data', isCat: true },
];

const Jobs = () => {
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [appliedLoading, setAppliedLoading] = useState(false); // true while fetching user's existing applications
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (activeFilter !== 'all') {
        const f = FILTERS.find((f) => f.value === activeFilter);
        if (f?.isCat) params.category = activeFilter;
        else params.type = activeFilter;
      }
      const res = await api.get('/jobs', { params });
      setJobs(res.data.jobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  // Fetch user's existing applications to mark applied buttons
  // We track appliedLoading so buttons stay disabled until we know which jobs are already applied
  useEffect(() => {
    if (user) {
      setAppliedLoading(true);
      api.get('/applications')
        .then((res) => {
          const ids = new Set(res.data.applications.map((a) => a.job._id));
          setAppliedIds(ids);
        })
        .catch(() => {})
        .finally(() => setAppliedLoading(false));
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleApply = async (job) => {
    if (!user) {
      showToast('Please sign in to apply for jobs', '🔒');
      return;
    }
    setApplying(job._id);
    try {
      await api.post('/applications', { jobId: job._id });
      // Successfully applied – update button immediately
      setAppliedIds((prev) => new Set([...prev, job._id]));
      showToast(`Applied to ${job.title}!`, '🎉');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      // If the backend says already applied (race condition on page load),
      // silently mark the button as applied instead of showing an error
      if (
        msg.toLowerCase().includes('already applied') ||
        err.response?.status === 400
      ) {
        setAppliedIds((prev) => new Set([...prev, job._id]));
        // No toast – button already shows ✓ Applied now
      } else {
        showToast(msg || 'Failed to apply. Please try again.', '⚠️');
      }
    } finally {
      setApplying(null);
    }
  };

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <h1>Browse <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Open Roles</span></h1>
        <p>12,000+ internships and entry-level positions waiting for you</p>
        <div className="search-bar">
          <input
            type="text"
            id="searchInput"
            placeholder="Search job title, company, or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="search-btn" onClick={fetchJobs}>Search</button>
        </div>
      </div>

      {/* FILTER CHIPS */}
      <div className="filter-chips">
        {FILTERS.map((f) => (
          <span
            key={f.value}
            className={`chip ${activeFilter === f.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </span>
        ))}
      </div>

      {/* JOBS GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading jobs…
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>No jobs found</h3>
          <p>Try a different search term or filter</p>
        </div>
      ) : (
        <div className="jobs-grid" id="jobsGrid">
          {jobs.map((job) => {
            const isApplied = appliedIds.has(job._id);
            const isApplying = applying === job._id;
            return (
              <div className="job-card" key={job._id} data-tags={`${job.type} ${job.category}`}>
                <div className="job-card-header">
                  <div className="job-company-icon">{job.icon || '🏢'}</div>
                  <div className="job-meta">
                    <div className="title">{job.title}</div>
                    <div className="company">{job.company} · {job.location}</div>
                  </div>
                  {job.badge && (
                    <span className={`job-badge ${job.badge}`}>
                      {job.badge === 'hot' ? 'Hot 🔥' : 'New ✨'}
                    </span>
                  )}
                </div>
                <div className="job-details">
                  <span className="job-detail-item">📍 {job.location}</span>
                  <span className="job-detail-item">
                    {job.type === 'intern' ? '🎓 Internship' : job.type === 'remote' ? '🌐 Remote' : '📅 Full-time'}
                  </span>
                </div>
                <div className="job-tags-row">
                  {job.tags?.map((tag, i) => (
                    <span key={tag} className={`tag ${i === 1 ? 'green' : i === 2 ? 'cyan' : ''}`}>{tag}</span>
                  ))}
                </div>
                <div className="job-card-footer">
                  <span className="job-salary">{job.salary}</span>
                  <button
                    className={`apply-btn ${isApplied ? 'applied' : ''}`}
                    onClick={() => handleApply(job)}
                    disabled={isApplied || isApplying || appliedLoading}
                    title={appliedLoading ? 'Checking your applications…' : ''}
                  >
                    {isApplying ? '…' : isApplied ? '✓ Applied' : 'Apply Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Toast message={toast.message} icon={toast.icon} show={toast.show} onHide={hideToast} />
    </>
  );
};

export default Jobs;
