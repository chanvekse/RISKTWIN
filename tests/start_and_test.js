/**
 * =============================================================================
 * RISKTWIN PLATFORM - SERVER STARTUP AND TESTING ORCHESTRATOR
 * =============================================================================
 * 
 * PURPOSE: Start the server safely and run comprehensive testing
 * USAGE: node start_and_test.js
 * 
 * =============================================================================
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fetch = require('node-fetch').default || require('node-fetch');

let serverProcess = null;

// Check if server is already running
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/', { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Start the server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting RiskTwin server...');
    
    // Change to backend directory and start server
    const serverPath = path.join(__dirname, 'backend', 'server.js');
    
    serverProcess = spawn('node', [serverPath], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let outputBuffer = '';
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      console.log(`[SERVER] ${output.trim()}`);
      
      // Check if server has started successfully
      if (output.includes('listening on port') || output.includes('Server running')) {
        console.log('✅ Server started successfully!');
        resolve(true);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[SERVER ERROR] ${error.trim()}`);
      
      // Check for common startup errors
      if (error.includes('EADDRINUSE')) {
        console.log('⚠️  Port 3000 is already in use. Checking if our server is running...');
        resolve(false); // We'll check if it's our server
      } else if (error.includes('Cannot find module')) {
        console.error('❌ Module dependency error. Please install dependencies.');
        reject(new Error('Missing dependencies'));
      }
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start server:', error.message);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('⏰ Server startup timeout. Checking if server is running...');
      resolve(false);
    }, 10000);
  });
}

// Stop the server
function stopServer() {
  if (serverProcess) {
    console.log('🛑 Stopping server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

// Run the comprehensive testing
async function runTesting() {
  console.log('\n🧪 Starting comprehensive testing...');
  
  try {
    // Import and run the night testing script
    const { runComprehensiveNightTesting } = require('./comprehensive_night_testing.js');
    await runComprehensiveNightTesting();
    console.log('✅ Testing completed successfully!');
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    throw error;
  }
}

// Main orchestration
async function main() {
  console.log('🌙 RiskTwin Platform - Night Testing Orchestrator');
  console.log('=' .repeat(60));
  
  try {
    // Check if server is already running
    const serverRunning = await checkServerStatus();
    
    if (serverRunning) {
      console.log('✅ Server is already running on port 3000');
    } else {
      console.log('📍 Server not running. Starting server...');
      
      const started = await startServer();
      
      if (!started) {
        // Double-check if server is running (maybe it was already running)
        const doubleCheck = await checkServerStatus();
        if (!doubleCheck) {
          throw new Error('Failed to start server');
        } else {
          console.log('✅ Server is running (was already started)');
        }
      }
      
      // Wait a moment for server to fully initialize
      console.log('⏳ Waiting for server to fully initialize...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Run comprehensive testing
    await runTesting();
    
  } catch (error) {
    console.error('\n❌ Orchestration failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup: stop server if we started it
    if (serverProcess) {
      stopServer();
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n📍 Received interrupt signal. Cleaning up...');
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📍 Received termination signal. Cleaning up...');
  stopServer();
  process.exit(0);
});

// Run if this is the main module
if (require.main === module) {
  main();
}

module.exports = { main, startServer, stopServer, checkServerStatus }; 