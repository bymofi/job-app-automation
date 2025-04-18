const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { Job, Cv, Config, Application } = require('./database');
const { CvMatcher } = require('./cv-matcher');

// Job search platforms
const platforms = {
  LinkedIn: {
    search: async (keyword, location) => {
      try {
        console.log(`Searching LinkedIn for ${keyword} jobs in ${location}...`);
        // In production, this would use LinkedIn API or web scraping
        // For now, return sample jobs
        return generateSampleJobs(keyword, location, 'LinkedIn');
      } catch (error) {
        console.error('LinkedIn search error:', error);
        return [];
      }
    }
  },
  Indeed: {
    search: async (keyword, location) => {
      try {
        console.log(`Searching Indeed for ${keyword} jobs in ${location}...`);
        // In production, this would use Indeed API or web scraping
        // For now, return sample jobs
        return generateSampleJobs(keyword, location, 'Indeed');
      } catch (error) {
        console.error('Indeed search error:', error);
        return [];
      }
    }
  },
  Glassdoor: {
    search: async (keyword, location) => {
      try {
        console.log(`Searching Glassdoor for ${keyword} jobs in ${location}...`);
        // In production, this would use Glassdoor API or web scraping
        // For now, return sample jobs
        return generateSampleJobs(keyword, location, 'Glassdoor');
      } catch (error) {
        console.error('Glassdoor search error:', error);
        return [];
      }
    }
  },
  FuzeHR: {
    search: async (keyword, location) => {
      try {
        console.log(`Searching FuzeHR for ${keyword} jobs in ${location}...`);
        // In production, this would use FuzeHR API or web scraping
        // For now, return sample jobs
        return generateSampleJobs(keyword, location, 'FuzeHR');
      } catch (error) {
        console.error('FuzeHR search error:', error);
        return [];
      }
    }
  },
  Quantum: {
    search: async (keyword, location) => {
      try {
        console.log(`Searching Quantum for ${keyword} jobs in ${location}...`);
        // In production, this would use Quantum API or web scraping
        // For now, return sample jobs
        return generateSampleJobs(keyword, location, 'Quantum');
      } catch (error) {
        console.error('Quantum search error:', error);
        return [];
      }
    }
  },
  'Canada Job Bank': {
    search: async (keyword, location) => {
      try {
        console.log(`Searching Canada Job Bank for ${keyword} jobs in ${location}...`);
        // In production, this would use Canada Job Bank API or web scraping
        // For now, return sample jobs
        return generateSampleJobs(keyword, location, 'Canada Job Bank');
      } catch (error) {
        console.error('Canada Job Bank search error:', error);
        return [];
      }
    }
  }
};

