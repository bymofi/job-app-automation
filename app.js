// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let jobs = [];
    let cvs = [];
    let applications = [];
    let config = {
        keywords: ['Financial Analyst', 'Business Analyst', 'Budget Analyst', 'ERP Business Analyst'],
        locations: ['Canada', 'Remote'],
        autoApplyThreshold: 80,
        autoApplyEnabled: false,
        platforms: ['LinkedIn', 'Indeed', 'Glassdoor', 'FuzeHR', 'Quantum', 'Canada Job Bank']
    };
    let currentJobId = null;
    let currentCvFilename = null;

    // Initialize the application
    init();

    // Initialize function
    async function init() {
        // Load configuration
        await loadConfig();
        
        // Load CVs
        await loadCVs();
        
        // Load jobs
        await loadJobs();
        
        // Load applications
        await loadApplications();
        
        // Update dashboard
        updateDashboard();
        
        // Set up event listeners
        setupEventListeners();
    }

    // Load configuration from server
    async function loadConfig() {
        try {
            showLoading('Loading configuration...');
            const response = await fetch('/api/config');
            config = await response.json();
            
            // Update UI with config values
            document.getElementById('auto-apply-threshold').value = config.autoApplyThreshold;
            document.getElementById('threshold-value').textContent = `${config.autoApplyThreshold}%`;
            document.getElementById('auto-apply-switch').checked = config.autoApplyEnabled;
            document.getElementById('auto-apply-toggle').checked = config.autoApplyEnabled;
            
            // Update keywords
            const keywordsContainer = document.getElementById('keywords-container');
            keywordsContainer.innerHTML = '';
            config.keywords.forEach(keyword => {
                addKeywordBadge(keyword);
            });
            
            // Update locations
            const locationsContainer = document.getElementById('locations-container');
            locationsContainer.innerHTML = '';
            config.locations.forEach(location => {
                addLocationBadge(location);
            });
            
            // Update platforms
            config.platforms.forEach(platform => {
                const checkbox = document.getElementById(`${platform.toLowerCase().replace(/\s+/g, '-')}-checkbox`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            hideLoading();
        } catch (error) {
            console.error('Error loading configuration:', error);
            hideLoading();
        }
    }

    // Load CVs from server
    async function loadCVs() {
        try {
            showLoading('Loading CVs...');
            const response = await fetch('/api/cvs');
            cvs = await response.json();
            
            // Update CV count
            document.getElementById('cvs-count').textContent = cvs.length;
            
            // Render CVs
            renderCVs();
            
            hideLoading();
        } catch (error) {
            console.error('Error loading CVs:', error);
            hideLoading();
        }
    }

    // Load jobs from server
    async function loadJobs() {
        try {
            showLoading('Loading jobs...');
            const response = await fetch('/api/jobs');
            jobs = await response.json();
            
            // Update jobs count
            document.getElementById('jobs-count').textContent = jobs.length;
            
            // Render jobs
            renderJobs();
            
            // Render top matching jobs
            renderTopJobs();
            
            hideLoading();
        } catch (error) {
            console.error('Error loading jobs:', error);
            hideLoading();
        }
    }

    // Load applications from server
    async function loadApplications() {
        try {
            showLoading('Loading applications...');
            const response = await fetch('/api/applications');
            applications = await response.json();
            
            // Update applications count
            document.getElementById('applications-count').textContent = applications.length;
            
            // Render applications
            renderApplications();
            
            hideLoading();
        } catch (error) {
            console.error('Error loading applications:', error);
            hideLoading();
        }
    }

    // Update dashboard
    function updateDashboard() {
        // Update counts
        document.getElementById('jobs-count').textContent = jobs.length;
        document.getElementById('applications-count').textContent = applications.length;
        document.getElementById('cvs-count').textContent = cvs.length;
        
        // Update application statistics
        // This would normally use real data, but for demo we'll use placeholders
        
        // Render top matching jobs
        renderTopJobs();
    }

    // Render CVs
    function renderCVs() {
        const cvsContainer = document.getElementById('cvs-container');
        cvsContainer.innerHTML = '';
        
        const filterValue = document.getElementById('cv-filter-select').value;
        
        let filteredCVs = cvs;
        if (filterValue !== 'all') {
            const roleType = filterValue.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            filteredCVs = cvs.filter(cv => cv.roleType === roleType);
        }
        
        if (filteredCVs.length === 0) {
            cvsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No CVs found. Upload a CV to get started.</p></div>';
            return;
        }
        
        filteredCVs.forEach(cv => {
            const experienceLevelText = getExperienceLevelText(cv.experienceLevel);
            
            const cvCard = document.createElement('div');
            cvCard.className = 'col-md-4 mb-4';
            cvCard.innerHTML = `
                <div class="card cv-card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${cv.roleType}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">Experience Level: ${experienceLevelText}</h6>
                        <p class="card-text">Filename: ${cv.filename}</p>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Financial Skills</small>
                                <small>${cv.skills.financial * 10}%</small>
                            </div>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-primary" role="progressbar" style="width: ${cv.skills.financial * 10}%;" aria-valuenow="${cv.skills.financial * 10}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Business Skills</small>
                                <small>${cv.skills.business * 10}%</small>
                            </div>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-success" role="progressbar" style="width: ${cv.skills.business * 10}%;" aria-valuenow="${cv.skills.business * 10}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small>Technical Skills</small>
                                <small>${cv.skills.technical * 10}%</small>
                            </div>
                            <div class="progress" style="height: 5px;">
                                <div class="progress-bar bg-info" role="progressbar" style="width: ${cv.skills.technical * 10}%;" aria-valuenow="${cv.skills.technical * 10}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-sm btn-primary view-cv-details" data-filename="${cv.filename}">View Details</button>
                        <button class="btn btn-sm btn-danger delete-cv" data-filename="${cv.filename}">Delete</button>
                    </div>
                </div>
            `;
            cvsContainer.appendChild(cvCard);
            
            // Add event listener to view CV details button
            cvCard.querySelector('.view-cv-details').addEventListener('click', function() {
                showCVDetails(cv.filename);
            });
            
            // Add event listener to delete CV button
            cvCard.querySelector('.delete-cv').addEventListener('click', function() {
                deleteCV(cv.filename);
            });
        });
    }

    // Render jobs
    function renderJobs() {
        const jobsContainer = document.getElementById('jobs-container');
        jobsContainer.innerHTML = '';
        
        const searchValue = document.getElementById('job-search-input').value.toLowerCase();
        const filterValue = document.getElementById('job-filter-select').value;
        
        let filteredJobs = jobs;
        
        // Apply search filter
        if (searchValue) {
            filteredJobs = filteredJobs.filter(job => 
                job.title.toLowerCase().includes(searchValue) || 
                job.company.toLowerCase().includes(searchValue) || 
                job.description.toLowerCase().includes(searchValue)
            );
        }
        
        // Apply match score filter
        if (filterValue === 'high-match') {
            filteredJobs = filteredJobs.filter(job => getJobMatchScore(job) >= 80);
        } else if (filterValue === 'medium-match') {
            filteredJobs = filteredJobs.filter(job => getJobMatchScore(job) >= 50 && getJobMatchScore(job) < 80);
        } else if (filterValue === 'low-match') {
            filteredJobs = filteredJobs.filter(job => getJobMatchScore(job) < 50);
        }
        
        if (filteredJobs.length === 0) {
            jobsContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No jobs found matching your criteria.</p></div>';
            return;
        }
        
        filteredJobs.forEach(job => {
            const matchScore = getJobMatchScore(job);
            const matchClass = matchScore >= 80 ? 'high' : matchScore >= 50 ? 'medium' : 'low';
            const bestMatchingCV = findBestMatchingCV(job);
            
            const jobCard = document.createElement('div');
            jobCard.className = 'col-md-4 mb-4';
            jobCard.innerHTML = `
                <div class="card job-card h-100">
                    <div class="card-body">
                        <div class="match-score ${matchClass}">${matchScore}</div>
                        <h5 class="card-title">${job.title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${job.company}</h6>
                        <p class="card-text">${job.location}</p>
                        <p class="card-text"><small class="text-muted">Posted: ${formatDate(job.datePosted)}</small></p>
                        <p class="card-text"><small class="text-muted">Source: ${job.source}</small></p>
                        ${bestMatchingCV ? `<p class="card-text"><small class="text-muted">Best CV: ${bestMatchingCV.filename}</small></p>` : ''}
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-sm btn-primary view-job-details" data-id="${job.id}">View Details</button>
                        <button class="btn btn-sm btn-success apply-job" data-id="${job.id}">Apply</button>
                    </div>
                </div>
            `;
            jobsContainer.appendChild(jobCard);
            
            // Add event listener to view job details button
            jobCard.querySelector('.view-job-details').addEventListener('click', function() {
                showJobDetails(job.id);
            });
            
            // Add event listener to apply button
            jobCard.querySelector('.apply-job').addEventListener('click', function() {
                applyToJob(job.id);
            });
        });
    }

    // Render top matching jobs
    function renderTopJobs() {
        const topJobsContainer = document.getElementById('top-jobs-container');
        topJobsContainer.innerHTML = '';
        
        // Sort jobs by match score
        const sortedJobs = [...jobs].sort((a, b) => getJobMatchScore(b) - getJobMatchScore(a));
        
        // Get top 3 jobs
        const topJobs = sortedJobs.slice(0, 3);
        
        if (topJobs.length === 0) {
            topJobsContainer.innerHTML = '<div class="col-12 text-center py-3"><p>No jobs found. Run a job search to get started.</p></div>';
            return;
        }
        
        topJobs.forEach(job => {
            const matchScore = getJobMatchScore(job);
            const matchClass = matchScore >= 80 ? 'high' : matchScore >= 50 ? 'medium' : 'low';
            const bestMatchingCV = findBestMatchingCV(job);
            
            const jobCard = document.createElement('div');
            jobCard.className = 'col-md-4 mb-4';
            jobCard.innerHTML = `
                <div class="card job-card h-100">
                    <div class="card-body">
                        <div class="match-score ${matchClass}">${matchScore}</div>
                        <h5 class="card-title">${job.title}</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${job.company}</h6>
                        <p class="card-text">${job.location}</p>
                        <p class="card-text"><small class="text-muted">Posted: ${formatDate(job.datePosted)}</small></p>
                        ${bestMatchingCV ? `<p class="card-text"><small class="text-muted">Best CV: ${bestMatchingCV.filename}</small></p>` : ''}
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <button class="btn btn-sm btn-primary view-job-details" data-id="${job.id}">View Details</button>
                        <button class="btn btn-sm btn-success apply-job" data-id="${job.id}">Apply</button>
                    </div>
                </div>
            `;
            topJobsContainer.appendChild(jobCard);
            
            // Add event listener to view job details button
            jobCard.querySelector('.view-job-details').addEventListener('click', function() {
                showJobDetails(job.id);
            });
            
            // Add event listener to apply button
            jobCard.querySelector('.apply-job').addEventListener('click', function() {
                applyToJob(job.id);
            });
        });
    }

    // Render applications
    function renderApplications() {
        const applicationsTableBody = document.getElementById('applications-table-body');
        applicationsTableBody.innerHTML = '';
        
        const searchValue = document.getElementById('application-search-input').value.toLowerCase();
        const filterValue = document.getElementById('application-filter-select').value;
        
        let filteredApplications = applications;
        
        // Apply search<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>