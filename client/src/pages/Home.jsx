import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-text">
          <h1>
            Find Your<br />
            <span className="gradient-text">Dream Career</span><br />
            Today
          </h1>
          <p>
            CareerNest connects students and fresh graduates with top companies hiring right now.
            One platform, endless possibilities.
          </p>
          <div className="hero-actions">
            <Link to="/jobs" className="primary-btn"><span>Explore Jobs</span> →</Link>
            <Link to="/register" className="ghost-btn">Sign Up Free</Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">12K+</div>
              <div className="stat-label">Active Jobs</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3.5K</div>
              <div className="stat-label">Companies</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="float-badge top">🔔 New match: Google SWE Intern</div>
          <div className="hero-card-float">
            <div className="card-header">
              <div className="company-logo-box">🏢</div>
              <div className="card-header-text">
                <div className="job-title">Product Designer</div>
                <div className="company-name">Stripe · Remote</div>
              </div>
            </div>
            <div className="job-tags">
              <span className="tag">UI/UX</span>
              <span className="tag green">Full-time</span>
              <span className="tag cyan">Remote</span>
            </div>
            <div className="card-salary">₹8–12 LPA</div>
            <Link to="/jobs" className="mini-btn">Apply Now →</Link>
          </div>
          <div className="float-badge bottom">✅ Applied: 48 jobs this month</div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-header">
          <div className="section-label">Why CareerNest</div>
          <h2 className="section-title">Everything you need to<br />land your first job</h2>
          <p className="section-subtitle">From discovery to offer letter – we've got every step covered.</p>
        </div>
        <div className="features-grid">
          {[
            { icon: '🎯', title: 'Smart Job Discovery', desc: 'Personalized job matches based on your skills, interests, and preferred location — updated daily.' },
            { icon: '⚡', title: 'One-Click Apply', desc: 'No lengthy forms. Apply instantly to hundreds of roles with your saved profile and resume.' },
            { icon: '📊', title: 'Application Tracking', desc: 'Track every application in a clean dashboard. Know exactly where you stand at all times.' },
            { icon: '🔔', title: 'Real-Time Alerts', desc: 'Get instant notifications when a company reviews your application or posts a matching role.' },
            { icon: '🤝', title: 'Top Companies', desc: 'Access exclusive listings from 3,500+ verified companies including FAANG and startups.' },
            { icon: '📝', title: 'Resume Builder', desc: 'Build a standout resume with ATS-friendly templates trusted by hiring managers.' },
          ].map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPANIES */}
      <section className="companies-section">
        <h2>Trusted by talent from top companies</h2>
        <div className="company-logos">
          {[
            { src: 'https://careernest-adi.s3.ap-south-1.amazonaws.com/google.jpeg', alt: 'Google' },
            { src: 'https://careernest-adi.s3.ap-south-1.amazonaws.com/amazon.png', alt: 'Amazon' },
            { src: 'https://careernest-adi.s3.ap-south-1.amazonaws.com/microsoft.png', alt: 'Microsoft' },
            { src: 'https://careernest-adi.s3.ap-south-1.amazonaws.com/logo.png', alt: 'CareerNest' },
          ].map((c) => (
            <div className="company-logo-item" key={c.alt}>
              <img src={c.src} alt={c.alt} onError={(e) => e.target.style.display='none'} />
              {c.alt}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to launch your career? 🚀</h2>
          <p>Join 50,000+ students who found their first job through CareerNest.</p>
          <div className="cta-actions">
            <Link to="/jobs" className="primary-btn"><span>Browse Jobs</span></Link>
            <Link to="/register" className="ghost-btn">Create Free Account</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo">Career<span>Nest</span></span>
            <p>The job platform built for students and fresh graduates entering the workforce.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/jobs">Browse Jobs</Link>
              <Link to="/dashboard">My Applications</Link>
              <Link to="/login">Sign In</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 CareerNest · Built with ❤️ for student job seekers
        </div>
      </footer>
    </>
  );
};

export default Home;
