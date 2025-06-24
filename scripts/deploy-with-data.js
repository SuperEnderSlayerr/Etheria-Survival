const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const txtDataDir = path.join(__dirname, '..', 'public', 'txtData');
const buildDir = path.join(__dirname, '..', 'build');
const buildTxtDataDir = path.join(buildDir, 'txtData');

console.log('🚀 Building app with private data for deployment...');

try {
  // Step 1: Build the React app
  console.log('📦 Building React app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Create txtData directory in build folder
  console.log('📁 Creating txtData directory in build...');
  if (!fs.existsSync(buildTxtDataDir)) {
    fs.mkdirSync(buildTxtDataDir, { recursive: true });
  }

  // Step 3: Copy all .txt files from public/txtData to build/txtData
  console.log('📋 Copying Discord log files to build directory...');
  const files = fs.readdirSync(txtDataDir);
  
  files.forEach(file => {
    if (file.endsWith('.txt')) {
      const srcPath = path.join(txtDataDir, file);
      const destPath = path.join(buildTxtDataDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`   ✓ Copied ${file}`);
    }
  });

  // Step 4: Deploy to gh-pages
  console.log('🚀 Deploying to GitHub Pages...');
  execSync('npx gh-pages -d build', { stdio: 'inherit' });

  console.log('✅ Deployment complete! Your app is now live with real data.');
  console.log('🔒 Private data is only in the gh-pages branch, not in main repo.');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}
