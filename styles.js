// Add CSS styles for the application
const styles = `
:root {
  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  --success-color: #198754;
  --danger-color: #dc3545;
  --warning-color: #ffc107;
  --info-color: #0dcaf0;
  --light-color: #f8f9fa;
  --dark-color: #212529;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f5f5;
}

.navbar-brand {
  font-weight: 600;
}

.card {
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.dashboard-card {
  border-left: 4px solid var(--primary-color);
}

.dashboard-card.jobs {
  border-left-color: var(--info-color);
}

.dashboard-card.applications {
  border-left-color: var(--success-color);
}

.dashboard-card.cvs {
  border-left-color: var(--warning-color);
}

.dashboard-card .card-icon {
  font-size: 2rem;
  color: var(--primary-color);
}

.dashboard-card.jobs .card-icon {
  color: var(--info-color);
}

.dashboard-card.applications .card-icon {
  color: var(--success-color);
}

.dashboard-card.cvs .card-icon {
  color: var(--warning-color);
}

.dashboard-card .card-value {
  font-size: 2rem;
  font-weight: 700;
}

.job-card, .cv-card {
  position: relative;
  overflow: hidden;
}

.match-score {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
}

.match-score.high {
  background-color: var(--success-color);
}

.match-score.medium {
  background-color: var(--warning-color);
}

.match-score.low {
  background-color: var(--danger-color);
}

.form-switch .form-check-input {
  width: 3em;
  height: 1.5em;
}

.form-range {
  height: 1.5rem;
}

.badge {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.5em 0.8em;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
}

.loading-text {
  color: white;
  font-size: 1.2rem;
  margin-left: 1rem;
}

.auto-apply-toggle-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background-color: white;
  padding: 10px 15px;
  border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
}

.auto-apply-toggle-container .form-check-label {
  margin-right: 10px;
  font-weight: 600;
}

.nav-tabs .nav-link {
  font-weight: 500;
}

.nav-tabs .nav-link.active {
  font-weight: 600;
  border-bottom: 3px solid var(--primary-color);
}

.table th {
  font-weight: 600;
}

.progress {
  height: 8px;
  border-radius: 4px;
}

.progress-thin {
  height: 4px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon i {
  margin-right: 5px;
}

.quick-actions {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
}

.quick-actions .btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.quick-actions .btn i {
  font-size: 1.5rem;
}

.platform-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}
`;

// Create a style element and append it to the head
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);

