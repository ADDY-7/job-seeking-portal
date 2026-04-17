const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['intern', 'full', 'remote', 'contract'],
      required: true,
    },
    category: {
      type: String,
      enum: ['tech', 'design', 'data', 'marketing', 'finance', 'other'],
      default: 'other',
    },
    tags: [{ type: String }],
    salary: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      enum: ['hot', 'new', ''],
      default: 'new',
    },
    icon: {
      type: String,
      default: '🏢',
    },
    description: {
      type: String,
      default: '',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Full-text search index on title and company
JobSchema.index({ title: 'text', company: 'text', tags: 'text' });

module.exports = mongoose.model('Job', JobSchema);
