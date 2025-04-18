const config = {
  keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
  locations: ['Canada', 'Remote'],
  autoApplyThreshold: 80,
  autoApplyEnabled: false,
  platforms: ['LinkedIn', 'Indeed', 'Glassdoor', 'FuzeHR', 'Quantum', 'Canada Job Bank']
};

// Save config to file
const fs = require('fs');
const path = require('path');
const configDir = path.join(__dirname, '../data/config');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(config, null, 2));

// Generate sample jobs for testing
const generateSampleJobs = () => {
  const jobs = [];
  const companies = [
    'Acme Corporation', 'Globex', 'Initech', 'Umbrella Corporation', 
    'Stark Industries', 'Wayne Enterprises', 'Cyberdyne Systems',
    'Royal Bank of Canada', 'TD Bank', 'CIBC', 'BMO', 'Scotiabank',
    'Government of Canada', 'Province of Ontario', 'City of Toronto',
    'Deloitte', 'KPMG', 'PwC', 'EY', 'McKinsey', 'BCG', 'Bain'
  ];
  
  const jobTitles = {
    'Financial Analyst': [
      'Financial Analyst', 'Senior Financial Analyst', 'Junior Financial Analyst',
      'Financial Planning Analyst', 'Financial Reporting Analyst', 'FP&A Analyst',
      'Finance Business Partner', 'Financial Operations Analyst'
    ],
    'Business Analyst': [
      'Business Analyst', 'Senior Business Analyst', 'Junior Business Analyst',
      'Business Systems Analyst', 'IT Business Analyst', 'Process Analyst',
      'Business Process Analyst', 'Requirements Analyst'
    ],
    'Budget Analyst': [
      'Budget Analyst', 'Senior Budget Analyst', 'Junior Budget Analyst',
      'Budget Planning Analyst', 'Budget Coordinator', 'Fiscal Analyst',
      'Budget Management Analyst', 'Financial Budget Analyst'
    ],
    'ERP Business Analyst': [
      'ERP Business Analyst', 'SAP Business Analyst', 'Oracle Business Analyst',
      'ERP Systems Analyst', 'ERP Implementation Analyst', 'ERP Functional Analyst',
      'ERP Technical Analyst', 'ERP Integration Analyst'
    ]
  };
  
  const descriptions = {
    'Financial Analyst': [
      'We are seeking a Financial Analyst to join our Finance team. The ideal candidate will have experience with financial modeling, forecasting, and reporting. Responsibilities include preparing financial reports, analyzing financial data, and providing insights to support business decisions. Required skills: Excel, PowerBI, financial modeling, variance analysis, budgeting, forecasting, and financial reporting. Experience with ERP systems is a plus.',
      'As a Financial Analyst, you will be responsible for analyzing financial data, preparing reports, and providing recommendations to improve financial performance. You will work closely with the Finance team to support budgeting, forecasting, and financial planning activities. Required skills: Advanced Excel (XLOOKUP, PowerQuery, PowerPivot), financial analysis, data visualization, and strong attention to detail.',
      'The Financial Analyst will be responsible for financial reporting, analysis, and planning. You will prepare monthly, quarterly, and annual financial reports, analyze variances, and provide insights to support business decisions. Experience with Excel, PowerBI, and ERP systems is required. The ideal candidate will have strong analytical skills and the ability to work with cross-functional teams.'
    ],
    'Business Analyst': [
      'We are looking for a Business Analyst to join our team. The ideal candidate will have experience gathering and documenting business requirements, analyzing business processes, and recommending solutions to improve efficiency and effectiveness. Required skills: Requirements gathering, process mapping, stakeholder management, and documentation. Experience with Agile methodologies is a plus.',
      'As a Business Analyst, you will be responsible for analyzing business processes, identifying opportunities for improvement, and documenting requirements for system enhancements. You will work closely with stakeholders to understand their needs and translate them into technical requirements. Required skills: Business process analysis, requirements documentation, and strong communication skills.',
      'The Business Analyst will be responsible for gathering and documenting business requirements, analyzing business processes, and recommending solutions to improve efficiency and effectiveness. Experience with requirements gathering, process mapping, and stakeholder management is required. The ideal candidate will have strong analytical and problem-solving skills.'
    ],
    'Budget Analyst': [
      'We are seeking a Budget Analyst to join our Finance team. The ideal candidate will have experience with budget preparation, analysis, and monitoring. Responsibilities include preparing budget reports, analyzing variances, and providing recommendations to improve budget performance. Required skills: Excel, financial analysis, budgeting, and forecasting.',
      'As a Budget Analyst, you will be responsible for preparing and monitoring budgets, analyzing variances, and providing recommendations to improve budget performance. You will work closely with department managers to develop and implement budgeting strategies. Required skills: Advanced Excel, financial analysis, and strong attention to detail.',
      'The Budget Analyst will be responsible for budget preparation, analysis, and monitoring. You will prepare budget reports, analyze variances, and provide recommendations to improve budget performance. Experience with Excel, financial systems, and budget preparation is required. The ideal candidate will have strong analytical skills and the ability to work with cross-functional teams.'
    ],
    'ERP Business Analyst': [
      'We are looking for an ERP Business Analyst to join our IT team. The ideal candidate will have experience with ERP systems, business process analysis, and system implementation. Responsibilities include gathering requirements, configuring systems, and supporting users. Required skills: ERP systems (SAP, Oracle), business process analysis, and system configuration.',
      'As an ERP Business Analyst, you will be responsible for analyzing business processes, gathering requirements, and configuring ERP systems to meet business needs. You will work closely with stakeholders to understand their requirements and translate them into system configurations. Required skills: ERP systems, business process analysis, and strong communication skills.',
      'The ERP Business Analyst will be responsible for analyzing business processes, gathering requirements, and configuring ERP systems to meet business needs. Experience with SAP, Oracle, or other ERP systems is required, along with strong analytical and problem-solving skills. The ideal candidate will have experience with system implementation and user support.'
    ]
  };
  
  const sources = ['LinkedIn', 'Indeed', 'Glassdoor', 'FuzeHR', 'Quantum', 'Canada Job Bank'];
  const locations = ['Toronto, Canada', 'Montreal, Canada', 'Vancouver, Canada', 'Calgary, Canada', 'Ottawa, Canada', 'Remote'];
  
  let id = 1;
  
  // Generate jobs for each keyword
  for (const keyword of config.keywords) {
    const titles = jobTitles[keyword] || jobTitles['Financial Analyst'];
    const descriptionOptions = descriptions[keyword] || descriptions['Financial Analyst'];
    
    // Generate 5 jobs for each keyword
    for (let i = 0; i < 5; i++) {
      const title = titles[Math.floor(Math.random() * titles.length)];
      const company = companies[Math.floor(Math.random() * companies.length)];
      const description = descriptionOptions[Math.floor(Math.random() * descriptionOptions.length)];
      const source = sources[Math.floor(Math.random() * sources.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Generate a random date within the last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      jobs.push({
        id: id.toString(),
        title,
        company,
        location,
        description,
        datePosted: date.toISOString(),
        source,
        url: `https://example.com/jobs/${id}`
      });
      
      id++;
    }
  }
  
  return jobs;
};

// Generate and save sample jobs
const jobs = generateSampleJobs();
const jobsDir = path.join(__dirname, '../data/jobs');

if (!fs.existsSync(jobsDir)) {
  fs.mkdirSync(jobsDir, { recursive: true });
}

fs.writeFileSync(path.join(jobsDir, 'jobs.json'), JSON.stringify(jobs, null, 2));

console.log(`Generated ${jobs.length} sample jobs for testing`);
