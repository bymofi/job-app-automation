const fs = require('fs');
const path = require('path');
const natural = require('natural');
const { PDFExtract } = require('pdf.js-extract');
const mammoth = require('mammoth');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const stemmer = natural.PorterStemmer;
const pdfExtract = new PDFExtract();

/**
 * CV Analyzer class - handles parsing and analyzing CVs
 */
class CvAnalyzer {
  /**
   * Analyze a CV file and extract key information
   * @param {string} cvPath - Path to the CV file
   * @returns {Promise<Object>} - CV analysis results
   */
  static async analyzeCv(cvPath) {
    try {
      // Extract text content based on file type
      const content = await this.extractTextFromFile(cvPath);
      if (!content) {
        throw new Error(`Failed to extract content from ${cvPath}`);
      }
      
      // Extract key information
      const filename = path.basename(cvPath);
      const experienceLevel = this.determineExperienceLevel(filename, content);
      const roleType = this.determineRoleType(filename, content);
      const skills = this.extractSkills(content);
      const education = this.extractEducation(content);
      const experience = this.extractExperience(content);
      const keywords = this.extractKeywords(content);
      
      return {
        path: cvPath,
        filename,
        experienceLevel,
        roleType,
        skills,
        education,
        experience,
        keywords,
        content
      };
    } catch (error) {
      console.error(`Error analyzing CV ${cvPath}:`, error);
      return null;
    }
  }
  
