require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/job_app_automation';

// Define MongoDB schemas
const JobSchema = new mongoose.Schema({
  id: String,
  title: String,
  company: String,
  location: String,
  description: String,
  url: String,
  platform: String,
  date: { type: Date, default: Date.now },
  analyzed: { type: Boolean, default: false },
  analysis: Object
});

const ApplicationSchema = new mongoose.Schema({
  id: String,
  jobId: String,
  jobTitle: String,
  company: String,
  cvUsed: String,
  matchScore: Number,
  date: { type: Date, default: Date.now },
  status: String,
  coverLetter: String
});

const CvSchema = new mongoose.Schema({
  filename: String,
  path: String,
  roleType: String,
  experienceLevel: Number,
  skills: Object,
  keywords: [String],
  content: String,
  uploadDate: { type: Date, default: Date.now },
  analysis: Object
});

const ConfigSchema = new mongoose.Schema({
  keywords: [String],
  locations: [String],
  autoApplyThreshold: Number,
  autoApplyEnabled: Boolean,
  platforms: [String],
  lastUpdated: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  settings: { type: mongoose.Schema.Types.ObjectId, ref: 'Config' }
});

// Add indexes for better performance
JobSchema.index({ title: 'text', company: 'text', description: 'text' });
JobSchema.index({ date: -1 });
ApplicationSchema.index({ date: -1 });
CvSchema.index({ roleType: 1, experienceLevel: 1 });

// Create models
const Job = mongoose.model('Job', JobSchema);
const Application = mongoose.model('Application', ApplicationSchema);
const Cv = mongoose.model('Cv', CvSchema);
const Config = mongoose.model('Config', ConfigSchema);
const User = mongoose.model('User', UserSchema);

// Connect to MongoDB with retry logic
const connectWithRetry = () => {
  console.log('Attempting to connect to MongoDB...');
  
  return mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('Connected to MongoDB');
    return true;
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
    return false;
  });
};

// Initialize default config if not exists
async function initializeDefaultConfig() {
  try {
    const configCount = await Config.countDocuments();
    if (configCount === 0) {
      const defaultConfig = new Config({
        keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
        locations: ['Canada', 'Remote'],
        autoApplyThreshold: 80,
        autoApplyEnabled: false,
        platforms: ['LinkedIn', 'Indeed', 'Glassdoor', 'FuzeHR', 'Quantum', 'Canada Job Bank']
      });
      await defaultConfig.save();
      console.log('Default configuration created');
    }
  } catch (error) {
    console.error('Error initializing default config:', error);
  }
}

// Initialize CVs from filesystem if not in database
async function initializeCvsFromFilesystem() {
  try {
    const cvDir = path.join(__dirname, '../data/cvs');
    if (!fs.existsSync(cvDir)) {
      fs.mkdirSync(cvDir, { recursive: true });
      return;
    }
    
    const cvFiles = fs.readdirSync(cvDir).filter(file => 
      file.endsWith('.docx') || file.endsWith('.pdf')
    );
    
    for (const cvFile of cvFiles) {
      const cvPath = path.join(cvDir, cvFile);
      const existingCv = await Cv.findOne({ filename: cvFile });
      
      if (!existingCv) {
        console.log(`Adding CV to database: ${cvFile}`);
        
        // Determine role type and experience level from filename
        const roleType = cvFile.includes('Financial_Analyst') ? 'Financial Analyst' :
                        cvFile.includes('Business_Analyst') ? 'Business Analyst' :
                        cvFile.includes('Budget_Analyst') ? 'Budget Analyst' :
                        cvFile.includes('ERP_Business_Analyst') ? 'ERP Business Analyst' : 'Unknown';
        
        const experienceLevel = cvFile.includes('_I.') ? 1 : 
                               cvFile.includes('_II.') ? 2 : 
                               cvFile.includes('_III.') ? 3 : 
                               cvFile.includes('_IV.') ? 4 : 0;
        
        const newCv = new Cv({
          filename: cvFile,
          path: cvPath,
          roleType,
          experienceLevel,
          skills: {},
          keywords: [],
          content: '',
          uploadDate: new Date()
        });
        
        await newCv.save();
        console.log(`Added CV to database: ${cvFile}`);
      }
    }
  } catch (error) {
    console.error('Error initializing CVs from filesystem:', error);
  }
}

// Initialize database
async function initializeDatabase() {
  await initializeDefaultConfig();
  await initializeCvsFromFilesystem();
  console.log('Database initialization completed');
}

// Export models and functions
module.exports = {
  Job,
  Application,
  Cv,
  Config,
  User,
  connectWithRetry,
  initializeDatabase
};
