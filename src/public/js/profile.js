/**
 * ISP Management Profile JavaScript
 * This file handles user profile management, password changes,
 * and user management functionality for administrators.
 */

// Store for profile data
const profileData = {
    currentUser: null,
    users: [],
    editingUserId: null
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initProfile();
});

/**
 * Initialize profile page functionality
 */
async function initProfile() {
    // Load current user data
    await loadCurrentUser();
    
    // Setup form handlers
    setupProfileForm();
    setupPasswordForm();
    
    // If user is admin, setup user management
    if (profileData.currentUser?.role === 'admin') {
        document.getElementById('userManagementSection').style.display = 'block';
        setupUserManagement();
    }
}

/**
 * Load current user data from localStorage
 */
async function loadCurrentUser() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
        profileData.currentUser = JSON.parse(userJson);
        
        // Populate profile form
        document.getElementById('fullName').value = profileData.currentUser.name || '';
        document.getElementById('email').value = profileData.currentUser.email || '';
        document.getElementById('phone').value = profileData.currentUser.phone || '';
        document.getElementById('role').value = profileData.currentUser.role || '';
        
        // Update user name in sidebar
        document.getElementById('currentUserName').textContent = profileData.currentUser.name;
    }
}

/**
 * Setup profile form submission
 */
function setupProfileForm() {
    const form = document.getElementById('profileForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: document.getElementById('fullName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value
                })
            });
            
            if (response.ok) {
                const updatedUser = await response.json();
                profileData.currentUser = updatedUser;
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                // Update display name
                document.getElementById('currentUserName').textContent = updatedUser.name;
                
                showAlert('Profile updated successfully', 'success');
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            showAlert('Failed to update profile: ' + error.message, 'danger');
        }
    });
}

/**
 * Setup password change form submission
 */
function setupPasswordForm() {
    const form = document.getElementById('passwordForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            showAlert('New passwords do not match', 'danger');
            return;
        }
        
        try {
            const response = await fetch('/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: document.getElementById('currentPassword').value,
                    newPassword: newPassword
                })
            });
            
            if (response.ok) {
                form.reset();
                showAlert('Password changed successfully', 'success');
            } else {
                throw new Error('Failed to change password');
            }
        } catch (error) {
            showAlert('Failed to change password: ' + error.message, 'danger');
        }
    });
}

/**
 * Setup user management functionality for admins
 */
async function setupUserManagement() {
    // Load users
    await loadUsers();
    
    // Setup add user button
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    
    // Reset form when modal is hidden
    const addUserModal = document.getElementById('addUserModal');
    addUserModal.addEventListener('hidden.bs.modal', function() {
        document.getElementById('userForm').reset();
        profileData.editingUserId = null;
        document.getElementById('userModalTitle').textContent = 'Add New User';
    });
}

/**
 * Load all users for admin management
 */
async function loadUsers() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            profileData.users = await response.json();
            renderUserTable();
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        showAlert('Failed to load users: ' + error.message, 'danger');
    }
}

/**
 * Render the user management table
 */
function renderUserTable() {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    
    profileData.users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td><span class="badge bg-${user.active ? 'success' : 'danger'}">
                ${user.active ? 'Active' : 'Inactive'}
            </span></td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editUser('${user.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-${user.active ? 'danger' : 'success'}" 
                        onclick="toggleUserStatus('${user.id}')">
                    <i class="bi bi-${user.active ? 'person-x' : 'person-check'}"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Save or update user
 */
async function saveUser() {
    const form = document.getElementById('userForm');
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value
    };
    
    const password = document.getElementById('userPassword').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        const url = profileData.editingUserId ? 
            `/api/users/${profileData.editingUserId}` : 
            '/api/users';
            
        const response = await fetch(url, {
            method: profileData.editingUserId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            await loadUsers();
            bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
            showAlert(`User ${profileData.editingUserId ? 'updated' : 'added'} successfully`, 'success');
        } else {
            throw new Error(`Failed to ${profileData.editingUserId ? 'update' : 'add'} user`);
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

/**
 * Edit user
 */
function editUser(userId) {
    const user = profileData.users.find(u => u.id === userId);
    if (user) {
        profileData.editingUserId = userId;
        document.getElementById('userModalTitle').textContent = 'Edit User';
        document.getElementById('userName').value = user.name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userRole').value = user.role || '';
        document.getElementById('userPassword').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('addUserModal'));
        modal.show();
    }
}

async function saveUser() {
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
        password: document.getElementById('userPassword').value
    };

    try {
        const url = profileData.editingUserId ? 
            `/api/users/${profileData.editingUserId}` : 
            '/api/users';
        
        const response = await fetch(url, {
            method: profileData.editingUserId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            await loadUsers();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
            modal.hide();
            showAlert(`User ${profileData.editingUserId ? 'updated' : 'created'} successfully`, 'success');
            document.getElementById('userForm').reset();
            profileData.editingUserId = null;
        } else {
            throw new Error(`Failed to ${profileData.editingUserId ? 'update' : 'create'} user`);
        }
    } catch (error) {
        showAlert(`Failed to ${profileData.editingUserId ? 'update' : 'create'} user: ${error.message}`, 'danger');
    }
}

/**
 * Toggle user active status
 */
async function toggleUserActions(userId, isActive) {
    try {
        const response = await fetch(`/api/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ active: !isActive })
        });

        if (response.ok) {
            await loadUsers(); // Reload user list
            showAlert('User status updated successfully', 'success');
        } else {
            throw new Error('Failed to update user status');
        }
    } catch (error) {
        showAlert('Failed to update user status: ' + error.message, 'danger');
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.main-content');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}