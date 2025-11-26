// ===== Backend Connection Check =====
// Check if backend is active before loading the app
async function checkBackendConnection() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app-container');
    const backendStatus = document.getElementById('backend-status');
    const mainStyles = document.getElementById('main-styles');
    
    try {
        // Try to reach the backend
        const response = await fetch('/api/question-papers', { 
            method: 'GET',
            timeout: 5000 
        });
        
        if (response.ok) {
            // Backend is active - load the app
            backendStatus.textContent = 'Backend connected successfully!';
            
            // Load main stylesheet
            mainStyles.media = 'all';
            mainStyles.removeAttribute('media');
            
            // Show app and hide loading screen
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                appContainer.style.display = 'block';
                initializeApp();
            }, 500);
            return true;
        } else {
            throw new Error('Backend returned error status');
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
        backendStatus.textContent = 'Backend unreachable. Some features may not work.';
        backendStatus.style.color = '#ff6b6b';
        
        // Still load the app but with limited functionality
        mainStyles.media = 'all';
        mainStyles.removeAttribute('media');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            appContainer.style.display = 'block';
            initializeApp();
        }, 2000);
        return false;
    }
}

// Initialize app after backend check
function initializeApp() {
    const form = document.getElementById('uploadForm');
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const sections = document.querySelectorAll('.view-section');
    
    if (!form) return;
    
    // Continue with normal initialization
    setupNavigation();
    setupFormHandler();
    showBackendWarningModal();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const sections = document.querySelectorAll('.view-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = link.dataset.target;
            if (target) {
                activateSection(target);
                if (target === 'view-question-papers') {
                    loadQuestionPapers();
                } else if (target === 'view-answer-sheets') {
                    loadAnswerSheets();
                }
            }
        });
    });
    
    activateSection('view-dashboard');
    loadQuestionPapers();
    loadAnswerSheets();
    loadSavedResults();
}

function setupFormHandler() {
    const form = document.getElementById('uploadForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loading = document.getElementById('loading');
        const resultsArea = document.getElementById('results-area');
        const resultsPlaceholder = document.getElementById('results-placeholder');
        const parsedContent = document.getElementById('parsed-content');
        
        // Reset UI
        resultsArea.style.display = 'none';
        if (resultsPlaceholder) {
            resultsPlaceholder.style.display = 'block';
        }
        loading.style.display = 'block';
        parsedContent.innerHTML = '';
        
        const fileInput = document.getElementById('fileInput');
        const docType = document.getElementById('docType').value;
        const ocrEngine = document.getElementById('ocrEngine').value;
        
        if(fileInput.files.length === 0) {
            alert("Please select a file!");
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('doc_type', docType);
        formData.append('ocr_engine', ocrEngine);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error("Upload failed");
            
            const data = await response.json();
            const docId = data.id;
            
            pollResults(docId);
            
        } catch (error) {
            alert("Error: " + error.message);
            loading.style.display = 'none';
        }
    });
}

function showBackendWarningModal() {
    document.addEventListener('DOMContentLoaded', () => {
        const backendWarningModal = document.getElementById('backend-warning-modal');
        const closeWarningBtn = document.getElementById('close-backend-warning');
        
        if (backendWarningModal && closeWarningBtn) {
            backendWarningModal.classList.remove('hidden');
            
            closeWarningBtn.addEventListener('click', () => {
                backendWarningModal.classList.add('hidden');
            });
            
            // Allow closing by clicking outside the modal
            backendWarningModal.addEventListener('click', (event) => {
                if (event.target === backendWarningModal) {
                    backendWarningModal.classList.add('hidden');
                }
            });
        }
    });
}

// ===== Original App Code =====

