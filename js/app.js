// ============================================
// HYPERLOCAL FREELANCE HUB - MAIN APP CONTROLLER
// Screen Navigation, Event Binding, Initialization
// ============================================

window.App = {
    // Current active screen
    currentScreen: null,
    
    // Selected role (for profile completion)
    selectedRole: null,
    
    // Initialize the application
    init: function() {
        console.log('HyperLocal Freelance Hub - Prototype Initialized');
        
        // Load mock data
        Data.loadMockData();
        
        // Bind all events
        this.bindEvents();
        
        // Show initial screen (signup)
        this.showScreen('signupScreen');
        
        // Update header actions based on login state
        this.updateHeader();
    },
    
    // Bind all DOM events
    bindEvents: function() {
        // Signup form - Send OTP button
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', () => this.handleSendOtp());
        }
        
        // OTP verification
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        if (verifyOtpBtn) {
            verifyOtpBtn.addEventListener('click', () => this.handleVerifyOtp());
        }
        
        // Resend OTP
        const resendOtpBtn = document.getElementById('resendOtpBtn');
        if (resendOtpBtn) {
            resendOtpBtn.addEventListener('click', () => Auth.resendOtp());
        }
        
        // OTP method toggle (Email vs Phone)
        const useEmailBtn = document.getElementById('useEmailOtpBtn');
        const usePhoneBtn = document.getElementById('usePhoneOtpBtn');
        if (useEmailBtn) {
            useEmailBtn.addEventListener('click', () => this.toggleOtpMethod('email'));
        }
        if (usePhoneBtn) {
            usePhoneBtn.addEventListener('click', () => this.toggleOtpMethod('phone'));
        }
        
        // Role selection cards
        const roleCards = document.querySelectorAll('.role-card');
        roleCards.forEach(card => {
            card.addEventListener('click', () => this.selectRole(card));
        });
        
        // Confirm role button
        const confirmRoleBtn = document.getElementById('confirmRoleBtn');
        if (confirmRoleBtn) {
            confirmRoleBtn.addEventListener('click', () => this.confirmRole());
        }
        
        // Profile completion form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }
        
        // Post gig form (client)
        const postGigForm = document.getElementById('postGigForm');
        if (postGigForm) {
            postGigForm.addEventListener('submit', (e) => this.handlePostGig(e));
        }
        
        // Logout button (dynamic - will be added to header)
        this.setupLogoutListener();
    },
    
    // Handle Send OTP
    handleSendOtp: function() {
        const name = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        
        if (Auth.validateSignup(name, email, phone)) {
            const method = Auth.pendingVerificationMethod;
            Auth.sendOtp(email, phone, method);
            
            // Update UI to show which method was used
            const verificationTarget = document.getElementById('verificationTarget');
            if (verificationTarget) {
                verificationTarget.textContent = method === 'email' ? email : phone;
            }
            
            this.showScreen('otpScreen');
        }
    },
    
    // Handle Verify OTP
    handleVerifyOtp: function() {
        const otpCode = document.getElementById('otpCode').value;
        Auth.verifyOtp(otpCode);
    },
    
    // Toggle between email and phone OTP
    toggleOtpMethod: function(method) {
        Auth.pendingVerificationMethod = method;
        
        // Update UI active state
        const emailBtn = document.getElementById('useEmailOtpBtn');
        const phoneBtn = document.getElementById('usePhoneOtpBtn');
        
        if (method === 'email') {
            emailBtn.classList.add('active');
            phoneBtn.classList.remove('active');
        } else {
            phoneBtn.classList.add('active');
            emailBtn.classList.remove('active');
        }
        
        // Update hint text
        const hint = document.querySelector('#otpScreen .hint');
        if (hint) {
            hint.innerHTML = `Demo: Use code <strong>123456</strong> sent to your ${method}`;
        }
    },
    
    // Select role from card
    selectRole: function(cardElement) {
        // Remove selected class from all
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selected class to clicked card
        cardElement.classList.add('selected');
        
        // Store selected role
        this.selectedRole = cardElement.dataset.role;
        
        // Enable confirm button
        const confirmBtn = document.getElementById('confirmRoleBtn');
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
    },
    
    // Confirm selected role
    confirmRole: function() {
        if (this.selectedRole) {
            Auth.setRole(this.selectedRole);
        } else {
            Auth.showError('Please select a role first');
        }
    },
    
    // Handle profile form submission
    handleProfileSubmit: function(e) {
        e.preventDefault();
        
        const currentUser = Data.getCurrentUser();
        if (!currentUser) return;
        
        const profileData = {
            location: document.getElementById('location').value,
            bio: document.getElementById('bio').value,
            profilePhoto: document.getElementById('profilePhoto').value
        };
        
        if (currentUser.role === 'worker') {
            profileData.skills = document.getElementById('skills').value;
            profileData.hourlyRate = document.getElementById('hourlyRate').value;
        } else if (currentUser.role === 'client') {
            profileData.company = document.getElementById('company').value;
        }
        
        Auth.completeProfile(profileData);
        this.updateHeader();
    },
    
    // Handle post gig submission
    handlePostGig: function(e) {
        e.preventDefault();
        
        const title = document.getElementById('gigTitle').value;
        const description = document.getElementById('gigDesc').value;
        const budget = document.getElementById('gigBudget').value;
        const location = document.getElementById('gigLocation').value;
        
        Client.postGig(title, description, budget, location);
    },
    
    // Show specific screen
    showScreen: function(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show selected screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
        
        // Update header based on screen
        this.updateHeader();
        
        // If showing dashboard, refresh data
        if (screenId === 'clientDashboard' && window.Client) {
            Client.renderClientDashboard();
        } else if (screenId === 'workerDashboard' && window.Worker) {
            Worker.renderWorkerDashboard();
        }
    },
    
    // Update header actions (logout button, etc.)
    updateHeader: function() {
        const headerActions = document.getElementById('headerActions');
        if (!headerActions) return;
        
        const currentUser = Data.getCurrentUser();
        
        if (currentUser && currentUser.isVerified) {
            // Show logged-in state
            headerActions.innerHTML = `
                <span class="user-greeting">
                    <i class="fas fa-user-circle"></i> ${this.escapeHtml(currentUser.name)}
                </span>
                <button id="logoutBtn" class="btn btn-link">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
            this.setupLogoutListener();
        } else {
            // Show logged-out state (nothing or simple text)
            headerActions.innerHTML = `
                <span class="user-greeting">
                    <i class="fas fa-globe"></i> Local Marketplace
                </span>
            `;
        }
    },
    
    // Setup logout button listener
    setupLogoutListener: function() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Remove existing listener to avoid duplicates
            const newBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newBtn, logoutBtn);
            newBtn.addEventListener('click', () => {
                Auth.logout();
                this.updateHeader();
            });
        }
    },
    
    // Escape HTML
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Add some additional styles for better UI
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    .user-greeting {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: var(--primary-color);
    }
    
    .applications-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--light-gray);
    }
    
    .applications-section details summary {
        cursor: pointer;
        font-weight: 500;
        color: var(--primary-color);
    }
    
    .application-item {
        background: var(--white);
        padding: 10px;
        margin-top: 8px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--light-gray);
    }
    
    .app-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .app-proposal {
        font-size: 0.85rem;
        color: var(--gray-color);
        margin-bottom: 8px;
        font-style: italic;
    }
    
    .app-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }
    
    .proposal-input {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--light-gray);
        border-radius: var(--radius-sm);
        font-family: inherit;
        font-size: 0.85rem;
        resize: vertical;
        margin-bottom: 8px;
    }
    
    .applied-badge {
        margin-top: 8px;
    }
    
    .your-proposal {
        margin-top: 8px;
        padding: 8px;
        background: var(--lighter-gray);
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
    }
    
    .your-proposal p {
        margin-top: 4px;
        font-style: italic;
    }
    
    .completion-message {
        margin-top: 8px;
    }
    
    .application-status {
        margin-top: 8px;
    }
    
    details summary {
        list-style: none;
    }
    
    details summary::-webkit-details-marker {
        display: none;
    }
    
    details summary::before {
        content: '▶';
        display: inline-block;
        margin-right: 8px;
        font-size: 0.8rem;
        transition: transform 0.2s;
    }
    
    details[open] summary::before {
        transform: rotate(90deg);
    }
`;
document.head.appendChild(additionalStyles);