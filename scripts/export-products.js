const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_URL = process.env.OLSERA_BASE_URL || 'https://api-open.olsera.co.id/api/open-api/v1/id';
const APP_ID = process.env.OLSERA_APP_ID || '';
const SECRET_KEY = process.env.OLSERA_SECRET_KEY || '';

let cachedToken = null;
let cachedRefreshToken = null;

function getToken() {
  return new Promise((resolve, reject) => {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
      resolve(cachedToken.token);
      return;
    }

    // Try refresh token first
    if (cachedRefreshToken) {
      try {
        const body = 'refresh_token=' + cachedRefreshToken + '&grant_type=refresh_token';
        const cmd = 'curl -s -X POST "' + BASE_URL + '/token" -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: application/json" -d "' + body + '"';
        const result = execSync(cmd).toString();
        const json = JSON.parse(result);
        if (json.access_token) {
          cachedToken = {
            token: json.access_token,
            expiresAt: Date.now() + (json.expires_in - 60) * 1000,
          };
          if (json.refresh_token) {
            cachedRefreshToken = json.refresh_token;
          }
          resolve(cachedToken.token);
          return;
        }
      } catch (e) {
        // Refresh failed
      }
    }

    // Get new token
    const body = 'app_id=' + APP_ID + '&secret_key=' + SECRET_KEY + '&grant_type=secret_key';
    const cmd = 'curl -s -X POST "' + BASE_URL + '/token" -H "Content-Type: application/x-www-form-urlencoded" -H "Accept: application/json" -d "' + body + '"';
    
    try {
      const result = execSync(cmd).toString();
      const json = JSON.parse(result);
      if (!json.access_token) {
        reject(new Error('No access_token: ' + result));
        return;
      }
      cachedToken = {
        token: json.access_token,
        expiresAt: Date.now() + (json.expires_in - 60) * 1000,
      };
      if (json.refresh_token) {
        cachedRefreshToken = json.refresh_token;
      }
      resolve(cachedToken.token);
    } catch (err) {
      reject(err);
    }
  });
}

function apiGet(path) {
  return new Promise((resolve, reject) => {
    getToken().then(token => {
      const url = BASE_URL + path;
      const cmd = 'curl -s -X GET "' + url + '" -H "Accept: application/json" -H "Authorization: Bearer ' + token + '"';
      execSync(cmd); // This won't work with execSync for async...
      // Let me use exec instead
      const { exec } = require('child_process');
      exec(cmd, (err, stdout) => {
        if (err) { reject(err); return; }
        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch (e) {
          reject(new Error('Parse error: ' + e.message));
        }
      });
    }).catch(reject);
  });
}

// Actually, let me simplify - just use synchronous approach
function fetchAllProductsSync() {
  let page = 1;
  const perPage = 100;
  let lastPage = 1;
  let allProducts = [];

  do {
    console.log('Fetching page ' + page + '...');
    const token = execSync('node -e "const {execSync} = require(\"child_process\"); const BASE_URL = process.env.OLSERA_BASE_URL || \'https://api-open.olsera.co.id/api/open-api/v1/id\'; const APP_ID = process.env.OLSERA_APP_ID || \'\'; const SECRET_KEY = process.env.OLSERA_SECRET_KEY || \'\'; const cmd = \'curl -s -X POST \"\' + BASE_URL + \'/token\" -H \"Content-Type: application/x-www-form-urlencoded\" -H \"Accept: application/json\" -d \"app_id=\' + APP_ID + \'&secret_key=\' + SECRET_KEY + \'&grant_type=secret_key\"\'; const {access_token, expires_in} = JSON.parse(execSync(cmd).toString()); console.log(access_token);"').toString().trim();

    const url = BASE_URL + '/product?page=' + page + '&per_page=' + perPage;
    const cmd = 'curl -s -X GET "' + url + '" -H "Accept: application/json" -H "Authorization: Bearer ' + token + '"';
    const result = execSync(cmd).toString();
    const json = JSON.parse(result);
    const products = json.data || [];
    allProducts = allProducts.concat(products);
    lastPage = json.meta ? json.meta.last_page : page;
    page++;
  } while (page <= lastPage);

  return allProducts;
}

console.log('This approach is too complex. Let me rewrite...');
process.exit(1);
