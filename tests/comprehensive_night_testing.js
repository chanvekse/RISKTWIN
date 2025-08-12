/**
 * =============================================================================
 * RISKTWIN PLATFORM - COMPREHENSIVE NIGHT TESTING SCRIPT
 * =============================================================================
 * 
 * PURPOSE: Complete overnight testing of all platform features with detailed reporting
 * USAGE: node comprehensive_night_testing.js
 * OUTPUT: Detailed test results, issue identification, and fix recommendations
 * 
 * =============================================================================
 */

const fetch = require('node-fetch').default || require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_CUSTOMER_ID = 11; // Jennifer Brown
const TEST_RESULTS = [];
const PERFORMANCE_METRICS = [];
const ISSUE_LOG = [];

// Enhanced test result tracking
function addTestResult(category, testCase, endpoint, expected, actual, status, details = '', performance = null) {
  const result = {
    category,
    testCase,
    endpoint,
    expected,
    actual,
    status,
    details,
    performance: performance || { duration: 0, timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} [${category}] ${testCase}: ${status}`);
  if (details) console.log(`   Details: ${details}`);
  if (performance && performance.duration > 1000) {
    console.log(`   ⚡ Performance: ${performance.duration}ms (SLOW)`);
  }
}

// Issue tracking
function logIssue(category, issue, severity, solution = '') {
  const issueRecord = {
    category,
    issue,
    severity, // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    solution,
    timestamp: new Date().toISOString()
  };
  ISSUE_LOG.push(issueRecord);
  
  const severityIcon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : severity === 'MEDIUM' ? '🟡' : '🟢';
  console.log(`${severityIcon} [${severity}] ${category}: ${issue}`);
  if (solution) console.log(`   🔧 Solution: ${solution}`);
}

// Enhanced API call with performance tracking
async function apiCall(endpoint, method = 'GET', body = null, timeout = 10000) {
  const startTime = Date.now();
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const duration = Date.now() - startTime;
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return { 
      success: true, 
      status: response.status, 
      data,
      performance: { duration, timestamp: new Date().toISOString() }
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { 
      success: false, 
      error: error.message,
      performance: { duration, timestamp: new Date().toISOString() }
    };
  }
}

// Test server connectivity
async function testServerConnectivity() {
  console.log('\n🔌 Testing Server Connectivity...');
  
  const result = await apiCall('/', 'GET', null, 5000);
  
  if (result.success && result.status === 200) {
    addTestResult(
      'Infrastructure',
      'Server Connectivity', 
      '/', 
      'HTTP 200 response', 
      `Status: ${result.status}`,
      'PASS',
      'Server is running and responding',
      result.performance
    );
    return true;
  } else {
    addTestResult(
      'Infrastructure',
      'Server Connectivity', 
      '/', 
      'HTTP 200 response', 
      `Error: ${result.error || 'No response'}`,
      'FAIL',
      'Server is not responding or not started',
      result.performance
    );
    logIssue(
      'Infrastructure',
      'Server not responding - may need to be started from backend directory',
      'CRITICAL',
      'Navigate to backend directory and run: node server.js'
    );
    return false;
  }
}

// Test database connectivity through API
async function testDatabaseConnectivity() {
  console.log('\n🗄️ Testing Database Connectivity...');
  
  const result = await apiCall('/api/high-risk?limit=1');
  
  if (result.success && result.status === 200) {
    addTestResult(
      'Infrastructure',
      'Database Connectivity', 
      '/api/high-risk', 
      'Database query successful', 
      `Status: ${result.status}, Data type: ${typeof result.data}`,
      'PASS',
      'Database is connected and responding',
      result.performance
    );
    return true;
  } else {
    addTestResult(
      'Infrastructure',
      'Database Connectivity', 
      '/api/high-risk', 
      'Database query successful', 
      `Error: ${result.error || 'Query failed'}`,
      'FAIL',
      'Database connection or query failed',
      result.performance
    );
    logIssue(
      'Infrastructure',
      'Database connection failed - check PostgreSQL connection',
      'CRITICAL',
      'Verify database connection string and network access'
    );
    return false;
  }
}

// Test all API endpoints systematically
async function testAPIEndpoints() {
  console.log('\n🌐 Testing All API Endpoints...');
  
  const endpoints = [
    { path: '/api/high-risk', method: 'GET', category: 'Customer Data' },
    { path: `/api/twin/${TEST_CUSTOMER_ID}`, method: 'GET', category: 'Customer Data' },
    { path: `/api/customer/${TEST_CUSTOMER_ID}`, method: 'GET', category: 'Customer Data' },
    { path: `/api/timeline/${TEST_CUSTOMER_ID}`, method: 'GET', category: 'Timeline' },
    { path: '/api/portfolio/summary', method: 'GET', category: 'Analytics' },
    { path: '/api/portfolio/trends', method: 'GET', category: 'Analytics' },
    { path: '/api/cohort/risk_based', method: 'GET', category: 'Analytics' },
    { path: '/api/cohort/geographic', method: 'GET', category: 'Analytics' },
    { path: '/api/heatmap/geographic', method: 'GET', category: 'Analytics' },
    { path: '/api/heatmap/activity', method: 'GET', category: 'Analytics' },
    { path: '/api/alerts/analysis', method: 'GET', category: 'Alerts' },
    { path: '/api/predictive/forecasts', method: 'GET', category: 'Predictive' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await apiCall(endpoint.path, endpoint.method);
    
    if (result.success && result.status === 200) {
      const dataValid = result.data && (Array.isArray(result.data) || typeof result.data === 'object');
      addTestResult(
        endpoint.category,
        `${endpoint.method} ${endpoint.path}`,
        endpoint.path,
        'HTTP 200 with valid data',
        `Status: ${result.status}, Data valid: ${dataValid}`,
        dataValid ? 'PASS' : 'WARN',
        dataValid ? 'Endpoint responding correctly' : 'Endpoint responds but data may be invalid',
        result.performance
      );
    } else {
      addTestResult(
        endpoint.category,
        `${endpoint.method} ${endpoint.path}`,
        endpoint.path,
        'HTTP 200 with valid data',
        `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
        'FAIL',
        'Endpoint not responding or returning errors',
        result.performance
      );
      
      if (result.error && result.error.includes('ECONNREFUSED')) {
        logIssue(
          endpoint.category,
          `Endpoint ${endpoint.path} - Connection refused`,
          'HIGH',
          'Check if server is running and listening on correct port'
        );
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Test POST endpoints with data
async function testPOSTEndpoints() {
  console.log('\n📤 Testing POST Endpoints...');
  
  // Test scenario application
  const scenarioData = {
    customer_id: TEST_CUSTOMER_ID,
    name: 'Night Test - Move to CA',
    change_json: {
      move_state: 'CA',
      increase_deductible: 250
    }
  };
  
  const scenarioResult = await apiCall('/api/scenario', 'POST', scenarioData);
  
  if (scenarioResult.success && scenarioResult.status === 200) {
    const hasValidResponse = scenarioResult.data && (scenarioResult.data.scenario_id || scenarioResult.data.success);
    addTestResult(
      'Scenarios',
      'Scenario Application',
      '/api/scenario',
      'Successful scenario creation',
      `Success: ${hasValidResponse}, Response: ${JSON.stringify(scenarioResult.data)}`,
      hasValidResponse ? 'PASS' : 'FAIL',
      hasValidResponse ? 'Scenario applied successfully' : 'Scenario application failed',
      scenarioResult.performance
    );
  } else {
    addTestResult(
      'Scenarios',
      'Scenario Application',
      '/api/scenario',
      'Successful scenario creation',
      `Status: ${scenarioResult.status || 'Error'}, Error: ${scenarioResult.error || 'None'}`,
      'FAIL',
      'Scenario application endpoint failed',
      scenarioResult.performance
    );
  }
  
  // Test ML risk recalculation
  const mlData = { customer_id: TEST_CUSTOMER_ID };
  const mlResult = await apiCall('/api/risk/recalculate', 'POST', mlData);
  
  if (mlResult.success && mlResult.status === 200) {
    const hasValidML = mlResult.data && mlResult.data.original_score && mlResult.data.new_score;
    addTestResult(
      'ML Services',
      'Risk Recalculation',
      '/api/risk/recalculate',
      'ML risk calculation with scores',
      `Has valid data: ${hasValidML}, Keys: ${Object.keys(mlResult.data || {}).join(', ')}`,
      hasValidML ? 'PASS' : 'FAIL',
      hasValidML ? 'ML service functioning correctly' : 'ML service response invalid',
      mlResult.performance
    );
  } else {
    addTestResult(
      'ML Services',
      'Risk Recalculation',
      '/api/risk/recalculate',
      'ML risk calculation with scores',
      `Status: ${mlResult.status || 'Error'}, Error: ${mlResult.error || 'None'}`,
      'FAIL',
      'ML risk recalculation endpoint failed',
      mlResult.performance
    );
  }
  
  // Test timeline creation
  const timelineData = {
    customer_id: TEST_CUSTOMER_ID,
    event_ts: new Date().toISOString(),
    title: 'Night Test Event',
    details: 'Automated test event creation',
    tag: 'test'
  };
  
  const timelineResult = await apiCall('/api/timeline/create', 'POST', timelineData);
  
  if (timelineResult.success && timelineResult.status === 200) {
    const hasEventId = timelineResult.data && timelineResult.data.event_id;
    addTestResult(
      'Timeline',
      'Event Creation',
      '/api/timeline/create',
      'Timeline event created successfully',
      `Has event ID: ${hasEventId}, Response: ${JSON.stringify(timelineResult.data)}`,
      hasEventId ? 'PASS' : 'WARN',
      hasEventId ? 'Timeline events can be created' : 'Timeline creation may have issues',
      timelineResult.performance
    );
  } else {
    addTestResult(
      'Timeline',
      'Event Creation',
      '/api/timeline/create',
      'Timeline event created successfully',
      `Status: ${timelineResult.status || 'Error'}, Error: ${timelineResult.error || 'None'}`,
      'FAIL',
      'Timeline event creation failed',
      timelineResult.performance
    );
  }
}

// Test data integrity and validation
async function testDataIntegrity() {
  console.log('\n🔍 Testing Data Integrity...');
  
  // Test customer data consistency
  const customerResult = await apiCall(`/api/customer/${TEST_CUSTOMER_ID}`);
  
  if (customerResult.success && customerResult.data) {
    const customer = customerResult.data;
    
    // Check required fields
    const requiredFields = ['id', 'twin', 'timeline'];
    const hasAllFields = requiredFields.every(field => customer.hasOwnProperty(field));
    
    addTestResult(
      'Data Integrity',
      'Customer Data Structure',
      `/api/customer/${TEST_CUSTOMER_ID}`,
      'Complete customer object with all required fields',
      `Has all fields: ${hasAllFields}, Available fields: ${Object.keys(customer).join(', ')}`,
      hasAllFields ? 'PASS' : 'FAIL',
      hasAllFields ? 'Customer data structure is complete' : 'Missing required customer data fields'
    );
    
    // Test twin data types
    if (customer.twin) {
      const riskScore = parseFloat(customer.twin.base_risk_score);
      const claimProb = parseFloat(customer.twin.next12m_claim_prob);
      const expectedLoss = parseFloat(customer.twin.next12m_expected_loss);
      
      const validTypes = !isNaN(riskScore) && !isNaN(claimProb) && !isNaN(expectedLoss);
      addTestResult(
        'Data Integrity',
        'Numeric Data Validation',
        `/api/customer/${TEST_CUSTOMER_ID}`,
        'All numeric fields convert properly',
        `Risk Score: ${riskScore} (${typeof riskScore}), Claim Prob: ${claimProb}, Expected Loss: ${expectedLoss}`,
        validTypes ? 'PASS' : 'FAIL',
        validTypes ? 'All numeric data is valid' : 'Numeric data conversion issues detected'
      );
      
      if (!validTypes) {
        logIssue(
          'Data Integrity',
          'Numeric fields in twin data are not converting properly to numbers',
          'HIGH',
          'Check database field types and ensure proper numeric storage'
        );
      }
    }
    
    // Test timeline structure
    if (Array.isArray(customer.timeline)) {
      const timelineValid = customer.timeline.length === 0 || 
        (customer.timeline[0] && customer.timeline[0].event_ts && customer.timeline[0].title);
      
      addTestResult(
        'Data Integrity',
        'Timeline Data Structure',
        `/api/customer/${TEST_CUSTOMER_ID}`,
        'Valid timeline array structure',
        `Timeline length: ${customer.timeline.length}, Structure valid: ${timelineValid}`,
        timelineValid ? 'PASS' : 'WARN',
        customer.timeline.length === 0 ? 'Timeline empty - will auto-populate on UI load' : 
          timelineValid ? 'Timeline structure is correct' : 'Timeline structure may be invalid'
      );
    }
  }
}

// Test service integration
async function testServiceIntegration() {
  console.log('\n🔧 Testing Service Integration...');
  
  // Test if all services are properly loaded by checking endpoints
  const serviceTests = [
    { service: 'ML Service', endpoint: '/api/risk/recalculate', method: 'POST', data: { customer_id: TEST_CUSTOMER_ID } },
    { service: 'Portfolio Service', endpoint: '/api/portfolio/summary', method: 'GET' },
    { service: 'HeatMap Service', endpoint: '/api/heatmap/geographic', method: 'GET' },
    { service: 'Cohort Service', endpoint: '/api/cohort/risk_based', method: 'GET' },
    { service: 'Alert Service', endpoint: '/api/alerts/analysis', method: 'GET' },
    { service: 'Predictive Service', endpoint: '/api/predictive/forecasts', method: 'GET' }
  ];
  
  for (const test of serviceTests) {
    const result = await apiCall(test.endpoint, test.method, test.data);
    
    if (result.success && result.status === 200) {
      addTestResult(
        'Service Integration',
        `${test.service} Integration`,
        test.endpoint,
        'Service responds successfully',
        `Status: ${result.status}, Data present: ${!!result.data}`,
        'PASS',
        `${test.service} is properly integrated and responding`
      );
    } else {
      addTestResult(
        'Service Integration',
        `${test.service} Integration`,
        test.endpoint,
        'Service responds successfully',
        `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
        'FAIL',
        `${test.service} integration may have issues`
      );
      
      if (result.error && result.error.includes('Cannot find module')) {
        logIssue(
          'Service Integration',
          `${test.service} module not found - file may be missing or incorrectly imported`,
          'HIGH',
          `Check that the service file exists and is properly exported in services/ directory`
        );
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Test UI functionality (static file serving)
async function testUIFunctionality() {
  console.log('\n🎨 Testing UI Functionality...');
  
  const uiResult = await apiCall('/', 'GET');
  
  if (uiResult.success && uiResult.status === 200) {
    const isHTML = typeof uiResult.data === 'string' && uiResult.data.includes('<html');
    const hasRiskTwin = typeof uiResult.data === 'string' && uiResult.data.includes('RiskTwin');
    
    addTestResult(
      'UI',
      'Dashboard Loading',
      '/',
      'HTML page with RiskTwin branding',
      `Is HTML: ${isHTML}, Has branding: ${hasRiskTwin}`,
      (isHTML && hasRiskTwin) ? 'PASS' : 'FAIL',
      (isHTML && hasRiskTwin) ? 'UI is loading properly' : 'UI may not be loading correctly'
    );
    
    if (!isHTML || !hasRiskTwin) {
      logIssue(
        'UI',
        'Static file serving may not be configured correctly',
        'MEDIUM',
        'Check Express static file configuration in server.js'
      );
    }
  } else {
    addTestResult(
      'UI',
      'Dashboard Loading',
      '/',
      'HTML page loads successfully',
      `Status: ${uiResult.status || 'Error'}, Error: ${uiResult.error || 'None'}`,
      'FAIL',
      'UI is not accessible'
    );
  }
}

// Performance analysis
function analyzePerformance() {
  console.log('\n⚡ Analyzing Performance...');
  
  const allPerformance = TEST_RESULTS.filter(r => r.performance && r.performance.duration > 0);
  
  if (allPerformance.length === 0) {
    console.log('   No performance data available');
    return;
  }
  
  const durations = allPerformance.map(r => r.performance.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);
  
  console.log(`   Average Response Time: ${avgDuration.toFixed(2)}ms`);
  console.log(`   Fastest Response: ${minDuration}ms`);
  console.log(`   Slowest Response: ${maxDuration}ms`);
  
  // Identify slow endpoints
  const slowEndpoints = allPerformance.filter(r => r.performance.duration > 2000);
  if (slowEndpoints.length > 0) {
    console.log(`   ⚠️  Slow Endpoints (>2s):`);
    slowEndpoints.forEach(endpoint => {
      console.log(`      ${endpoint.endpoint}: ${endpoint.performance.duration}ms`);
      logIssue(
        'Performance',
        `Endpoint ${endpoint.endpoint} is slow (${endpoint.performance.duration}ms)`,
        'MEDIUM',
        'Optimize database queries or add caching'
      );
    });
  }
}

// Generate comprehensive report
function generateComprehensiveReport() {
  console.log('\n📊 Generating Comprehensive Report...');
  
  const passCount = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failCount = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const warnCount = TEST_RESULTS.filter(r => r.status === 'WARN').length;
  const totalTests = TEST_RESULTS.length;
  
  const criticalIssues = ISSUE_LOG.filter(i => i.severity === 'CRITICAL').length;
  const highIssues = ISSUE_LOG.filter(i => i.severity === 'HIGH').length;
  const mediumIssues = ISSUE_LOG.filter(i => i.severity === 'MEDIUM').length;
  const lowIssues = ISSUE_LOG.filter(i => i.severity === 'LOW').length;
  
  // Console summary
  console.log('\n' + '='.repeat(80));
  console.log('🌙 RISKTWIN PLATFORM - COMPREHENSIVE NIGHT TESTING REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`   ✅ PASSED: ${passCount}/${totalTests} (${((passCount / totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ❌ FAILED: ${failCount}/${totalTests} (${((failCount / totalTests) * 100).toFixed(1)}%)`);
  console.log(`   ⚠️  WARNINGS: ${warnCount}/${totalTests} (${((warnCount / totalTests) * 100).toFixed(1)}%)`);
  
  console.log(`\n🚨 ISSUES IDENTIFIED:`);
  console.log(`   🔴 CRITICAL: ${criticalIssues}`);
  console.log(`   🟠 HIGH: ${highIssues}`);
  console.log(`   🟡 MEDIUM: ${mediumIssues}`);
  console.log(`   🟢 LOW: ${lowIssues}`);
  
  // Generate detailed markdown report
  let report = `# 🌙 RiskTwin Platform - Comprehensive Night Testing Report\n\n`;
  report += `**Generated**: ${new Date().toLocaleString()}\n`;
  report += `**Test Environment**: ${BASE_URL}\n`;
  report += `**Test Duration**: Full night testing cycle\n\n`;
  
  // Executive Summary
  report += `## 📋 Executive Summary\n\n`;
  report += `This comprehensive testing report covers all aspects of the RiskTwin platform functionality, `;
  report += `including infrastructure, API endpoints, data integrity, service integration, and UI functionality.\n\n`;
  
  if (criticalIssues > 0) {
    report += `⚠️ **CRITICAL ISSUES DETECTED**: ${criticalIssues} critical issues require immediate attention.\n\n`;
  }
  
  // Test Results Summary
  report += `## 📊 Test Results Summary\n\n`;
  report += `| Status | Count | Percentage |\n`;
  report += `|--------|-------|------------|\n`;
  report += `| ✅ PASS | ${passCount} | ${((passCount / totalTests) * 100).toFixed(1)}% |\n`;
  report += `| ❌ FAIL | ${failCount} | ${((failCount / totalTests) * 100).toFixed(1)}% |\n`;
  report += `| ⚠️ WARN | ${warnCount} | ${((warnCount / totalTests) * 100).toFixed(1)}% |\n`;
  report += `| **TOTAL** | **${totalTests}** | **100%** |\n\n`;
  
  // Issues Summary
  if (ISSUE_LOG.length > 0) {
    report += `## 🚨 Issues Summary\n\n`;
    report += `| Severity | Count | Category | Issue | Solution |\n`;
    report += `|----------|-------|----------|-------|----------|\n`;
    
    ISSUE_LOG.forEach(issue => {
      const severityIcon = issue.severity === 'CRITICAL' ? '🔴' : 
                          issue.severity === 'HIGH' ? '🟠' : 
                          issue.severity === 'MEDIUM' ? '🟡' : '🟢';
      report += `| ${severityIcon} ${issue.severity} | 1 | ${issue.category} | ${issue.issue} | ${issue.solution} |\n`;
    });
    report += `\n`;
  }
  
  // Category-wise results
  const categories = [...new Set(TEST_RESULTS.map(r => r.category))];
  report += `## 🔍 Detailed Results by Category\n\n`;
  
  categories.forEach(category => {
    const categoryTests = TEST_RESULTS.filter(r => r.category === category);
    const categoryPass = categoryTests.filter(r => r.status === 'PASS').length;
    const categoryTotal = categoryTests.length;
    
    report += `### ${category}\n`;
    report += `**Success Rate**: ${((categoryPass / categoryTotal) * 100).toFixed(1)}% (${categoryPass}/${categoryTotal})\n\n`;
    
    report += `| Test Case | Endpoint | Status | Expected | Actual | Details |\n`;
    report += `|-----------|----------|--------|----------|--------|---------|\n`;
    
    categoryTests.forEach(test => {
      const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️';
      report += `| ${test.testCase} | \`${test.endpoint}\` | ${statusIcon} ${test.status} | ${test.expected} | ${test.actual} | ${test.details} |\n`;
    });
    report += `\n`;
  });
  
  // Performance Analysis
  const performanceData = TEST_RESULTS.filter(r => r.performance && r.performance.duration > 0);
  if (performanceData.length > 0) {
    const durations = performanceData.map(r => r.performance.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    report += `## ⚡ Performance Analysis\n\n`;
    report += `| Metric | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| Average Response Time | ${avgDuration.toFixed(2)}ms |\n`;
    report += `| Fastest Response | ${minDuration}ms |\n`;
    report += `| Slowest Response | ${maxDuration}ms |\n`;
    report += `| Total Requests Tested | ${performanceData.length} |\n\n`;
    
    const slowEndpoints = performanceData.filter(r => r.performance.duration > 2000);
    if (slowEndpoints.length > 0) {
      report += `### Slow Endpoints (>2 seconds)\n\n`;
      report += `| Endpoint | Response Time | Category |\n`;
      report += `|----------|---------------|----------|\n`;
      slowEndpoints.forEach(endpoint => {
        report += `| \`${endpoint.endpoint}\` | ${endpoint.performance.duration}ms | ${endpoint.category} |\n`;
      });
      report += `\n`;
    }
  }
  
  // Recommendations
  report += `## 🔧 Recommendations\n\n`;
  
  if (criticalIssues > 0) {
    report += `### Immediate Actions Required\n`;
    const criticalItems = ISSUE_LOG.filter(i => i.severity === 'CRITICAL');
    criticalItems.forEach((issue, index) => {
      report += `${index + 1}. **${issue.category}**: ${issue.issue}\n`;
      report += `   - Solution: ${issue.solution}\n\n`;
    });
  }
  
  if (highIssues > 0) {
    report += `### High Priority Items\n`;
    const highItems = ISSUE_LOG.filter(i => i.severity === 'HIGH');
    highItems.forEach((issue, index) => {
      report += `${index + 1}. **${issue.category}**: ${issue.issue}\n`;
      report += `   - Solution: ${issue.solution}\n\n`;
    });
  }
  
  // Next Steps
  report += `## 🚀 Next Steps\n\n`;
  report += `1. **Address Critical Issues**: Fix any critical issues before proceeding\n`;
  report += `2. **Verify Server Startup**: Ensure server starts correctly from backend directory\n`;
  report += `3. **Test UI Interactions**: Manually test the dashboard at http://localhost:3000\n`;
  report += `4. **Performance Optimization**: Review and optimize slow endpoints\n`;
  report += `5. **Monitor Data Integrity**: Ensure all data flows correctly between components\n\n`;
  
  report += `---\n`;
  report += `*Report generated by RiskTwin Comprehensive Testing Suite*\n`;
  report += `*Timestamp: ${new Date().toISOString()}*\n`;
  
  // Save report
  try {
    const reportPath = path.join('docs', 'NIGHT_TESTING_REPORT.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Comprehensive report saved to: ${reportPath}`);
    
    // Also save JSON data for further analysis
    const dataPath = path.join('docs', 'night_testing_data.json');
    const testData = {
      summary: {
        totalTests,
        passCount,
        failCount,
        warnCount,
        criticalIssues,
        highIssues,
        mediumIssues,
        lowIssues
      },
      testResults: TEST_RESULTS,
      issues: ISSUE_LOG,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(dataPath, JSON.stringify(testData, null, 2));
    console.log(`📄 Test data saved to: ${dataPath}`);
    
  } catch (error) {
    console.log(`\n❌ Could not save report: ${error.message}`);
    logIssue(
      'Reporting',
      'Could not save test report to file',
      'LOW',
      'Check file permissions and ensure docs directory exists'
    );
  }
  
  return report;
}

// Main testing orchestration
async function runComprehensiveNightTesting() {
  console.log('🌙 Starting RiskTwin Comprehensive Night Testing...\n');
  console.log('This testing suite will run overnight and provide a complete analysis.');
  console.log('=' .repeat(80));
  
  try {
    // Phase 1: Infrastructure Testing
    console.log('\n🏗️ PHASE 1: INFRASTRUCTURE TESTING');
    const serverConnected = await testServerConnectivity();
    
    if (serverConnected) {
      const dbConnected = await testDatabaseConnectivity();
      
      if (dbConnected) {
        // Phase 2: API Testing
        console.log('\n🌐 PHASE 2: API ENDPOINT TESTING');
        await testAPIEndpoints();
        await testPOSTEndpoints();
        
        // Phase 3: Data Integrity
        console.log('\n🔍 PHASE 3: DATA INTEGRITY TESTING');
        await testDataIntegrity();
        
        // Phase 4: Service Integration
        console.log('\n🔧 PHASE 4: SERVICE INTEGRATION TESTING');
        await testServiceIntegration();
        
        // Phase 5: UI Testing
        console.log('\n🎨 PHASE 5: UI FUNCTIONALITY TESTING');
        await testUIFunctionality();
        
      } else {
        logIssue(
          'Infrastructure',
          'Cannot proceed with full testing - database not accessible',
          'CRITICAL',
          'Fix database connectivity before running comprehensive tests'
        );
      }
    } else {
      logIssue(
        'Infrastructure',
        'Cannot proceed with testing - server not responding',
        'CRITICAL',
        'Start the server before running tests'
      );
    }
    
    // Phase 6: Performance Analysis
    console.log('\n⚡ PHASE 6: PERFORMANCE ANALYSIS');
    analyzePerformance();
    
    // Phase 7: Report Generation
    console.log('\n📊 PHASE 7: REPORT GENERATION');
    generateComprehensiveReport();
    
    console.log('\n✅ Comprehensive night testing completed successfully!');
    console.log('📋 Check the generated reports for detailed analysis and recommendations.');
    
  } catch (error) {
    console.error('\n❌ Night testing failed:', error.message);
    logIssue(
      'Testing Framework',
      `Test execution failed: ${error.message}`,
      'CRITICAL',
      'Debug the testing framework and retry'
    );
    generateComprehensiveReport(); // Generate report even if tests failed
  }
}

// Run the tests if this is the main module
if (require.main === module) {
  runComprehensiveNightTesting();
}

module.exports = { 
  runComprehensiveNightTesting, 
  TEST_RESULTS, 
  ISSUE_LOG 
}; 