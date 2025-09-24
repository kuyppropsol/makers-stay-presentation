const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('investors.db');

// Initialize database tables
db.serialize(() => {
    // Investor requests table
    db.run(`CREATE TABLE IF NOT EXISTS investor_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        company TEXT,
        accreditation TEXT,
        investmentRange TEXT,
        timeline TEXT,
        referralSource TEXT,
        userAgent TEXT,
        ipAddress TEXT,
        referrerUrl TEXT,
        status TEXT DEFAULT 'pending',
        submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        approvedAt DATETIME,
        rejectedAt DATETIME,
        accessToken TEXT,
        lastLogin DATETIME,
        pageViews INTEGER DEFAULT 0,
        confidentialityAgreed BOOLEAN DEFAULT 0,
        riskAcknowledged BOOLEAN DEFAULT 0,
        noGuaranteeAgreed BOOLEAN DEFAULT 0
    )`);

    // Page tracking table
    db.run(`CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        investorId INTEGER,
        pageName TEXT,
        pageUrl TEXT,
        timeSpent INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        sessionId TEXT,
        FOREIGN KEY (investorId) REFERENCES investor_requests (id)
    )`);

    // Admin users table
    db.run(`CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastLogin DATETIME,
        isActive BOOLEAN DEFAULT 1,
        failedAttempts INTEGER DEFAULT 0,
        lockedUntil DATETIME
    )`);
    
    // Emergency access methods table
    db.run(`CREATE TABLE IF NOT EXISTS emergency_access (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        identifier TEXT UNIQUE NOT NULL,
        secretHash TEXT NOT NULL,
        adminId INTEGER,
        isActive BOOLEAN DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastUsed DATETIME,
        useCount INTEGER DEFAULT 0,
        FOREIGN KEY (adminId) REFERENCES admin_users (id)
    )`);

    // Create master admin user (karolsue@themakersstay.com)
    const masterAdminHash = bcrypt.hashSync('MasterAdmin2025!KarolSue', 12);
    db.run(`INSERT OR IGNORE INTO admin_users (username, email, passwordHash, role) 
            VALUES (?, ?, ?, ?)`, ['karolsue@themakersstay.com', 'karolsue@themakersstay.com', masterAdminHash, 'master']);
    
    // Create backup admin users for failsafe access
    const backupAdminHash = bcrypt.hashSync('BackupAdmin2025!Emergency', 12);
    db.run(`INSERT OR IGNORE INTO admin_users (username, email, passwordHash, role) 
            VALUES (?, ?, ?, ?)`, ['backup-admin', 'backup@themakersstay.com', backupAdminHash, 'backup']);
    
    // Create emergency access token admin
    const emergencyTokenHash = bcrypt.hashSync('EmergencyAccess2025!Token', 12);
    db.run(`INSERT OR IGNORE INTO admin_users (username, email, passwordHash, role) 
            VALUES (?, ?, ?, ?)`, ['emergency-token', 'emergency@themakersstay.com', emergencyTokenHash, 'emergency']);
    
    // Legacy admin (keep for compatibility)
    const defaultAdminHash = bcrypt.hashSync('TempAdmin2025!', 10);
    db.run(`INSERT OR IGNORE INTO admin_users (username, email, passwordHash, role) 
            VALUES (?, ?, ?, ?)`, ['admin', 'admin@themakersstay.com', defaultAdminHash, 'admin']);
    
    // Create emergency access methods for master admin
    setTimeout(() => {
        // Get master admin ID and create backup methods
        db.get('SELECT id FROM admin_users WHERE email = ?', ['karolsue@themakersstay.com'], (err, masterAdmin) => {
            if (masterAdmin) {
                // Recovery phrase method
                const recoveryPhraseHash = bcrypt.hashSync('makers stay ecovillage investment recovery phrase 2025', 12);
                db.run(`INSERT OR IGNORE INTO emergency_access (method, identifier, secretHash, adminId) 
                        VALUES (?, ?, ?, ?)`, ['recovery-phrase', 'master-recovery', recoveryPhraseHash, masterAdmin.id]);
                
                // Security question method
                const securityAnswerHash = bcrypt.hashSync('sustainable community development', 12);
                db.run(`INSERT OR IGNORE INTO emergency_access (method, identifier, secretHash, adminId) 
                        VALUES (?, ?, ?, ?)`, ['security-question', 'what-is-makers-stay-focus', securityAnswerHash, masterAdmin.id]);
                
                // Emergency PIN method
                const emergencyPinHash = bcrypt.hashSync('717256', 12);
                db.run(`INSERT OR IGNORE INTO emergency_access (method, identifier, secretHash, adminId) 
                        VALUES (?, ?, ?, ?)`, ['emergency-pin', 'master-pin', emergencyPinHash, masterAdmin.id]);
                
                console.log('🔐 Emergency access methods created for master admin');
            }
        });
    }, 1000);
});