const form = document.getElementById('uploadForm');
const loading = document.getElementById('loading');
const resultsArea = document.getElementById('results-area');
const resultsPlaceholder = document.getElementById('results-placeholder');
const jsonOutput = document.getElementById('json-output');
const parsedContent = document.getElementById('parsed-content');
const statusLabel = document.getElementById('status-label');
const rawTextOutput = document.getElementById('raw-text');
const navLinks = document.querySelectorAll('.nav-link[data-target]');
const sections = document.querySelectorAll('.view-section');
const questionPapersContainer = document.getElementById('question-papers-container');
const questionPapersEmpty = document.getElementById('question-papers-empty');
const questionPapersViewer = document.getElementById('question-papers-viewer');
const questionPapersViewerWrapper = document.getElementById('question-papers-viewer-wrapper');
const questionPapersViewerPlaceholder = document.getElementById('question-papers-viewer-placeholder');
let questionPapersLoaded = false;
let questionPaperItems = [];
const answerSheetsContainer = document.getElementById('answer-sheets-container');
const answerSheetsEmpty = document.getElementById('answer-sheets-empty');
const answerSheetsViewer = document.getElementById('answer-sheets-viewer');
const answerSheetsViewerWrapper = document.getElementById('answer-sheets-viewer-wrapper');
const answerSheetsViewerPlaceholder = document.getElementById('answer-sheets-viewer-placeholder');
let answerSheetsLoaded = false;
let answerSheetItems = [];
const savedResultsContainer = document.getElementById('saved-results-container');
const savedResultsEmpty = document.getElementById('saved-results-empty');
const savedResultsSection = document.getElementById('saved-results-section');
let savedResultsLoaded = false;
let savedResultItems = [];
const dashboardContent = document.getElementById('dashboard-content');
let lastSavedResultsFetch = 0;
const SAVED_RESULTS_THROTTLE_MS = 5000; // Throttle to 5 seconds

// Show backend warning modal on page load
document.addEventListener('DOMContentLoaded', () => {
    const backendWarningModal = document.getElementById('backend-warning-modal');
    const closeWarningBtn = document.getElementById('close-backend-warning');
    
    if (backendWarningModal && closeWarningBtn) {
        backendWarningModal.classList.remove('hidden');
        
        closeWarningBtn.addEventListener('click', () => {
            backendWarningModal.classList.add('hidden');
        });
        
        // Allow closing by clicking outside the modal
        backendWarningModal.addEventListener('click', (event) => {
            if (event.target === backendWarningModal) {
                backendWarningModal.classList.add('hidden');
            }
        });
    }
});

function activateSection(sectionId) {
    sections.forEach(section => {
        section.classList.toggle('active', section.id === sectionId);
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.target === sectionId);
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        const target = link.dataset.target;
        if (target) {
            activateSection(target);
            if (target === 'view-question-papers') {
                loadQuestionPapers();
            } else if (target === 'view-answer-sheets') {
                loadAnswerSheets();
            }
        }
    });
});

activateSection('view-dashboard');
loadQuestionPapers();
loadAnswerSheets();
loadSavedResults();

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Reset UI
    resultsArea.style.display = 'none';
    if (resultsPlaceholder) {
        resultsPlaceholder.style.display = 'block';
    }
    loading.style.display = 'block';
    parsedContent.innerHTML = '';
    
    const fileInput = document.getElementById('fileInput');
    const docType = document.getElementById('docType').value;
    const ocrEngine = document.getElementById('ocrEngine').value;
    
    if(fileInput.files.length === 0) {
        alert("Please select a file!");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('doc_type', docType);
    formData.append('ocr_engine', ocrEngine);

    try {
        // 1. Upload File
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error("Upload failed");
        
        const data = await response.json();
        const docId = data.id;
        
        // 2. Start Polling for Results
        pollResults(docId);
        
    } catch (error) {
        alert("Error: " + error.message);
        loading.style.display = 'none';
    }
});

async function pollResults(docId) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`/api/results/${docId}`);
            const data = await res.json();
            
            // Update progress display
            if (data.status === 'processing') {
                loading.textContent = 'Processing with ' + (data.ocr_engine || 'selected OCR engine') + '... please wait.';
            } else if (data.status === 'queued') {
                loading.textContent = 'Queued... please wait.';
            }
            
            if (data.status === 'completed') {
                clearInterval(interval);
                displayResults(data);
            } else if (data.status === 'failed') {
                clearInterval(interval);
                displayResults(data);
            }
        } catch (e) {
            clearInterval(interval);
            console.error(e);
        }
    }, 2000); // Check every 2 seconds
}

