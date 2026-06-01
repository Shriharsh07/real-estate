const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const GITHUB_TOKEN = process.env.VERSION_TOKEN || process.env.GITHUB_TOKEN; // Optional: for private repos or rate limiting

function parseGitHubRemote(remoteUrl) {
  if (!remoteUrl) return null;

  const match = remoteUrl.trim().match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2],
  };
}

function getGitRemoteRepo() {
  try {
    const remoteUrl = execSync('git remote get-url origin', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    return parseGitHubRemote(remoteUrl);
  } catch (error) {
    return null;
  }
}

function getGitHubRepo() {
  const owner = process.env.ACCOUNT_OWNER || process.env.GITHUB_OWNER;
  const repo = process.env.REPO_NAME || process.env.GITHUB_REPO;

  if (owner && repo) {
    return {
      owner,
      repo,
      source: process.env.ACCOUNT_OWNER || process.env.REPO_NAME
        ? 'ACCOUNT_OWNER/REPO_NAME'
        : 'GITHUB_OWNER/GITHUB_REPO',
    };
  }

  if (process.env.GITHUB_REPOSITORY) {
    const [repositoryOwner, repositoryName] = process.env.GITHUB_REPOSITORY.split('/');
    if (repositoryOwner && repositoryName) {
      return {
        owner: repositoryOwner,
        repo: repositoryName,
        source: 'GITHUB_REPOSITORY',
      };
    }
  }

  if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG) {
    return {
      owner: process.env.VERCEL_GIT_REPO_OWNER,
      repo: process.env.VERCEL_GIT_REPO_SLUG,
      source: 'VERCEL_GIT_REPO_OWNER/VERCEL_GIT_REPO_SLUG',
    };
  }

  const gitRemoteRepo = getGitRemoteRepo();
  if (gitRemoteRepo) {
    return {
      ...gitRemoteRepo,
      source: 'git remote origin',
    };
  }

  return null;
}

// Function to fetch latest tag from GitHub
function fetchLatestTagFromGitHub(githubRepo) {
  return new Promise((resolve, reject) => {
    if (!githubRepo) {
      resolve(null);
      return;
    }

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${githubRepo.owner}/${githubRepo.repo}/releases/latest`,
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
            let version = release.tag_name;
            // Remove 'v' prefix if present (e.g., v1.0.0 -> 1.0.0)
            if (version.startsWith('v') || version.startsWith('V')) {
              version = version.substring(1);
            }
            resolve(version);
          } catch (e) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else if (res.statusCode === 404) {
          // No releases found, fall back to package.json
          resolve(null);
        } else if (res.statusCode === 403) {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        } else {
          reject(new Error(`GitHub API returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
}

async function setVersion() {
  let version;
  const githubRepo = getGitHubRepo();

  if (githubRepo) {
    try {
      version = await fetchLatestTagFromGitHub(githubRepo);
    } catch (error) {
      // Silent failure, will fall back to package.json
    }
  }

  // Fall back to package.json if GitHub fetch failed.
  if (!version) {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    version = packageJson.version;
  }

  // Write to version.ts
  const versionTsPath = path.join(__dirname, '..', 'src', 'environments', 'version.ts');
  const versionTsContent = `export const APP_VERSION = '${version}';\n`;
  fs.writeFileSync(versionTsPath, versionTsContent);
}

setVersion();