// Email configuration
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER, // Your email
        pass: process.env.SMTP_PASS  // Your app password
    }
});

// Email templates
const emailTemplates = {
    adminNotification: (request) => ({
        subject: `New Investor Access Request - ${request.firstName} ${request.lastName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #182719;">New Investor Access Request</h2>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
                    <h3>Contact Information</h3>
                    <p><strong>Name:</strong> ${request.firstName} ${request.lastName}</p>
                    <p><strong>Email:</strong> ${request.email}</p>
                    <p><strong>Phone:</strong> ${request.phone || 'Not provided'}</p>
                    <p><strong>Company:</strong> ${request.company || 'Not provided'}</p>
                    
                    <h3>Investment Details</h3>
                    <p><strong>Investment Range:</strong> ${request.investmentRange || 'Not specified'}</p>
                    <p><strong>Timeline:</strong> ${request.timeline || 'Not specified'}</p>
                    <p><strong>Referral Source:</strong> ${request.referralSource || 'Not provided'}</p>
                    
                    <h3>Accreditation</h3>
                    <p>${request.accreditation ? JSON.parse(request.accreditation).join(', ') : 'None specified'}</p>
                </div>
                <p><a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000/admin'}" 
                      style="background: #Bca86d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px;">
                   Review Request in Dashboard
                </a></p>
            </div>
        `
    }),

    approvalEmail: (request, accessToken) => ({
        subject: 'Access Approved - The Maker\'s Stay Investment Presentation',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #182719;">Welcome to The Maker's Stay</h2>
                <p>Dear ${request.firstName},</p>
                
                <p>Thank you for your interest in The Maker's Stay investment opportunity. Your access request has been approved!</p>
                
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #182719;">Your Access Credentials</h3>
                    <p><strong>Access Link:</strong> <a href="${process.env.FRONTEND_URL}/presentation?token=${accessToken}">Click Here to Access Presentation</a></p>
                    <p><strong>Access Token:</strong> ${accessToken}</p>
                    <p style="color: #666; font-size: 12px;">Keep this information confidential. Do not share with others.</p>
                </div>
                
                <p>This presentation contains confidential and proprietary information. By accessing it, you agree to:</p>
                <ul>
                    <li>Maintain strict confidentiality</li>
                    <li>Not distribute or copy materials</li>
                    <li>Understand investment risks</li>
                </ul>
                
                <p>Questions? Reply to this email or call us at +1-717-256-1114.</p>
                
                <p>Best regards,<br>The Maker's Stay Investment Team</p>
            </div>
        `
    }),

    rejectionEmail: (request) => ({
        subject: 'Investment Presentation Access - The Maker\'s Stay',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #182719;">Thank You for Your Interest</h2>
                <p>Dear ${request.firstName},</p>
                
                <p>Thank you for your interest in The Maker's Stay investment opportunity.</p>
                
                <p>At this time, we are focusing on investors who meet specific criteria for this particular investment round. While we cannot provide access to the full presentation currently, we appreciate your interest in sustainable community development.</p>
                
                <p>We encourage you to:</p>
                <ul>
                    <li>Visit our public website for general information</li>
                    <li>Sign up for our newsletter for future opportunities</li>
                    <li>Contact us if your investment profile changes</li>
                </ul>
                
                <p>Thank you again for considering The Maker's Stay.</p>
                
                <p>Best regards,<br>The Maker's Stay Team</p>
            </div>
        `
    })
};

