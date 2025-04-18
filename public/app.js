// Update the API endpoints to match Firebase Functions
document.addEventListener('DOMContentLoaded', function() {
    // API base URL - update to point to Firebase Functions
    const API_BASE_URL = '/api';
    
    // Navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    const pages = document.querySelectorAll('.page');
    
    // Initialize the app
    init();
    
    function init() {
        // Set up navigation
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetPage = this.getAttribute('data-page');
                showPage(targetPage);
                
                // Load page-specific data
                if (targetPage === 'dashboard') {
                    loadDashboard();
                } else if (targetPage === 'jobs') {
                    loadJobs();
                } else if (targetPage === 'cvs') {
                    loadCVs();
                } else if (targetPage === 'applications') {
                    loadApplications();
                } else if (targetPage === 'settings') {
                    loadSettings();
                }
            });
        });
        
        // Set up other event listeners
        document.getElementById('run-now-btn').addEventListener('click', runJobSearch);
        document.getElementById('search-jobs-btn').addEventListener('click', runJobSearch);
        document.getElementById('back-to-jobs-btn').addEventListener('click', () => {
            document.getElementById('job-detail-view').style.display = 'none';
            document.querySelector('.card:not(#job-detail-view)').style.display = 'block';
        });
        
        // Show dashboard by default
        showPage('dashboard');
        loadDashboard();
    }
    
    function showPage(pageId) {
        pages.forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById(`${pageId}-page`).style.display = 'block';
    }
    
    function loadDashboard() {
        // Load counts
        fetchJobsCount();
        fetchCVsCount();
        fetchApplicationsCount();
        fetchAutoApplyStatus();
        
        // Load recent jobs
        fetchRecentJobs();
    }
    
    function fetchJobsCount() {
        fetch(`${API_BASE_URL}/jobs`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('jobs-count').textContent = data.length;
            })
            .catch(error => {
                console.error('Error fetching jobs count:', error);
                showNotification('Error loading jobs count', true);
            });
    }
    
    function fetchCVsCount() {
        fetch(`${API_BASE_URL}/cvs`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('cvs-count').textContent = data.length;
            })
            .catch(error => {
                console.error('Error fetching CVs count:', error);
                showNotification('Error loading CVs count', true);
            });
    }
    
    function fetchApplicationsCount() {
        fetch(`${API_BASE_URL}/applications`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('applications-count').textContent = data.length;
            })
            .catch(error => {
                console.error('Error fetching applications count:', error);
                showNotification('Error loading applications count', true);
            });
    }
    
    function fetchAutoApplyStatus() {
        fetch(`${API_BASE_URL}/config`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('auto-apply-status').textContent = data.autoApplyEnabled ? 'On' : 'Off';
            })
            .catch(error => {
                console.error('Error fetching auto-apply status:', error);
                showNotification('Error loading auto-apply status', true);
            });
    }
    
    function fetchRecentJobs() {
        fetch(`${API_BASE_URL}/jobs`)
            .then(response => response.json())
            .then(data => {
                const recentJobs = data.slice(0, 3); // Get most recent 3 jobs
                const recentJobsContainer = document.getElementById('recent-jobs');
                recentJobsContainer.innerHTML = '';
                
                if (recentJobs.length === 0) {
                    recentJobsContainer.innerHTML = '<p>No jobs found. Run a job search to find new opportunities.</p>';
                    return;
                }
                
                recentJobs.forEach(job => {
                    const jobCard = createJobCard(job);
                    recentJobsContainer.appendChild(jobCard);
                });
            })
            .catch(error => {
                console.error('Error fetching recent jobs:', error);
                showNotification('Error loading recent jobs', true);
            });
    }
    
    function loadJobs() {
        fetch(`${API_BASE_URL}/jobs`)
            .then(response => response.json())
            .then(data => {
                const jobsContainer = document.getElementById('jobs-list');
                jobsContainer.innerHTML = '';
                
                if (data.length === 0) {
                    jobsContainer.innerHTML = '<p>No jobs found. Run a job search to find new opportunities.</p>';
                    return;
                }
                
                data.forEach(job => {
                    const jobCard = createJobCard(job);
                    jobsContainer.appendChild(jobCard);
                });
            })
            .catch(error => {
                console.error('Error fetching jobs:', error);
                showNotification('Error loading jobs', true);
            });
    }
    
    function createJobCard(job) {
        const jobCard = document.createElement('div');
        jobCard.className = 'job-card';
        jobCard.dataset.jobId = job.id;
        
        const dateFormatted = new Date(job.date).toLocaleDateString();
        
        jobCard.innerHTML = `
            <div class="job-title">${job.title}</div>
            <div class="job-company">${job.company}</div>
            <div class="job-location">${job.location}</div>
            <div>
                <span class="job-platform">${job.platform}</span>
                <span class="job-date">${dateFormatted}</span>
            </div>
            ${job.applied ? '<div class="job-match status-applied">Applied</div>' : ''}
        `;
        
        jobCard.addEventListener('click', () => {
            showJobDetail(job.id);
        });
        
        return jobCard;
    }
    
    function showJobDetail(jobId) {
        // Hide jobs list
        document.querySelector('.card:not(#job-detail-view)').style.display = 'none';
        
        // Show job detail view
        const jobDetailView = document.getElementById('job-detail-view');
        jobDetailView.style.display = 'block';
        
        // Show loading
        jobDetailView.innerHTML = `
            <div class="card-header">
                <h2 class="card-title">Loading...</h2>
                <button id="back-to-jobs-btn" class="btn">Back to Jobs</button>
            </div>
            <div class="loading" style="display: block;">
                <div class="spinner"></div>
                <p>Loading job details...</p>
            </div>
        `;
        
        document.getElementById('back-to-jobs-btn').addEventListener('click', () => {
            jobDetailView.style.display = 'none';
            document.querySelector('.card:not(#job-detail-view)').style.display = 'block';
        });
        
        // Fetch job details
        fetch(`${API_BASE_URL}/jobs/${jobId}`)
            .then(response => response.json())
            .then(job => {
                // Fetch best matching CV
                return fetch(`${API_BASE_URL}/match/${jobId}`)
                    .then(response => response.json())
                    .then(matchData => {
                        return { job, matchData };
                    });
            })
            .then(data => {
                const { job, matchData } = data;
                const dateFormatted = new Date(job.date).toLocaleDateString();
                
                jobDetailView.innerHTML = `
                    <div class="card-header">
                        <h2 class="card-title" id="job-detail-title">${job.title}</h2>
                        <button id="back-to-jobs-btn" class="btn">Back to Jobs</button>
                    </div>
                    <div class="job-detail">
                        <div>
                            <h3 id="job-detail-company">${job.company}</h3>
                            <p id="job-detail-location">${job.location}</p>
                            <p><strong>Platform:</strong> <span id="job-detail-platform">${job.platform}</span></p>
                            <p><strong>Posted:</strong> <span id="job-detail-date">${dateFormatted}</span></p>
                        </div>
                        
                        <div>
                            <h3>Job Description</h3>
                            <div id="job-detail-description" class="job-description">${job.description}</div>
                        </div>
                        
                        <div>
                            <h3>Best Match</h3>
                            <div class="match-info">
                                <div class="match-score">${matchData.bestMatch.score}%</div>
                                <div class="match-cv">${matchData.bestMatch.cv.filename}</div>
                            </div>
                            
                            <div class="tabs">
                                <div class="tab active" data-tab="gap-analysis">Gap Analysis</div>
                                <div class="tab" data-tab="cover-letter">Cover Letter</div>
                            </div>
                            
                            <div class="tab-content active" id="gap-analysis-tab">
                                <div class="gap-analysis">
                                    <h4>Missing Skills</h4>
                                    <ul class="missing-skills" id="missing-skills-list">
                                        <li>Loading...</li>
                                    </ul>
                                    
                                    <h4>Recommendations</h4>
                                    <ul class="recommendations" id="recommendations-list">
                                        <li>Loading...</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div class="tab-content" id="cover-letter-tab">
                                <div class="cover-letter" id="cover-letter-content">
                                    Loading...
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <button id="apply-btn" class="btn btn-success" ${job.applied ? 'disabled' : ''}>
                                ${job.applied ? 'Already Applied' : 'Apply Now'}
                            </button>
                        </div>
                    </div>
                `;
                
                // Set up tabs
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    tab.addEventListener('click', function() {
                        // Remove active class from all tabs
                        tabs.forEach(t => t.classList.remove('active'));
                        
                        // Add active class to clicked tab
                        this.classList.add('active');
                        
                        // Hide all tab content
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        
                        // Show selected tab content
                        const tabId = this.getAttribute('data-tab');
                        document.getElementById(`${tabId}-tab`).classList.add('active');
                    });
                });
                
                // Set up back button
                document.getElementById('back-to-jobs-btn').addEventListener('click', () => {
                    jobDetailView.style.display = 'none';
                    document.querySelector('.card:not(#job-detail-view)').style.display = 'block';
                });
                
                // Set up apply button
                const applyBtn = document.getElementById('apply-btn');
                if (!job.applied) {
                    applyBtn.addEventListener('click', () => {
                        applyToJob(job.id, matchData.bestMatch.cv.id);
                    });
                }
                
                // Load gap analysis
                fetch(`${API_BASE_URL}/gap-analysis/${jobId}/${matchData.bestMatch.cv.id}`)
                    .then(response => response.json())
                    .then(gapData => {
                        const missingSkillsList = document.getElementById('missing-skills-list');
                        const recommendationsList = document.getElementById('recommendations-list');
                        
                        missingSkillsList.innerHTML = '';
                        recommendationsList.innerHTML = '';
                        
                        if (gapData.missingSkills.length === 0) {
                            missingSkillsList.innerHTML = '<li>No missing skills identified</li>';
                        } else {
                            gapData.missingSkills.forEach(skill => {
                                const li = document.createElement('li');
                                li.textContent = skill;
                                missingSkillsList.appendChild(li);
                            });
                        }
                        
                        gapData.recommendations.forEach(recommendation => {
                            const li = document.createElement('li');
                            li.textContent = recommendation;
                            recommendationsList.appendChild(li);
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching gap analysis:', error);
                        document.getElementById('missing-skills-list').innerHTML = '<li>Error loading gap analysis</li>';
                        document.getElementById('recommendations-list').innerHTML = '<li>Error loading recommendations</li>';
                    });
                
                // Load cover letter
                fetch(`${API_BASE_URL}/cover-letter/${jobId}/${matchData.bestMatch.cv.id}`)
                    .then(response => response.json())
                    .then(coverLetterData => {
                        document.getElementById('cover-letter-content').textContent = coverLetterData.coverLetter;
                    })
                    .catch(error => {
                        console.error('Error fetching cover letter:', error);
                        document.getElementById('cover-letter-content').textContent = 'Error loading cover letter';
                    });
            })
            .catch(error => {
                console.error('Error fetching job details:', error);
                jobDetailView.innerHTML = `
                    <div class="card-header">
                        <h2 class="card-title">Error</h2>
                        <button id="back-to-jobs-btn" class="btn">Back to Jobs</button>
                    </div>
                    <div class="job-detail">
                        <p>Error loading job details. Please try again later.</p>
                    </div>
                `;
                
                document.getElementById('back-to-jobs-btn').addEventListener('click', () => {
                    jobDetailView.style.display = 'none';
                    document.querySelector('.card:not(#job-detail-view)').style.display = 'block';
                });
            });
    }
    
    function applyToJob(jobId, cvId) {
        // Show loading
        const applyBtn = document.getElementById('apply-btn');
        applyBtn.textContent = 'Applying...';
        applyBtn.disabled = true;
        
        // Send application request
        fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jobId, cvId })
        })
            .then(response => response.json())
            .then(data => {
                applyBtn.textContent = 'Applied';
                showNotification('Application submitted successfully');
            })
            .catch(error => {
                console.error('Error applying to job:', error);
                applyBtn.textContent = 'Apply Now';
                applyBtn.disabled = false;
                showNotification('Error submitting application', true);
            });
    }
    
    function loadCVs() {
        fetch(`${API_BASE_URL}/cvs`)
            .then(response => response.json())
            .then(data => {
                const cvsContainer = document.getElementById('cvs-list');
                cvsContainer.innerHTML = '';
                
                if (data.length === 0) {
                    cvsContainer.innerHTML = '<p>No CVs found. Upload a CV to get started.</p>';
                    return;
                }
                
                data.forEach(cv => {
                    const cvCard = document.createElement('div');
                    cvCard.className = 'cv-card';
                    
                    const uploadDate = new Date(cv.uploadDate).toLocaleDateString();
                    
                    cvCard.innerHTML = `
                        <div class="cv-filename">${cv.filename}</div>
                        <div class="cv-type">${cv.type}</div>
                        <div class="cv-level">${cv.experienceLevel}</div>
                        <div class="cv-date">Uploaded: ${uploadDate}</div>
                    `;
                    
                    cvsContainer.appendChild(cvCard);
                });
            })
            .catch(error => {
                console.error('Error fetching CVs:', error);
                showNotification('Error loading CVs', true);
            });
    }
    
    function loadApplications() {
        fetch(`${API_BASE_URL}/applications`)
            .then(response => response.json())
            .then(data => {
                const applicationsContainer = document.getElementById('applications-list');
                
                if (data.length === 0) {
                    applicationsContainer.innerHTML = '<p>No applications found. Apply to jobs to see your applications here.</p>';
                    return;
                }
                
                // Sort by date (newest first)
                data.sort((a, b) => new Date(b.date) - new Date(a.date));
                
                const table = document.createElement('table');
                table.className = 'application-list';
                
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>CV</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                `;
                
                const tbody = table.querySelector('tbody');
                
                data.forEach(application => {
                    const tr = document.createElement('tr');
                    
                    const dateFormatted = new Date(application.date).toLocaleDateString();
                    
                    tr.innerHTML = `
                        <td>${dateFormatted}</td>
                        <td>${application.jobTitle}</td>
                        <td>${application.company}</td>
                        <td>${application.cvFilename}</td>
                        <td><span class="status-badge status-${application.status.toLowerCase()}">${application.status}</span></td>
                    `;
                    
                    tbody.appendChild(tr);
                });
                
                applicationsContainer.innerHTML = '';
                applicationsContainer.appendChild(table);
            })
            .catch(error => {
                console.error('Error fetching applications:', error);
                showNotification('Error loading applications', true);
            });
    }
    
    function loadSettings() {
        fetch(`${API_BASE_URL}/config`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('auto-apply-toggle').checked = data.autoApplyEnabled;
                document.getElementById('auto-apply-threshold').value = data.autoApplyThreshold;
                
                const keywordsInput = document.getElementById('keywords');
                keywordsInput.value = data.keywords.join(', ');
                
                const locationsInput = document.getElementById('locations');
                locationsInput.value = data.locations.join(', ');
                
                const platformsInput = document.getElementById('platforms');
                platformsInput.value = data.platforms.join(', ');
                
                // Set up save button
                document.getElementById('save-settings-btn').addEventListener('click', saveSettings);
            })
            .catch(error => {
                console.error('Error fetching settings:', error);
                showNotification('Error loading settings', true);
            });
    }
    
    function saveSettings() {
        const autoApplyEnabled = document.getElementById('auto-apply-toggle').checked;
        const autoApplyThreshold = parseInt(document.getElementById('auto-apply-threshold').value);
        
        const keywordsInput = document.getElementById('keywords').value;
        const keywords = keywordsInput.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
        
        const locationsInput = document.getElementById('locations').value;
        const locations = locationsInput.split(',').map(location => location.trim()).filter(location => location);
        
        const platformsInput = document.getElementById('platforms').value;
        const platforms = platformsInput.split(',').map(platform => platform.trim()).filter(platform => platform);
        
        const settings = {
            autoApplyEnabled,
            autoApplyThreshold,
            keywords,
            locations,
            platforms
        };
        
        fetch(`${API_BASE_URL}/config`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        })
            .then(response => response.json())
            .then(data => {
                showNotification('Settings saved successfully');
            })
            .catch(error => {
                console.error('Error saving settings:', error);
                showNotification('Error saving settings', true);
            });
    }
    
    function runJobSearch() {
        // Show loading
        const runBtn = document.getElementById('run-now-btn');
        const searchBtn = document.getElementById('search-jobs-btn');
        
        runBtn.textContent = 'Searching...';
        runBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
        searchBtn.disabled = true;
        
        // Send search request
        fetch(`${API_BASE_URL}/search`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                runBtn.textContent = 'Run Now';
                runBtn.disabled = false;
                searchBtn.textContent = 'Search Jobs';
                searchBtn.disabled = false;
                
                showNotification(`${data.message}`);
                
                // Reload jobs
                loadJobs();
                loadDashboard();
            })
            .catch(error => {
                console.error('Error running job search:', error);
                runBtn.textContent = 'Run Now';
                runBtn.disabled = false;
                searchBtn.textContent = 'Search Jobs';
                searchBtn.disabled = false;
                
                showNotification('Error running job search', true);
            });
    }
    
    function showNotification(message, isError = false) {
        // Create notification element if it doesn't exist
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set notification content and style
        notification.textContent = message;
        notification.className = `notification ${isError ? 'error' : ''}`;
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});