function displayResults(data) {
    loading.style.display = 'none';
    resultsArea.style.display = 'grid';
    if (resultsPlaceholder) {
        resultsPlaceholder.style.display = 'none';
    }
    if (savedResultsSection) {
        savedResultsSection.style.display = 'block';
    }
    loadSavedResults(true);
    activateSection('view-results');

    // Update Badge
    if (data.status === 'failed') {
        statusLabel.textContent = "Failed";
        statusLabel.className = "status-badge badge-failed";
    } else {
        statusLabel.textContent = "Completed";
        statusLabel.className = "status-badge badge-success";
    }
    
    // Show Raw JSON
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    
    // Show Raw Text
    if (data.raw_text_pages && data.raw_text_pages.length > 0) {
        rawTextOutput.textContent = data.raw_text_pages.join('\n\n--- Page Break ---\n\n');
    } else {
        rawTextOutput.textContent = 'No raw text available.';
    }
    
    // Render Pretty List
    if (data.parsed_result && data.parsed_result.length > 0) {
        data.parsed_result.forEach(item => {
            const div = document.createElement('div');
            div.className = "list-group-item";

            let html = `<div class="item-header">
                            <h5>Q${item.q_no}</h5>
                            <span class="meta-pill">Confidence</span>
                        </div>
                        <p>${item.text || 'No text detected'}</p>`;

            if (item.subparts && item.subparts.length > 0) {
                html += `<p class="meta-detail">Sub-parts detected: ${item.subparts.length}</p>`;
            }

            div.innerHTML = html;
            parsedContent.appendChild(div);
        });
    } else {
        parsedContent.innerHTML = "<div class='alert'>No structured data extracted. Check Raw JSON.</div>";
    }
}

function toggleJson() {
    if (jsonOutput.style.display === 'none') {
        jsonOutput.style.display = 'block';
    } else {
        jsonOutput.style.display = 'none';
    }
}

function updateDashboard(files) {
    if (!dashboardContent) return;
    
    if (!files || files.length === 0) {
        dashboardContent.innerHTML = '<p style="margin: 0;">No active scans</p>';
        return;
    }

    // Count by status
    const completed = files.filter(f => f.status === 'completed').length;
    const failed = files.filter(f => f.status === 'failed').length;
    const processing = files.filter(f => f.status === 'processing').length;

    let html = `
        <div style="margin: 12px 0; line-height: 1.8;">
            <strong>Total Results:</strong> ${files.length}<br>
            <strong style="color: #4caf50;">✓ Completed:</strong> ${completed}<br>
    `;

    if (failed > 0) {
        html += `<strong style="color: #ff6b6b;">✗ Failed:</strong> ${failed}<br>`;
    }

    if (processing > 0) {
        html += `<strong style="color: #ffa500;">⊙ Processing:</strong> ${processing}<br>`;
    }

    html += '</div>';
    dashboardContent.innerHTML = html;
}

