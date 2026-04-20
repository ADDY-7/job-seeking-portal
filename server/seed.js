require('dotenv').config();
const pool   = require('./config/db');
const JobRepo = require('./models/Job');

// ─── Seed Data ────────────────────────────────────────────────────────────────
const jobs = [
  {
    title: 'Frontend Developer Intern',
    company: 'TechNova',
    location: 'Pune, India',
    type: 'intern',
    category: 'tech',
    tags: ['React', 'CSS', 'JavaScript'],
    salary: '₹25K/mo',
    badge: 'hot',
    icon: '💻',
    description: '6-month internship working on cutting-edge React applications.',
  },
  {
    title: 'Backend Developer',
    company: 'Cloudify',
    location: 'Remote',
    type: 'remote',
    category: 'tech',
    tags: ['Node.js', 'PostgreSQL', 'REST APIs'],
    salary: '₹6–10 LPA',
    badge: 'new',
    icon: '☁️',
    description: 'Join our cloud team building scalable microservices.',
  },
  {
    title: 'Data Analyst Intern',
    company: 'InsightWorks',
    location: 'Mumbai, India',
    type: 'intern',
    category: 'data',
    tags: ['Python', 'SQL', 'Excel'],
    salary: '₹15K/mo',
    badge: 'new',
    icon: '📊',
    description: '3-month internship in our data analytics division.',
  },
  {
    title: 'UI/UX Designer',
    company: 'PixelCraft',
    location: 'Remote',
    type: 'remote',
    category: 'design',
    tags: ['Figma', 'Prototyping', 'Research'],
    salary: '₹4–8 LPA',
    badge: 'hot',
    icon: '🎨',
    description: 'Design beautiful user interfaces for our SaaS products.',
  },
  {
    title: 'ML Engineer Intern',
    company: 'NeuralEdge',
    location: 'Bengaluru, India',
    type: 'intern',
    category: 'tech',
    tags: ['Python', 'TensorFlow', 'PyTorch'],
    salary: '₹30K/mo',
    badge: 'new',
    icon: '🤖',
    description: '6-month ML research internship with top AI researchers.',
  },
  {
    title: 'DevOps Engineer',
    company: 'ShieldOps',
    location: 'Hyderabad, India',
    type: 'full',
    category: 'tech',
    tags: ['Docker', 'AWS', 'CI/CD'],
    salary: '₹7–12 LPA',
    badge: 'new',
    icon: '🛡️',
    description: 'Build and maintain cloud infrastructure on AWS.',
  },
  {
    title: 'Product Manager',
    company: 'LaunchPad',
    location: 'Delhi, India',
    type: 'full',
    category: 'other',
    tags: ['Product Strategy', 'Agile', 'Analytics'],
    salary: '₹12–18 LPA',
    badge: 'hot',
    icon: '🚀',
    description: 'Lead product development for our mobile-first platform.',
  },
  {
    title: 'Cloud Solutions Architect',
    company: 'AWSify',
    location: 'Remote',
    type: 'remote',
    category: 'tech',
    tags: ['AWS', 'Azure', 'Terraform', 'Kubernetes'],
    salary: '₹20–35 LPA',
    badge: 'hot',
    icon: '☁️',
    description: 'Design and implement enterprise cloud architectures on AWS.',
  },
];

const seed = async () => {
  try {
    // Verify DB connection
    await pool.query('SELECT 1');
    console.log('✅  Connected to PostgreSQL');

    // Clear existing jobs (preserves users and applications)
    await pool.query('DELETE FROM jobs');
    console.log('🗑️   Cleared existing jobs');

    // Insert jobs using JobRepo
    for (const job of jobs) {
      await JobRepo.create(job, null); // null = no postedBy
    }
    console.log(`✅  Seeded ${jobs.length} jobs`);

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed error:', err.message);
    process.exit(1);
  } finally {
    // Close pool so the process exits cleanly
    await pool.end();
  }
};

seed();
