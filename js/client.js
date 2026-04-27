// ============================================
// HYPERLOCAL FREELANCE HUB - CLIENT DASHBOARD
// Post Gigs, View Posted Gigs, Manage Applications
// ============================================

window.Client = {
    // Render client dashboard
    renderClientDashboard: function() {
        const currentUser = Data.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
            console.error('Not a client user');
            return;
        }
        
        // Update welcome message
        const clientNameSpan = document.getElementById('clientName');
        if (clientNameSpan) {
            clientNameSpan.textContent = currentUser.name;
        }
        
        // Load client's gigs
        this.loadClientGigs();
    },
    
    // Load and display client's posted gigs
    loadClientGigs: function() {
        const currentUser = Data.getCurrentUser();
        if (!currentUser) return;
        
        const clientGigs = Data.getGigsByClient(currentUser.id);
        const container = document.getElementById('clientGigsList');
        
        if (!container) return;
        
        if (clientGigs.length === 0) {
            container.innerHTML = '<p class="empty-message">No gigs posted yet. Create your first gig above!</p>';
            return;
        }
        
        container.innerHTML = '';
        clientGigs.forEach(gig => {
            const applications = Data.getApplicationsByGig(gig.id);
            const gigCard = this.createGigCard(gig, applications);
            container.appendChild(gigCard);
        });
    },
    
    // Create a gig card for client view
    createGigCard: function(gig, applications) {
        const card = document.createElement('div');
        card.className = 'gig-card';
        card.dataset.gigId = gig.id;
        
        const statusBadge = this.getStatusBadge(gig.status);
        
        card.innerHTML = `
            <div class="gig-title">
                ${this.escapeHtml(gig.title)}
                ${statusBadge}
            </div>
            <div class="gig-description">${this.escapeHtml(gig.description)}</div>
            <div class="gig-meta">
                <span><i class="fas fa-dollar-sign"></i> $${gig.budget}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${this.escapeHtml(gig.location)}</span>
                <span><i class="fas fa-calendar"></i> ${new Date(gig.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="applications-section">
                <details>
                    <summary><i class="fas fa-users"></i> Applications (${applications.length})</summary>
                    <div class="applications-list" id="apps-${gig.id}">
                        ${this.renderApplications(applications, gig)}
                    </div>
                </details>
            </div>
        `;
        
        return card;
    },
    
    // Render applications for a gig
    renderApplications: function(applications, gig) {
        if (applications.length === 0) {
            return '<p class="empty-message">No applications yet.</p>';
        }
        
        return applications.map(app => `
            <div class="application-item" data-app-id="${app.id}">
                <div class="app-header">
                    <strong><i class="fas fa-user"></i> ${this.escapeHtml(app.workerName)}</strong>
                    <span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span>
                </div>
                <div class="app-proposal">"${this.escapeHtml(app.proposal)}"</div>
                ${gig.status === 'open' && app.status === 'pending' ? `
                    <div class="app-actions">
                        <button class="btn btn-sm btn-success accept-app" data-app-id="${app.id}">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn btn-sm btn-danger reject-app" data-app-id="${app.id}">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                ` : ''}
                ${gig.status === 'in_progress' && app.status === 'accepted' ? `
                    <div class="app-actions">
                        <button class="btn btn-sm btn-success complete-gig" data-gig-id="${gig.id}">
                            <i class="fas fa-check-double"></i> Mark Complete
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    },
    
    // Get status badge HTML
    getStatusBadge: function(status) {
        const badges = {
            'open': '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Open</span>',
            'in_progress': '<span class="status-badge status-accepted"><i class="fas fa-spinner"></i> In Progress</span>',
            'completed': '<span class="status-badge status-completed"><i class="fas fa-check"></i> Completed</span>',
            'cancelled': '<span class="status-badge status-pending"><i class="fas fa-ban"></i> Cancelled</span>'
        };
        return badges[status] || badges['open'];
    },
    
    // Post a new gig
    postGig: function(title, description, budget, location) {
        const currentUser = Data.getCurrentUser();
        
        if (!title || title.trim() === '') {
            Auth.showError('Please enter a gig title');
            return false;
        }
        
        if (!description || description.trim() === '') {
            Auth.showError('Please enter a description');
            return false;
        }
        
        if (!budget || budget <= 0) {
            Auth.showError('Please enter a valid budget');
            return false;
        }
        
        if (!location || location.trim() === '') {
            Auth.showError('Please enter a location');
            return false;
        }
        
        const newGig = Data.addGig({
            clientId: currentUser.id,
            clientName: currentUser.name,
            title: title,
            description: description,
            budget: parseFloat(budget),
            location: location
        });
        
        Auth.showSuccess('Gig posted successfully!');
        
        // Clear form
        document.getElementById('gigTitle').value = '';
        document.getElementById('gigDesc').value = '';
        document.getElementById('gigBudget').value = '';
        document.getElementById('gigLocation').value = '';
        
        // Reload gigs
        this.loadClientGigs();
        return true;
    },
    
    // Accept an application
    acceptApplication: function(applicationId) {
        const success = Data.updateApplicationStatus(applicationId, 'accepted');
        if (success) {
            Auth.showSuccess('Application accepted! Worker has been notified.');
            this.loadClientGigs(); // Refresh view
        } else {
            Auth.showError('Failed to accept application');
        }
    },
    
    // Reject an application
    rejectApplication: function(applicationId) {
        const success = Data.updateApplicationStatus(applicationId, 'rejected');
        if (success) {
            Auth.showSuccess('Application rejected');
            this.loadClientGigs(); // Refresh view
        } else {
            Auth.showError('Failed to reject application');
        }
    },
    
    // Mark gig as complete
    completeGig: function(gigId) {
        const success = Data.updateGigStatus(gigId, 'completed');
        if (success) {
            Auth.showSuccess('Gig marked as completed!');
            this.loadClientGigs(); // Refresh view
        } else {
            Auth.showError('Failed to mark gig as completed');
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
    // Accept application button
    if (e.target.closest('.accept-app')) {
        const btn = e.target.closest('.accept-app');
        const appId = parseInt(btn.dataset.appId);
        Client.acceptApplication(appId);
    }
    
    // Reject application button
    if (e.target.closest('.reject-app')) {
        const btn = e.target.closest('.reject-app');
        const appId = parseInt(btn.dataset.appId);
        Client.rejectApplication(appId);
    }
    
    // Complete gig button
    if (e.target.closest('.complete-gig')) {
        const btn = e.target.closest('.complete-gig');
        const gigId = parseInt(btn.dataset.gigId);
        Client.completeGig(gigId);
    }
});