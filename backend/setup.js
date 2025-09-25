const readline = require('readline');
const fs = require('fs');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 The Maker\'s Stay Backend Setup');
console.log('=====================================');

const questions = [
    {
        key: 'SMTP_USER',
        question: 'Enter your email address (for sending notifications): ',
        default: 'investing@themakersstay.com'
    },
    {
        key: 'SMTP_PASS',
        question: 'Enter your email app password (Gmail App Password): ',
        sensitive: true
    },
    {
        key: 'ADMIN_EMAIL',
        question: 'Enter admin email address: ',
        default: 'admin@themakersstay.com'
    },
    {
        key: 'FRONTEND_URL',
        question: 'Enter your website URL: ',
        default: 'https://themakersstay.com'
    }
];

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function setup() {
    const config = {};
    
    // Generate secure JWT secret
    config.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    config.PORT = '3001';
    config.NODE_ENV = 'production';
    config.SMTP_HOST = 'smtp.gmail.com';
    config.SMTP_PORT = '587';
    config.DATABASE_PATH = './investors.db';
    
    console.log('\n📧 Email Configuration');
    console.log('Note: For Gmail, you need to generate an "App Password" in your Google Account settings.');
    console.log('Go to: Google Account > Security > 2-Step Verification > App passwords\n');
    
    for (const q of questions) {
        let answer = await askQuestion(q.question + (q.default ? `(default: ${q.default}) ` : ''));
        
        if (!answer && q.default) {
            answer = q.default;
        }
        
        if (answer) {
            config[q.key] = answer;
        }
        
        if (q.sensitive) {
            console.log('✅ Password saved securely\n');
        }
    }
    
    config.ADMIN_DASHBOARD_URL = `${config.FRONTEND_URL}/admin`;
    
    // Write .env file
    const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    
    fs.writeFileSync('.env', envContent);
    
    console.log('\n✅ Configuration saved to .env file');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm start');
    console.log('3. Test the API at: http://localhost:3001/api/health');
    console.log('4. Update your HTML files to point to this backend');
    console.log('\n🔒 Security Notes:');
    console.log('- Change the default admin password immediately!');
    console.log('- Keep your .env file secure and never commit it to git');
    console.log('- Use HTTPS in production');
    
    rl.close();
}

setup().catch(console.error);