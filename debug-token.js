const { getPublicToken } = require('./services/aps.js');
const fetch = require('node-fetch');

async function debugToken() {
    try {
        console.log('🔍 Getting access token...');
        const token = await getPublicToken();
        
        console.log('✅ Token obtained successfully');
        console.log('Token starts with:', token.access_token.substring(0, 20) + '...');
        
        // Test token by calling APS userinfo endpoint
        console.log('\n🔍 Testing token with APS userinfo...');
        const response = await fetch('https://developer.api.autodesk.com/userprofile/v1/users/@me', {
            headers: {
                'Authorization': `Bearer ${token.access_token}`
            }
        });
        
        if (response.ok) {
            const userInfo = await response.json();
            console.log('✅ Token is valid for APS');
            console.log('User:', userInfo.userName || userInfo.emailId);
        } else {
            console.log('❌ Token failed APS test:', response.status, response.statusText);
        }
        
        // Test with ACC projects endpoint
        console.log('\n🔍 Testing token with ACC projects...');
        const accResponse = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (accResponse.ok) {
            const projects = await accResponse.json();
            console.log('✅ Token works with ACC');
            console.log('Found', projects.data?.length || 0, 'hubs/projects');
        } else {
            const errorText = await accResponse.text();
            console.log('❌ Token failed ACC test:', accResponse.status, accResponse.statusText);
            console.log('Error details:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Error during token debug:', error.message);
    }
}

debugToken(); 