// API endpoint - always use localhost since backend needs local file access
const API_URL = 'http://localhost:3001';

// Get form elements
const form = document.getElementById('summaryForm');
const loading = document.getElementById('loading');
const output = document.getElementById('output');
const summaryContent = document.getElementById('summaryContent');
const errorDiv = document.getElementById('error');
const reposList = document.getElementById('reposList');

let repositories = [];

// Load repositories on page load
async function loadRepositories() {
    try {
        const response = await fetch(`${API_URL}/api/discover-repos`);
        const data = await response.json();

        repositories = data.repositories;
        renderRepositories();
    } catch (error) {
        console.error('Error loading repositories:', error);
        reposList.innerHTML = '<div style="text-align: center; padding: 20px; color: #c33;">Failed to load repositories</div>';
    }
}

// Render repository checkboxes
function renderRepositories() {
    if (repositories.length === 0) {
        reposList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">No repositories found</div>';
        return;
    }

    reposList.innerHTML = repositories.map((repo, index) => `
        <div class="repo-item" onclick="toggleRepo(${index})">
            <input type="checkbox" id="repo-${index}" onclick="event.stopPropagation()">
            <label for="repo-${index}">
                <div class="repo-name">${repo.name}</div>
                <div class="repo-path">${repo.path}</div>
            </label>
        </div>
    `).join('');
}

// Toggle individual repo checkbox
window.toggleRepo = function(index) {
    const checkbox = document.getElementById(`repo-${index}`);
    checkbox.checked = !checkbox.checked;
};

// Toggle all checkboxes
window.toggleSelectAll = function() {
    const checkboxes = document.querySelectorAll('.repo-item input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);

    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
};

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get selected repo paths
    const selectedRepos = [];
    repositories.forEach((repo, index) => {
        const checkbox = document.getElementById(`repo-${index}`);
        if (checkbox && checkbox.checked) {
            selectedRepos.push(repo.path);
        }
    });

    if (selectedRepos.length === 0) {
        showError('Please select at least one repository');
        return;
    }

    // Get dates
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Show loading, hide output and error
    loading.classList.add('visible');
    output.classList.remove('visible');
    errorDiv.classList.remove('visible');

    try {
        // Call backend API
        const response = await fetch(`${API_URL}/api/generate-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                repoPaths: selectedRepos,
                startDate,
                endDate
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        const data = await response.json();

        // Display the summary as HTML
        summaryContent.innerHTML = data.summary;
        loading.classList.remove('visible');
        output.classList.add('visible');

        console.log(`Generated summary from ${data.commitsCount} commits`);

    } catch (error) {
        console.error('Error generating summary:', error);
        showError(error.message);
        loading.classList.remove('visible');
    }
});

function showError(message) {
    errorDiv.textContent = `Error: ${message}`;
    errorDiv.classList.add('visible');
}

// Set default dates (last 7 days)
const today = new Date();
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);

document.getElementById('endDate').valueAsDate = today;
document.getElementById('startDate').valueAsDate = lastWeek;

// Load repositories on page load
loadRepositories();
