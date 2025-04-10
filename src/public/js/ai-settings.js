/**
 * AI Settings Manager
 * Handles AI and WhatsApp settings, template management
 */

let templates = {};
let filteredTemplates = {};

// Initialize AI settings
document.addEventListener('DOMContentLoaded', function() {
    initializeTemplateManager();
    initializeOpenAISettings();
    initializeWhatsAppSettings();
});

// Template Manager Functions
async function initializeTemplateManager() {
    await loadTemplates();
    setupTemplateForm();
    setupTemplateList();
    setupFilters();
    setupTemplatePreview();
    setupVariableManager();
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

// Setup template form with enhanced validation
function setupTemplateForm() {
    const form = document.getElementById('templateForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            category: document.getElementById('templateCategory').value,
            key: document.getElementById('templateKey').value,
            title: document.getElementById('templateTitle').value,
            content: document.getElementById('templateContent').value,
            variables: getTemplateVariables()
        };

        if (!validateTemplateForm(formData)) {
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
                form.reset();
            } else {
                showAlert('Failed to save template', 'danger');
            }
        } catch (error) {
            showAlert('Failed to save template', 'danger');
        }
    });
}

// OpenAI Settings Functions
function initializeOpenAISettings() {
    const form = document.getElementById('openaiSettingsForm');
    if (!form) return;

    loadOpenAISettings();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            apiKey: form.elements.apiKey.value,
            model: form.elements.model.value,
            temperature: parseFloat(form.elements.temperature.value),
            maxTokens: parseInt(form.elements.maxTokens.value),
            enableAIAssistant: form.elements.enableAIAssistant.checked
        };

        // Validate settings
        if (!formData.apiKey) {
            showAlert('API Key is required', 'warning');
            return;
        }
        if (formData.temperature < 0 || formData.temperature > 1) {
            showAlert('Temperature must be between 0 and 1', 'warning');
            return;
        }
        if (formData.maxTokens < 100 || formData.maxTokens > 4000) {
            showAlert('Max tokens must be between 100 and 4000', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/settings/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showAlert('OpenAI settings saved successfully', 'success');
            } else {
                throw new Error('Failed to save OpenAI settings');
            }
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}

// WhatsApp Settings Functions
function initializeWhatsAppSettings() {
    const form = document.getElementById('whatsappSettingsForm');
    if (!form) return;

    loadWhatsAppSettings();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            autoReply: form.elements.autoReply.checked,
            businessStart: form.elements.businessStart.value,
            businessEnd: form.elements.businessEnd.value
        };

        try {
            const response = await fetch('/api/settings/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showAlert('WhatsApp settings saved successfully', 'success');
            } else {
                throw new Error('Failed to save WhatsApp settings');
            }
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
}

// Setup interactive template preview
function setupTemplatePreview() {
    const contentInput = document.getElementById('templateContent');
    const previewContainer = document.getElementById('templatePreview');
    if (!contentInput || !previewContainer) return;

    contentInput.addEventListener('input', () => {
        updateTemplatePreview(contentInput.value);
    });
}

// Setup variable manager
function setupVariableManager() {
    const variableInput = document.getElementById('templateVariables');
    const variableList = document.getElementById('variableList');
    if (!variableInput || !variableList) return;

    variableInput.addEventListener('input', () => {
        const variables = getTemplateVariables();
        updateVariableList(variables);
        updateTemplatePreview();
    });
}

// Get template variables as array
function getTemplateVariables() {
    const variableInput = document.getElementById('templateVariables');
    return variableInput.value.split(',').map(v => v.trim()).filter(v => v);
}

// Validate template form
function validateTemplateForm(formData) {
    if (!formData.category || !formData.key || !formData.title || !formData.content) {
        showAlert('Please fill in all required fields', 'warning');
        return false;
    }

    const variablePattern = /\{\{([^}]+)\}\}/g;
    const contentVariables = [...formData.content.matchAll(variablePattern)].map(m => m[1]);
    const undefinedVariables = contentVariables.filter(v => !formData.variables.includes(v));

    if (undefinedVariables.length > 0) {
        showAlert(`Please define the following variables: ${undefinedVariables.join(', ')}`, 'warning');
        return false;
    }

    return true;
}

// Update template preview with variable highlighting
function updateTemplatePreview(content = null) {
    const previewContainer = document.getElementById('templatePreview');
    if (!previewContainer) return;

    content = content || document.getElementById('templateContent').value;
    const variables = getTemplateVariables();

    variables.forEach(variable => {
        const pattern = new RegExp(`\{\{${variable}\}\}`, 'g');
        content = content.replace(pattern, `<span class="variable-highlight">{{${variable}}}</span>`);
    });

    previewContainer.innerHTML = content;
}

// Update variable list display
function updateVariableList(variables) {
    const variableList = document.getElementById('variableList');
    if (!variableList) return;

    variableList.innerHTML = variables.map(variable => `
        <span class="badge bg-primary me-2 mb-2">${variable}
            <button type="button" class="btn-close btn-close-white ms-2" 
                    onclick="removeVariable('${variable}')"></button>
        </span>
    `).join('');
}

// Remove variable from list
function removeVariable(variable) {
    const variableInput = document.getElementById('templateVariables');
    const variables = getTemplateVariables().filter(v => v !== variable);
    variableInput.value = variables.join(', ');
    updateVariableList(variables);
    updateTemplatePreview();
}

// Helper Functions
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const container = document.querySelector('.main-content');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Setup filters for template list
function setupFilters() {
    const searchInput = document.getElementById('templateSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    if (!searchInput || !categoryFilter) return;

    searchInput.addEventListener('input', () => {
        filterTemplates();
    });

    categoryFilter.addEventListener('change', () => {
        filterTemplates();
    });
}

// Filter and display templates based on search and category
function filterTemplates() {
    const searchTerm = document.getElementById('templateSearch').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;

    filteredTemplates = Object.entries(templates).reduce((filtered, [key, template]) => {
        const matchesSearch = template.title.toLowerCase().includes(searchTerm) ||
                            template.content.toLowerCase().includes(searchTerm) ||
                            template.key.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

        if (matchesSearch && matchesCategory) {
            filtered[key] = template;
        }
        return filtered;
    }, {});

    displayTemplates();
}

// Display templates in the list
function displayTemplates() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    const templatesToDisplay = Object.keys(filteredTemplates).length > 0 ? filteredTemplates : templates;
    templateList.innerHTML = Object.entries(templatesToDisplay).map(([key, template]) => `
        <div class="card mb-3 template-card">
            <div class="card-body">
                <h5 class="card-title">${template.title}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${template.category}</h6>
                <p class="card-text">${template.content}</p>
                <div class="template-actions">
                    <button class="btn btn-sm btn-primary" onclick="editTemplate('${key}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTemplate('${key}')">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}