async function loadQuestionPapers(forceReload = false) {
    if (questionPapersLoaded && !forceReload) {
        return;
    }

    if (!questionPapersContainer || !questionPapersEmpty) {
        return;
    }

    questionPapersContainer.innerHTML = '';
    questionPapersEmpty.style.display = 'none';
    questionPaperItems = [];

    if (questionPapersViewerWrapper) {
        questionPapersViewerWrapper.style.display = 'none';
    }

    if (questionPapersViewerPlaceholder) {
        questionPapersViewerPlaceholder.style.display = 'none';
        questionPapersViewerPlaceholder.textContent = 'Select a question paper to preview.';
    }

    if (questionPapersViewer) {
        questionPapersViewer.src = '';
        questionPapersViewer.removeAttribute('title');
    }

    try {
        const response = await fetch('/api/question-papers');
        if (!response.ok) {
            throw new Error('Failed to load question papers');
        }

        const { files = [] } = await response.json();

        if (!files.length) {
            questionPapersEmpty.style.display = 'block';
            questionPapersLoaded = true;
            return;
        }

        const preferredPaper = 'eng_1.pdf';
        let preferredItem = null;

        files.forEach(({ name, url }) => {
            const item = document.createElement('div');
            item.className = 'doc-item';
            item.dataset.name = name;
            item.dataset.url = url;
            item.setAttribute('role', 'button');
            item.tabIndex = 0;

            const label = document.createElement('span');
            label.textContent = name;

            const actions = document.createElement('div');
            actions.className = 'doc-actions';

            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.textContent = 'View';
            viewButton.addEventListener('click', (event) => {
                event.stopPropagation();
                setActiveQuestionPaper(name, url, item);
            });

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.target = '_blank';
            downloadLink.rel = 'noopener noreferrer';
            downloadLink.textContent = 'Download';
            downloadLink.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            actions.appendChild(viewButton);
            actions.appendChild(downloadLink);

            item.appendChild(label);
            item.appendChild(actions);

            item.addEventListener('click', () => setActiveQuestionPaper(name, url, item));
            item.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveQuestionPaper(name, url, item);
                }
            });

            questionPapersContainer.appendChild(item);
            questionPaperItems.push(item);

            if (!preferredItem && name.toLowerCase() === preferredPaper) {
                preferredItem = item;
            }
        });

        const initialItem = preferredItem || questionPaperItems[0];
        if (initialItem) {
            const initialName = initialItem.dataset.name;
            const initialUrl = initialItem.dataset.url;
            if (initialName && initialUrl) {
                setActiveQuestionPaper(initialName, initialUrl, initialItem);
            }
        } else if (questionPapersViewerPlaceholder) {
            questionPapersViewerPlaceholder.style.display = 'block';
        }

        questionPapersLoaded = true;
    } catch (error) {
        questionPapersEmpty.textContent = 'Unable to load question papers. Please try again later.';
        questionPapersEmpty.style.display = 'block';
        if (questionPapersViewerWrapper) {
            questionPapersViewerWrapper.style.display = 'none';
        }
        if (questionPapersViewerPlaceholder) {
            questionPapersViewerPlaceholder.style.display = 'none';
        }
        console.error(error);
    }
}

function setActiveQuestionPaper(name, url, sourceItem) {
    if (!questionPapersViewer || !questionPapersViewerWrapper) {
        return;
    }

    questionPaperItems.forEach((item) => item.classList.remove('active'));

    if (sourceItem) {
        sourceItem.classList.add('active');
    }

    questionPapersViewer.src = url;
    questionPapersViewer.title = `Preview of ${name}`;
    questionPapersViewerWrapper.style.display = 'block';

    if (questionPapersViewerPlaceholder) {
        questionPapersViewerPlaceholder.style.display = 'none';
    }
}

async function loadAnswerSheets(forceReload = false) {
    if (answerSheetsLoaded && !forceReload) {
        return;
    }

    if (!answerSheetsContainer || !answerSheetsEmpty) {
        return;
    }

    answerSheetsContainer.innerHTML = '';
    answerSheetsEmpty.style.display = 'none';
    answerSheetItems = [];

    if (answerSheetsViewerWrapper) {
        answerSheetsViewerWrapper.style.display = 'none';
    }

    if (answerSheetsViewerPlaceholder) {
        answerSheetsViewerPlaceholder.style.display = 'none';
        answerSheetsViewerPlaceholder.textContent = 'Select an answer sheet to preview.';
    }

    if (answerSheetsViewer) {
        answerSheetsViewer.src = '';
        answerSheetsViewer.removeAttribute('title');
    }

    try {
        const response = await fetch('/api/answer-sheets');
        if (!response.ok) {
            throw new Error('Failed to load answer sheets');
        }

        const { files = [] } = await response.json();

        if (!files.length) {
            answerSheetsEmpty.style.display = 'block';
            answerSheetsLoaded = true;
            return;
        }

        files.forEach(({ name, url }) => {
            const item = document.createElement('div');
            item.className = 'doc-item';
            item.dataset.name = name;
            item.dataset.url = url;
            item.setAttribute('role', 'button');
            item.tabIndex = 0;

            const label = document.createElement('span');
            label.textContent = name;

            const actions = document.createElement('div');
            actions.className = 'doc-actions';

            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.textContent = 'View';
            viewButton.addEventListener('click', (event) => {
                event.stopPropagation();
                setActiveAnswerSheet(name, url, item);
            });

            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.target = '_blank';
            downloadLink.rel = 'noopener noreferrer';
            downloadLink.textContent = 'Download';
            downloadLink.addEventListener('click', (event) => {
                event.stopPropagation();
            });

            actions.appendChild(viewButton);
            actions.appendChild(downloadLink);

            item.appendChild(label);
            item.appendChild(actions);

            item.addEventListener('click', () => setActiveAnswerSheet(name, url, item));
            item.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveAnswerSheet(name, url, item);
                }
            });

            answerSheetsContainer.appendChild(item);
            answerSheetItems.push(item);
        });

        const initialItem = answerSheetItems[0];
        if (initialItem) {
            const initialName = initialItem.dataset.name;
            const initialUrl = initialItem.dataset.url;
            if (initialName && initialUrl) {
                setActiveAnswerSheet(initialName, initialUrl, initialItem);
            }
        } else if (answerSheetsViewerPlaceholder) {
            answerSheetsViewerPlaceholder.style.display = 'block';
        }

        answerSheetsLoaded = true;
    } catch (error) {
        answerSheetsEmpty.textContent = 'Unable to load answer sheets. Please try again later.';
        answerSheetsEmpty.style.display = 'block';
        if (answerSheetsViewerWrapper) {
            answerSheetsViewerWrapper.style.display = 'none';
        }
        if (answerSheetsViewerPlaceholder) {
            answerSheetsViewerPlaceholder.style.display = 'none';
        }
        console.error(error);
    }
}

