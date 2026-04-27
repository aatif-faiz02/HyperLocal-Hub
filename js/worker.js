// ============================================
// HYPERLOCAL FREELANCE HUB - WORKER DASHBOARD
// View Available Gigs, Apply, Track Applications
// ============================================

window.Worker = {
    // Render worker dashboard
    renderWorkerDashboard: function() {
        const currentUser = Data.getCurrentUser();
        if (!currentUser || currentUser.role !== 'worker') {
            console.error('Not a worker user');
            return;
        }
        
        // Update welcome message
        const workerNameSpan = document.getElementById('workerName');
        if (workerNameSpan) {
            workerNameSpan.textContent = currentUser.name;
        }
        
        // Load available gigs and applications
        this.loadAvailableGigs();
        this.loadMyApplications();
    },
    
    // Load and display available gigs
    loadAvailableGigs: function() {
        const currentUser = Data.getCurrentUser();
        if (!currentUser) return;
        
        const availableGigs = Data.getAvailableGigsForWorker();
        const container = document.getElementById('availableGigsList');
        
        if (!container) return;
        
        if (availableGigs.length === 0) {
            container.innerHTML = '<p class="empty-message">No gigs available nearby. Check back later!</p>';
            return;
        }
        
        container.innerHTML = '';
        availableGigs.forEach(gig => {
            const hasApplied = Data.hasApplied(currentUser.id, gig.id);
            const gigCard = this.createAvailableGigCard(gig, hasApplied);
            container.appendChild(gigCard);
        });
    },
    
    // Create a gig card for worker view
    createAvailableGigCard: function(gig, hasApplied) {
        const card = document.createElement('div');
        card.className = 'gig-card';
        card.dataset.gigId = gig.id;
        
        card.innerHTML = `
            <div class="gig-title">${this.escapeHtml(gig.title)}</div>
            <div class="gig-description">${this.escapeHtml(gig.description)}</div>
            <div class="gig-meta">
                <span><i class="fas fa-user"></i> ${this.escapeHtml(gig.clientName)}</span>
                <span><i class="fas fa-dollar-sign"></i> $${gig.budget}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(gig.location)}</span>
            </div>
            ${!hasApplied ? `
                <div class="gig-actions">
                    <textarea id="proposal-${gig.id}" class="proposal-input" rows="2" placeholder="Write a proposal to the client..."></textarea>
                    <button class="btn btn-primary btn-sm apply-btn" data-gig-id="${gig.id}">
                        <i class="fas fa-paper-plane"></i> Apply Now
                    </button>
                </div>
            ` : `
                <div class="applied-badge">
                    <span class="status-badge status-pending"><i class="fas fa-check-circle"></i> Applied</span>
                </div>
            `}
        `;
        
        return card;
    },
    
    // Load worker's applications
    loadMyApplications: function() {
        const currentUser = Data.getCurrentUser();
        if (!currentUser) return;
        
        const myApplications = Data.getApplicationsByWorker(currentUser.id);
        const container = document.getElementById('myApplicationsList');
        
        if (!container) return;
        
        if (myApplications.length === 0) {
            container.innerHTML = '<p class="empty-message">You haven\'t applied to any gigs yet. Browse available gigs above!</p>';
            return;
        }
        
        container.innerHTML = '';
        myApplications.forEach(app => {
            const gig = Data.getGigById(app.gigId);
            if (gig) {
                const appCard = this.createApplicationCard(app, gig);
                container.appendChild(appCard);
            }
        });
    },
    
    // Create application card
    createApplicationCard: function(application, gig) {
        const card = document.createElement('div');
        card.className = 'gig-card';
        
        const statusText = {
            'pending': 'Pending Review',
            'accepted': 'Accepted! 🎉',
            'rejected': 'Not Selected'
        }[application.status] || application.status;
        
        const statusClass = {
            'pending': 'status-pending',
            'accepted': 'status-accepted',
            'rejected': 'status-pending'
        }[application.status] || 'status-pending';
        
        card.innerHTML = `
            <div class="gig-title">${this.escapeHtml(gig.title)}</div>
            <div class="gig-meta">
                <span><i class="fas fa-user"></i> Client: ${this.escapeHtml(gig.clientName)}</span>
                <span><i class="fas fa-dollar-sign"></i> $${gig.budget}</span>
            </div>
            <div class="gig-description">${this.escapeHtml(gig.description)}</div>
            <div class="application-status">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            ${application.proposal ? `
                <div class="your-proposal">
                    <small><i class="fas fa-comment"></i> Your proposal:</small>
                    <p>"${this.escapeHtml(application.proposal)}"</p>
                </div>
            ` : ''}
            ${gig.status === 'in_progress' && application.status === 'accepted' ? `
                <div class="gig-actions">
                    <button class="btn btn-sm btn-success mark-work-done" data-gig-id="${gig.id}">
                        <i class="fas fa-check-double"></i> Mark Work Done
                    </button>
                </div>
            ` : ''}
            ${gig.status === 'completed' && application.status === 'accepted' ? `
                <div class="completion-message">
                    <span class="status-badge status-completed"><i class="fas fa-star"></i> Completed - Rating Pending</span>
                </div>
            ` : ''}
        `;
        
        return card;
    },
    
    // Apply to a gig
    applyToGig: function(gigId, proposal) {
        const currentUser = Data.getCurrentUser();
        
        if (!proposal || proposal.trim() === '') {
            Auth.showError('Please write a proposal before applying');
            return false;
        }
        
        // Check if already applied
        if (Data.hasApplied(currentUser.id, gigId)) {
            Auth.showError('You have already applied to this gig');
            return false;
        }
        
        const application = Data.addApplication({
            gigId: gigId,
            workerId: currentUser.id,
            workerName: currentUser.name,
            proposal: proposal
        });
        
        if (application) {
            Auth.showSuccess('Application submitted successfully!');
            
            // Clear the proposal textarea
            const textarea = document.getElementById(`proposal-${gigId}`);
            if (textarea) textarea.value = '';
            
            // Reload both lists
            this.loadAvailableGigs();
            this.loadMyApplications();
            return true;
        } else {
            Auth.showError('Failed to submit application');
            return false;
        }
    },
    
    // Mark work as done (worker completes the gig)
    markWorkDone: function(gigId) {
        const success = Data.updateGigStatus(gigId, 'completed');
        if (success) {
            Auth.showSuccess('Work marked as completed! Payment will be released.');
            this.loadMyApplications(); // Refresh view
        } else {
            Auth.showError('Failed to mark work as done');
        }
    },
    
    // Escape HTML to prevent XSS
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Event delegation for dynamic buttons
document.addEventListener('click', function(e) {
    // Apply button
    if (e.target.closest('.apply-btn')) {
        const btn = e.target.closest('.apply-btn');
        const gigId = parseInt(btn.dataset.gigId);
        const proposalTextarea = document.getElementById(`proposal-${gigId}`);
        const proposal = proposalTextarea ? proposalTextarea.value : '';
        Worker.applyToGig(gigId, proposal);
    }
    
    // Mark work done button
    if (e.target.closest('.mark-work-done')) {
        const btn = e.target.closest('.mark-work-done');
        const gigId = parseInt(btn.dataset.gigId);
        Worker.markWorkDone(gigId);
    }
});