// ============================================
// HYPERLOCAL FREELANCE HUB - AUTHENTICATION
// Signup, OTP Verification, Role Selection
// ============================================

window.Auth = {
    // Temporary storage for pending user
    pendingUser: null,
    pendingVerificationMethod: 'email', // 'email' or 'phone'
    
    // Current OTP code (simulated)
    currentOtp: null,
    
    // ============================================
    // SIGNUP METHODS
    // ============================================
    
    // Validate signup form
    validateSignup: function(name, email, phone) {
        if (!name || name.trim() === '') {
            this.showError('Please enter your full name');
            return false;
        }
        
        if (!email || !this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return false;
        }
        
        if (!phone || phone.trim() === '') {
            this.showError('Please enter your phone number');
            return false;
        }
        
        // Check if user already exists
        const existingUserByEmail = Data.findUserByEmail(email);
        const existingUserByPhone = Data.findUserByPhone(phone);
        
        if (existingUserByEmail) {
            this.showError('An account with this email already exists');
            return false;
        }
        
        if (existingUserByPhone) {
            this.showError('An account with this phone number already exists');
            return false;
        }
        
        return true;
    },
    
    // Validate email format
    isValidEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Send OTP (simulated)
    sendOtp: function(email, phone, method) {
        // Generate random 6-digit OTP
        this.currentOtp = '123456'; // Hardcoded for demo consistency
        
        // Simulate sending
        if (method === 'email') {
            this.showSuccess(`Demo: OTP ${this.currentOtp} sent to ${email}`);
            console.log(`[DEMO] Email OTP for ${email}: ${this.currentOtp}`);
        } else {
            this.showSuccess(`Demo: OTP ${this.currentOtp} sent to ${phone}`);
            console.log(`[DEMO] Phone OTP for ${phone}: ${this.currentOtp}`);
        }
        
        // Store pending user info
        this.pendingUser = {
            name: document.getElementById('fullName').value,
            email: email,
            phone: phone,
            isVerified: false
        };
        
        return true;
    },
    
    // Verify OTP
    verifyOtp: function(enteredOtp) {
        if (!this.currentOtp) {
            this.showError('Please request an OTP first');
            return false;
        }
        
        if (enteredOtp === this.currentOtp) {
            // Create user in database
            const newUser = Data.addUser({
                name: this.pendingUser.name,
                email: this.pendingUser.email,
                phone: this.pendingUser.phone,
                isVerified: true
            });
            
            Data.setCurrentUser(this.pendingUser.email);
            this.showSuccess('Verification successful!');
            
            // Move to role selection
            App.showScreen('roleScreen');
            return true;
        } else {
            this.showError('Invalid OTP. Please try again.');
            return false;
        }
    },
    
    // Resend OTP
    resendOtp: function() {
        if (this.pendingUser) {
            this.sendOtp(
                this.pendingUser.email,
                this.pendingUser.phone,
                this.pendingVerificationMethod
            );
        }
    },
    
    // ============================================
    // ROLE SELECTION METHODS
    // ============================================
    
    // Set user role
    setRole: function(role) {
        const currentUser = Data.getCurrentUser();
        if (currentUser) {
            Data.setUserRole(currentUser.email, role);
            this.showSuccess(`You're now registered as a ${role}`);
            
            // Move to profile completion
            this.showRoleSpecificFields(role);
            App.showScreen('profileScreen');
            return true;
        }
        return false;
    },
    
    // Show role-specific fields in profile form
    showRoleSpecificFields: function(role) {
        const workerFields = document.getElementById('workerFields');
        const clientFields = document.getElementById('clientFields');
        
        if (role === 'worker') {
            if (workerFields) workerFields.style.display = 'block';
            if (clientFields) clientFields.style.display = 'none';
        } else if (role === 'client') {
            if (workerFields) workerFields.style.display = 'none';
            if (clientFields) clientFields.style.display = 'block';
        }
    },
    
    // ============================================
    // PROFILE COMPLETION
    // ============================================
    
    // Complete profile
    completeProfile: function(profileData) {
        const currentUser = Data.getCurrentUser();
        if (currentUser) {
            const success = Data.completeProfile(currentUser.email, profileData);
            if (success) {
                this.showSuccess('Profile completed!');
                
                // Redirect to appropriate dashboard
                if (currentUser.role === 'client') {
                    App.showScreen('clientDashboard');
                    if (window.Client) Client.renderClientDashboard();
                } else if (currentUser.role === 'worker') {
                    App.showScreen('workerDashboard');
                    if (window.Worker) Worker.renderWorkerDashboard();
                }
                return true;
            }
        }
        this.showError('Failed to save profile');
        return false;
    },
    
    // ============================================
    // LOGOUT
    // ============================================
    
    logout: function() {
        Data.logout();
        this.pendingUser = null;
        this.currentOtp = null;
        this.showSuccess('Logged out successfully');
        
        // Clear form fields
        document.getElementById('fullName').value = '';
        document.getElementById('email').value = '';
        document.getElementById('phone').value = '';
        document.getElementById('otpCode').value = '';
        
        App.showScreen('signupScreen');
    },
    
    // ============================================
    // UI HELPERS (Toast Notifications)
    // ============================================
    
    showError: function(message) {
        this.showToast(message, 'error');
    },
    
    showSuccess: function(message) {
        this.showToast(message, 'success');
    },
    
    showToast: function(message, type) {
        // Remove existing toast
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f56565' : '#48bb78'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
`;
document.head.appendChild(style);