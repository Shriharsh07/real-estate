const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Get version
const version = packageJson.version;

// Write to version.ts
const versionTsPath = path.join(__dirname, '..', 'src', 'environments', 'version.ts');
const versionTsContent = `export const APP_VERSION = '${version}';\n`;
fs.writeFileSync(versionTsPath, versionTsContent);

console.log(`Version set to: ${version}`);
