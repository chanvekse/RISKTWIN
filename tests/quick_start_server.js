/**
 * Quick Start Server and Test Script for RiskTwin
 * This will start the server and run basic connectivity tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fetch = require('node-fetch').default || require('node-fetch');

let serverProcess = null;

async function checkServerRunning() {
  try {
    const response = await fetch('http://localhost:3000/', { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting RiskTwin server...');
    
    // Start server from backend directory
    serverProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit'
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      reject(error);
    });
    
    // Give server time to start
    setTimeout(async () => {
      const isRunning = await checkServerRunning();
      if (isRunning) {
        console.log('✅ Server started successfully!');
        console.log('🌐 UI available at: http://localhost:3000');
        resolve(true);
      } else {
        console.log('⚠️  Server may not have started properly');
        resolve(false);
      }
    }, 5000);
  });
}

async function runBasicTests() {
  console.log('\n🧪 Running basic connectivity tests...');
  
  try {
    // Test basic endpoints
    const endpoints = [
      '/api/high-risk',
      '/api/twin/11',
      '/api/customer/11',
      '/api/portfolio/summary'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint}`);
        const status = response.status === 200 ? '✅' : '❌';
        console.log(`${status} ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ Basic tests failed:', error.message);
  }
}

async function main() {
  console.log('🌙 RiskTwin Quick Start and Test');
  console.log('='.repeat(40));
  
  try {
    // Check if server is already running
    const alreadyRunning = await checkServerRunning();
    
    if (alreadyRunning) {
      console.log('✅ Server is already running!');
      console.log('🌐 UI available at: http://localhost:3000');
    } else {
      // Start the server
      await startServer();
    }
    
    // Run basic tests
    await runBasicTests();
    
    console.log('\n🎉 Setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Test the UI functionality');
    console.log('3. Press Ctrl+C to stop the server when done');
    
    // Keep process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n📍 Shutting down...');
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main();
}

module.exports = { startServer, checkServerRunning }; 