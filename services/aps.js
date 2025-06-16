const { SdkManagerBuilder } = require('@aps_sdk/autodesk-sdkmanager');
const { AuthenticationClient, Scopes } = require('@aps_sdk/authentication');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = require('../config.js');

const sdkManager = SdkManagerBuilder.create().build();
const authenticationClient = new AuthenticationClient(sdkManager);

let _credentials = null;
async function getPublicToken() {
    // If manual access token is provided, use it
    if (process.env.APS_ACCESS_TOKEN) {
        return {
            access_token: process.env.APS_ACCESS_TOKEN,
            expires_at: Date.now() + (24 * 60 * 60 * 1000) // Assume 24 hour expiry
        };
    }
    
    // Otherwise, generate token automatically
    if (!_credentials || _credentials.expires_at < Date.now()) {
        _credentials = await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, [
            Scopes.ViewablesRead,
            Scopes.DataRead,      // Required for ACC APIs
            Scopes.AccountRead    // Required for ACC project access
        ]);
        _credentials.expires_at = Date.now() + _credentials.expires_in * 1000;
    }
    return _credentials;
}

module.exports = {
    getPublicToken
};
