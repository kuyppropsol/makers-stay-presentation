# **🚀 BACKEND SETUP INSTRUCTIONS**
## Professional Investor Access System

Follow these steps to set up your complete backend system with database, email automation, and admin dashboard.

---

## **📋 PREREQUISITES**

### **Required Software:**
- **Node.js** (version 16 or higher) → [Download here](https://nodejs.org/)
- **Email Account** with App Password (Gmail recommended)

### **Email Setup (Gmail):**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** → **App passwords**
3. Generate an "App password" for "Mail"
4. Save this password - you'll need it during setup

---

## **⚡ QUICK SETUP (5 Minutes)**

### **Step 1: Install Dependencies**
```powershell
cd "C:\Users\kuype\OneDrive\Desktop\The Maker's Stay - An HTML Presentation\backend"
npm install
```

### **Step 2: Configure Environment**
```powershell
node setup.js
```
This will ask you for:
- ✅ Your email address (for sending notifications)
- ✅ Email app password (from Gmail setup above)
- ✅ Admin email address
- ✅ Website URL

### **Step 3: Start the Server**
```powershell
npm start
```

### **Step 4: Test the System**
Open: http://localhost:3001/api/health

**You should see:** `{"status":"healthy","timestamp":"..."}`

---

## **🔧 CONFIGURATION FILES**

### **📁 Backend Files Created:**
- `server.js` → Main API server with all endpoints
- `package.json` → Dependencies and scripts
- `.env.example` → Configuration template
- `setup.js` → Interactive configuration wizard
- `investors.db` → SQLite database (created automatically)

### **🔑 Default Admin Credentials:**
- **Username:** `admin`
- **Password:** `TempAdmin2025!`
- **⚠️ CHANGE IMMEDIATELY after first login!**

---

## **📧 EMAIL TEMPLATES**

The system automatically sends these emails:

### **🔔 Admin Notifications:**
- New investor requests
- Complete investor details
- Direct link to admin dashboard

### **✅ Approval Emails:**
- Personalized access credentials
- Unique access token/link
- Legal disclaimers and instructions

### **❌ Rejection Emails:**
- Professional rejection message
- Future opportunity signup
- Contact information

---

## **🎯 API ENDPOINTS**

### **Public Endpoints:**
- `POST /api/investor-request` → Submit access request
- `POST /api/verify-access` → Verify investor token
- `POST /api/track-page` → Track page views

### **Admin Endpoints (Authentication Required):**
- `POST /api/admin/login` → Admin login
- `GET /api/admin/requests` → List all requests
- `POST /api/admin/approve/:id` → Approve request
- `POST /api/admin/reject/:id` → Reject request
- `GET /api/admin/analytics` → Usage analytics

---

## **🛡️ SECURITY FEATURES**

### **✅ Built-in Security:**
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- JWT token authentication
- Bcrypt password hashing
- SQL injection prevention
- CORS protection

### **🔒 Compliance Features:**
- Complete audit trail
- Accredited investor verification
- Legal acknowledgment tracking
- IP address logging
- Session tracking

---

## **📊 ADMIN DASHBOARD FEATURES**

### **Access:** http://localhost:3001/admin

### **👀 Real-time Statistics:**
- Total requests received
- Pending approvals
- Approved investors
- Total investment interest

### **🎛️ Management Tools:**
- One-click approve/reject
- Detailed investor profiles
- Custom email composer
- CSV export for CRM
- Activity tracking

### **📈 Analytics:**
- Page view tracking
- Time spent analytics
- Investor engagement metrics
- Investment range reporting

---

## **🌐 PRODUCTION DEPLOYMENT**

### **Update URLs:**
1. **investor-access-request.html**: Change `API_BASE_URL` to your domain
2. **admin-dashboard.html**: Change `API_BASE_URL` to your domain  
3. **001iguessthisisfirst.html**: Change `API_BASE_URL` to your domain

### **Environment Variables:**
```
FRONTEND_URL=https://yourdomain.com
SMTP_USER=investing@themakersstay.com  
ADMIN_EMAIL=admin@themakersstay.com
JWT_SECRET=your-secure-secret-key
```

### **Hosting Options:**
- **VPS/Cloud:** DigitalOcean, AWS, Google Cloud
- **Platform:** Heroku, Railway, Render
- **Domain:** Point your domain to the server IP

---

## **✅ TESTING CHECKLIST**

### **Backend Tests:**
- [ ] Server starts without errors: `npm start`
- [ ] Health check works: `http://localhost:3001/api/health`
- [ ] Admin login works: Use `admin` / `TempAdmin2025!`
- [ ] Email configuration tested

### **Frontend Tests:**
- [ ] Investor form submits successfully
- [ ] Admin receives notification email
- [ ] Approve/reject functions work
- [ ] Access tokens grant presentation access

### **Integration Tests:**
- [ ] End-to-end investor flow
- [ ] Email delivery working
- [ ] Admin dashboard functional
- [ ] Page tracking operational

---

## **🆘 TROUBLESHOOTING**

### **Common Issues:**

**"Module not found" errors:**
```powershell
cd backend
npm install
```

**"Email failed to send":**
- Check Gmail App Password
- Verify SMTP settings in .env
- Enable "Less secure app access" if needed

**"Database locked" errors:**
- Stop the server: `Ctrl+C`
- Delete `investors.db`
- Restart: `npm start`

**"Port already in use":**
- Change PORT in .env file
- Or kill existing process

---

## **📱 MOBILE COMPATIBILITY**

The system is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets and iPads
- ✅ Mobile phones
- ✅ All modern browsers

---

## **🔄 BACKUP & MAINTENANCE**

### **Database Backup:**
```powershell
copy investors.db investors-backup.db
```

### **Log Monitoring:**
- Server logs show all activity
- Email delivery status
- Error tracking and debugging

### **Regular Maintenance:**
- Monitor disk space
- Review email deliverability  
- Update dependencies monthly
- Check security updates

---

## **🎉 NEXT STEPS**

Once your backend is running:

1. **Test the complete flow** → Submit request, approve, access presentation
2. **Customize email templates** → Match your branding
3. **Set up monitoring** → Track system health
4. **Go live!** → Start collecting qualified investor leads

**🚀 Your professional investor access system is now ready for prime time!**