function setActiveAnswerSheet(name, url, sourceItem) {
    if (!answerSheetsViewer || !answerSheetsViewerWrapper) {
        return;
    }

    answerSheetItems.forEach((item) => item.classList.remove('active'));

    if (sourceItem) {
        sourceItem.classList.add('active');
    }

    answerSheetsViewer.src = url;
    answerSheetsViewer.title = `Preview of ${name}`;
    answerSheetsViewerWrapper.style.display = 'block';

    if (answerSheetsViewerPlaceholder) {
        answerSheetsViewerPlaceholder.style.display = 'none';
    }
}

async function loadSavedResults(forceReload = false) {
    // Throttle API calls to prevent excessive requests
    const now = Date.now();
    if (!forceReload && (now - lastSavedResultsFetch) < SAVED_RESULTS_THROTTLE_MS) {
        return; // Skip if throttled
    }

    // Always reload when forceReload is true
    if (savedResultsLoaded && !forceReload) {
        lastSavedResultsFetch = now;
        return;
    }

    if (!savedResultsContainer || !savedResultsEmpty) {
        return;
    }

    lastSavedResultsFetch = now;

    // Always clear the container
    savedResultsContainer.innerHTML = '';
    savedResultsEmpty.style.display = 'none';
    savedResultItems = [];

    try {
        const response = await fetch('/api/saved-results');
        if (!response.ok) {
            throw new Error('Failed to load saved results');
        }

        const { files = [] } = await response.json();

        if (!files.length) {
            savedResultsEmpty.style.display = 'block';
            savedResultsLoaded = true;
            updateDashboard([]);
            return;
        }

        // Sort files by timestamp (newest first)
        const sortedFiles = [...files].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA; // descending order
        });

        // Deduplicate by id to avoid showing duplicates
        const seen = new Set();
        sortedFiles.forEach(({ id, name, status, doc_type, timestamp }) => {
            if (seen.has(id)) {
                return; // skip duplicates
            }
            seen.add(id);

            const item = document.createElement('div');
            item.className = 'doc-item';
            item.dataset.id = id;
            item.dataset.url = `/api/saved-results/${id}`;
            item.setAttribute('role', 'button');
            item.tabIndex = 0;

            const labelDiv = document.createElement('div');
            labelDiv.style.flex = '1';

            const label = document.createElement('span');
            label.textContent = name;
            label.style.display = 'block';
            label.style.fontWeight = '600';

            const meta = document.createElement('span');
            meta.style.fontSize = '0.8rem';
            meta.style.color = 'var(--text-secondary)';
            meta.style.display = 'block';
            meta.style.marginTop = '4px';
            // Parse ISO timestamp safely; if invalid, show raw string
            let timeLabel = timestamp;
            try {
                const parsed = new Date(timestamp);
                if (!isNaN(parsed.getTime())) {
                    timeLabel = parsed.toLocaleString();
                }
            } catch (e) {
                // leave timeLabel as-is
            }
            meta.textContent = `${doc_type} • ${status} • ${timeLabel}`;

            labelDiv.appendChild(label);
            labelDiv.appendChild(meta);

            const actions = document.createElement('div');
            actions.className = 'doc-actions';

            const viewButton = document.createElement('button');
            viewButton.type = 'button';
            viewButton.textContent = 'View';
            viewButton.addEventListener('click', (event) => {
                event.stopPropagation();
                loadAndDisplayResult(id);
            });

            actions.appendChild(viewButton);

            item.appendChild(labelDiv);
            item.appendChild(actions);

            item.addEventListener('click', () => loadAndDisplayResult(id));
            item.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    loadAndDisplayResult(id);
                }
            });

            savedResultsContainer.appendChild(item);
            savedResultItems.push(item);
        });

        const initialItem = savedResultItems[0];
        if (initialItem) {
            const initialId = initialItem.dataset.id;
            if (initialId) {
                loadAndDisplayResult(initialId);
            }
        }

        // Ensure the saved results panel is visible when we have saved files
        if (savedResultsSection) {
            savedResultsSection.style.display = 'block';
        }

        // Update dashboard with stats
        updateDashboard(files);

        savedResultsLoaded = true;
    } catch (error) {
        savedResultsEmpty.textContent = 'Unable to load saved results. Please try again later.';
        savedResultsEmpty.style.display = 'block';
        console.error(error);
    }
}

