/**
 * =============================================================================
 * RISKTWIN PLATFORM - COMPREHENSIVE FUNCTIONALITY TESTING SCRIPT
 * =============================================================================
 * 
 * PURPOSE: Systematically test all platform features and generate test report
 * USAGE: node test_all_functionality.js
 * OUTPUT: Detailed test results and documentation
 * 
 * =============================================================================
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_CUSTOMER_ID = 11; // Jennifer Brown
const TEST_RESULTS = [];

// Helper function to add test results
function addTestResult(testCase, endpoint, expected, actual, status, details = '') {
  const result = {
    testCase,
    endpoint,
    expected,
    actual,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  TEST_RESULTS.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testCase}: ${status}`);
  if (details) console.log(`   Details: ${details}`);
}

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { success: true, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test 1: Basic Dashboard Loading
async function testDashboardLoading() {
  console.log('\n🏠 Testing Dashboard Loading...');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const html = await response.text();
    
    if (response.status === 200 && html.includes('Risk Twin')) {
      addTestResult(
        'Dashboard Loading', 
        '/', 
        'HTML page with Risk Twin title', 
        `Status: ${response.status}, Contains title: ${html.includes('Risk Twin')}`,
        'PASS'
      );
    } else {
      addTestResult(
        'Dashboard Loading', 
        '/', 
        'HTML page with Risk Twin title', 
        `Status: ${response.status}`,
        'FAIL'
      );
    }
  } catch (error) {
    addTestResult(
      'Dashboard Loading', 
      '/', 
      'HTML page loads successfully', 
      `Error: ${error.message}`,
      'FAIL'
    );
  }
}

// Test 2: High-Risk Customer API
async function testHighRiskAPI() {
  console.log('\n📊 Testing High-Risk Customer API...');
  
  const result = await apiCall('/api/high-risk');
  
  if (result.success && result.status === 200) {
    const customers = result.data;
    if (Array.isArray(customers) && customers.length > 0) {
      const hasRequiredFields = customers[0].customer_id && customers[0].name && customers[0].base_risk_score;
      addTestResult(
        'High-Risk Customer List',
        '/api/high-risk',
        'Array of customers with required fields',
        `Found ${customers.length} customers, has required fields: ${hasRequiredFields}`,
        hasRequiredFields ? 'PASS' : 'FAIL'
      );
    } else {
      addTestResult(
        'High-Risk Customer List',
        '/api/high-risk',
        'Array of customers',
        'Empty array or invalid data',
        'FAIL'
      );
    }
  } else {
    addTestResult(
      'High-Risk Customer List',
      '/api/high-risk',
      'Status 200 with customer data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 3: Individual Customer Twin Data
async function testCustomerTwinData() {
  console.log('\n👤 Testing Customer Twin Data...');
  
  const result = await apiCall(`/api/twin/${TEST_CUSTOMER_ID}`);
  
  if (result.success && result.status === 200) {
    const twin = result.data;
    const requiredFields = ['customer_id', 'name', 'state', 'base_risk_score', 'next12m_claim_prob', 'next12m_expected_loss'];
    const hasAllFields = requiredFields.every(field => twin.hasOwnProperty(field));
    
    addTestResult(
      'Customer Twin Data Loading',
      `/api/twin/${TEST_CUSTOMER_ID}`,
      'Complete twin data with all required fields',
      `Has all fields: ${hasAllFields}, Fields: ${Object.keys(twin).join(', ')}`,
      hasAllFields ? 'PASS' : 'FAIL'
    );
    
    // Test data types
    const riskScore = parseFloat(twin.base_risk_score);
    const claimProb = parseFloat(twin.next12m_claim_prob);
    const expectedLoss = parseFloat(twin.next12m_expected_loss);
    
    const validTypes = !isNaN(riskScore) && !isNaN(claimProb) && !isNaN(expectedLoss);
    addTestResult(
      'Twin Data Type Validation',
      `/api/twin/${TEST_CUSTOMER_ID}`,
      'Numeric values for risk metrics',
      `Risk Score: ${riskScore}, Claim Prob: ${claimProb}, Expected Loss: ${expectedLoss}`,
      validTypes ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'Customer Twin Data Loading',
      `/api/twin/${TEST_CUSTOMER_ID}`,
      'Status 200 with twin data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 4: Combined Customer API
async function testCombinedCustomerAPI() {
  console.log('\n🔄 Testing Combined Customer API...');
  
  const result = await apiCall(`/api/customer/${TEST_CUSTOMER_ID}`);
  
  if (result.success && result.status === 200) {
    const customerData = result.data;
    const hasId = customerData.id === TEST_CUSTOMER_ID;
    const hasTwin = customerData.twin && customerData.twin.customer_id;
    const hasTimeline = Array.isArray(customerData.timeline);
    
    addTestResult(
      'Combined Customer Data',
      `/api/customer/${TEST_CUSTOMER_ID}`,
      'Customer object with id, twin, and timeline',
      `Has ID: ${hasId}, Has Twin: ${hasTwin}, Has Timeline: ${hasTimeline}`,
      (hasId && hasTwin && hasTimeline) ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'Combined Customer Data',
      `/api/customer/${TEST_CUSTOMER_ID}`,
      'Status 200 with combined data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 5: Timeline Data
async function testTimelineData() {
  console.log('\n📅 Testing Timeline Data...');
  
  const result = await apiCall(`/api/timeline/${TEST_CUSTOMER_ID}`);
  
  if (result.success && result.status === 200) {
    const timeline = result.data;
    if (Array.isArray(timeline)) {
      if (timeline.length > 0) {
        const hasRequiredFields = timeline[0].event_ts && timeline[0].title && timeline[0].details;
        addTestResult(
          'Timeline Data Loading',
          `/api/timeline/${TEST_CUSTOMER_ID}`,
          'Array of timeline events with required fields',
          `Found ${timeline.length} events, has required fields: ${hasRequiredFields}`,
          hasRequiredFields ? 'PASS' : 'WARN',
          timeline.length === 0 ? 'Empty timeline - will auto-create on UI load' : ''
        );
      } else {
        addTestResult(
          'Timeline Data Loading',
          `/api/timeline/${TEST_CUSTOMER_ID}`,
          'Timeline events array',
          'Empty timeline array',
          'WARN',
          'Timeline will be auto-populated on first UI load'
        );
      }
    } else {
      addTestResult(
        'Timeline Data Loading',
        `/api/timeline/${TEST_CUSTOMER_ID}`,
        'Array of timeline events',
        'Invalid data format',
        'FAIL'
      );
    }
  } else {
    addTestResult(
      'Timeline Data Loading',
      `/api/timeline/${TEST_CUSTOMER_ID}`,
      'Status 200 with timeline data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 6: Scenario Application
async function testScenarioApplication() {
  console.log('\n🎯 Testing Scenario Application...');
  
  const scenarioData = {
    customer_id: TEST_CUSTOMER_ID,
    name: 'Test Scenario - Move to TX',
    change_json: {
      move_state: 'TX',
      increase_deductible: 500
    }
  };
  
  const result = await apiCall('/api/scenario', 'POST', scenarioData);
  
  if (result.success && result.status === 200) {
    const response = result.data;
    const hasScenarioId = response.scenario_id || response.success;
    
    addTestResult(
      'Scenario Application',
      '/api/scenario',
      'Successful scenario application with ID',
      `Success: ${hasScenarioId}, Response: ${JSON.stringify(response)}`,
      hasScenarioId ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'Scenario Application',
      '/api/scenario',
      'Status 200 with scenario ID',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 7: ML Risk Recalculation
async function testMLRiskRecalculation() {
  console.log('\n🤖 Testing ML Risk Recalculation...');
  
  const mlData = { customer_id: TEST_CUSTOMER_ID };
  const result = await apiCall('/api/risk/recalculate', 'POST', mlData);
  
  if (result.success && result.status === 200) {
    const mlResponse = result.data;
    const hasRiskData = mlResponse.original_score && mlResponse.new_score;
    
    addTestResult(
      'ML Risk Recalculation',
      '/api/risk/recalculate',
      'ML response with original and new risk scores',
      `Has risk data: ${hasRiskData}, Response keys: ${Object.keys(mlResponse).join(', ')}`,
      hasRiskData ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'ML Risk Recalculation',
      '/api/risk/recalculate',
      'Status 200 with ML risk data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 8: Portfolio Analytics
async function testPortfolioAnalytics() {
  console.log('\n📈 Testing Portfolio Analytics...');
  
  const result = await apiCall('/api/portfolio/summary');
  
  if (result.success && result.status === 200) {
    const portfolio = result.data;
    const hasOverview = portfolio.overview && portfolio.overview.total_customers;
    const hasRiskTiers = Array.isArray(portfolio.risk_tiers);
    
    addTestResult(
      'Portfolio Summary',
      '/api/portfolio/summary',
      'Portfolio data with overview and risk tiers',
      `Has overview: ${hasOverview}, Has risk tiers: ${hasRiskTiers}`,
      (hasOverview && hasRiskTiers) ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'Portfolio Summary',
      '/api/portfolio/summary',
      'Status 200 with portfolio data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 9: Cohort Analysis
async function testCohortAnalysis() {
  console.log('\n👥 Testing Cohort Analysis...');
  
  const result = await apiCall('/api/cohort/risk_based');
  
  if (result.success && result.status === 200) {
    const cohortData = result.data;
    const hasSegments = Array.isArray(cohortData.segments);
    const hasPerformance = cohortData.performance_metrics;
    
    addTestResult(
      'Cohort Analysis',
      '/api/cohort/risk_based',
      'Cohort data with segments and performance metrics',
      `Has segments: ${hasSegments}, Has performance: ${hasPerformance}`,
      (hasSegments && hasPerformance) ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'Cohort Analysis',
      '/api/cohort/risk_based',
      'Status 200 with cohort data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Test 10: Heat Map Data
async function testHeatMapData() {
  console.log('\n🗺️ Testing Heat Map Data...');
  
  const result = await apiCall('/api/heatmap/geographic');
  
  if (result.success && result.status === 200) {
    const heatMapData = result.data;
    const hasStates = Array.isArray(heatMapData.states);
    const hasMetrics = heatMapData.summary;
    
    addTestResult(
      'Geographic Heat Map',
      '/api/heatmap/geographic',
      'Heat map data with states and summary',
      `Has states: ${hasStates}, Has metrics: ${hasMetrics}`,
      (hasStates && hasMetrics) ? 'PASS' : 'FAIL'
    );
  } else {
    addTestResult(
      'Geographic Heat Map',
      '/api/heatmap/geographic',
      'Status 200 with heat map data',
      `Status: ${result.status || 'Error'}, Error: ${result.error || 'None'}`,
      'FAIL'
    );
  }
}

// Generate Test Report
function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 RISKTWIN PLATFORM - COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));
  
  const passCount = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failCount = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const warnCount = TEST_RESULTS.filter(r => r.status === 'WARN').length;
  const totalTests = TEST_RESULTS.length;
  
  console.log(`\n📊 TEST SUMMARY:`);
  console.log(`   ✅ PASSED: ${passCount}/${totalTests}`);
  console.log(`   ❌ FAILED: ${failCount}/${totalTests}`);
  console.log(`   ⚠️  WARNINGS: ${warnCount}/${totalTests}`);
  console.log(`   📈 SUCCESS RATE: ${((passCount / totalTests) * 100).toFixed(1)}%`);
  
  // Generate detailed markdown report
  let markdownReport = `# 🧪 RiskTwin Platform - Test Results\n\n`;
  markdownReport += `**Generated**: ${new Date().toLocaleString()}\n`;
  markdownReport += `**Test Environment**: ${BASE_URL}\n\n`;
  
  markdownReport += `## 📊 Summary\n\n`;
  markdownReport += `| Status | Count | Percentage |\n`;
  markdownReport += `|--------|-------|------------|\n`;
  markdownReport += `| ✅ PASS | ${passCount} | ${((passCount / totalTests) * 100).toFixed(1)}% |\n`;
  markdownReport += `| ❌ FAIL | ${failCount} | ${((failCount / totalTests) * 100).toFixed(1)}% |\n`;
  markdownReport += `| ⚠️ WARN | ${warnCount} | ${((warnCount / totalTests) * 100).toFixed(1)}% |\n`;
  markdownReport += `| **TOTAL** | **${totalTests}** | **100%** |\n\n`;
  
  markdownReport += `## 🔍 Detailed Test Results\n\n`;
  markdownReport += `| Test Case | Endpoint | Status | Expected | Actual | Details |\n`;
  markdownReport += `|-----------|----------|--------|----------|--------|---------|\n`;
  
  TEST_RESULTS.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    markdownReport += `| ${result.testCase} | \`${result.endpoint}\` | ${statusIcon} ${result.status} | ${result.expected} | ${result.actual} | ${result.details} |\n`;
  });
  
  // Save report to file
  const fs = require('fs');
  const reportPath = 'docs/TEST_RESULTS.md';
  
  try {
    fs.writeFileSync(reportPath, markdownReport);
    console.log(`\n📄 Detailed test report saved to: ${reportPath}`);
  } catch (error) {
    console.log(`\n❌ Could not save report to file: ${error.message}`);
  }
  
  return markdownReport;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting RiskTwin Platform Comprehensive Testing...\n');
  
  try {
    await testDashboardLoading();
    await testHighRiskAPI();
    await testCustomerTwinData();
    await testCombinedCustomerAPI();
    await testTimelineData();
    await testScenarioApplication();
    await testMLRiskRecalculation();
    await testPortfolioAnalytics();
    await testCohortAnalysis();
    await testHeatMapData();
    
    generateTestReport();
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    addTestResult(
      'Test Execution',
      'N/A',
      'All tests complete successfully',
      `Failed with error: ${error.message}`,
      'FAIL'
    );
  }
}

// Check if fetch is available, if not, install node-fetch
async function checkDependencies() {
  try {
    if (typeof fetch === 'undefined') {
      console.log('📦 Installing node-fetch dependency...');
      const { exec } = require('child_process');
      return new Promise((resolve, reject) => {
        exec('npm install node-fetch', (error, stdout, stderr) => {
          if (error) {
            console.log('⚠️  Could not install node-fetch automatically. Please run: npm install node-fetch');
            console.log('   Continuing with limited testing...');
          }
          resolve();
        });
      });
    }
  } catch (error) {
    console.log('⚠️  Fetch dependency issue, continuing with available tools...');
  }
}

// Run tests
if (require.main === module) {
  checkDependencies().then(() => {
    runAllTests();
  });
}

module.exports = { runAllTests, TEST_RESULTS }; 