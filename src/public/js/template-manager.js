// Template Manager for AI Response Templates

let templates = {};
let filteredTemplates = {};

// Initialize template manager
async function initializeTemplateManager() {
    await loadTemplates();
    setupTemplateForm();
    setupTemplateList();
    setupFilters();
    setupPreview();
}

// Setup template list and its event handlers
function setupTemplateList() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;
    
    // Initial display of templates
    displayTemplates();
}

// Load templates from server
async function loadTemplates() {
    try {
        const response = await fetch('/api/settings/templates', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (response.ok) {
            templates = await response.json();
            displayTemplates();
        }
    } catch (error) {
        showAlert('Failed to load templates', 'danger');
    }
}

// Setup template form
function setupTemplateForm() {
    const saveButton = document.getElementById('saveTemplate');
    if (!saveButton) return;

    saveButton.addEventListener('click', async () => {
        const formData = {
            category: document.getElementById('templateCategory').value,
            key: document.getElementById('templateKey').value,
            title: document.getElementById('templateTitle').value,
            content: document.getElementById('templateContent').value,
            variables: document.getElementById('templateVariables').value.split(',').map(v => v.trim()).filter(v => v)
        };

        if (!formData.category || !formData.key || !formData.title || !formData.content) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/settings/templates', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showAlert('Template saved successfully', 'success');
                await loadTemplates();
                document.getElementById('templateForm').reset();
                document.getElementById('templateModal').querySelector('.btn-close').click();
            } else {
                showAlert('Failed to save template', 'danger');
            }
        } catch (error) {
            showAlert('Failed to save template', 'danger');
        }
    });
}

// Setup filters and search
function setupFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('templateSearch');

    // Update category filter options
    const categories = Object.keys(templates);
    categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

    // Filter change handler
    categoryFilter.addEventListener('change', filterTemplates);
    searchInput.addEventListener('input', filterTemplates);
}

// Setup template preview
function setupPreview() {
    const contentInput = document.getElementById('templateContent');
    const variablesInput = document.getElementById('templateVariables');
    const previewDiv = document.getElementById('templatePreview');

    const updatePreview = () => {
        let content = contentInput.value;
        const variables = variablesInput.value.split(',').map(v => v.trim()).filter(v => v);
        
        variables.forEach(variable => {
            const placeholder = new RegExp(`\{${variable}\}`, 'g');
            content = content.replace(placeholder, `<span class="text-primary">{${variable}}</span>`);
        });

        previewDiv.innerHTML = content;
    };

    contentInput.addEventListener('input', updatePreview);
    variablesInput.addEventListener('input', updatePreview);
}

// Filter templates based on category and search
function filterTemplates() {
    const category = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('templateSearch').value.toLowerCase();

    filteredTemplates = {};
    Object.entries(templates).forEach(([cat, items]) => {
        if (!category || category === cat) {
            const filteredItems = {};
            Object.entries(items).forEach(([key, template]) => {
                if (template.title.toLowerCase().includes(searchTerm) ||
                    template.content.toLowerCase().includes(searchTerm)) {
                    filteredItems[key] = template;
                }
            });
            if (Object.keys(filteredItems).length > 0) {
                filteredTemplates[cat] = filteredItems;
            }
        }
    });

    displayTemplates();
}

// Display templates in the list
function displayTemplates() {
    const container = document.getElementById('templateList');
    if (!container) return;

    container.innerHTML = '';
    Object.entries(filteredTemplates).forEach(([category, items]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'mb-4';
        categoryDiv.innerHTML = `
            <h5 class="mb-3">${category}</h5>
            <div class="list-group">
                ${Object.entries(items).map(([key, template]) => `
                    <div class="list-group-item list-group-item-action template-item">
                        <div class="d-flex w-100 justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${template.title}</h6>
                                <p class="mb-1 text-muted small">${template.content}</p>
                                ${template.variables.length ? `
                                    <small class="text-primary">Variables: ${template.variables.join(', ')}</small>
                                ` : ''}
                            </div>
                            <div class="ms-2">
                                <button class="btn btn-sm btn-outline-primary edit-template" data-category="${category}" data-key="${key}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-template" data-category="${category}" data-key="${key}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(categoryDiv);
    });

    // Add event listeners for edit and delete buttons
    setupTemplateButtons();
}

// Setup template edit and delete buttons
function setupTemplateButtons() {
    // Edit template
    document.querySelectorAll('.edit-template').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const key = button.dataset.key;
            const template = templates[category][key];

            document.getElementById('templateCategory').value = category;
            document.getElementById('templateKey').value = key;
            document.getElementById('templateTitle').value = template.title;
            document.getElementById('templateContent').value = template.content;
            document.getElementById('templateVariables').value = template.variables.join(', ');
        });
    });

    // Delete template
    document.querySelectorAll('.delete-template').forEach(button => {
        button.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to delete this template?')) return;

            const category = button.dataset.category;
            const key = button.dataset.key;

            try {
                const response = await fetch(`/api/settings/templates/${category}/${key}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showAlert('Template deleted successfully', 'success');
                    await loadTemplates();
                } else {
                    showAlert('Failed to delete template', 'danger');
                }
            } catch (error) {
                showAlert('Failed to delete template', 'danger');
            }
        });
    });
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.getElementById('alertContainer').appendChild(alertDiv);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTemplateManager);