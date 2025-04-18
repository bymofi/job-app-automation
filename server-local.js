const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory data storage
const data = {
  jobs: [],
  cvs: [],
  applications: [],
  config: {
    autoApplyEnabled: false,
    autoApplyThreshold: 80,
    keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
    locations: ['Canada', 'Remote'],
    platforms: ['Indeed', 'LinkedIn']
  }
};

// Load initial data
try {
  // Load CVs from text files
  const cvFiles = [
    { 
      id: 'cv-1',
      filename: 'Bassem Gebraeel -Long.txt',
      type: 'Financial Analyst',
      experienceLevel: 'Senior Level'
    },
    {
      id: 'cv-2',
      filename: 'Bassem Gebraeel FBA.txt',
      type: 'Business Analyst',
      experienceLevel: 'Mid Level'
    }
  ];
  
  data.cvs = cvFiles.map(cv => ({
    ...cv,
    uploadDate: new Date().toISOString()
  }));
  
  // Generate sample jobs
  generateSampleJobs();
  
  console.log(`Loaded ${data.cvs.length} CVs`);
} catch (error) {
  console.error('Error loading initial data:', error);
}

// Generate sample jobs for testing
function generateSampleJobs() {
  const companies = [
    'CIBC', 'Royal Bank of Canada', 'TD Bank', 'BMO', 'Scotiabank',
    'McKinsey', 'Deloitte', 'KPMG', 'EY', 'PwC',
    'Microsoft', 'Amazon', 'Google', 'Apple', 'IBM'
  ];
  
  const jobTypes = ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'];
  
  const descriptions = [
    `We are seeking a {jobType} to join our team. The ideal candidate will have experience with financial analysis, reporting, and forecasting. Responsibilities include preparing financial reports, analyzing financial data, and providing insights to support decision-making. Requirements: 3-5 years of experience, proficiency in Excel, and strong analytical skills.`,
    
    `{jobType} position available. This role involves analyzing business processes, gathering requirements, and recommending solutions to improve efficiency. The successful candidate will work closely with stakeholders to understand business needs and translate them into functional requirements. Requirements: 2-4 years of experience, knowledge of business analysis methodologies, and excellent communication skills.`,
    
    `Experienced {jobType} needed. This position is responsible for budget preparation, monitoring, and analysis. The role involves working with department heads to develop annual budgets, tracking variances, and providing recommendations for cost optimization. Requirements: 5+ years of experience, advanced Excel skills, and knowledge of financial principles.`
  ];
  
  const locations = ['Toronto, Canada', 'Vancouver, Canada', 'Montreal, Canada', 'Remote'];
  const platforms = ['Indeed', 'LinkedIn', 'Glassdoor'];
  
  // Generate 10 sample jobs
  for (let i = 0; i < 10; i++) {
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const descTemplate = descriptions[Math.floor(Math.random() * descriptions.length)];
    const description = descTemplate.replace('{jobType}', jobType);
    const location = locations[Math.floor(Math.random() * locations.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    data.jobs.push({
      id: `job-${Date.now()}-${i}`,
      title: jobType,
      company,
      location,
      description,
      url: `https://example.com/jobs/${i}`,
      platform,
      date: new Date().toISOString(),
      applied: false
    });
  }
}

// API Routes
// Get all jobs
app.get('/api/jobs', (req, res) => {
  res.json(data.jobs);
});

// Get job by ID
app.get('/api/jobs/:id', (req, res) => {
  const job = data.jobs.find(j => j.id === req.params.id);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  res.json(job);
});

// Get all CVs
app.get('/api/cvs', (req, res) => {
  res.json(data.cvs);
});

// Get CV by ID
app.get('/api/cvs/:id', (req, res) => {
  const cv = data.cvs.find(c => c.id === req.params.id);
  if (!cv) {
    return res.status(404).json({ message: 'CV not found' });
  }
  res.json(cv);
});

// Get all applications
app.get('/api/applications', (req, res) => {
  res.json(data.applications);
});

// Create application
app.post('/api/applications', (req, res) => {
  const { jobId, cvId } = req.body;
  
  // Find job and CV
  const job = data.jobs.find(j => j.id === jobId);
  const cv = data.cvs.find(c => c.id === cvId);
  
  if (!job || !cv) {
    return res.status(404).json({ message: 'Job or CV not found' });
  }
  
  // Create application
  const application = {
    id: `app-${Date.now()}`,
    jobId,
    jobTitle: job.title,
    company: job.company,
    cvId,
    cvFilename: cv.filename,
    date: new Date().toISOString(),
    status: 'Applied'
  };
  
  // Mark job as applied
  job.applied = true;
  
  // Add to applications
  data.applications.push(application);
  
  res.status(201).json(application);
});

// Get configuration
app.get('/api/config', (req, res) => {
  res.json(data.config);
});

// Update configuration
app.put('/api/config', (req, res) => {
  data.config = { ...data.config, ...req.body };
  res.json(data.config);
});

// Find best matching CV for a job
app.get('/api/match/:jobId', (req, res) => {
  const job = data.jobs.find(j => j.id === req.params.jobId);
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  // Simple matching algorithm
  const matches = data.cvs.map(cv => {
    // Calculate match score based on job title and CV type
    let score = 0;
    
    // Match job title with CV type
    if (job.title.includes(cv.type) || cv.type.includes(job.title)) {
      score += 50;
    }
    
    // Add random factor for demonstration
    score += Math.floor(Math.random() * 30) + 20;
    
    // Cap at 100
    score = Math.min(score, 100);
    
    return {
      cv,
      score
    };
  });
  
  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);
  
  res.json({
    job,
    matches: matches.slice(0, 3), // Return top 3 matches
    bestMatch: matches[0]
  });
});

// Generate cover letter
app.get('/api/cover-letter/:jobId/:cvId', (req, res) => {
  const job = data.jobs.find(j => j.id === req.params.jobId);
  const cv = data.cvs.find(c => c.id === req.params.cvId);
  
  if (!job || !cv) {
    return res.status(404).json({ message: 'Job or CV not found' });
  }
  
  // Generate simple cover letter
  const coverLetter = `
Dear Hiring Manager,

I am writing to express my interest in the ${job.title} position at ${job.company} that I found on ${job.platform}. With my background as reflected in my ${cv.filename} and experience in ${cv.type}, I believe I am well-qualified for this role.

The job description mentions the need for skills in financial analysis, reporting, and forecasting, which align perfectly with my experience. I have successfully [specific achievement related to job requirements] which demonstrates my ability to deliver results in this area.

I am particularly interested in joining ${job.company} because of its reputation for [company strength]. I am confident that my skills in [key skill from CV] would be an asset to your team.

I look forward to discussing how my background, skills, and experience would benefit ${job.company}. Thank you for considering my application.

Sincerely,
Bassem Gebraeel
  `;
  
  res.json({
    job,
    cv,
    coverLetter
  });
});

// Gap analysis
app.get('/api/gap-analysis/:jobId/:cvId', (req, res) => {
  const job = data.jobs.find(j => j.id === req.params.jobId);
  const cv = data.cvs.find(c => c.id === req.params.cvId);
  
  if (!job || !cv) {
    return res.status(404).json({ message: 'Job or CV not found' });
  }
  
  // Simple gap analysis
  const missingSkills = [
    'Advanced Excel',
    'Financial Modeling',
    'Data Visualization',
    'SQL',
    'Power BI'
  ].filter(() => Math.random() > 0.5); // Randomly select some skills
  
  const recommendations = [
    'Highlight your experience with financial analysis in your cover letter',
    'Emphasize your Excel skills and specific functions you\'ve used',
    'Mention any experience with ERP systems',
    'Include examples of reports or dashboards you\'ve created'
  ];
  
  res.json({
    job,
    cv,
    missingSkills,
    recommendations
  });
});

// Run job search (simulated)
app.post('/api/search', (req, res) => {
  // Generate 5 new sample jobs
  const oldCount = data.jobs.length;
  generateSampleJobs();
  const newCount = data.jobs.length - oldCount;
  
  res.json({
    message: `Found ${newCount} new jobs`,
    newJobs: data.jobs.slice(-newCount)
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