async function loadAndDisplayResult(resultId) {
    try {
        const response = await fetch(`/api/saved-results/${resultId}`);
        if (!response.ok) {
            throw new Error('Failed to load result');
        }

        const data = await response.json();

        savedResultItems.forEach((item) => item.classList.remove('active'));
        const activeItem = Array.from(savedResultItems).find((item) => item.dataset.id === resultId);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        displaySavedResult(data);
    } catch (error) {
        console.error('Error loading saved result:', error);
        alert('Unable to load result. Please try again.');
    }
}

function displaySavedResult(data) {
    loading.style.display = 'none';
    resultsArea.style.display = 'grid';
    if (resultsPlaceholder) {
        resultsPlaceholder.style.display = 'none';
    }

    // Update Badge
    if (data.status === 'failed') {
        statusLabel.textContent = "Failed";
        statusLabel.className = "status-badge badge-failed";
    } else {
        statusLabel.textContent = "Completed";
        statusLabel.className = "status-badge badge-success";
    }

    // Show Raw JSON
    jsonOutput.textContent = JSON.stringify(data, null, 2);

    // Show Raw Text
    if (data.raw_text_pages && data.raw_text_pages.length > 0) {
        rawTextOutput.textContent = data.raw_text_pages.join('\n\n--- Page Break ---\n\n');
    } else {
        rawTextOutput.textContent = 'No raw text available.';
    }

    // Render Pretty List
    parsedContent.innerHTML = '';
    if (data.parsed_result && data.parsed_result.length > 0) {
        data.parsed_result.forEach(item => {
            const div = document.createElement('div');
            div.className = "list-group-item";

            let html = `<div class="item-header">
                            <h5>Q${item.q_no}</h5>
                            <span class="meta-pill">Confidence</span>
                        </div>
                        <p>${item.text || 'No text detected'}</p>`;

            if (item.subparts && item.subparts.length > 0) {
                html += `<p class="meta-detail">Sub-parts detected: ${item.subparts.length}</p>`;
            }

            div.innerHTML = html;
            parsedContent.appendChild(div);
        });
    } else {
        parsedContent.innerHTML = "<div class='alert'>No structured data extracted. Check Raw JSON.</div>";
    }
}

// ===== Start Backend Connection Check =====
// Run backend check when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkBackendConnection);
} else {
    checkBackendConnection();
}
