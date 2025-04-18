// Test script for enhanced CV-job matching functionality
const { CvAnalyzer, JobAnalyzer, CvMatcher } = require('../backend/cv-matcher');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  cvDir: path.join(__dirname, '../data/cvs'),
  jobsFile: path.join(__dirname, '../data/jobs/jobs.json'),
  outputDir: path.join(__dirname, 'test_results')
};

// Create output directory if it doesn't exist
if (!fs.existsSync(testConfig.outputDir)) {
  fs.mkdirSync(testConfig.outputDir, { recursive: true });
}

// Load jobs
let jobs = [];
try {
  const jobsData = fs.readFileSync(testConfig.jobsFile, 'utf8');
  jobs = JSON.parse(jobsData);
  console.log(`Loaded ${jobs.length} jobs for testing`);
} catch (error) {
  console.error('Error loading jobs:', error);
  process.exit(1);
}

// Get CV files
let cvFiles = [];
try {
  cvFiles = fs.readdirSync(testConfig.cvDir).filter(file => 
    file.endsWith('.pdf') || file.endsWith('.docx')
  );
  console.log(`Found ${cvFiles.length} CV files for testing`);
} catch (error) {
  console.error('Error reading CV directory:', error);
  process.exit(1);
}

// Main test function
async function runTests() {
  console.log('Starting enhanced functionality tests...');
  
  // Test results
  const results = {
    cvAnalysis: [],
    jobAnalysis: [],
    cvMatching: [],
    gapAnalysis: [],
    coverLetterGeneration: [],
    hiringManagerIdentification: []
  };
  
  // 1. Test CV Analysis
  console.log('\n1. Testing CV Analysis...');
  const analyzedCvs = [];
  
  for (const cvFile of cvFiles) {
    const cvPath = path.join(testConfig.cvDir, cvFile);
    console.log(`  Analyzing CV: ${cvFile}`);
    
    try {
      const cvAnalysis = await CvAnalyzer.analyzeCv(cvPath);
      analyzedCvs.push(cvAnalysis);
      
      results.cvAnalysis.push({
        filename: cvFile,
        roleType: cvAnalysis.roleType,
        experienceLevel: cvAnalysis.experienceLevel,
        skills: cvAnalysis.skills,
        success: true
      });
      
      console.log(`    Role Type: ${cvAnalysis.roleType}`);
      console.log(`    Experience Level: ${cvAnalysis.experienceLevel}`);
    } catch (error) {
      console.error(`    Error analyzing CV ${cvFile}:`, error);
      results.cvAnalysis.push({
        filename: cvFile,
        error: error.message,
        success: false
      });
    }
  }
  
  // 2. Test Job Analysis
  console.log('\n2. Testing Job Analysis...');
  const analyzedJobs = [];
  
  for (let i = 0; i < Math.min(5, jobs.length); i++) {
    const job = jobs[i];
    console.log(`  Analyzing Job: ${job.title} at ${job.company}`);
    
    try {
      const jobAnalysis = JobAnalyzer.analyzeJobDescription(job);
      analyzedJobs.push({ job, analysis: jobAnalysis });
      
      results.jobAnalysis.push({
        title: job.title,
        company: job.company,
        roleType: jobAnalysis.roleType,
        experienceLevel: jobAnalysis.experienceLevel,
        requiredSkills: jobAnalysis.requiredSkills,
        success: true
      });
      
      console.log(`    Role Type: ${jobAnalysis.roleType}`);
      console.log(`    Experience Level: ${jobAnalysis.experienceLevel}`);
    } catch (error) {
      console.error(`    Error analyzing job ${job.title}:`, error);
      results.jobAnalysis.push({
        title: job.title,
        company: job.company,
        error: error.message,
        success: false
      });
    }
  }
  
  // 3. Test CV-Job Matching
  console.log('\n3. Testing CV-Job Matching...');
  
  if (analyzedCvs.length > 0 && analyzedJobs.length > 0) {
    for (let i = 0; i < Math.min(3, analyzedJobs.length); i++) {
      const { job, analysis: jobAnalysis } = analyzedJobs[i];
      console.log(`  Finding best CV match for: ${job.title} at ${job.company}`);
      
      try {
        const bestMatch = CvMatcher.findBestMatchingCv(job, analyzedCvs);
        
        results.cvMatching.push({
          jobTitle: job.title,
          jobCompany: job.company,
          bestMatchCv: bestMatch.cv.filename,
          score: bestMatch.score,
          details: bestMatch.details,
          success: true
        });
        
        console.log(`    Best Match: ${bestMatch.cv.filename} (Score: ${bestMatch.score})`);
        console.log(`    Role Score: ${bestMatch.details.roleScore}`);
        console.log(`    Experience Score: ${bestMatch.details.experienceScore}`);
        console.log(`    Skills Score: ${bestMatch.details.skillsScore}`);
        console.log(`    Keyword Score: ${bestMatch.details.keywordScore}`);
      } catch (error) {
        console.error(`    Error matching CVs to job ${job.title}:`, error);
        results.cvMatching.push({
          jobTitle: job.title,
          jobCompany: job.company,
          error: error.message,
          success: false
        });
      }
    }
  } else {
    console.log('  Skipping CV-Job Matching due to insufficient analyzed CVs or jobs');
  }
  
  // 4. Test Gap Analysis
  console.log('\n4. Testing Gap Analysis...');
  
  if (analyzedCvs.length > 0 && analyzedJobs.length > 0) {
    for (let i = 0; i < Math.min(2, analyzedJobs.length); i++) {
      const { job } = analyzedJobs[i];
      const cv = analyzedCvs[i % analyzedCvs.length];
      
      console.log(`  Generating gap analysis for CV ${cv.filename} and job ${job.title}`);
      
      try {
        const gapAnalysis = CvMatcher.generateGapAnalysis(cv, job);
        
        results.gapAnalysis.push({
          cvFilename: cv.filename,
          jobTitle: job.title,
          overallScore: gapAnalysis.overallScore,
          missingSkills: gapAnalysis.missingSkills,
          missingKeywords: gapAnalysis.missingKeywords,
          recommendations: gapAnalysis.recommendations,
          success: true
        });
        
        console.log(`    Overall Score: ${gapAnalysis.overallScore}`);
        console.log(`    Missing Skills: ${Object.keys(gapAnalysis.missingSkills).length}`);
        console.log(`    Missing Keywords: ${gapAnalysis.missingKeywords.length}`);
        console.log(`    Recommendations: ${gapAnalysis.recommendations.length}`);
      } catch (error) {
        console.error(`    Error generating gap analysis:`, error);
        results.gapAnalysis.push({
          cvFilename: cv.filename,
          jobTitle: job.title,
          error: error.message,
          success: false
        });
      }
    }
  } else {
    console.log('  Skipping Gap Analysis due to insufficient analyzed CVs or jobs');
  }
  
  // 5. Test Cover Letter Generation
  console.log('\n5. Testing Cover Letter Generation...');
  
  if (analyzedCvs.length > 0 && analyzedJobs.length > 0) {
    for (let i = 0; i < Math.min(2, analyzedJobs.length); i++) {
      const { job } = analyzedJobs[i];
      const cv = analyzedCvs[i % analyzedCvs.length];
      
      console.log(`  Generating cover letter for CV ${cv.filename} and job ${job.title}`);
      
      try {
        const coverLetter = CvMatcher.generateCoverLetterTemplate(cv, job);
        
        results.coverLetterGeneration.push({
          cvFilename: cv.filename,
          jobTitle: job.title,
          salutation: coverLetter.salutation,
          success: true
        });
        
        console.log(`    Salutation: ${coverLetter.salutation}`);
        console.log(`    Introduction: ${coverLetter.introduction.substring(0, 50)}...`);
        
        // Save cover letter to file
        const coverLetterFile = path.join(testConfig.outputDir, `cover_letter_${cv.filename.replace('.docx', '')}_${i}.txt`);
        fs.writeFileSync(coverLetterFile, coverLetter.fullTemplate);
        console.log(`    Saved cover letter to: ${coverLetterFile}`);
      } catch (error) {
        console.error(`    Error generating cover letter:`, error);
        results.coverLetterGeneration.push({
          cvFilename: cv.filename,
          jobTitle: job.title,
          error: error.message,
          success: false
        });
      }
    }
  } else {
    console.log('  Skipping Cover Letter Generation due to insufficient analyzed CVs or jobs');
  }
  
  // 6. Test Hiring Manager Identification
  console.log('\n6. Testing Hiring Manager Identification...');
  
  for (let i = 0; i < Math.min(5, jobs.length); i++) {
    const job = jobs[i];
    console.log(`  Identifying hiring manager for job: ${job.title} at ${job.company}`);
    
    try {
      const hiringManager = CvMatcher.identifyHiringManager(job);
      
      results.hiringManagerIdentification.push({
        jobTitle: job.title,
        jobCompany: job.company,
        hiringManager: hiringManager,
        success: true
      });
      
      if (hiringManager) {
        console.log(`    Hiring Manager: ${hiringManager.title} ${hiringManager.lastName || ''}`);
      } else {
        console.log(`    No hiring manager identified`);
      }
    } catch (error) {
      console.error(`    Error identifying hiring manager:`, error);
      results.hiringManagerIdentification.push({
        jobTitle: job.title,
        jobCompany: job.company,
        error: error.message,
        success: false
      });
    }
  }
  
  // Save test results
  const resultsFile = path.join(testConfig.outputDir, 'test_results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nTest results saved to: ${resultsFile}`);
  
  // Generate summary
  const summary = {
    cvAnalysis: {
      total: results.cvAnalysis.length,
      success: results.cvAnalysis.filter(r => r.success).length
    },
    jobAnalysis: {
      total: results.jobAnalysis.length,
      success: results.jobAnalysis.filter(r => r.success).length
    },
    cvMatching: {
      total: results.cvMatching.length,
      success: results.cvMatching.filter(r => r.success).length
    },
    gapAnalysis: {
      total: results.gapAnalysis.length,
      success: results.gapAnalysis.filter(r => r.success).length
    },
    coverLetterGeneration: {
      total: results.coverLetterGeneration.length,
      success: results.coverLetterGeneration.filter(r => r.success).length
    },
    hiringManagerIdentification: {
      total: results.hiringManagerIdentification.length,
      success: results.hiringManagerIdentification.filter(r => r.success).length
    }
  };
  
  console.log('\nTest Summary:');
  console.log(`  CV Analysis: ${summary.cvAnalysis.success}/${summary.cvAnalysis.total} successful`);
  console.log(`  Job Analysis: ${summary.jobAnalysis.success}/${summary.jobAnalysis.total} successful`);
  console.log(`  CV Matching: ${summary.cvMatching.success}/${summary.cvMatching.total} successful`);
  console.log(`  Gap Analysis: ${summary.gapAnalysis.success}/${summary.gapAnalysis.total} successful`);
  console.log(`  Cover Letter Generation: ${summary.coverLetterGeneration.success}/${summary.coverLetterGeneration.total} successful`);
  console.log(`  Hiring Manager Identification: ${summary.hiringManagerIdentification.success}/${summary.hiringManagerIdentification.total} successful`);
  
  return summary;
}

// Run tests
runTests()
  .then(summary => {
    console.log('\nAll tests completed!');
    
    // Check if all tests passed
    const allPassed = Object.values(summary).every(category => 
      category.success === category.total && category.total > 0
    );
    
    if (allPassed) {
      console.log('✅ All tests passed successfully!');
    } else {
      console.log('⚠️ Some tests failed. Check test_results.json for details.');
    }
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });
