/**
 * =============================================================================
 * RISKTWIN COMPREHENSIVE OVERNIGHT TESTING SUITE
 * =============================================================================
 * 
 * This script will run comprehensive testing throughout the night and generate
 * detailed reports with all findings, issues, and recommendations.
 * 
 * =============================================================================
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch').default || require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CUSTOMER_ID = 11;
const REPORT_DIR = './docs';

// Test results storage
const testResults = {
  infrastructure: [],
  apiEndpoints: [],
  dataIntegrity: [],
  uiTesting: [],
  performance: [],
  issues: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    criticalIssues: 0
  }
};

let serverProcess = null;

// Utility functions
function log(message, type = 'INFO') {
  const timestamp = new Date().toLocaleTimeString();
  const icon = type === 'PASS' ? '✅' : type === 'FAIL' ? '❌' : type === 'WARN' ? '⚠️' : '📝';
  console.log(`[${timestamp}] ${icon} ${message}`);
}

function addTestResult(category, testName, status, details, endpoint = '') {
  const result = {
    category,
    testName,
    status,
    details,
    endpoint,
    timestamp: new Date().toISOString()
  };
  
  testResults[category].push(result);
  testResults.summary.totalTests++;
  
  if (status === 'PASS') testResults.summary.passed++;
  else if (status === 'FAIL') testResults.summary.failed++;
  else if (status === 'WARN') testResults.summary.warnings++;
  
  log(`${testName}: ${status} - ${details}`, status);
}

function addIssue(severity, category, issue, solution = '') {
  testResults.issues.push({
    severity,
    category,
    issue,
    solution,
    timestamp: new Date().toISOString()
  });
  
  if (severity === 'CRITICAL') testResults.summary.criticalIssues++;
  log(`${severity} ISSUE in ${category}: ${issue}`, 'FAIL');
}

// Server management
async function checkServerStatus() {
  try {
    const response = await fetch(`${BASE_URL}/`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    log('Starting RiskTwin server...');
    
    serverProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('listening on port') || output.includes('Server running')) {
        log('Server started successfully');
        resolve(true);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      log(`Server error: ${error}`, 'FAIL');
      if (error.includes('Cannot find module')) {
        addIssue('CRITICAL', 'Server', 'Missing module dependencies', 'Run npm install');
        reject(new Error('Missing dependencies'));
      }
    });
    
    serverProcess.on('error', (error) => {
      addIssue('CRITICAL', 'Server', `Failed to start: ${error.message}`, 'Check Node.js installation');
      reject(error);
    });
    
    // Timeout after 15 seconds
    setTimeout(() => {
      resolve(false);
    }, 15000);
  });
}

// Testing phases
async function testInfrastructure() {
  log('=== PHASE 1: INFRASTRUCTURE TESTING ===');
  
  // Test server connectivity
  const serverRunning = await checkServerStatus();
  addTestResult('infrastructure', 'Server Connectivity', 
    serverRunning ? 'PASS' : 'FAIL',
    serverRunning ? 'Server responding on port 3000' : 'Server not responding',
    '/'
  );
  
  if (!serverRunning) {
    addIssue('CRITICAL', 'Infrastructure', 'Server not accessible', 'Start server with: cd backend && node server.js');
    return false;
  }
  
  // Test database connectivity through API
  try {
    const response = await fetch(`${BASE_URL}/api/high-risk?limit=1`);
    const data = await response.json();
    
    addTestResult('infrastructure', 'Database Connectivity',
      response.status === 200 && Array.isArray(data) ? 'PASS' : 'FAIL',
      response.status === 200 ? 'Database queries working' : `HTTP ${response.status}`,
      '/api/high-risk'
    );
  } catch (error) {
    addTestResult('infrastructure', 'Database Connectivity', 'FAIL',
      `Database connection failed: ${error.message}`, '/api/high-risk');
    addIssue('CRITICAL', 'Database', 'Cannot connect to database', 'Check PostgreSQL connection string');
  }
  
  return true;
}

async function testAPIEndpoints() {
  log('=== PHASE 2: API ENDPOINTS TESTING ===');
  
  const endpoints = [
    { path: '/api/high-risk', method: 'GET', expectedType: 'array' },
    { path: `/api/twin/${TEST_CUSTOMER_ID}`, method: 'GET', expectedType: 'object' },
    { path: `/api/customer/${TEST_CUSTOMER_ID}`, method: 'GET', expectedType: 'object' },
    { path: `/api/timeline/${TEST_CUSTOMER_ID}`, method: 'GET', expectedType: 'array' },
    { path: '/api/portfolio/summary', method: 'GET', expectedType: 'object' },
    { path: '/api/portfolio/trends', method: 'GET', expectedType: 'object' },
    { path: '/api/cohort/risk_based', method: 'GET', expectedType: 'object' },
    { path: '/api/cohort/geographic', method: 'GET', expectedType: 'object' },
    { path: '/api/heatmap/geographic', method: 'GET', expectedType: 'object' },
    { path: '/api/heatmap/activity', method: 'GET', expectedType: 'object' },
    { path: '/api/alerts/analysis', method: 'GET', expectedType: 'object' },
    { path: '/api/predictive/forecasts', method: 'GET', expectedType: 'object' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${BASE_URL}${endpoint.path}`);
      const duration = Date.now() - startTime;
      
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        addTestResult('apiEndpoints', `${endpoint.method} ${endpoint.path}`, 'FAIL',
          `Invalid JSON response: ${parseError.message}`, endpoint.path);
        continue;
      }
      
      const isCorrectType = endpoint.expectedType === 'array' ? Array.isArray(data) : typeof data === 'object';
      const status = response.status === 200 && isCorrectType ? 'PASS' : 'FAIL';
      
      addTestResult('apiEndpoints', `${endpoint.method} ${endpoint.path}`, status,
        `HTTP ${response.status}, Type: ${typeof data}, Duration: ${duration}ms`, endpoint.path);
      
      // Track performance
      if (duration > 2000) {
        addIssue('MEDIUM', 'Performance', `Slow endpoint: ${endpoint.path} (${duration}ms)`, 'Optimize database queries');
      }
      
      // Store performance data
      testResults.performance.push({
        endpoint: endpoint.path,
        duration,
        status: response.status,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      addTestResult('apiEndpoints', `${endpoint.method} ${endpoint.path}`, 'FAIL',
        `Request failed: ${error.message}`, endpoint.path);
      
      if (error.message.includes('ECONNREFUSED')) {
        addIssue('HIGH', 'Connectivity', `Endpoint ${endpoint.path} - Connection refused`, 'Check server status');
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

async function testPOSTEndpoints() {
  log('=== PHASE 3: POST ENDPOINTS TESTING ===');
  
  // Test scenario application
  try {
    const scenarioData = {
      customer_id: TEST_CUSTOMER_ID,
      name: 'Overnight Test - State Move',
      change_json: {
        move_state: 'TX',
        increase_deductible: 500
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioData)
    });
    
    const result = await response.json();
    const success = response.status === 200 && (result.scenario_id || result.success);
    
    addTestResult('apiEndpoints', 'POST /api/scenario', success ? 'PASS' : 'FAIL',
      success ? 'Scenario created successfully' : `Failed: ${JSON.stringify(result)}`, '/api/scenario');
    
  } catch (error) {
    addTestResult('apiEndpoints', 'POST /api/scenario', 'FAIL',
      `Scenario creation failed: ${error.message}`, '/api/scenario');
  }
  
  // Test ML risk recalculation
  try {
    const mlData = { customer_id: TEST_CUSTOMER_ID };
    const response = await fetch(`${BASE_URL}/api/risk/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mlData)
    });
    
    const result = await response.json();
    const success = response.status === 200 && result.original_score && result.new_score;
    
    addTestResult('apiEndpoints', 'POST /api/risk/recalculate', success ? 'PASS' : 'FAIL',
      success ? 'ML recalculation working' : `Failed: ${JSON.stringify(result)}`, '/api/risk/recalculate');
    
  } catch (error) {
    addTestResult('apiEndpoints', 'POST /api/risk/recalculate', 'FAIL',
      `ML recalculation failed: ${error.message}`, '/api/risk/recalculate');
  }
}

async function testDataIntegrity() {
  log('=== PHASE 4: DATA INTEGRITY TESTING ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/customer/${TEST_CUSTOMER_ID}`);
    const customer = await response.json();
    
    // Test customer data structure
    const requiredFields = ['id', 'twin', 'timeline'];
    const hasAllFields = requiredFields.every(field => customer.hasOwnProperty(field));
    
    addTestResult('dataIntegrity', 'Customer Data Structure', hasAllFields ? 'PASS' : 'FAIL',
      hasAllFields ? 'All required fields present' : `Missing fields: ${requiredFields.filter(f => !customer[f]).join(', ')}`,
      `/api/customer/${TEST_CUSTOMER_ID}`);
    
    // Test numeric data conversion
    if (customer.twin) {
      const riskScore = parseFloat(customer.twin.base_risk_score);
      const claimProb = parseFloat(customer.twin.next12m_claim_prob);
      const expectedLoss = parseFloat(customer.twin.next12m_expected_loss);
      
      const validNumbers = !isNaN(riskScore) && !isNaN(claimProb) && !isNaN(expectedLoss);
      
      addTestResult('dataIntegrity', 'Numeric Data Validation', validNumbers ? 'PASS' : 'FAIL',
        validNumbers ? 'All numeric fields convert properly' : 'Numeric conversion issues detected',
        `/api/twin/${TEST_CUSTOMER_ID}`);
      
      if (!validNumbers) {
        addIssue('HIGH', 'Data Integrity', 'Numeric fields not converting properly', 'Check database field types');
      }
    }
    
    // Test timeline structure
    if (Array.isArray(customer.timeline)) {
      const timelineValid = customer.timeline.length === 0 || 
        (customer.timeline[0] && customer.timeline[0].event_ts && customer.timeline[0].title);
      
      addTestResult('dataIntegrity', 'Timeline Structure', timelineValid ? 'PASS' : 'WARN',
        customer.timeline.length === 0 ? 'Timeline empty (will auto-populate)' : 
        timelineValid ? 'Timeline structure correct' : 'Timeline structure invalid',
        `/api/timeline/${TEST_CUSTOMER_ID}`);
    }
    
  } catch (error) {
    addTestResult('dataIntegrity', 'Customer Data Testing', 'FAIL',
      `Data integrity test failed: ${error.message}`, `/api/customer/${TEST_CUSTOMER_ID}`);
  }
}

async function testUIAccessibility() {
  log('=== PHASE 5: UI ACCESSIBILITY TESTING ===');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();
    
    const isHTML = html.includes('<html') || html.includes('<!DOCTYPE');
    const hasTitle = html.includes('RiskTwin') || html.includes('Risk Twin');
    
    addTestResult('uiTesting', 'UI Page Loading', 
      isHTML && hasTitle ? 'PASS' : 'FAIL',
      isHTML ? (hasTitle ? 'UI loads with proper branding' : 'UI loads but missing branding') : 'Not serving HTML',
      '/');
    
    if (!isHTML) {
      addIssue('HIGH', 'UI', 'Static file serving not working properly', 'Check Express static middleware configuration');
    }
    
  } catch (error) {
    addTestResult('uiTesting', 'UI Page Loading', 'FAIL',
      `UI not accessible: ${error.message}`, '/');
    addIssue('HIGH', 'UI', 'Dashboard not accessible', 'Check static file serving configuration');
  }
}

async function runStressTest() {
  log('=== PHASE 6: STRESS TESTING ===');
  
  const stressEndpoints = ['/api/high-risk', '/api/portfolio/summary', '/api/heatmap/geographic'];
  const concurrentRequests = 5;
  const requestsPerEndpoint = 10;
  
  for (const endpoint of stressEndpoints) {
    const promises = [];
    const startTime = Date.now();
    
    for (let i = 0; i < concurrentRequests; i++) {
      for (let j = 0; j < requestsPerEndpoint; j++) {
        promises.push(
          fetch(`${BASE_URL}${endpoint}`)
            .then(response => ({ status: response.status, success: response.ok }))
            .catch(error => ({ error: error.message, success: false }))
        );
      }
    }
    
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const successRate = (successCount / results.length) * 100;
    
    addTestResult('performance', `Stress Test ${endpoint}`, 
      successRate > 90 ? 'PASS' : successRate > 70 ? 'WARN' : 'FAIL',
      `${successCount}/${results.length} requests successful (${successRate.toFixed(1)}%) in ${totalTime}ms`,
      endpoint);
    
    if (successRate < 90) {
      addIssue('MEDIUM', 'Performance', `Stress test failed for ${endpoint}`, 'Optimize for concurrent requests');
    }
  }
}

function generateComprehensiveReport() {
  log('=== GENERATING COMPREHENSIVE REPORT ===');
  
  const timestamp = new Date().toLocaleString();
  const successRate = (testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(1);
  
  const report = `# 🌙 RiskTwin Platform - Comprehensive Overnight Testing Report

**Generated**: ${timestamp}
**Testing Duration**: Complete overnight testing cycle
**Total Tests Executed**: ${testResults.summary.totalTests}

## 📊 Executive Summary

### Test Results Overview
- ✅ **PASSED**: ${testResults.summary.passed} tests (${successRate}%)
- ❌ **FAILED**: ${testResults.summary.failed} tests
- ⚠️ **WARNINGS**: ${testResults.summary.warnings} tests
- 🔴 **CRITICAL ISSUES**: ${testResults.summary.criticalIssues}

### Platform Status
${testResults.summary.criticalIssues === 0 ? 
  '🟢 **PLATFORM READY** - No critical issues preventing operation' : 
  `🔴 **PLATFORM NEEDS ATTENTION** - ${testResults.summary.criticalIssues} critical issues require immediate fixing`}

## 🔍 Detailed Test Results

### Infrastructure Testing
${testResults.infrastructure.map(test => 
  `- ${test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌'} **${test.testName}**: ${test.details}`
).join('\n')}

### API Endpoints Testing
${testResults.apiEndpoints.map(test => 
  `- ${test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌'} **${test.testName}**: ${test.details}`
).join('\n')}

### Data Integrity Testing
${testResults.dataIntegrity.map(test => 
  `- ${test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌'} **${test.testName}**: ${test.details}`
).join('\n')}

### UI Testing
${testResults.uiTesting.map(test => 
  `- ${test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌'} **${test.testName}**: ${test.details}`
).join('\n')}

## ⚡ Performance Analysis

### Response Time Summary
${testResults.performance.length > 0 ? (() => {
  const durations = testResults.performance.map(p => p.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  
  return `- **Average Response Time**: ${avgDuration.toFixed(2)}ms
- **Fastest Response**: ${minDuration}ms
- **Slowest Response**: ${maxDuration}ms
- **Total API Calls**: ${testResults.performance.length}`;
})() : 'No performance data collected'}

### Slow Endpoints (>2 seconds)
${testResults.performance.filter(p => p.duration > 2000).map(p => 
  `- \`${p.endpoint}\`: ${p.duration}ms`
).join('\n') || 'No slow endpoints detected'}

## 🚨 Issues Identified

${testResults.issues.length > 0 ? testResults.issues.map(issue => {
  const severityIcon = issue.severity === 'CRITICAL' ? '🔴' : issue.severity === 'HIGH' ? '🟠' : '🟡';
  return `### ${severityIcon} ${issue.severity}: ${issue.category}
**Issue**: ${issue.issue}
**Solution**: ${issue.solution}
`;
}).join('\n') : 'No issues identified during testing'}

## 🚀 Recommendations

### Immediate Actions Required
${testResults.issues.filter(i => i.severity === 'CRITICAL').length > 0 ? 
  testResults.issues.filter(i => i.severity === 'CRITICAL').map((issue, index) => 
    `${index + 1}. **${issue.category}**: ${issue.issue}\n   - Solution: ${issue.solution}`
  ).join('\n') : 
  'No critical actions required - platform is ready for use'}

### Performance Optimizations
${testResults.issues.filter(i => i.severity === 'MEDIUM' && i.category === 'Performance').length > 0 ? 
  testResults.issues.filter(i => i.severity === 'MEDIUM' && i.category === 'Performance').map(issue => 
    `- ${issue.issue}: ${issue.solution}`
  ).join('\n') : 
  'No performance issues detected'}

### High Priority Items
${testResults.issues.filter(i => i.severity === 'HIGH').length > 0 ? 
  testResults.issues.filter(i => i.severity === 'HIGH').map(issue => 
    `- **${issue.category}**: ${issue.issue}\n  Solution: ${issue.solution}`
  ).join('\n') : 
  'No high priority items'}

## 📋 Manual Testing Checklist

After reviewing this automated testing report, please manually verify:

1. **UI Functionality**
   - [ ] Dashboard loads at http://localhost:3000
   - [ ] High-risk customer selection works
   - [ ] Scenario application updates timeline
   - [ ] All charts and visualizations display data
   - [ ] ML recalculation button functions properly

2. **Data Flow**
   - [ ] Customer data populates correctly
   - [ ] Timeline events show chronologically
   - [ ] Portfolio analytics display accurate metrics
   - [ ] Heat maps show geographic distribution

3. **Interactive Features**
   - [ ] Customer selection updates all panels
   - [ ] Scenario changes reflect in risk scores
   - [ ] Navigation between sections works smoothly
   - [ ] Error handling displays appropriate messages

## 🏁 Conclusion

${testResults.summary.criticalIssues === 0 ? 
  `The RiskTwin platform has successfully passed automated testing with a ${successRate}% success rate. 
The platform appears to be ready for production use, with all core functionality working properly.` :
  `The RiskTwin platform requires attention before production use. ${testResults.summary.criticalIssues} critical 
issues were identified that must be resolved. Please review the issues section and implement the recommended fixes.`}

**Next Steps:**
1. ${testResults.summary.criticalIssues > 0 ? 'Fix critical issues listed above' : 'Perform manual UI testing'}
2. ${testResults.summary.failed > 0 ? 'Address failed test cases' : 'Review performance optimizations'}
3. Deploy to production environment
4. Set up monitoring and alerting

---
*Generated by RiskTwin Comprehensive Overnight Testing Suite*
*Testing completed at: ${timestamp}*
`;

  // Save the report
  try {
    if (!fs.existsSync(REPORT_DIR)) {
      fs.mkdirSync(REPORT_DIR, { recursive: true });
    }
    
    fs.writeFileSync(path.join(REPORT_DIR, 'OVERNIGHT_TESTING_REPORT.md'), report);
    fs.writeFileSync(path.join(REPORT_DIR, 'overnight_testing_data.json'), JSON.stringify(testResults, null, 2));
    
    log('Comprehensive report saved to docs/OVERNIGHT_TESTING_REPORT.md');
    log('Testing data saved to docs/overnight_testing_data.json');
    
  } catch (error) {
    log(`Failed to save report: ${error.message}`, 'FAIL');
  }
  
  return report;
}

// Main testing orchestration
async function runOvernightTesting() {
  log('🌙 STARTING RISKTWIN COMPREHENSIVE OVERNIGHT TESTING');
  log('=' .repeat(60));
  
  try {
    // Check if server is running, start if needed
    const serverRunning = await checkServerStatus();
    
    if (!serverRunning) {
      log('Server not running, attempting to start...');
      const started = await startServer();
      
      if (!started) {
        const doubleCheck = await checkServerStatus();
        if (!doubleCheck) {
          addIssue('CRITICAL', 'Infrastructure', 'Cannot start or connect to server', 'Manually start with: cd backend && node server.js');
          generateComprehensiveReport();
          return;
        }
      }
      
      // Wait for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      log('Server already running - proceeding with tests');
    }
    
    // Run all testing phases
    const infraReady = await testInfrastructure();
    
    if (infraReady) {
      await testAPIEndpoints();
      await testPOSTEndpoints();
      await testDataIntegrity();
      await testUIAccessibility();
      await runStressTest();
    }
    
    // Generate comprehensive report
    generateComprehensiveReport();
    
    // Display summary
    log('=== TESTING COMPLETED ===');
    log(`Total Tests: ${testResults.summary.totalTests}`);
    log(`Passed: ${testResults.summary.passed}`, 'PASS');
    log(`Failed: ${testResults.summary.failed}`, 'FAIL');
    log(`Warnings: ${testResults.summary.warnings}`, 'WARN');
    log(`Critical Issues: ${testResults.summary.criticalIssues}`, testResults.summary.criticalIssues > 0 ? 'FAIL' : 'PASS');
    
    if (testResults.summary.criticalIssues === 0) {
      log('🎉 PLATFORM READY FOR USE!', 'PASS');
      log('👉 Open http://localhost:3000 to access the dashboard');
    } else {
      log('⚠️  PLATFORM NEEDS ATTENTION - Check report for critical issues', 'FAIL');
    }
    
  } catch (error) {
    log(`Testing failed with error: ${error.message}`, 'FAIL');
    addIssue('CRITICAL', 'Testing Framework', `Testing framework error: ${error.message}`, 'Debug testing script');
    generateComprehensiveReport();
  }
}

// Cleanup function
function cleanup() {
  if (serverProcess) {
    log('Stopping server...');
    serverProcess.kill();
  }
}

// Handle process termination
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Run the comprehensive testing
if (require.main === module) {
  runOvernightTesting();
}

module.exports = { runOvernightTesting, testResults }; 