// Update the server.js file to include the new endpoints
const updatedServerJs = `
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CvAnalyzer, JobAnalyzer, CvMatcher } = require('./cv-matcher');
const JobScraper = require('./job-scraper');
const AutoApply = require('./auto-apply');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Set up file storage for CV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../data/cvs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Initialize data directories
const dataDir = path.join(__dirname, '../data');
const cvsDir = path.join(dataDir, 'cvs');
const jobsDir = path.join(dataDir, 'jobs');
const applicationsDir = path.join(dataDir, 'applications');
const configDir = path.join(dataDir, 'config');

// Create directories if they don't exist
[dataDir, cvsDir, jobsDir, applicationsDir, configDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Default configuration
let config = {
  keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
  locations: ['Canada', 'Remote'],
  autoApplyThreshold: 80,
  autoApplyEnabled: false,
  platforms: ['LinkedIn', 'Indeed', 'Glassdoor', 'FuzeHR', 'Quantum', 'Canada Job Bank']
};

// Load configuration if exists
const configFile = path.join(configDir, 'config.json');
if (fs.existsSync(configFile)) {
  try {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

// Initialize job scraper
const jobScraper = new JobScraper(config);

// Initialize auto-apply
const autoApply = new AutoApply(config);

// In-memory data (would be replaced with database in production)
let jobs = [];
let cvs = [];
let applications = [];

// Load data from files if they exist
try {
  const jobsFile = path.join(jobsDir, 'jobs.json');
  if (fs.existsSync(jobsFile)) {
    jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
  }
  
  const applicationsFile = path.join(applicationsDir, 'applications.json');
  if (fs.existsSync(applicationsFile)) {
    applications = JSON.parse(fs.readFileSync(applicationsFile, 'utf8'));
  }
  
  // Load and analyze CVs
  if (fs.existsSync(cvsDir)) {
    const cvFiles = fs.readdirSync(cvsDir).filter(file => 
      file.endsWith('.pdf') || file.endsWith('.docx')
    );
    
    // Analyze each CV
    for (const cvFile of cvFiles) {
      const cvPath = path.join(cvsDir, cvFile);
      const cvAnalysis = await CvAnalyzer.analyzeCv(cvPath);
      
      if (cvAnalysis) {
        cvs.push(cvAnalysis);
      }
    }
  }
} catch (error) {
  console.error('Error loading data:', error);
}

// Save data to files
function saveData() {
  try {
    fs.writeFileSync(path.join(jobsDir, 'jobs.json'), JSON.stringify(jobs, null, 2));
    fs.writeFileSync(path.join(applicationsDir, 'applications.json'), JSON.stringify(applications, null, 2));
    fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// API Routes

// Get configuration
app.get('/api/config', (req, res) => {
  res.json(config);
});

// Update configuration
app.put('/api/config', (req, res) => {
  config = { ...config, ...req.body };
  
  // Update job scraper and auto-apply config
  jobScraper.updateConfig(config);
  autoApply.updateConfig(config);
  
  // Save configuration
  saveData();
  
  res.json(config);
});

// Get all CVs
app.get('/api/cvs', (req, res) => {
  res.json(cvs);
});

// Upload CV
app.post('/api/cvs/upload', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const cvPath = req.file.path;
    const cvAnalysis = await CvAnalyzer.analyzeCv(cvPath);
    
    if (!cvAnalysis) {
      return res.status(500).json({ error: 'Failed to analyze CV' });
    }
    
    // Add to CVs list
    cvs.push(cvAnalysis);
    
    res.json({ success: true, cv: cvAnalysis });
  } catch (error) {
    console.error('Error uploading CV:', error);
    res.status(500).json({ error: 'Error uploading CV' });
  }
});

// Delete CV
app.delete('/api/cvs/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const cvPath = path.join(cvsDir, filename);
    
    // Check if file exists
    if (!fs.existsSync(cvPath)) {
      return res.status(404).json({ error: 'CV not found' });
    }
    
    // Delete file
    fs.unlinkSync(cvPath);
    
    // Remove from CVs list
    cvs = cvs.filter(cv => cv.filename !== filename);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting CV:', error);
    res.status(500).json({ error: 'Error deleting CV' });
  }
});

// Get all jobs
app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

// Search for jobs
app.post('/api/jobs/search', async (req, res) => {
  try {
    const newJobs = await jobScraper.searchJobs();
    
    // Filter out jobs that already exist
    const existingJobIds = new Set(jobs.map(job => job.id));
    const uniqueNewJobs = newJobs.filter(job => !existingJobIds.has(job.id));
    
    // Add new jobs to list
    jobs.push(...uniqueNewJobs);
    
    // Save jobs
    saveData();
    
    res.json({ success: true, newJobs: uniqueNewJobs.length, totalJobs: jobs.length });
  } catch (error) {
    console.error('Error searching for jobs:', error);
    res.status(500).json({ error: 'Error searching for jobs' });
  }
});

// Apply to job
app.post('/api/jobs/:id/apply', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = jobs.find(j => j.id === jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if already applied
    const alreadyApplied = applications.some(app => app.jobId === jobId);
    if (alreadyApplied) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }
    
    // Apply to job
    const result = await autoApply.applyToJob(job, cvs);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    // Add to applications list
    applications.push(result.application);
    
    // Save applications
    saveData();
    
    res.json({ success: true, application: result.application, matchDetails: result.matchDetails });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ error: 'Error applying to job' });
  }
});

// Get all applications
app.get('/api/applications', (req, res) => {
  res.json(applications);
});

// Process auto-apply
app.post('/api/auto-apply', async (req, res) => {
  try {
    if (!config.autoApplyEnabled) {
      return res.status(400).json({ error: 'Auto-apply is disabled' });
    }
    
    // Get jobs that haven't been applied to
    const appliedJobIds = new Set(applications.map(app => app.jobId));
    const unappliedJobs = jobs.filter(job => !appliedJobIds.has(job.id));
    
    // Process auto-apply
    const result = await autoApply.processAutoApply(unappliedJobs, cvs);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    // Add successful applications to list
    const successfulApplications = result.results
      .filter(r => r.success)
      .map(r => r.application);
    
    applications.push(...successfulApplications);
    
    // Save applications
    saveData();
    
    res.json({ 
      success: true, 
      processed: result.results.length,
      applied: successfulApplications.length
    });
  } catch (error) {
    console.error('Error processing auto-apply:', error);
    res.status(500).json({ error: 'Error processing auto-apply' });
  }
});

// Schedule daily job search
const scheduledSearch = jobScraper.scheduleDailySearch(async (newJobs) => {
  // Filter out jobs that already exist
  const existingJobIds = new Set(jobs.map(job => job.id));
  const uniqueNewJobs = newJobs.filter(job => !existingJobIds.has(job.id));
  
  // Add new jobs to list
  jobs.push(...uniqueNewJobs);
  
  // Save jobs
  saveData();
  
  console.log(\`Found \${uniqueNewJobs.length} new jobs in scheduled search\`);
  
  // Process auto-apply if enabled
  if (config.autoApplyEnabled) {
    // Get jobs that haven't been applied to
    const appliedJobIds = new Set(applications.map(app => app.jobId));
    const unappliedJobs = uniqueNewJobs.filter(job => !appliedJobIds.has(job.id));
    
    // Process auto-apply
    const result = await autoApply.processAutoApply(unappliedJobs, cvs);
    
    if (result.success) {
      // Add successful applications to list
      const successfulApplications = result.results
        .filter(r => r.success)
        .map(r => r.application);
      
      applications.push(...successfulApplications);
      
      // Save applications
      saveData();
      
      console.log(\`Applied to \${successfulApplications.length} jobs in scheduled auto-apply\`);
    }
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

// Update the server.js file
fs.writeFileSync('/home/ubuntu/job_app_automation/backend/server.js', updatedServerJs);

// Create a sample data structure for the frontend
const sampleData = {
  cvs: [
    {
      filename: 'Financial_Analyst_I.docx',
      roleType: 'Financial Analyst',
      experienceLevel: 1,
      skills: {
        financial: 8,
        business: 6,
        technical: 7,
        leadership: 4
      }
    },
    {
      filename: 'Financial_Analyst_II.docx',
      roleType: 'Financial Analyst',
      experienceLevel: 2,
      skills: {
        financial: 9,
        business: 7,
        technical: 8,
        leadership: 6
      }
    },
    {
      filename: 'Financial_Analyst_III.docx',
      roleType: 'Financial Analyst',
      experienceLevel: 3,
      skills: {
        financial: 10,
        business: 8,
        technical: 9,
        leadership: 7
      }
    },
    {
      filename: 'Financial_Analyst_IV.docx',
      roleType: 'Financial Analyst',
      experienceLevel: 4,
      skills: {
        financial: 10,
        business: 9,
        technical: 9,
        leadership: 9
      }
    },
    {
      filename: 'Business_Analyst_I.docx',
      roleType: 'Business Analyst',
      experienceLevel: 1,
      skills: {
        financial: 6,
        business: 8,
        technical: 7,
        leadership: 4
      }
    },
    {
      filename: 'Business_Analyst_II.docx',
      roleType: 'Business Analyst',
      experienceLevel: 2,
      skills: {
        financial: 7,
        business: 9,
        technical: 8,
        leadership: 6
      }
    },
    {
      filename: 'Business_Analyst_III.docx',
      roleType: 'Business Analyst',
      experienceLevel: 3,
      skills: {
        financial: 8,
        business: 10,
        technical: 9,
        leadership: 7
      }
    },
    {
      filename: 'Business_Analyst_IV.docx',
      roleType: 'Business Analyst',
      experienceLevel: 4,
      skills: {
        financial: 9,
        business: 10,
        technical: 9,
        leadership: 9
      }
    },
    {
      filename: 'Budget_Analyst_I.docx',
      roleType: 'Budget Analyst',
      experienceLevel: 1,
      skills: {
        financial: 8,
        business: 6,
        technical: 6,
        leadership: 4
      }
    },
    {
      filename: 'Budget_Analyst_II.docx',
      roleType: 'Budget Analyst',
      experienceLevel: 2,
      skills: {
        financial: 9,
        business: 7,
        technical: 7,
        leadership: 5
      }
  <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>