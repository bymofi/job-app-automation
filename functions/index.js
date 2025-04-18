const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Simple data structure for initial setup
const generateSampleJobs = () => {
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
  
  const jobs = [];
  
  // Generate 10 sample jobs
  for (let i = 0; i < 10; i++) {
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const descTemplate = descriptions[Math.floor(Math.random() * descriptions.length)];
    const description = descTemplate.replace('{jobType}', jobType);
    const location = locations[Math.floor(Math.random() * locations.length)];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    
    jobs.push({
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
  
  return jobs;
};

// Initialize Firestore with sample data
const initializeFirestore = async () => {
  try {
    // Check if jobs collection exists and has documents
    const jobsSnapshot = await db.collection('jobs').limit(1).get();
    
    if (jobsSnapshot.empty) {
      // Generate sample jobs
      const sampleJobs = generateSampleJobs();
      
      // Add jobs to Firestore
      const batch = db.batch();
      sampleJobs.forEach(job => {
        const jobRef = db.collection('jobs').doc(job.id);
        batch.set(jobRef, job);
      });
      
      await batch.commit();
      console.log('Sample jobs added to Firestore');
    }
    
    // Initialize config if it doesn't exist
    const configSnapshot = await db.collection('config').doc('settings').get();
    
    if (!configSnapshot.exists) {
      await db.collection('config').doc('settings').set({
        autoApplyEnabled: false,
        autoApplyThreshold: 80,
        keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
        locations: ['Canada', 'Remote'],
        platforms: ['Indeed', 'LinkedIn']
      });
      console.log('Config initialized in Firestore');
    }
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
};

// Call initialization function
initializeFirestore();

// API Routes
// Get all jobs
app.get('/jobs', async (req, res) => {
  try {
    const jobsSnapshot = await db.collection('jobs').get();
    const jobs = [];
    
    jobsSnapshot.forEach(doc => {
      jobs.push(doc.data());
    });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
app.get('/jobs/:id', async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.id).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.json(jobDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all CVs
app.get('/cvs', async (req, res) => {
  try {
    const cvsSnapshot = await db.collection('cvs').get();
    const cvs = [];
    
    cvsSnapshot.forEach(doc => {
      cvs.push(doc.data());
    });
    
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get CV by ID
app.get('/cvs/:id', async (req, res) => {
  try {
    const cvDoc = await db.collection('cvs').doc(req.params.id).get();
    
    if (!cvDoc.exists) {
      return res.status(404).json({ message: 'CV not found' });
    }
    
    res.json(cvDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all applications
app.get('/applications', async (req, res) => {
  try {
    const applicationsSnapshot = await db.collection('applications').get();
    const applications = [];
    
    applicationsSnapshot.forEach(doc => {
      applications.push(doc.data());
    });
    
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create application
app.post('/applications', async (req, res) => {
  try {
    const { jobId, cvId } = req.body;
    
    // Find job and CV
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    const cvDoc = await db.collection('cvs').doc(cvId).get();
    
    if (!jobDoc.exists || !cvDoc.exists) {
      return res.status(404).json({ message: 'Job or CV not found' });
    }
    
    const job = jobDoc.data();
    const cv = cvDoc.data();
    
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
    
    // Add application to Firestore
    await db.collection('applications').doc(application.id).set(application);
    
    // Mark job as applied
    await db.collection('jobs').doc(jobId).update({ applied: true });
    
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get configuration
app.get('/config', async (req, res) => {
  try {
    const configDoc = await db.collection('config').doc('settings').get();
    
    if (!configDoc.exists) {
      return res.status(404).json({ message: 'Config not found' });
    }
    
    res.json(configDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update configuration
app.put('/config', async (req, res) => {
  try {
    await db.collection('config').doc('settings').update(req.body);
    
    const updatedConfigDoc = await db.collection('config').doc('settings').get();
    
    res.json(updatedConfigDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find best matching CV for a job
app.get('/match/:jobId', async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.jobId).get();
    
    if (!jobDoc.exists) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const job = jobDoc.data();
    
    // Get all CVs
    const cvsSnapshot = await db.collection('cvs').get();
    const cvs = [];
    
    cvsSnapshot.forEach(doc => {
      cvs.push(doc.data());
    });
    
    // Simple matching algorithm
    const matches = cvs.map(cv => {
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate cover letter
app.get('/cover-letter/:jobId/:cvId', async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.jobId).get();
    const cvDoc = await db.collection('cvs').doc(req.params.cvId).get();
    
    if (!jobDoc.exists || !cvDoc.exists) {
      return res.status(404).json({ message: 'Job or CV not found' });
    }
    
    const job = jobDoc.data();
    const cv = cvDoc.data();
    
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Gap analysis
app.get('/gap-analysis/:jobId/:cvId', async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.jobId).get();
    const cvDoc = await db.collection('cvs').doc(req.params.cvId).get();
    
    if (!jobDoc.exists || !cvDoc.exists) {
      return res.status(404).json({ message: 'Job or CV not found' });
    }
    
    const job = jobDoc.data();
    const cv = cvDoc.data();
    
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Run job search (simulated)
app.post('/search', async (req, res) => {
  try {
    // Generate new sample jobs
    const newJobs = generateSampleJobs().slice(0, 5);
    
    // Add new jobs to Firestore
    const batch = db.batch();
    newJobs.forEach(job => {
      const jobRef = db.collection('jobs').doc(job.id);
      batch.set(jobRef, job);
    });
    
    await batch.commit();
    
    res.json({
      message: `Found ${newJobs.length} new jobs`,
      newJobs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Export the API as a Firebase Function
exports.api = functions.https.onRequest(app);