// Generate sample jobs for testing
function generateSampleJobs(keyword, location, platform) {
  const jobs = [];
  const count = Math.floor(Math.random() * 5) + 1; // 1-5 jobs
  
  const companies = [
    'CIBC', 'Royal Bank of Canada', 'TD Bank', 'BMO', 'Scotiabank',
    'McKinsey', 'Deloitte', 'KPMG', 'EY', 'PwC',
    'Microsoft', 'Amazon', 'Google', 'Apple', 'IBM',
    'Government of Canada', 'Province of Ontario', 'City of Toronto'
  ];
  
  const titles = [
    'Financial Analyst', 'Senior Financial Analyst', 'Financial Planning Analyst',
    'Business Analyst', 'Senior Business Analyst', 'Business Systems Analyst',
    'Budget Analyst', 'Senior Budget Analyst', 'Budget Planning Analyst',
    'ERP Business Analyst', 'SAP Business Analyst', 'Oracle Business Analyst'
  ];
  
  const descriptions = [
    `We are seeking a ${keyword} to join our team in ${location}. The ideal candidate will have experience with financial analysis, reporting, and forecasting. Responsibilities include preparing financial reports, analyzing financial data, and providing insights to support decision-making. Requirements: 3-5 years of experience, proficiency in Excel, and strong analytical skills.`,
    
    `${keyword} position available in ${location}. This role involves analyzing business processes, gathering requirements, and recommending solutions to improve efficiency. The successful candidate will work closely with stakeholders to understand business needs and translate them into functional requirements. Requirements: 2-4 years of experience, knowledge of business analysis methodologies, and excellent communication skills.`,
    
    `Experienced ${keyword} needed in ${location}. This position is responsible for budget preparation, monitoring, and analysis. The role involves working with department heads to develop annual budgets, tracking variances, and providing recommendations for cost optimization. Requirements: 5+ years of experience, advanced Excel skills, and knowledge of financial principles.`,
    
    `${keyword} opportunity in ${location}. The role involves supporting ERP system implementation and maintenance, gathering business requirements, and configuring system modules. The ideal candidate will have experience with ERP systems, process improvement, and change management. Requirements: 3-7 years of experience, knowledge of ERP systems, and strong problem-solving skills.`
  ];
  
  const hiringManagers = [
    { name: 'John Smith', title: 'Finance Director' },
    { name: 'Sarah Johnson', title: 'HR Manager' },
    { name: 'Michael Brown', title: 'Department Head' },
    { name: 'Emily Davis', title: 'Talent Acquisition Specialist' },
    { name: 'Robert Wilson', title: 'Hiring Manager' }
  ];
  
  for (let i = 0; i < count; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    const titleBase = titles.find(t => t.includes(keyword.split(' ')[0])) || titles[0];
    const title = Math.random() > 0.5 ? titleBase : `${titleBase} ${i + 1}`;
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const hiringManager = Math.random() > 0.7 ? hiringManagers[Math.floor(Math.random() * hiringManagers.length)] : null;
    
    const hiringManagerText = hiringManager ? 
      `\n\nPlease submit your application to ${hiringManager.name}, ${hiringManager.title}.` : '';
    
    jobs.push({
      id: Date.now().toString() + i,
      title,
      company,
      location,
      description: description + hiringManagerText,
      url: `https://example.com/jobs/${Date.now() + i}`,
      platform,
      date: new Date(),
      hiringManager: hiringManager ? `${hiringManager.name}, ${hiringManager.title}` : null
    });
  }
  
  return jobs;
}

// Main job search function
async function searchJobs() {
  try {
    console.log('Starting job search...');
    
    const config = await Config.findOne();
    if (!config) {
      console.error('No config found for job search');
      return { success: false, message: 'No config found' };
    }
    
    const { keywords, locations, platforms: configPlatforms } = config;
    let newJobsCount = 0;
    
    // For each platform, search for jobs
    for (const platformName of configPlatforms) {
      if (!platforms[platformName]) {
        console.warn(`Platform ${platformName} not supported`);
        continue;
      }
      
      for (const keyword of keywords) {
        for (const location of locations) {
          try {
            console.log(`Searching for ${keyword} jobs in ${location} on ${platformName}...`);
            
            const jobs = await platforms[platformName].search(keyword, location);
            
            // Save jobs to database
            for (const job of jobs) {
              const existingJob = await Job.findOne({ 
                title: job.title, 
                company: job.company,
                url: job.url
              });
              
              if (!existingJob) {
                const newJob = new Job(job);
                await newJob.save();
                console.log(`Added new job: ${job.title} at ${job.company}`);
                newJobsCount++;
                
                // Auto-apply if enabled
                if (config.autoApplyEnabled) {
                  await autoApplyToJob(newJob, config.autoApplyThreshold);
                }
              }
            }
          } catch (searchError) {
            console.error(`Error searching ${platformName} for ${keyword} in ${location}:`, searchError);
            // Continue with next platform/keyword/location
          }
        }
      }
    }
    
    console.log(`Job search completed. Found ${newJobsCount} new jobs.`);
    return { success: true, message: `Found ${newJobsCount} new jobs` };
  } catch (error) {
    console.error('Error searching for jobs:', error);
    return { success: false, message: error.message };
  }
}