  /**
   * Extract text content from a file based on its extension
   * @param {string} filePath - Path to the file
   * @returns {Promise<string>} - Extracted text content
   */
  static async extractTextFromFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    
    try {
      if (extension === '.pdf') {
        return await this.extractTextFromPdf(filePath);
      } else if (extension === '.docx') {
        return await this.extractTextFromDocx(filePath);
      } else {
        throw new Error(`Unsupported file format: ${extension}`);
      }
    } catch (error) {
      console.error(`Error extracting text from ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Extract text from a PDF file
   * @param {string} pdfPath - Path to the PDF file
   * @returns {Promise<string>} - Extracted text content
   */
  static async extractTextFromPdf(pdfPath) {
    try {
      const data = await pdfExtract.extract(pdfPath, {});
      return data.pages.map(page => page.content.map(item => item.str).join(' ')).join('\n');
    } catch (error) {
      console.error(`Error extracting text from PDF ${pdfPath}:`, error);
      return null;
    }
  }
  
  /**
   * Extract text from a DOCX file
   * @param {string} docxPath - Path to the DOCX file
   * @returns {Promise<string>} - Extracted text content
   */
  static async extractTextFromDocx(docxPath) {
    try {
      const result = await mammoth.extractRawText({ path: docxPath });
      return result.value;
    } catch (error) {
      console.error(`Error extracting text from DOCX ${docxPath}:`, error);
      return null;
    }
  }
  
  /**
   * Determine the experience level from filename and content
   * @param {string} filename - CV filename
   * @param {string} content - CV content
   * @returns {number} - Experience level (1-4)
   */
  static determineExperienceLevel(filename, content) {
    // First check filename for level indicators
    if (filename.includes('_I.') || filename.includes('_I_')) {
      return 1; // Entry level (<5 years)
    } else if (filename.includes('_II.') || filename.includes('_II_')) {
      return 2; // Mid level (<7 years)
    } else if (filename.includes('_III.') || filename.includes('_III_')) {
      return 3; // Senior level (<10 years)
    } else if (filename.includes('_IV.') || filename.includes('_IV_') || filename.includes('_IIII.') || filename.includes('_IIII_')) {
      return 4; // Expert level (>10 years)
    }
    
    // If not found in filename, analyze content
    const contentLower = content.toLowerCase();
    
    // Look for years of experience
    const yearsRegex = /(\d+)[\s-]*years? (?:of )?experience/i;
    const yearsMatch = content.match(yearsRegex);
    if (yearsMatch && yearsMatch[1]) {
      const years = parseInt(yearsMatch[1]);
      if (years < 5) return 1;
      if (years < 7) return 2;
      if (years < 10) return 3;
      return 4;
    }
    
    // Look for level indicators in content
    if (contentLower.includes('senior') || contentLower.includes('lead')) {
      return 3;
    } else if (contentLower.includes('principal') || contentLower.includes('director')) {
      return 4;
    } else if (contentLower.includes('junior') || contentLower.includes('entry')) {
      return 1;
    }
    
    // Default to mid-level if no clear indicators
    return 2;
  }
  
  /**
   * Determine the role type from filename and content
   * @param {string} filename - CV filename
   * @param {string} content - CV content
   * @returns {string} - Role type
   */
  static determineRoleType(filename, content) {
    // First check filename for role indicators
    if (filename.includes('Financial_Analyst') || filename.includes('Financial-Analyst') || filename.includes('FA')) {
      return 'Financial Analyst';
    } else if (filename.includes('Business_Analyst') || filename.includes('Business-Analyst') || filename.includes('BA')) {
      return 'Business Analyst';
    } else if (filename.includes('Budget_Analyst') || filename.includes('Budget-Analyst')) {
      return 'Budget Analyst';
    } else if (filename.includes('ERP_Business_Analyst') || filename.includes('ERP-Business-Analyst') || filename.includes('ERP')) {
      return 'ERP Business Analyst';
    }
    
    // If not found in filename, analyze content
    const contentLower = content.toLowerCase();
    
    // Count occurrences of role-related terms
    const roleScores = {
      'Financial Analyst': 0,
      'Business Analyst': 0,
      'Budget Analyst': 0,
      'ERP Business Analyst': 0
    };
    
    // Financial Analyst indicators
    if (contentLower.includes('financial analyst')) roleScores['Financial Analyst'] += 10;
    if (contentLower.includes('financial reporting')) roleScores['Financial Analyst'] += 5;
    if (contentLower.includes('financial analysis')) roleScores['Financial Analyst'] += 5;
    if (contentLower.includes('financial modeling')) roleScores['Financial Analyst'] += 5;
    if (contentLower.includes('forecasting')) roleScores['Financial Analyst'] += 3;
    if (contentLower.includes('budgeting')) roleScores['Financial Analyst'] += 3;
    
    // Business Analyst indicators
    if (contentLower.includes('business analyst')) roleScores['Business Analyst'] += 10;
    if (contentLower.includes('requirements gathering')) roleScores['Business Analyst'] += 5;
    if (contentLower.includes('process improvement')) roleScores['Business Analyst'] += 5;
    if (contentLower.includes('business process')) roleScores['Business Analyst'] += 5;
    if (contentLower.includes('stakeholder')) roleScores['Business Analyst'] += 3;
    if (contentLower.includes('documentation')) roleScores['Business Analyst'] += 3;
    
    // Budget Analyst indicators
    if (contentLower.includes('budget analyst')) roleScores['Budget Analyst'] += 10;
    if (contentLower.includes('budget preparation')) roleScores['Budget Analyst'] += 5;
    if (contentLower.includes('budget planning')) roleScores['Budget Analyst'] += 5;
    if (contentLower.includes('fiscal')) roleScores['Budget Analyst'] += 5;
    if (contentLower.includes('appropriation')) roleScores['Budget Analyst'] += 3;
    if (contentLower.includes('allocation')) roleScores['Budget Analyst'] += 3;
    
    // ERP Business Analyst indicators
    if (contentLower.includes('erp')) roleScores['ERP Business Analyst'] += 10;
    if (contentLower.includes('sap')) roleScores['ERP Business Analyst'] += 5;
    if (contentLower.includes('oracle')) roleScores['ERP Business Analyst'] += 5;
    if (contentLower.includes('system implementation')) roleScores['ERP Business Analyst'] += 5;
    if (contentLower.includes('configuration')) roleScores['ERP Business Analyst'] += 3;
    if (contentLower.includes('integration')) roleScores['ERP Business Analyst'] += 3;
    
    // Find role with highest score
    let maxScore = 0;
    let maxRole = 'Financial Analyst'; // Default
    
    for (const [role, score] of Object.entries(roleScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxRole = role;
      }
    }
    
    return maxRole;
  }
  
  /**
   * Extract skills from CV content
   * @param {string} content - CV content
   * @returns {Object} - Skills by category
   */
  static extractSkills(content) {
    const contentLower = content.toLowerCase();
    
    // Define skill categories and keywords
    const skillCategories = {
      financial: [
        'financial analysis', 'financial reporting', 'financial modeling', 'forecasting',
        'budgeting', 'variance analysis', 'cost analysis', 'profit and loss', 'p&l',
        'balance sheet', 'cash flow', 'accounting', 'audit', 'taxation', 'financial planning',
        'financial statements', 'financial performance', 'kpi', 'metrics', 'financial strategy'
      ],
      business: [
        'business analysis', 'requirements gathering', 'process improvement', 'business process',
        'stakeholder management', 'documentation', 'business case', 'business requirements',
        'functional requirements', 'use cases', 'user stories', 'agile', 'scrum', 'waterfall',
        'business strategy', 'business transformation', 'change management', 'project management'
      ],
      technical: [
        'excel', 'powerpoint', 'word', 'access', 'vba', 'macros', 'sql', 'database',
        'power bi', 'tableau', 'data visualization', 'erp', 'sap', 'oracle', 'quickbooks',
        'python', 'r', 'programming', 'api', 'automation', 'power query', 'power pivot',
        'data analysis', 'data modeling', 'etl', 'bi', 'business intelligence', 'reporting'
      ],
      leadership: [
        'leadership', 'team management', 'mentoring', 'coaching', 'strategic planning',
        'decision making', 'problem solving', 'critical thinking', 'communication',
        'presentation', 'negotiation', 'conflict resolution', 'team building', 'collaboration',
        'cross-functional', 'project leadership', 'people management', 'performance management'
      ]
    };
    
    // Score each skill category
    const skills = {};
    
    for (const [category, keywords] of Object.entries(skillCategories)) {
      let score = 0;
      
      for (const keyword of keywords) {
        // Count occurrences of keyword
        const regex = new RegExp(keyword, 'gi');
        const matches = contentLower.match(regex);
        
        if (matches) {
          score += matches.length;
        }
      }
      
      // Normalize score (0-10 scale)
      skills[category] = Math.min(10, Math.round(score / 3));
    }
    
    return skills;
  }
  
  /**
   * Extract education information from CV content
   * @param {string} content - CV content
   * @returns {Array} - Education entries
   */
  static extractEducation(content) {
    const education = [];
    
    // Look for education section
    const educationRegex = /education|academic background|qualifications/i;
    const educationMatch = content.match(educationRegex);
    
    if (educationMatch) {
      // Extract education entries
      const degreeRegex = /(bachelor|master|mba|phd|doctorate|diploma|certificate|certification|degree|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?)/i;
      const degreeMatches = content.match(new RegExp(`${degreeRegex.source}[^.]*`, 'gi'));
      
      if (degreeMatches) {
        for (const match of degreeMatches) {
          education.push(match.trim());
        }
      }
    }
    
    return education;
  }
  
  /**
   * Extract work experience from CV content
   * @param {string} content - CV content
   * @returns {Array} - Experience entries
   */
  static extractExperience(content) {
    const experience = [];
    
    // Look for experience section
    const experienceRegex = /experience|work history|employment|career/i;
    const experienceMatch = content.match(experienceRegex);
    
    if (experienceMatch) {
      // Extract company names and positions
      const companyRegex = /(?:^|\n)([A-Z][A-Za-z0-9\s&.,]+)(?:\n|$)/g;
      let match;
      
      while ((match = companyRegex.exec(content)) !== null) {
        const company = match[1].trim();
        
        // Skip if it's likely not a company name
        if (company.length < 3 || company.match(/^(and|the|or|if|but|education|experience|skills|references)$/i)) {
          continue;
        }
        
        experience.push(company);
      }
    }
    
    return experience;
  }
  
  /**
   * Extract keywords from CV content
   * @param {string} content - CV content
   * @returns {Array} - Keywords
   */
  static extractKeywords(content) {
    // Tokenize content
    const tokens = tokenizer.tokenize(content);
    
    // Remove stop words and short words
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'from', 'by', 'for', 'with', 'about', 'to', 'in', 'on', 'of'];
    const filteredTokens = tokens.filter(token => 
      token.length > 2 && !stopWords.includes(token.toLowerCase())
    );
    
    // Stem tokens
    const stemmedTokens = filteredTokens.map(token => stemmer.stem(token));
    
    // Count token frequencies
    const tokenCounts = {};
    for (const token of stemmedTokens) {
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    }
    
    // Sort by frequency
    const sortedTokens = Object.entries(tokenCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    // Get top keywords
    const keywords = sortedTokens.slice(0, 50);
    
    // Add specific skill keywords
    const skillKeywords = [
      'financial analysis', 'financial reporting', 'financial modeling', 'forecasting',
      'budgeting', 'variance analysis', 'excel', 'power bi', 'sql', 'erp', 'sap',
      'oracle', 'business analysis', 'requirements gathering', 'process improvement',
      'stakeholder management', 'project management', 'data analysis', 'reporting'
    ];
    
    for (const skill of skillKeywords) {
      if (content.toLowerCase().includes(skill.toLowerCase())) {
        keywords.push(skill);
      }
    }
    
    return [...new Set(keywords)]; // Remove duplicates
  }
}

/**
 * Job Analyzer class - handles analyzing job descriptions
 */
class JobAnalyzer {
  /**
   * Analyze a job description
   * @param {Object} job - Job object
   * @returns {Object} - Job analysis results
   */
  static analyzeJobDescription(job) {
    if (!job || !job.description) {
      return null;
    }
    
    const description = job.description;
    const title = job.title || '';
    
    // Analyze job components
    const roleType = this.determineRoleType(title, description);
    const experienceLevel = this.determineExperienceLevel(title, description);
    const requiredSkills = this.extractRequiredSkills(description);
    const keywords = this.extractKeywords(title, description);
    const roleScore = this.calculateRoleScore(title, description);
    
    return {
      roleType,
      experienceLevel,
      requiredSkills,
      keywords,
      roleScore,
      title,
      description
    };
  }
  
  /**
   * Determine the role type from job title and description
   * @param {string} title - Job title
   * @param {string} description - Job description
   * @returns {string} - Role type
   */
  static determineRoleType(title, description) {
    const titleLower = title.toLowerCase();
    const descriptionLower = description.toLowerCase();
    
    // Check title fir<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>