// User Type Detection and Personalization Script
// Add this to any presentation page to detect user type and customize experience

(function () {
    // Get user type from URL parameters or session storage
    function getUserType() {
        const urlParams = new URLSearchParams(window.location.search);
        const typeFromURL = urlParams.get('type');
        const sessionData = sessionStorage.getItem('visitorData');

        if (typeFromURL) {
            return typeFromURL;
        } else if (sessionData) {
            const userData = JSON.parse(sessionData);
            return userData.userType;
        }
        return 'visitor'; // default
    }

    // Get user data from session storage
    function getUserData() {
        const sessionData = sessionStorage.getItem('visitorData');
        if (sessionData) {
            return JSON.parse(sessionData);
        }
        return null;
    }

    // Initialize user experience
    function initializeUserExperience() {
        const userType = getUserType();
        const userData = getUserData();

        // Add user type class to body for CSS targeting
        document.body.classList.add(`user-type-${userType}`);

        // Add personalized welcome message if we have user data
        if (userData && userData.fullName) {
            addWelcomeMessage(userData, userType);
        }

        // Add appropriate navigation based on user type
        addUserTypeNavigation(userType);

        // Show/hide content based on user type
        customizeContentForUserType(userType);
    }

    // Add personalized welcome message
    function addWelcomeMessage(userData, userType) {
        const welcomeHTML = `
            <div id="personalizedWelcome" style="
                position: fixed; 
                top: 20px; 
                right: 20px; 
                background: rgba(188, 168, 109, 0.9); 
                color: #182719; 
                padding: 10px 20px; 
                border-radius: 25px; 
                font-size: 14px; 
                font-weight: 600;
                z-index: 1000;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            ">
                Welcome, ${userData.fullName}! 
                <span style="font-size: 12px; opacity: 0.8;">
                    (${userType === 'investor' ? 'Investor' : userType === 'team' ? 'Team' : 'Visitor'})
                </span>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', welcomeHTML);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            const welcome = document.getElementById('personalizedWelcome');
            if (welcome) {
                welcome.style.opacity = '0';
                welcome.style.transition = 'opacity 1s ease';
                setTimeout(() => welcome.remove(), 1000);
            }
        }, 5000);
    }

    // Add navigation appropriate for user type
    function addUserTypeNavigation(userType) {
        const navHTML = `
            <div id="userTypeNav" style="
                position: fixed; 
                bottom: 20px; 
                left: 20px; 
                z-index: 1000;
            ">
                <div style="
                    background: rgba(24, 39, 25, 0.9); 
                    border: 1px solid rgba(188, 168, 109, 0.3);
                    border-radius: 15px; 
                    padding: 15px;
                    backdrop-filter: blur(10px);
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                ">
                    ${getNavigationLinksForUserType(userType)}
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', navHTML);
    }

    // Get navigation links based on user type
    function getNavigationLinksForUserType(userType) {
        const baseStyle = `
            color: #Bca86d; 
            text-decoration: none; 
            padding: 8px 15px; 
            border-radius: 8px; 
            font-size: 13px; 
            font-weight: 500;
            transition: all 0.3s ease;
            border: 1px solid rgba(188, 168, 109, 0.2);
        `;

        const hoverStyle = `
            onmouseover="this.style.backgroundColor='rgba(188, 168, 109, 0.2)'" 
            onmouseout="this.style.backgroundColor='transparent'"
        `;

        switch (userType) {
            case 'visitor':
                return `
                    <a href="visitor-access.html" style="${baseStyle}" ${hoverStyle}>← Change Access</a>
                    <a href="investor-portal.html" style="${baseStyle}" ${hoverStyle}>Investor Info</a>
                `;
            case 'investor':
                return `
                    <a href="visitor-access.html" style="${baseStyle}" ${hoverStyle}>← Change Access</a>
                    <a href="investment-commitment.html" style="${baseStyle}" ${hoverStyle}>💰 Commit</a>
                    <a href="investor-portal.html" style="${baseStyle}" ${hoverStyle}>📊 Portal</a>
                `;
            case 'team':
                return `
                    <a href="visitor-access.html" style="${baseStyle}" ${hoverStyle}>← Change Access</a>
                    <a href="admin-dashboard.html" style="${baseStyle}" ${hoverStyle}>🔐 Admin</a>
                    <a href="investor-portal.html" style="${baseStyle}" ${hoverStyle}>📊 Portal</a>
                `;
            default:
                return `<a href="visitor-access.html" style="${baseStyle}" ${hoverStyle}>← Back to Access</a>`;
        }
    }

    // Customize content visibility based on user type
    function customizeContentForUserType(userType) {
        // Add custom CSS for user type specific styling
        const style = document.createElement('style');
        style.textContent = `
            /* Investor-specific enhancements */
            body.user-type-investor .financial-data {
                display: block !important;
            }
            
            /* Team-specific enhancements */
            body.user-type-team .admin-notes {
                display: block !important;
            }
            
            /* Visitor limitations */
            body.user-type-visitor .sensitive-financial {
                filter: blur(3px);
                position: relative;
            }
            
            body.user-type-visitor .sensitive-financial::after {
                content: 'Available to Accredited Investors';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(188, 168, 109, 0.9);
                color: #182719;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: bold;
                text-align: center;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUserExperience);
    } else {
        initializeUserExperience();
    }
})();