// Middleware to verify JWT tokens
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.userId = decoded.userId;
        next();
    });
};

// API Routes

// Submit investor access request
app.post('/api/investor-request', async (req, res) => {
    try {
        const {
            firstName, lastName, email, phone, company,
            accreditation, investmentRange, timeline, referralSource,
            confidentiality, riskAcknowledgment, noGuarantee,
            userAgent, referrerUrl
        } = req.body;

        // Validation
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ error: 'Required fields missing' });
        }

        if (!confidentiality || !riskAcknowledgment || !noGuarantee) {
            return res.status(400).json({ error: 'Legal acknowledgments required' });
        }

        const ipAddress = req.ip || req.connection.remoteAddress;

        // Insert into database
        const stmt = db.prepare(`
            INSERT INTO investor_requests (
                firstName, lastName, email, phone, company,
                accreditation, investmentRange, timeline, referralSource,
                userAgent, ipAddress, referrerUrl,
                confidentialityAgreed, riskAcknowledged, noGuaranteeAgreed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            firstName, lastName, email, phone, company,
            JSON.stringify(accreditation || []), investmentRange, timeline, referralSource,
            userAgent, ipAddress, referrerUrl,
            confidentiality ? 1 : 0, riskAcknowledgment ? 1 : 0, noGuarantee ? 1 : 0
        ], async function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                    return res.status(409).json({ error: 'Email already registered' });
                }
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Send admin notification email
            try {
                const adminEmail = emailTemplates.adminNotification({
                    firstName, lastName, email, phone, company,
                    investmentRange, timeline, referralSource,
                    accreditation: JSON.stringify(accreditation || [])
                });

                await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: process.env.ADMIN_EMAIL || 'admin@themakersstay.com',
                    subject: adminEmail.subject,
                    html: adminEmail.html
                });
            } catch (emailError) {
                console.error('Email error:', emailError);
                // Don't fail the request if email fails
            }

            res.status(201).json({
                message: 'Request submitted successfully',
                requestId: this.lastID
            });
        });

        stmt.finalize();

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        db.get('SELECT * FROM admin_users WHERE username = ? AND isActive = 1', [username], async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check if account is locked
            if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
                return res.status(423).json({ error: 'Account temporarily locked due to failed attempts' });
            }

            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                // Increment failed attempts
                const failedAttempts = (user.failedAttempts || 0) + 1;
                const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // 30 minutes lock
                
                db.run('UPDATE admin_users SET failedAttempts = ?, lockedUntil = ? WHERE id = ?', 
                       [failedAttempts, lockUntil, user.id]);
                
                return res.status(401).json({ 
                    error: 'Invalid credentials',
                    attemptsRemaining: Math.max(0, 5 - failedAttempts)
                });
            }

            // Reset failed attempts on successful login
            db.run('UPDATE admin_users SET lastLogin = CURRENT_TIMESTAMP, failedAttempts = 0, lockedUntil = NULL WHERE id = ?', [user.id]);

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'fallback_secret_change_me',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Emergency login with recovery phrase
app.post('/api/admin/emergency-login', async (req, res) => {
    try {
        const { method, identifier, secret } = req.body;

        // Get emergency access method
        db.get('SELECT ea.*, au.* FROM emergency_access ea JOIN admin_users au ON ea.adminId = au.id WHERE ea.method = ? AND ea.identifier = ? AND ea.isActive = 1', 
               [method, identifier], async (err, emergencyAccess) => {
            if (err || !emergencyAccess) {
                return res.status(401).json({ error: 'Invalid emergency access method' });
            }

            const isValidSecret = await bcrypt.compare(secret, emergencyAccess.secretHash);
            if (!isValidSecret) {
                return res.status(401).json({ error: 'Invalid emergency access secret' });
            }

            // Update usage tracking
            db.run('UPDATE emergency_access SET lastUsed = CURRENT_TIMESTAMP, useCount = useCount + 1 WHERE id = ?', 
                   [emergencyAccess.id]);
            
            // Update admin last login
            db.run('UPDATE admin_users SET lastLogin = CURRENT_TIMESTAMP, failedAttempts = 0, lockedUntil = NULL WHERE id = ?', 
                   [emergencyAccess.adminId]);

            // Generate JWT token
            const token = jwt.sign(
                { userId: emergencyAccess.adminId, username: emergencyAccess.username, role: emergencyAccess.role, emergency: true },
                process.env.JWT_SECRET || 'fallback_secret_change_me',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: emergencyAccess.adminId,
                    username: emergencyAccess.username,
                    email: emergencyAccess.email,
                    role: emergencyAccess.role
                },
                emergencyLogin: true,
                message: 'Emergency access granted. Please update your regular password.'
            });
        });
    } catch (error) {
        console.error('Emergency login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available emergency methods (without revealing secrets)
app.get('/api/admin/emergency-methods/:email', (req, res) => {
    try {
        const { email } = req.params;
        
        db.all(`SELECT ea.method, ea.identifier 
                FROM emergency_access ea 
                JOIN admin_users au ON ea.adminId = au.id 
                WHERE au.email = ? AND ea.isActive = 1`, [email], (err, methods) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            const availableMethods = methods.map(m => ({
                method: m.method,
                identifier: m.identifier,
                description: getMethodDescription(m.method)
            }));

            res.json({ methods: availableMethods });
        });
    } catch (error) {
        console.error('Emergency methods error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function getMethodDescription(method) {
    const descriptions = {
        'recovery-phrase': 'Recovery phrase (multiple words)',
        'security-question': 'Security question answer',
        'emergency-pin': 'Emergency PIN code'
    };
    return descriptions[method] || 'Unknown method';
}

// Get all investor requests (admin only)
app.get('/api/admin/requests', verifyToken, (req, res) => {
    const { status, investmentRange, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM investor_requests WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (investmentRange) {
        query += ' AND investmentRange = ?';
        params.push(investmentRange);
    }
    if (startDate) {
        query += ' AND date(submittedAt) >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND date(submittedAt) <= ?';
        params.push(endDate);
    }

    query += ' ORDER BY submittedAt DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        // Parse accreditation JSON
        const requests = rows.map(row => ({
            ...row,
            accreditation: row.accreditation ? JSON.parse(row.accreditation) : []
        }));

        res.json(requests);
    });
});

// Approve investor request
app.post('/api/admin/approve/:id', verifyToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        
        // Generate access token
        const accessToken = jwt.sign(
            { investorId: requestId, type: 'investor' },
            process.env.JWT_SECRET || 'fallback_secret_change_me',
            { expiresIn: '90d' } // 90 day access
        );

        // Update database
        db.run(
            'UPDATE investor_requests SET status = ?, approvedAt = CURRENT_TIMESTAMP, accessToken = ? WHERE id = ?',
            ['approved', accessToken, requestId],
            async function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                // Get investor details for email
                db.get('SELECT * FROM investor_requests WHERE id = ?', [requestId], async (err, request) => {
                    if (err || !request) {
                        return res.status(404).json({ error: 'Request not found' });
                    }

                    // Send approval email
                    try {
                        const approvalEmail = emailTemplates.approvalEmail(request, accessToken);
                        await transporter.sendMail({
                            from: process.env.SMTP_USER,
                            to: request.email,
                            subject: approvalEmail.subject,
                            html: approvalEmail.html
                        });

                        res.json({ 
                            message: 'Request approved and email sent',
                            accessToken 
                        });
                    } catch (emailError) {
                        console.error('Email error:', emailError);
                        res.json({ 
                            message: 'Request approved but email failed to send',
                            accessToken 
                        });
                    }
                });
            }
        );
    } catch (error) {
        console.error('Approval error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject investor request
app.post('/api/admin/reject/:id', verifyToken, async (req, res) => {
    try {
        const requestId = req.params.id;

        db.run(
            'UPDATE investor_requests SET status = ?, rejectedAt = CURRENT_TIMESTAMP WHERE id = ?',
            ['rejected', requestId],
            async function(err) {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                // Get investor details for email
                db.get('SELECT * FROM investor_requests WHERE id = ?', [requestId], async (err, request) => {
                    if (err || !request) {
                        return res.status(404).json({ error: 'Request not found' });
                    }

                    // Send rejection email
                    try {
                        const rejectionEmail = emailTemplates.rejectionEmail(request);
                        await transporter.sendMail({
                            from: process.env.SMTP_USER,
                            to: request.email,
                            subject: rejectionEmail.subject,
                            html: rejectionEmail.html
                        });

                        res.json({ message: 'Request rejected and email sent' });
                    } catch (emailError) {
                        console.error('Email error:', emailError);
                        res.json({ message: 'Request rejected but email failed to send' });
                    }
                });
            }
        );
    } catch (error) {
        console.error('Rejection error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify investor access token
app.post('/api/verify-access', (req, res) => {
    try {
        const { token } = req.body;

        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me', (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    valid: false, 
                    error: 'Invalid or expired token' 
                });
            }

            if (decoded.type !== 'investor') {
                return res.status(403).json({ 
                    valid: false, 
                    error: 'Invalid token type' 
                });
            }

            // Update last login
            db.run(
                'UPDATE investor_requests SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
                [decoded.investorId]
            );

            res.json({ 
                valid: true, 
                investorId: decoded.investorId 
            });
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Track page views
app.post('/api/track-page', (req, res) => {
    try {
        const { token, pageName, pageUrl, timeSpent, sessionId } = req.body;

        jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_change_me', (err, decoded) => {
            if (err || decoded.type !== 'investor') {
                return res.status(403).json({ error: 'Invalid token' });
            }

            // Insert page view
            db.run(
                'INSERT INTO page_views (investorId, pageName, pageUrl, timeSpent, sessionId) VALUES (?, ?, ?, ?, ?)',
                [decoded.investorId, pageName, pageUrl, timeSpent, sessionId],
                function(err) {
                    if (err) {
                        console.error('Page tracking error:', err);
                        return res.status(500).json({ error: 'Tracking failed' });
                    }

                    // Update total page views for investor
                    db.run(
                        'UPDATE investor_requests SET pageViews = pageViews + 1 WHERE id = ?',
                        [decoded.investorId]
                    );

                    res.json({ message: 'Page view tracked' });
                }
            );
        });
    } catch (error) {
        console.error('Page tracking error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get analytics data
app.get('/api/admin/analytics', verifyToken, (req, res) => {
    const queries = {
        totalRequests: 'SELECT COUNT(*) as count FROM investor_requests',
        pendingRequests: 'SELECT COUNT(*) as count FROM investor_requests WHERE status = "pending"',
        approvedRequests: 'SELECT COUNT(*) as count FROM investor_requests WHERE status = "approved"',
        totalPageViews: 'SELECT COUNT(*) as count FROM page_views',
        uniqueInvestors: 'SELECT COUNT(DISTINCT investorId) as count FROM page_views',
        investmentRanges: `
            SELECT investmentRange, COUNT(*) as count 
            FROM investor_requests 
            WHERE investmentRange IS NOT NULL 
            GROUP BY investmentRange
        `,
        recentActivity: `
            SELECT ir.firstName, ir.lastName, ir.email, pv.pageName, pv.timestamp
            FROM page_views pv
            JOIN investor_requests ir ON pv.investorId = ir.id
            ORDER BY pv.timestamp DESC
            LIMIT 20
        `
    };

    const results = {};
    let completed = 0;
    const totalQueries = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, query]) => {
        db.all(query, [], (err, rows) => {
            if (!err) {
                results[key] = rows;
            }
            completed++;
            if (completed === totalQueries) {
                res.json(results);
            }
        });
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 The Maker's Stay Backend Server running on port ${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
    console.log(`📧 Email configured: ${process.env.SMTP_USER ? 'Yes' : 'No'}`);
    console.log(`🔒 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Using fallback'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = app;