// Auto-apply to job if match score meets threshold
async function autoApplyToJob(job, threshold) {
  try {
    console.log(`Checking for auto-apply to job: ${job.title} at ${job.company}`);
    
    const cvs = await Cv.find();
    if (cvs.length === 0) {
      console.log('No CVs found for auto-apply');
      return { success: false, message: 'No CVs found' };
    }
    
    const bestMatch = await CvMatcher.findBestMatchingCv(job, cvs);
    
    if (bestMatch && bestMatch.score >= threshold) {
      console.log(`Auto-applying to job with CV ${bestMatch.cv.filename} (Score: ${bestMatch.score})`);
      
      // Check if already applied
      const existingApplication = await Application.findOne({ 
        jobId: job._id, 
        cvUsed: bestMatch.cv.filename 
      });
      
      if (existingApplication) {
        console.log('Already applied to this job with this CV');
        return { success: false, message: 'Already applied' };
      }
      
      // Generate cover letter
      const coverLetter = await CvMatcher.generateCoverLetterTemplate(bestMatch.cv, job);
      
      // Create application record
      const application = new Application({
        id: Date.now().toString(),
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        cvUsed: bestMatch.cv.filename,
        matchScore: bestMatch.score,
        date: new Date(),
        status: 'Auto-Applied',
        coverLetter: coverLetter.fullTemplate
      });
      
      await application.save();
      console.log('Auto-applied successfully');
      return { success: true, message: 'Auto-applied successfully', application };
    } else {
      console.log(`Not auto-applying. Best match score: ${bestMatch ? bestMatch.score : 'No match'}`);
      return { success: false, message: 'Match score below threshold' };
    }
  } catch (error) {
    console.error('Error in auto-apply:', error);
    return { success: false, message: error.message };
  }
}

// Find hiring manager information in job description
function findHiringManager(jobDescription) {
  if (!jobDescription) return null;
  
  // Common patterns for hiring manager information
  const patterns = [
    /(?:please\s+(?:contact|submit|send|email))(?:\s+(?:to|with))?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,\s*([^,\.]+))?/i,
    /(?:contact|hiring manager|recruiter|hr contact)(?:\s*:)?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,\s*([^,\.]+))?/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s*,\s*([^,\.]+))?\s+(?:is|will be)\s+(?:the|your)\s+(?:hiring manager|recruiter|point of contact)/i
  ];
  
  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      return {
        name: match[1].trim(),
        title: match[2] ? match[2].trim() : 'Hiring Manager'
      };
    }
  }
  
  return null;
}

// Suggest hiring manager based on company size
async function suggestHiringManager(job) {
  // If hiring manager is already in the job description, use that
  if (job.hiringManager) {
    return job.hiringManager;
  }
  
  // Try to find hiring manager in job description
  const hiringManager = findHiringManager(job.description);
  if (hiringManager) {
    return `${hiringManager.name}, ${hiringManager.title}`;
  }
  
  // For small companies, suggest CEO or department VP
  // This would use a company size API in production
  // For now, randomly determine if it's a "small company"
  const isSmallCompany = Math.random() > 0.7;
  
  if (isSmallCompany) {
    // Determine department based on job title
    let department = 'Finance';
    if (job.title.toLowerCase().includes('business analyst')) {
      department = 'Business';
    } else if (job.title.toLowerCase().includes('erp')) {
      department = 'IT';
    }
    
    // Randomly choose between CEO and VP
    if (Math.random() > 0.5) {
      return `CEO, ${job.company}`;
    } else {
      return `VP of ${department}, ${job.company}`;
    }
  }
  
  // Default to generic hiring manager
  return `Hiring Manager, ${job.company}`;
}

module.exports = {
  searchJobs,
  autoApplyToJob,
  findHiringManager,
  suggestHiringManager
};
