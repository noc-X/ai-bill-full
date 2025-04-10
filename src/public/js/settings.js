/**
 * Settings Page JavaScript
 * Handles form submissions and settings management
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all forms
    initializeGeneralSettings();
    initializeNetworkSettings();
    initializeBillingSettings();
    initializeNotificationSettings();
    initializeUsersSettings();
    initializeAISettings();
    initializeMikrotikSettings();
});

// General Settings
function initializeGeneralSettings() {
    loadGeneralSettings();
    const form = document.getElementById('generalSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            companyName: document.getElementById('companyName').value,
            timezone: document.getElementById('timezone').value,
            dateFormat: document.getElementById('dateFormat').value,
            currency: document.getElementById('currency').value,
            language: document.getElementById('language').value
        };

        // Handle logo file separately
        const logoFile = document.getElementById('companyLogo').files[0];
        if (logoFile) {
            const reader = new FileReader();
            reader.readAsDataURL(logoFile);
            reader.onload = function() {
                formData.companyLogo = reader.result;
                saveGeneralSettings(formData);
            };
        } else {
            saveGeneralSettings(formData);
        }
    });
}

// Network Settings
function initializeNetworkSettings() {
    loadNetworkSettings();
    loadNetworkDeviceSettings();
    const form = document.getElementById('networkSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            monitoringInterval: document.getElementById('monitoringInterval').value,
            bandwidthUnit: document.getElementById('bandwidthUnit').value
        };
        saveNetworkSettings(formData);
        saveNetworkDeviceSettings();
    }
        e.preventDefault();
        const formData = {
            monitoringInterval: document.getElementById('monitoringInterval').value,
            bandwidthUnit: document.getElementById('bandwidthUnit').value
        };
        saveNetworkSettings(formData);
    });
}

async function loadNetworkSettings() {
    try {
        const response = await fetch('/api/settings/network');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('monitoringInterval').value = settings.monitoringInterval || '5';
            document.getElementById('bandwidthUnit').value = settings.bandwidthUnit || 'Mbps';
        }
    } catch (error) {
        showAlert('Failed to load network settings', 'danger');
    }
}

async function saveNetworkSettings(data) {
    try {
        const response = await fetch('/api/settings/network', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Network settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save network settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Network Device Settings
async function loadNetworkDeviceSettings() {
    try {
        const response = await fetch('/api/settings/network-device');
        if (!response.ok) {
            throw new Error('Failed to load network device settings');
        }
        const settings = await response.json();
        
        // Populate form fields
        if (document.getElementById('monitoringEnabled')) {
            document.getElementById('monitoringEnabled').checked = settings.monitoringEnabled || false;
        }
        if (document.getElementById('monitoringInterval')) {
            document.getElementById('monitoringInterval').value = settings.monitoringInterval || 60;
        }
        if (document.getElementById('cpuThreshold')) {
            document.getElementById('cpuThreshold').value = settings.cpuThreshold || 80;
        }
        if (document.getElementById('memoryThreshold')) {
            document.getElementById('memoryThreshold').value = settings.memoryThreshold || 80;
        }
        if (document.getElementById('temperatureThreshold')) {
            document.getElementById('temperatureThreshold').value = settings.temperatureThreshold || 70;
        }
    } catch (error) {
        console.error('Error loading network device settings:', error);
        showAlert('Failed to load network device settings', 'danger');
    }
}

async function saveNetworkDeviceSettings() {
    try {
        const data = {
            monitoringEnabled: document.getElementById('monitoringEnabled')?.checked || false,
            monitoringInterval: parseInt(document.getElementById('monitoringInterval')?.value || 60),
            cpuThreshold: parseInt(document.getElementById('cpuThreshold')?.value || 80),
            memoryThreshold: parseInt(document.getElementById('memoryThreshold')?.value || 80),
            temperatureThreshold: parseInt(document.getElementById('temperatureThreshold')?.value || 70)
        };
        
        const response = await fetch('/api/settings/network-device', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showAlert('Network device settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save network device settings');
        }
    } catch (error) {
        console.error('Error saving network device settings:', error);
        showAlert(error.message, 'danger');
    }
}

// Billing Settings
function initializeBillingSettings() {
    loadBillingSettings();
    const form = document.getElementById('billingSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            invoiceDueDate: document.getElementById('invoiceDueDate').value,
            lateFeePercentage: document.getElementById('lateFeePercentage').value,
            taxRate: document.getElementById('taxRate').value,
            paymentGracePeriod: document.getElementById('paymentGracePeriod').value,
            enableAutoSuspend: document.getElementById('enableAutoSuspend').checked
        };
        saveBillingSettings(formData);
    });
}

async function loadBillingSettings() {
    try {
        const response = await fetch('/api/settings/billing');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('invoiceDueDate').value = settings.invoiceDueDate || '30';
            document.getElementById('lateFeePercentage').value = settings.lateFeePercentage || '0';
            document.getElementById('taxRate').value = settings.taxRate || '0';
            document.getElementById('paymentGracePeriod').value = settings.paymentGracePeriod || '7';
            document.getElementById('enableAutoSuspend').checked = settings.enableAutoSuspend || false;
        }
    } catch (error) {
        showAlert('Failed to load billing settings', 'danger');
    }
}

async function saveBillingSettings(data) {
    try {
        const response = await fetch('/api/settings/billing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Billing settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save billing settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Notification Settings
function initializeNotificationSettings() {
    loadNotificationSettings();
    const form = document.getElementById('notificationsSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            emailServer: document.getElementById('emailServer').value,
            emailPort: document.getElementById('emailPort').value,
            emailUsername: document.getElementById('emailUsername').value,
            emailPassword: document.getElementById('emailPassword').value,
            notifyInvoice: document.getElementById('notifyInvoice').checked,
            notifyPayment: document.getElementById('notifyPayment').checked,
            notifyService: document.getElementById('notifyService').checked
        };
        saveNotificationSettings(formData);
    });
}

async function loadNotificationSettings() {
    try {
        const response = await fetch('/api/settings/notifications');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('emailServer').value = settings.emailServer || '';
            document.getElementById('emailPort').value = settings.emailPort || '';
            document.getElementById('emailUsername').value = settings.emailUsername || '';
            document.getElementById('notifyInvoice').checked = settings.notifyInvoice || false;
            document.getElementById('notifyPayment').checked = settings.notifyPayment || false;
            document.getElementById('notifyService').checked = settings.notifyService || false;
        }
    } catch (error) {
        showAlert('Failed to load notification settings', 'danger');
    }
}

async function saveNotificationSettings(data) {
    try {
        const response = await fetch('/api/settings/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Notification settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save notification settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// AI Settings
function initializeAISettings() {
    loadAISettings();
    setupTemplatePreview();
    setupVariableManager();
    
    const aiSettingsForm = document.getElementById('aiSettingsForm');
    if (aiSettingsForm) {
        aiSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                model: document.getElementById('aiModel').value,
                language: document.getElementById('aiLanguage').value,
                responseTemplates: document.getElementById('responseTemplates').value,
                requireEmail: document.getElementById('requireEmail').checked,
                requirePhone: document.getElementById('requirePhone').checked,
                templatePreview: document.getElementById('templatePreview').innerHTML,
                variables: getTemplateVariables()
            };
            saveAISettings(formData);
        });
    }

async function loadAISettings() {
    try {
        const response = await fetch('/api/settings/ai');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('aiModel').value = settings.model || 'llama2';
            document.getElementById('aiEndpoint').value = settings.endpoint || 'http://localhost:11434/api/generate';
            document.getElementById('aiApiKey').value = settings.apiKey || '';
            document.getElementById('maxTokens').value = settings.maxTokens || '2000';
            document.getElementById('aiTemperature').value = settings.temperature || '0.7';
            document.getElementById('aiLanguage').value = settings.language || 'en';
            document.getElementById('responseTemplates').value = settings.templates || '';
            document.getElementById('requireEmail').checked = settings.requireEmail || false;
            document.getElementById('requirePhone').checked = settings.requirePhone || false;
            document.getElementById('enableAIAssistant').checked = settings.enableAIAssistant !== false;
            
            // Load template variables if available
            if (settings.variables) {
                const variablesList = document.getElementById('variablesList');
                if (variablesList) {
                    variablesList.innerHTML = '';
                    Object.entries(settings.variables).forEach(([name, data]) => {
                        const row = createVariableRow({
                            name: name,
                            description: data.description,
                            sample: data.sample
                        });
                        variablesList.appendChild(row);
                    });
                }
            }
            
            // Update template preview
            const templateInput = document.getElementById('responseTemplates');
            if (templateInput) {
                updateTemplatePreview(templateInput.value);
            }
        }
    } catch (error) {
        showAlert('Failed to load AI settings', 'danger');
    }
}

async function saveAISettings(data) {
    try {
        const response = await fetch('/api/settings/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Mikrotik Settings
function initializeMikrotikSettings() {
    const routersList = document.getElementById('routersList');
    const addRouterBtn = document.getElementById('addRouter');
    const routerTemplate = document.getElementById('routerTemplate');

    // Load existing settings
    loadMikrotikSettings();

    // Add router button click handler
    addRouterBtn.addEventListener('click', () => {
        const routerElement = routerTemplate.content.cloneNode(true);
        routersList.appendChild(routerElement);

        // Add remove button handler
        const removeBtn = routersList.lastElementChild.querySelector('.remove-router');
        removeBtn.addEventListener('click', (e) => {
            e.target.closest('.router-config').remove();
        });
    });

    // Form submit handler
    const mikrotikForm = document.getElementById('mikrotikSettingsForm');
    if (mikrotikForm) {
        mikrotikForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Collect all router configurations
            const routers = [];
            const routerConfigs = document.querySelectorAll('.router-config');
            
            routerConfigs.forEach(config => {
                routers.push({
                    name: config.querySelector('.router-name').value,
                    host: config.querySelector('.router-host').value,
                    port: parseInt(config.querySelector('.router-port').value),
                    timeout: parseInt(config.querySelector('.router-timeout').value),
                    username: config.querySelector('.router-username').value,
                    password: config.querySelector('.router-password').value
                });
            });

            const formData = {
                routers,
                defaultQueueType: document.getElementById('defaultQueueType').value,
                defaultFirewallPolicy: document.getElementById('defaultFirewallPolicy').value,
                enableBandwidthLimiting: document.getElementById('enableBandwidthLimiting').checked,
                enableQoS: document.getElementById('enableQoS').checked
            };

            try {
                const response = await fetch('/api/settings/mikrotik', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to save settings');
                }

                showAlert('Mikrotik settings saved successfully', 'success');
                await loadMikrotikSettings();
            } catch (error) {
                showAlert(error.message || 'Failed to save Mikrotik settings', 'danger');
            }
        });
    }
}

async function loadMikrotikSettings() {
    try {
        const response = await fetch('/api/settings/mikrotik');
        const settings = await response.json();

        // Clear existing router configurations
        const routersList = document.getElementById('routersList');
        routersList.innerHTML = '';

        // Add router configurations
        const routerTemplate = document.getElementById('routerTemplate');
        settings.routers.forEach(router => {
            const routerElement = routerTemplate.content.cloneNode(true);
            const routerConfig = routerElement.querySelector('.router-config');

            routerConfig.querySelector('.router-name').value = router.name || '';
            routerConfig.querySelector('.router-host').value = router.host || '';
            routerConfig.querySelector('.router-port').value = router.port || '8728';
            routerConfig.querySelector('.router-timeout').value = router.timeout || '30';
            routerConfig.querySelector('.router-username').value = router.username || '';

            // Add remove button handler
            const removeBtn = routerConfig.querySelector('.remove-router');
            removeBtn.addEventListener('click', (e) => {
                e.target.closest('.router-config').remove();
            });

            routersList.appendChild(routerElement);
        });

        // Load other settings
        document.getElementById('defaultQueueType').value = settings.defaultQueueType || 'pcq';
        document.getElementById('defaultFirewallPolicy').value = settings.defaultFirewallPolicy || 'drop';
        document.getElementById('enableBandwidthLimiting').checked = settings.enableBandwidthLimiting !== false;
        document.getElementById('enableQoS').checked = settings.enableQoS !== false;
    } catch (error) {
        showAlert('Failed to load Mikrotik settings', 'danger');
    }
}

async function saveMikrotikSettings(data) {
    try {
        const response = await fetch('/api/settings/mikrotik', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Mikrotik settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save Mikrotik settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Users Settings
function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function initializeUsersSettings() {
    loadUsers();
    
    const userSettingsForm = document.getElementById('userForm');
    if (userSettingsForm) {
        userSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const userId = userSettingsForm.dataset.userId;
            const formData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                role: document.getElementById('role').value
            };
            
            if (userId) {
                updateUser(userId, formData);
            } else {
                saveNewUser(formData);
            }
        });
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            const users = await response.json();
            const usersList = document.getElementById('usersList');
            if (usersList) {
                usersList.innerHTML = users.map(user => `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        showAlert('Failed to load users', 'danger');
    }
}

async function createUser(data) {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('User created successfully', 'success');
            loadUsers();
            document.getElementById('userForm').reset();
        } else {
            throw new Error('Failed to create user');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function updateUser(userId, data) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('User updated successfully', 'success');
            loadUsers();
            document.getElementById('userForm').reset();
            document.getElementById('userForm').dataset.userId = '';
        } else {
            throw new Error('Failed to update user');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showAlert('User deleted successfully', 'success');
            loadUsers();
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function editUser(userId) {
    const form = document.getElementById('userForm');
    form.dataset.userId = userId;

    fetch(`/api/users/${userId}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('role').value = user.role;
        })
        .catch(error => showAlert('Failed to load user details', 'danger'));
}
    
    // Handle new user form submission
    document.getElementById('saveNewUser').addEventListener('click', function() {
        const formData = {
            username: document.getElementById('newUsername').value,
            password: document.getElementById('newPassword').value,
            role: document.getElementById('newRole').value
        };
        saveNewUser(formData);
    });
}

// API Calls
async function saveGeneralSettings(data) {
    try {
        const response = await fetch('/api/settings/general', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('General settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save general settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveNetworkSettings(data) {
    try {
        const response = await fetch('/api/settings/network', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Network settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save network settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveBillingSettings(data) {
    try {
        const response = await fetch('/api/settings/billing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Billing settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save billing settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveNotificationSettings(data) {
    try {
        const response = await fetch('/api/settings/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('Notification settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save notification settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// AI Settings
function initializeAISettings() {
    loadAISettings();
    setupTemplatePreview();
    setupVariableManager();
    
    // Setup add variable button
    const addVariableBtn = document.getElementById('addVariable');
    if (addVariableBtn) {
        addVariableBtn.addEventListener('click', function() {
            const variablesList = document.getElementById('variablesList');
            const row = createVariableRow();
            variablesList.appendChild(row);
        });
    }
    
    const aiSettingsForm = document.getElementById('aiSettingsForm');
    if (aiSettingsForm) {
        aiSettingsForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                model: document.getElementById('aiModel').value,
                endpoint: document.getElementById('aiEndpoint').value,
                apiKey: document.getElementById('aiApiKey').value,
                maxTokens: document.getElementById('maxTokens').value,
                temperature: document.getElementById('aiTemperature').value,
                language: document.getElementById('aiLanguage').value,
                templates: document.getElementById('responseTemplates').value,
                requireEmail: document.getElementById('requireEmail').checked,
                requirePhone: document.getElementById('requirePhone').checked,
                enableAIAssistant: document.getElementById('enableAIAssistant').checked,
                variables: getTemplateVariables()
            };
            
            try {
                const response = await fetch('/api/settings/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showAlert('AI settings saved successfully', 'success');
                    await loadAISettings(); // Reload settings to reflect changes
                } else {
                    throw new Error('Failed to save AI settings');
                }
            } catch (error) {
                showAlert(error.message, 'danger');
            }
        });
    }
}

function initializeMikrotikSettings() {
    loadMikrotikSettings();
    
    const mikrotikForm = document.getElementById('mikrotikSettingsForm');
    if (mikrotikForm) {
        mikrotikForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                host: document.getElementById('mikrotikHost').value,
                port: document.getElementById('mikrotikPort').value,
                username: document.getElementById('mikrotikUsername').value,
                password: document.getElementById('mikrotikPassword').value,
                apiEnabled: document.getElementById('mikrotikApiEnabled').checked,
                sshEnabled: document.getElementById('mikrotikSshEnabled').checked
            };
            
            if (!formData.host || !formData.username || !formData.password) {
                showAlert('Please fill in all required fields', 'warning');
                return;
            }
            
            try {
                const response = await fetch('/api/settings/mikrotik', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    showAlert('Mikrotik settings saved successfully', 'success');
                    await loadMikrotikSettings();
                } else {
                    throw new Error('Failed to save Mikrotik settings');
                }
            } catch (error) {
                showAlert(error.message, 'danger');
            }
        });
    }
}

async function loadAISettings() {
    try {
        const response = await fetch('/api/settings/ai');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('aiModel').value = settings.model || '';
            document.getElementById('aiLanguage').value = settings.language || '';
            document.getElementById('responseTemplates').value = settings.templates || '';
            document.getElementById('requireEmail').checked = settings.requireEmail || false;
            document.getElementById('requirePhone').checked = settings.requirePhone || false;
            
            if (settings.variables) {
                const variablesList = document.getElementById('variablesList');
                if (variablesList) {
                    variablesList.innerHTML = '';
                    Object.entries(settings.variables).forEach(([name, data]) => {
                        const row = createVariableRow({
                            name: name,
                            description: data.description,
                            sample: data.sample
                        });
                        variablesList.appendChild(row);
                    });
                }
            }
            
            // Update template preview
            const templateInput = document.getElementById('responseTemplates');
            if (templateInput) {
                updateTemplatePreview(templateInput.value);
            }
        }
    } catch (error) {
        showAlert('Failed to load AI settings', 'danger');
    }
}

async function loadMikrotikSettings() {
    try {
        const response = await fetch('/api/settings/mikrotik');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('mikrotikHost').value = settings.host || '';
            document.getElementById('mikrotikPort').value = settings.port || '';
            document.getElementById('mikrotikUsername').value = settings.username || '';
            document.getElementById('mikrotikPassword').value = settings.password || '';
            document.getElementById('mikrotikApiEnabled').checked = settings.apiEnabled || false;
            document.getElementById('mikrotikSshEnabled').checked = settings.sshEnabled || false;
        }
    } catch (error) {
        showAlert('Failed to load Mikrotik settings', 'danger');
    }
}

// Setup template preview functionality
function setupTemplatePreview() {
    const templateInput = document.getElementById('responseTemplates');
    if (templateInput) {
        templateInput.addEventListener('input', function() {
            updateTemplatePreview(this.value);
        });
    }
}

// Update template preview with variables
function updateTemplatePreview(templateText) {
    const previewContainer = document.getElementById('templatePreview');
    if (!previewContainer) return;
    
    try {
        // Try to parse as JSON
        let templates = {};
        try {
            templates = JSON.parse(templateText);
        } catch (e) {
            previewContainer.innerHTML = '<div class="text-danger">Invalid JSON format</div>';
            return;
        }
        
        // Display template preview
        let previewHtml = '';
        for (const [key, template] of Object.entries(templates)) {
            previewHtml += `<div class="mb-3">
                <h6>${key}</h6>
                <div class="border p-2 bg-white">${formatTemplateWithVariables(template)}</div>
            </div>`;
        }
        
        previewContainer.innerHTML = previewHtml || '<div class="text-muted">No templates defined</div>';
    } catch (error) {
        previewContainer.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    }
}

// Format template with variable placeholders
function formatTemplateWithVariables(template) {
    if (!template) return '';
    
    // Replace variables with highlighted spans
    return template.replace(/\{\{([^}]+)\}\}/g, '<span class="badge bg-primary">{{$1}}</span>');
}

// Setup variable manager
function setupVariableManager() {
    const addVariableBtn = document.getElementById('addVariable');
    if (addVariableBtn) {
        addVariableBtn.addEventListener('click', function() {
            const variablesList = document.getElementById('variablesList');
            const row = createVariableRow();
            variablesList.appendChild(row);
        });
    }
}

// Create a new variable row
function createVariableRow(data = {}) {
    const row = document.createElement('div');
    row.className = 'variable-row row mb-2 align-items-center';
    row.innerHTML = `
        <div class="col-md-3">
            <input type="text" class="form-control variable-name" placeholder="Variable name" value="${data.name || ''}">
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control variable-description" placeholder="Description" value="${data.description || ''}">
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control variable-sample" placeholder="Sample value" value="${data.sample || ''}">
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-sm btn-danger remove-variable">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add remove button handler
    const removeBtn = row.querySelector('.remove-variable');
    removeBtn.addEventListener('click', function() {
        row.remove();
    });
    
    return row;
}

// Get template variables from the form
function getTemplateVariables() {
    const variables = {};
    const rows = document.querySelectorAll('.variable-row');
    
    rows.forEach(row => {
        const name = row.querySelector('.variable-name').value.trim();
        if (name) {
            variables[name] = {
                description: row.querySelector('.variable-description').value.trim(),
                sample: row.querySelector('.variable-sample').value.trim()
            };
        }
    });
    
    return variables;
}

async function saveAISettings(data) {
    try {
        const response = await fetch('/api/settings/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: data.model,
                endpoint: data.endpoint,
                apiKey: data.apiKey,
                maxTokens: data.maxTokens,
                temperature: data.temperature,
                language: data.language,
                templates: data.templates,
                requireEmail: data.requireEmail,
                requirePhone: data.requirePhone,
                enableAIAssistant: data.enableAIAssistant,
                variables: data.variables
            })
        });
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveMikrotikSettings(data) {
    try {
        const response = await fetch('/api/settings/mikrotik', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                apiEnabled: data.apiEnabled,
                sshEnabled: data.sshEnabled
            })
        });
        if (response.ok) {
            showAlert('Mikrotik settings saved successfully', 'success');
            loadMikrotikSettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save Mikrotik settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            responseTemplates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            templatePreview: document.getElementById('templatePreview').innerHTML,
            variables: getTemplateVariables()
        };
        saveAISettings(formData);
    });

function setupTemplatePreview() {
    const templateInput = document.getElementById('responseTemplates');
    const previewContainer = document.getElementById('templatePreview');

    if (templateInput && previewContainer) {
        templateInput.addEventListener('input', () => {
            updateTemplatePreview(templateInput.value);
        });
    }
}

function updateTemplatePreview(template) {
    const previewContainer = document.getElementById('templatePreview');
    if (!previewContainer) return;

    // Replace variables with sample values
    const variables = getTemplateVariables();
    let previewText = template;
    
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\{${key}\}`, 'g');
        previewText = previewText.replace(regex, value.sample || key);
    }

    previewContainer.innerHTML = previewText.replace(/\n/g, '<br>');
}

function setupVariableManager() {
    const variablesList = document.getElementById('variablesList');
    const addVariableBtn = document.getElementById('addVariable');

    if (addVariableBtn) {
        addVariableBtn.addEventListener('click', () => {
            const variableRow = createVariableRow();
            variablesList.appendChild(variableRow);
        });
    }
}

function createVariableRow(variable = { name: '', description: '', sample: '' }) {
    const row = document.createElement('div');
    row.className = 'row mb-2 variable-row';
    
    row.innerHTML = `
        <div class="col-3">
            <input type="text" class="form-control variable-name" value="${variable.name}" placeholder="Variable name">
        </div>
        <div class="col-4">
            <input type="text" class="form-control variable-description" value="${variable.description}" placeholder="Description">
        </div>
        <div class="col-3">
            <input type="text" class="form-control variable-sample" value="${variable.sample}" placeholder="Sample value">
        </div>
        <div class="col-2">
            <button class="btn btn-danger btn-sm" onclick="this.closest('.variable-row').remove()"><i class="bi bi-trash"></i></button>
        </div>
    `;

    return row;
}

function getTemplateVariables() {
    const variables = {};
    const rows = document.querySelectorAll('.variable-row');

    rows.forEach(row => {
        const name = row.querySelector('.variable-name').value;
        if (name) {
            variables[name] = {
                description: row.querySelector('.variable-description').value,
                sample: row.querySelector('.variable-sample').value
            };
        }
    });

    return variables;
}
}
}

async function loadGeneralSettings() {
    try {
        const response = await fetch('/api/settings/general');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('companyName').value = settings.companyName || '';
            document.getElementById('timezone').value = settings.timezone || '';
            document.getElementById('dateFormat').value = settings.dateFormat || '';
            document.getElementById('currency').value = settings.currency || '';
            document.getElementById('language').value = settings.language || '';
        }
    } catch (error) {
        showAlert('Failed to load general settings', 'danger');
    }
}

async function loadNetworkSettings() {
    try {
        const response = await fetch('/api/settings/network');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('routerIP').value = settings.routerIP || '';
            document.getElementById('routerUsername').value = settings.routerUsername || '';
            document.getElementById('routerPassword').value = settings.routerPassword || '';
            document.getElementById('routerAPIPort').value = settings.routerAPIPort || '';
            document.getElementById('monitoringInterval').value = settings.monitoringInterval || '';
            document.getElementById('bandwidthUnit').value = settings.bandwidthUnit || '';
            document.getElementById('enableAutoReboot').checked = settings.enableAutoReboot || false;
        }
    } catch (error) {
        showAlert('Failed to load network settings', 'danger');
    }
}

async function loadBillingSettings() {
    try {
        const response = await fetch('/api/settings/billing');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('invoiceDueDate').value = settings.invoiceDueDate || '';
            document.getElementById('lateFeePercentage').value = settings.lateFeePercentage || '';
            document.getElementById('taxRate').value = settings.taxRate || '';
            document.getElementById('paymentGracePeriod').value = settings.paymentGracePeriod || '';
            document.getElementById('enableAutoSuspend').checked = settings.enableAutoSuspend || false;
        }
    } catch (error) {
        showAlert('Failed to load billing settings', 'danger');
    }
}

async function loadNotificationSettings() {
    try {
        const response = await fetch('/api/settings/notifications');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('emailServer').value = settings.emailServer || '';
            document.getElementById('emailPort').value = settings.emailPort || '';
            document.getElementById('emailUsername').value = settings.emailUsername || '';
            document.getElementById('emailPassword').value = settings.emailPassword || '';
            document.getElementById('notifyInvoice').checked = settings.notifyInvoice || false;
            document.getElementById('notifyPayment').checked = settings.notifyPayment || false;
            document.getElementById('notifyService').checked = settings.notifyService || false;
        }
    } catch (error) {
        showAlert('Failed to load notification settings', 'danger');
    }
}

async function loadAISettings() {
    try {
        const response = await fetch('/api/settings/ai');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('aiModel').value = settings.model || 'llama2';
            document.getElementById('aiLanguage').value = settings.language || 'en';
            document.getElementById('responseTemplates').value = settings.responseTemplates || '';
            document.getElementById('requireEmail').checked = settings.requireEmail || false;
            document.getElementById('requirePhone').checked = settings.requirePhone || false;
        }
    } catch (error) {
        showAlert('Failed to load AI settings', 'danger');
    }
}

// Setup template preview functionality
function setupTemplatePreview() {
    const templateInput = document.getElementById('responseTemplates');
    if (templateInput) {
        templateInput.addEventListener('input', function() {
            updateTemplatePreview(this.value);
        });
    }
}

// Update template preview with variables
function updateTemplatePreview(templateText) {
    const previewContainer = document.getElementById('templatePreview');
    if (!previewContainer) return;
    
    try {
        // Try to parse as JSON
        let templates = {};
        try {
            templates = JSON.parse(templateText);
        } catch (e) {
            previewContainer.innerHTML = '<div class="text-danger">Invalid JSON format</div>';
            return;
        }
        
        // Display template preview
        let previewHtml = '';
        for (const [key, template] of Object.entries(templates)) {
            previewHtml += `<div class="mb-3">
                <h6>${key}</h6>
                <div class="border p-2 bg-white">${formatTemplateWithVariables(template)}</div>
            </div>`;
        }
        
        previewContainer.innerHTML = previewHtml || '<div class="text-muted">No templates defined</div>';
    } catch (error) {
        previewContainer.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
    }
}

// Format template with variable placeholders
function formatTemplateWithVariables(template) {
    if (!template) return '';
    
    // Replace variables with highlighted spans
    return template.replace(/\{\{([^}]+)\}\}/g, '<span class="badge bg-primary">{{$1}}</span>');
}

// Setup variable manager
function setupVariableManager() {
    const addVariableBtn = document.getElementById('addVariable');
    if (addVariableBtn) {
        addVariableBtn.addEventListener('click', function() {
            const variablesList = document.getElementById('variablesList');
            const row = createVariableRow();
            variablesList.appendChild(row);
        });
    }
}

// Create a new variable row
function createVariableRow(data = {}) {
    const row = document.createElement('div');
    row.className = 'variable-row row mb-2 align-items-center';
    row.innerHTML = `
        <div class="col-md-3">
            <input type="text" class="form-control variable-name" placeholder="Variable name" value="${data.name || ''}">
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control variable-description" placeholder="Description" value="${data.description || ''}">
        </div>
        <div class="col-md-4">
            <input type="text" class="form-control variable-sample" placeholder="Sample value" value="${data.sample || ''}">
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-sm btn-danger remove-variable">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add remove button handler
    const removeBtn = row.querySelector('.remove-variable');
    removeBtn.addEventListener('click', function() {
        row.remove();
    });
    
    return row;
}

// Get template variables from the form
function getTemplateVariables() {
    const variables = {};
    const rows = document.querySelectorAll('.variable-row');
    
    rows.forEach(row => {
        const name = row.querySelector('.variable-name').value.trim();
        if (name) {
            variables[name] = {
                description: row.querySelector('.variable-description').value.trim(),
                sample: row.querySelector('.variable-sample').value.trim()
            };
        }
    });
    
    return variables;
}

async function saveAISettings(data) {
    try {
        const response = await fetch('/api/settings/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: data.model,
                endpoint: data.endpoint,
                apiKey: data.apiKey,
                maxTokens: data.maxTokens,
                temperature: data.temperature,
                language: data.language,
                templates: data.templates,
                requireEmail: data.requireEmail,
                requirePhone: data.requirePhone,
                enableAIAssistant: data.enableAIAssistant,
                variables: data.variables
            })
        });
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function saveMikrotikSettings(data) {
    try {
        const response = await fetch('/api/settings/mikrotik', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                apiEnabled: data.apiEnabled,
                sshEnabled: data.sshEnabled
            })
        });
        if (response.ok) {
            showAlert('Mikrotik settings saved successfully', 'success');
            loadMikrotikSettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save Mikrotik settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            responseTemplates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            templatePreview: document.getElementById('templatePreview').innerHTML,
            variables: getTemplateVariables()
        };
        saveAISettings(formData);
    });

function setupTemplatePreview() {
    const templateInput = document.getElementById('responseTemplates');
    const previewContainer = document.getElementById('templatePreview');

    if (templateInput && previewContainer) {
        templateInput.addEventListener('input', () => {
            updateTemplatePreview(templateInput.value);
        });
    }
}

function updateTemplatePreview(template) {
    const previewContainer = document.getElementById('templatePreview');
    if (!previewContainer) return;

    // Replace variables with sample values
    const variables = getTemplateVariables();
    let previewText = template;
    
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\{${key}\}`, 'g');
        previewText = previewText.replace(regex, value.sample || key);
    }

    previewContainer.innerHTML = previewText.replace(/\n/g, '<br>');
}

function setupVariableManager() {
    const variablesList = document.getElementById('variablesList');
    const addVariableBtn = document.getElementById('addVariable');

    if (addVariableBtn) {
        addVariableBtn.addEventListener('click', () => {
            const variableRow = createVariableRow();
            variablesList.appendChild(variableRow);
        });
    }
}

function createVariableRow(variable = { name: '', description: '', sample: '' }) {
    const row = document.createElement('div');
    row.className = 'row mb-2 variable-row';
    
    row.innerHTML = `
        <div class="col-3">
            <input type="text" class="form-control variable-name" value="${variable.name}" placeholder="Variable name">
        </div>
        <div class="col-4">
            <input type="text" class="form-control variable-description" value="${variable.description}" placeholder="Description">
        </div>
        <div class="col-3">
            <input type="text" class="form-control variable-sample" value="${variable.sample}" placeholder="Sample value">
        </div>
        <div class="col-2">
            <button class="btn btn-danger btn-sm" onclick="this.closest('.variable-row').remove()"><i class="bi bi-trash"></i></button>
        </div>
    `;

    return row;
}

function getTemplateVariables() {
    const variables = {};
    const rows = document.querySelectorAll('.variable-row');

    rows.forEach(row => {
        const name = row.querySelector('.variable-name').value;
        if (name) {
            variables[name] = {
                description: row.querySelector('.variable-description').value,
                sample: row.querySelector('.variable-sample').value
            };
        }
    });

    return variables;
}
}
}

async function loadGeneralSettings() {
    try {
        const response = await fetch('/api/settings/general');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('companyName').value = settings.companyName || '';
            document.getElementById('timezone').value = settings.timezone || '';
            document.getElementById('dateFormat').value = settings.dateFormat || '';
            document.getElementById('currency').value = settings.currency || '';
            document.getElementById('language').value = settings.language || '';
        }
    } catch (error) {
        showAlert('Failed to load general settings', 'danger');
    }
}

async function loadNetworkSettings() {
    try {
        const response = await fetch('/api/settings/network');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('routerIP').value = settings.routerIP || '';
            document.getElementById('routerUsername').value = settings.routerUsername || '';
            document.getElementById('routerPassword').value = settings.routerPassword || '';
            document.getElementById('routerAPIPort').value = settings.routerAPIPort || '';
            document.getElementById('monitoringInterval').value = settings.monitoringInterval || '';
            document.getElementById('bandwidthUnit').value = settings.bandwidthUnit || '';
            document.getElementById('enableAutoReboot').checked = settings.enableAutoReboot || false;
        }
    } catch (error) {
        showAlert('Failed to load network settings', 'danger');
    }
}

async function loadBillingSettings() {
    try {
        const response = await fetch('/api/settings/billing');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('invoiceDueDate').value = settings.invoiceDueDate || '';
            document.getElementById('lateFeePercentage').value = settings.lateFeePercentage || '';
            document.getElementById('taxRate').value = settings.taxRate || '';
            document.getElementById('paymentGracePeriod').value = settings.paymentGracePeriod || '';
            document.getElementById('enableAutoSuspend').checked = settings.enableAutoSuspend || false;
        }
    } catch (error) {
        showAlert('Failed to load billing settings', 'danger');
    }
}

async function loadNotificationSettings() {
    try {
        const response = await fetch('/api/settings/notifications');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('emailServer').value = settings.emailServer || '';
            document.getElementById('emailPort').value = settings.emailPort || '';
            document.getElementById('emailUsername').value = settings.emailUsername || '';
            document.getElementById('emailPassword').value = settings.emailPassword || '';
            document.getElementById('notifyInvoice').checked = settings.notifyInvoice || false;
            document.getElementById('notifyPayment').checked = settings.notifyPayment || false;
            document.getElementById('notifyService').checked = settings.notifyService || false;
        }
    } catch (error) {
        showAlert('Failed to load notification settings', 'danger');
    }
}

async function loadAISettings() {
    try {
        const response = await fetch('/api/settings/ai');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('aiModel').value = settings.model || 'llama2';
            document.getElementById('aiLanguage').value = settings.language || 'en';
            document.getElementById('responseTemplates').value = settings.responseTemplates || '';
            document.getElementById('requireEmail').checked = settings.requireEmail || false;
            document.getElementById('requirePhone').checked = settings.requirePhone || false;
        }
    } catch (error) {
        showAlert('Failed to load AI settings', 'danger');
    }
}

async function saveAISettings(data) {
    try {
        const response = await fetch('/api/settings/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Mikrotik Settings
function initializeMikrotikSettings() {
    loadMikrotikSettings();
    
    const form = document.getElementById('mikrotikSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            host: document.getElementById('mikrotikHost').value,
            port: document.getElementById('mikrotikPort').value,
            user: document.getElementById('mikrotikUser').value,
            password: document.getElementById('mikrotikPassword').value,
            useSSL: document.getElementById('useSSL').checked,
            autoReconnect: document.getElementById('autoReconnect').checked
        };
        saveMikrotikSettings(formData);
    });
}

async function loadMikrotikSettings() {
    try {
        const response = await fetch('/api/settings/mikrotik');
        if (response.ok) {
            const settings = await response.json();
            document.getElementById('mikrotikHost').value = settings.host || '';
            document.getElementById('mikrotikPort').value = settings.port || '8728';
            document.getElementById('mikrotikUser').value = settings.user || '';
            document.getElementById('useSSL').checked = settings.useSSL || false;
            document.getElementById('autoReconnect').checked = settings.autoReconnect || false;
        }
    } catch (error) {
        showAlert('Failed to load Mikrotik settings', 'danger');
    }
}

async function saveMikrotikSettings(data) {
    try {
        const response = await fetch('/api/settings/mikrotik', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                host: data.host,
                port: data.port,
                username: data.username,
                password: data.password,
                apiEnabled: data.apiEnabled,
                sshEnabled: data.sshEnabled
            })
        });
        if (response.ok) {
            showAlert('Mikrotik settings saved successfully', 'success');
            loadMikrotikSettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save Mikrotik settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
    
    const form = document.getElementById('aiSettingsForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            model: document.getElementById('aiModel').value,
            language: document.getElementById('aiLanguage').value,
            templates: document.getElementById('responseTemplates').value,
            requireEmail: document.getElementById('requireEmail').checked,
            requirePhone: document.getElementById('requirePhone').checked,
            variables: data.variables
        };
        if (response.ok) {
            showAlert('AI settings saved successfully', 'success');
            loadAISettings(); // Reload settings to reflect changes
        } else {
            throw new Error('Failed to save AI settings');