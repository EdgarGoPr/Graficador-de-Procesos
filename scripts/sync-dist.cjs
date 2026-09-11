const fs = require('fs');
const path = require('path');

const srcDist = path.resolve(__dirname, '../dist');
const targetDist = path.resolve(__dirname, '../MiAppProcesos_USB/App/dist');

if (fs.existsSync(srcDist)) {
  if (!fs.existsSync(targetDist)) {
    fs.mkdirSync(targetDist, { recursive: true });
  }
  // Clear old target directory contents
  fs.rmSync(targetDist, { recursive: true, force: true });
  fs.cpSync(srcDist, targetDist, { recursive: true });
  console.log('✓ Successfully synced dist/ to MiAppProcesos_USB/App/dist/');
}
