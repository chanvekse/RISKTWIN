/**
 * =============================================================================
 * RISKTWIN PLATFORM - SIMPLE STARTUP SCRIPT
 * =============================================================================
 * 
 * PURPOSE: Start the RiskTwin server with organized file structure
 * USAGE: node start_risktwin.js
 * 
 * =============================================================================
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🌟 RiskTwin Platform - Starting Server');
console.log('=' .repeat(50));

// Start the server from the backend directory
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, '..', 'backend'),
  stdio: 'inherit'
});

serverProcess.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n📍 Shutting down RiskTwin server...');
  serverProcess.kill();
  process.exit(0);
});

console.log('🚀 Server starting...');
console.log('📋 Once started:');
console.log('   • Dashboard: http://localhost:3000');
console.log('   • Press Ctrl+C to stop');
console.log('');
console.log('📁 Project Structure:');
console.log('   • backend/     - Server and API');
console.log('   • frontend/    - UI and dashboard');  
console.log('   • services/    - Analytics services');
console.log('   • tests/       - Testing scripts');
console.log('   • utils/       - Utility scripts');
console.log('   • docs/        - Documentation');
console.log(''); 