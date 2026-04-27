// ============================================
// HYPERLOCAL FREELANCE HUB - DATA LAYER
// Mock Database with Users, Gigs, Applications
// ============================================

window.Data = {
    // Mock data stores
    users: [],
    gigs: [],
    applications: [],
    
    // Current logged-in user
    currentUser: null,
    
    // ID counters for auto-increment
    nextUserId: 1,
    nextGigId: 1,
    nextApplicationId: 1,
    
    // ============================================
    // USER METHODS
    // ============================================
    
    // Add a new user
    addUser: function(userData) {
        const newUser = {
            id: this.nextUserId++,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role || null,
            isVerified: userData.isVerified || false,
            location: userData.location || '',
            bio: userData.bio || '',
            profilePhoto: userData.profilePhoto || '',
            skills: userData.skills || [],
            hourlyRate: userData.hourlyRate || null,
            company: userData.company || null,
            createdAt: new Date().toISOString()
        };
        this.users.push(newUser);
        return newUser;
    },
    
    // Find user by email
    findUserByEmail: function(email) {
        return this.users.find(user => user.email === email);
    },
    
    // Find user by phone
    findUserByPhone: function(phone) {
        return this.users.find(user => user.phone === phone);
    },
    
    // Get user by ID
    getUserById: function(id) {
        return this.users.find(user => user.id === id);
    },
    
    // Update user verification status
    verifyUser: function(email, phone) {
        const user = this.findUserByEmail(email) || this.findUserByPhone(phone);
        if (user) {
            user.isVerified = true;
            return true;
        }
        return false;
    },
    
    // Update user role
    setUserRole: function(email, role) {
        const user = this.findUserByEmail(email);
        if (user) {
            user.role = role;
            return true;
        }
        return false;
    },
    
    // Complete user profile
    completeProfile: function(email, profileData) {
        const user = this.findUserByEmail(email);
        if (user) {
            user.location = profileData.location || user.location;
            user.bio = profileData.bio || user.bio;
            user.profilePhoto = profileData.profilePhoto || user.profilePhoto;
            
            if (user.role === 'worker') {
                user.skills = profileData.skills ? profileData.skills.split(',').map(s => s.trim()) : [];
                user.hourlyRate = profileData.hourlyRate || null;
            } else if (user.role === 'client') {
                user.company = profileData.company || null;
            }
            return true;
        }
        return false;
    },
    
    // Set current logged-in user
    setCurrentUser: function(email) {
        this.currentUser = this.findUserByEmail(email);
        return this.currentUser;
    },
    
    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // Logout
    logout: function() {
        this.currentUser = null;
    },
    
    // ============================================
    // GIG METHODS
    // ============================================
    
    // Add a new gig
    addGig: function(gigData) {
        const newGig = {
            id: this.nextGigId++,
            clientId: gigData.clientId,
            clientName: gigData.clientName,
            title: gigData.title,
            description: gigData.description,
            budget: gigData.budget,
            location: gigData.location,
            status: 'open', // open, in_progress, completed, cancelled
            createdAt: new Date().toISOString(),
            hiredWorkerId: null
        };
        this.gigs.push(newGig);
        return newGig;
    },
    
    // Get all open gigs
    getOpenGigs: function() {
        return this.gigs.filter(gig => gig.status === 'open');
    },
    
    // Get gigs by client
    getGigsByClient: function(clientId) {
        return this.gigs.filter(gig => gig.clientId === clientId);
    },
    
    // Get gig by ID
    getGigById: function(gigId) {
        return this.gigs.find(gig => gig.id === gigId);
    },
    
    // Update gig status
    updateGigStatus: function(gigId, status, workerId = null) {
        const gig = this.getGigById(gigId);
        if (gig) {
            gig.status = status;
            if (workerId) {
                gig.hiredWorkerId = workerId;
            }
            return true;
        }
        return false;
    },
    
    // Get gigs with worker info (for worker dashboard)
    getAvailableGigsForWorker: function() {
        return this.getOpenGigs();
    },
    
    // ============================================
    // APPLICATION METHODS
    // ============================================
    
    // Add an application
    addApplication: function(applicationData) {
        // Check if already applied
        const existing = this.applications.find(
            app => app.gigId === applicationData.gigId && app.workerId === applicationData.workerId
        );
        if (existing) {
            return null;
        }
        
        const newApplication = {
            id: this.nextApplicationId++,
            gigId: applicationData.gigId,
            workerId: applicationData.workerId,
            workerName: applicationData.workerName,
            proposal: applicationData.proposal || '',
            status: 'pending', // pending, accepted, rejected
            appliedAt: new Date().toISOString()
        };
        this.applications.push(newApplication);
        return newApplication;
    },
    
    // Get applications for a specific gig
    getApplicationsByGig: function(gigId) {
        return this.applications.filter(app => app.gigId === gigId);
    },
    
    // Get applications by worker
    getApplicationsByWorker: function(workerId) {
        return this.applications.filter(app => app.workerId === workerId);
    },
    
    // Get applications by client (through gigs they posted)
    getApplicationsByClient: function(clientId) {
        const clientGigs = this.getGigsByClient(clientId);
        const clientGigIds = clientGigs.map(gig => gig.id);
        return this.applications.filter(app => clientGigIds.includes(app.gigId));
    },
    
    // Update application status
    updateApplicationStatus: function(applicationId, status) {
        const application = this.applications.find(app => app.id === applicationId);
        if (application) {
            application.status = status;
            
            // If accepted, update gig status
            if (status === 'accepted') {
                this.updateGigStatus(application.gigId, 'in_progress', application.workerId);
            }
            return true;
        }
        return false;
    },
    
    // Check if worker applied to a gig
    hasApplied: function(workerId, gigId) {
        return this.applications.some(
            app => app.workerId === workerId && app.gigId === gigId
        );
    },
    
    // ============================================
    // INITIAL MOCK DATA (for demonstration)
    // ============================================
    
    loadMockData: function() {
        // Only load if no users exist
        if (this.users.length > 0) return;
        
        // Create a sample client
        const sampleClient = this.addUser({
            name: "Priya Sharma",
            email: "priya@example.com",
            phone: "+91 98765 00001",
            role: "client",
            isVerified: true,
            location: "Indiranagar, Bangalore",
            bio: "Homeowner looking for reliable local help",
            company: "Home Solutions Pvt Ltd"
        });
        
        // Create a sample worker
        const sampleWorker = this.addUser({
            name: "Amit Kumar",
            email: "amit@example.com",
            phone: "+91 98765 00002",
            role: "worker",
            isVerified: true,
            location: "Koramangala, Bangalore",
            bio: "Experienced handyman with 5+ years experience",
            skills: ["Plumbing", "Electrical", "Furniture Assembly"],
            hourlyRate: 25
        });
        
        // Create sample gigs
        this.addGig({
            clientId: sampleClient.id,
            clientName: sampleClient.name,
            title: "Fix leaking kitchen sink",
            description: "The sink under my kitchen is leaking. Need someone to fix it urgently.",
            budget: 35,
            location: "Indiranagar, Bangalore"
        });
        
        this.addGig({
            clientId: sampleClient.id,
            clientName: sampleClient.name,
            title: "Tutor for 10th grade Math",
            description: "Need a tutor for 1 hour to help with algebra homework.",
            budget: 20,
            location: "Indiranagar, Bangalore"
        });
        
        this.addGig({
            clientId: sampleClient.id,
            clientName: sampleClient.name,
            title: "Help move furniture",
            description: "Need 2 people to help move a sofa and bed to a new apartment.",
            budget: 50,
            location: "Indiranagar, Bangalore"
        });
        
        // Add a sample application
        this.addApplication({
            gigId: 1,
            workerId: sampleWorker.id,
            workerName: sampleWorker.name,
            proposal: "I have 5 years of plumbing experience. Can fix this quickly."
        });
    }
};

// Export for use in other files (for browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Data;
}