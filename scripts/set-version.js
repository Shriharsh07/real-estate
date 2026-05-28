const fs = require('fs');
const path = require('path');
const https = require('https');

// Check if we're in a CI/CD environment
const isCI = process.env.CI === 'true' || process.env.VERCEL === '1' || process.env.GITHUB_ACTIONS === 'true';

// GitHub repository info (only used in CI/CD)
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional: for private repos or rate limiting

// Function to fetch latest tag from GitHub
function fetchLatestTagFromGitHub() {
  return new Promise((resolve, reject) => {
    if (!GITHUB_OWNER || !GITHUB_REPO) {
      console.log('GITHUB_OWNER or GITHUB_REPO not set, skipping GitHub fetch');
      resolve(null);
      return;
    }

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: {
        'User-Agent': 'real-estate-app',
        ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            // Remove 'v' prefix if present
            const version = release.tag_name.replace(/^v/, '');
            resolve(version);
          } catch (e) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else if (res.statusCode === 404) {
          // No releases found, fall back to package.json
          console.log('No GitHub releases found, falling back to package.json');
          resolve(null);
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('GitHub fetch failed, falling back to package.json');
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('GitHub request timed out, falling back to package.json');
      resolve(null);
    });

    req.end();
  });
}

async function setVersion() {
  let version;

  // Only try GitHub fetch in CI/CD environment
  if (isCI) {
    console.log('Running in CI/CD, attempting to fetch version from GitHub...');
    try {
      version = await fetchLatestTagFromGitHub();
    } catch (error) {
      console.log('GitHub fetch error:', error.message);
    }
  } else {
    console.log('Running locally, using package.json version');
  }

  // Fall back to package.json if GitHub fetch failed or not in CI
  if (!version) {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    version = packageJson.version;
  }

  // Write to version.ts
  const versionTsPath = path.join(__dirname, '..', 'src', 'environments', 'version.ts');
  const versionTsContent = `export const APP_VERSION = '${version}';\n`;
  fs.writeFileSync(versionTsPath, versionTsContent);

  console.log(`Version set to: ${version}`);
}

setVersion();
