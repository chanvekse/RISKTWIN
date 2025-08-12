/**
 * =============================================================================
 * RISKTWIN PLATFORM - UI INTERACTION TESTING SCRIPT
 * =============================================================================
 * 
 * PURPOSE: Test specific UI interactions and data population issues
 * USAGE: node ui_interaction_test.js
 * 
 * =============================================================================
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_CUSTOMER_ID = 11; // Jennifer Brown

// Test the specific issue mentioned: high-risk customer selection
async function testHighRiskCustomerSelection() {
  console.log('🔍 Testing High-Risk Customer Selection Issue...\n');
  
  try {
    // Step 1: Get high-risk customers list
    console.log('1️⃣ Fetching high-risk customers...');
    const highRiskResponse = await fetch(`${BASE_URL}/api/high-risk`);
    const highRiskCustomers = await highRiskResponse.json();
    
    if (!Array.isArray(highRiskCustomers) || highRiskCustomers.length === 0) {
      console.log('❌ FAIL: No high-risk customers returned');
      return;
    }
    
    console.log(`✅ Found ${highRiskCustomers.length} high-risk customers`);
    console.log(`   First customer: ${highRiskCustomers[0].name} (ID: ${highRiskCustomers[0].customer_id})`);
    
    // Step 2: Select first customer and get their full data
    const selectedCustomer = highRiskCustomers[0];
    console.log(`\n2️⃣ Testing customer selection for ${selectedCustomer.name}...`);
    
    const customerResponse = await fetch(`${BASE_URL}/api/customer/${selectedCustomer.customer_id}`);
    const customerData = await customerResponse.json();
    
    if (!customerData.twin) {
      console.log('❌ FAIL: Customer twin data not loaded');
      return;
    }
    
    console.log(`✅ Customer data loaded successfully`);
    console.log(`   Risk Score: ${customerData.twin.base_risk_score}`);
    console.log(`   Claim Probability: ${customerData.twin.next12m_claim_prob}`);
    console.log(`   Expected Loss: ${customerData.twin.next12m_expected_loss}`);
    
    // Step 3: Test data format (the issue might be string vs number)
    console.log(`\n3️⃣ Testing data types...`);
    
    const riskScore = parseFloat(customerData.twin.base_risk_score);
    const claimProb = parseFloat(customerData.twin.next12m_claim_prob);
    const expectedLoss = parseFloat(customerData.twin.next12m_expected_loss);
    
    if (isNaN(riskScore) || isNaN(claimProb) || isNaN(expectedLoss)) {
      console.log('❌ FAIL: Numeric conversion failed');
      console.log(`   Risk Score (raw): "${customerData.twin.base_risk_score}" -> ${riskScore}`);
      console.log(`   Claim Prob (raw): "${customerData.twin.next12m_claim_prob}" -> ${claimProb}`);
      console.log(`   Expected Loss (raw): "${customerData.twin.next12m_expected_loss}" -> ${expectedLoss}`);
    } else {
      console.log(`✅ All numeric fields convert properly`);
      console.log(`   Risk Score: ${riskScore} (${typeof riskScore})`);
      console.log(`   Claim Prob: ${claimProb} (${typeof claimProb})`);
      console.log(`   Expected Loss: ${expectedLoss} (${typeof expectedLoss})`);
    }
    
    // Step 4: Test timeline data
    console.log(`\n4️⃣ Testing timeline data...`);
    
    if (Array.isArray(customerData.timeline)) {
      console.log(`✅ Timeline is array with ${customerData.timeline.length} events`);
      if (customerData.timeline.length > 0) {
        const firstEvent = customerData.timeline[0];
        console.log(`   First event: ${firstEvent.title} (${firstEvent.event_ts})`);
      } else {
        console.log(`   ⚠️  Empty timeline - should auto-populate on UI load`);
      }
    } else {
      console.log(`❌ FAIL: Timeline is not an array`);
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

// Test scenario application workflow
async function testScenarioWorkflow() {
  console.log('\n🎯 Testing Scenario Application Workflow...\n');
  
  try {
    // Apply a test scenario
    console.log('1️⃣ Applying test scenario...');
    const scenarioData = {
      customer_id: TEST_CUSTOMER_ID,
      name: 'UI Test - Move to CA',
      change_json: {
        move_state: 'CA',
        increase_deductible: 250
      }
    };
    
    const scenarioResponse = await fetch(`${BASE_URL}/api/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenarioData)
    });
    
    const scenarioResult = await scenarioResponse.json();
    
    if (scenarioResult.success && scenarioResult.scenario_id) {
      console.log(`✅ Scenario applied successfully (ID: ${scenarioResult.scenario_id})`);
      
      // Check if deductible progression is provided
      if (scenarioResult.deductible_progression) {
        console.log(`   Deductible progression: $${scenarioResult.deductible_progression.before} -> $${scenarioResult.deductible_progression.final}`);
      }
    } else {
      console.log(`❌ FAIL: Scenario application failed`);
      console.log(`   Response: ${JSON.stringify(scenarioResult)}`);
    }
    
    // Check if timeline was updated
    console.log('\n2️⃣ Checking timeline update...');
    const timelineResponse = await fetch(`${BASE_URL}/api/timeline/${TEST_CUSTOMER_ID}`);
    const timeline = await timelineResponse.json();
    
    if (Array.isArray(timeline) && timeline.length > 0) {
      const latestEvent = timeline[0]; // Should be sorted by date DESC
      console.log(`✅ Timeline updated with latest event: ${latestEvent.title}`);
    } else {
      console.log(`❌ FAIL: Timeline not updated after scenario`);
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

// Test ML risk recalculation
async function testMLRiskRecalculation() {
  console.log('\n🤖 Testing ML Risk Recalculation...\n');
  
  try {
    console.log('1️⃣ Triggering ML risk recalculation...');
    
    const mlResponse = await fetch(`${BASE_URL}/api/risk/recalculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: TEST_CUSTOMER_ID })
    });
    
    if (mlResponse.status !== 200) {
      const errorText = await mlResponse.text();
      console.log(`❌ FAIL: ML recalculation failed (${mlResponse.status})`);
      console.log(`   Error: ${errorText}`);
      return;
    }
    
    const mlResult = await mlResponse.json();
    
    if (mlResult.original_score && mlResult.new_score) {
      console.log(`✅ ML recalculation successful`);
      console.log(`   Original Score: ${mlResult.original_score}`);
      console.log(`   New Score: ${mlResult.new_score}`);
      console.log(`   Change: ${mlResult.change || mlResult.adjustment}`);
      console.log(`   Confidence: ${(mlResult.confidence * 100).toFixed(1)}%`);
    } else {
      console.log(`❌ FAIL: ML result missing required fields`);
      console.log(`   Result keys: ${Object.keys(mlResult).join(', ')}`);
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

// Test portfolio analytics
async function testPortfolioAnalytics() {
  console.log('\n📈 Testing Portfolio Analytics...\n');
  
  try {
    console.log('1️⃣ Testing portfolio summary...');
    const portfolioResponse = await fetch(`${BASE_URL}/api/portfolio/summary`);
    const portfolio = await portfolioResponse.json();
    
    if (portfolio.overview && portfolio.overview.total_customers) {
      console.log(`✅ Portfolio overview loaded`);
      console.log(`   Total Customers: ${portfolio.overview.total_customers}`);
      console.log(`   Average Risk Score: ${portfolio.overview.avg_risk_score}`);
      
      if (Array.isArray(portfolio.risk_tiers) && portfolio.risk_tiers.length > 0) {
        console.log(`✅ Risk tiers loaded (${portfolio.risk_tiers.length} tiers)`);
        portfolio.risk_tiers.forEach(tier => {
          console.log(`   ${tier.tier}: ${tier.customer_count} customers`);
        });
      } else {
        console.log(`❌ FAIL: Risk tiers not loaded properly`);
      }
    } else {
      console.log(`❌ FAIL: Portfolio overview not loaded`);
    }
    
    console.log('\n2️⃣ Testing portfolio trends...');
    const trendsResponse = await fetch(`${BASE_URL}/api/portfolio/trends`);
    
    if (trendsResponse.status === 200) {
      const trends = await trendsResponse.json();
      console.log(`✅ Portfolio trends loaded`);
      console.log(`   Response type: ${typeof trends}`);
    } else {
      console.log(`❌ FAIL: Portfolio trends failed (${trendsResponse.status})`);
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
  }
}

// Test interactive features data flow
async function testInteractiveFeatures() {
  console.log('\n🎮 Testing Interactive Features...\n');
  
  // Test cohort analysis
  console.log('1️⃣ Testing cohort analysis...');
  try {
    const cohortResponse = await fetch(`${BASE_URL}/api/cohort/risk_based`);
    const cohortData = await cohortResponse.json();
    
    if (cohortData.segments && Array.isArray(cohortData.segments)) {
      console.log(`✅ Cohort segments loaded (${cohortData.segments.length} segments)`);
      
      if (cohortData.performance_metrics) {
        console.log(`✅ Performance metrics available`);
      } else {
        console.log(`⚠️  Performance metrics missing`);
      }
    } else {
      console.log(`❌ FAIL: Cohort segments not loaded`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Cohort analysis error - ${error.message}`);
  }
  
  // Test heat map data
  console.log('\n2️⃣ Testing heat map data...');
  try {
    const heatmapResponse = await fetch(`${BASE_URL}/api/heatmap/geographic`);
    const heatmapData = await heatmapResponse.json();
    
    if (heatmapData.heat_map_points && Array.isArray(heatmapData.heat_map_points)) {
      console.log(`✅ Heat map points loaded (${heatmapData.heat_map_points.length} points)`);
    } else {
      console.log(`❌ FAIL: Heat map points not loaded`);
      console.log(`   Available keys: ${Object.keys(heatmapData).join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Heat map error - ${error.message}`);
  }
  
  // Test alert system
  console.log('\n3️⃣ Testing alert system...');
  try {
    const alertsResponse = await fetch(`${BASE_URL}/api/alerts/analysis`);
    const alertsData = await alertsResponse.json();
    
    if (alertsData.alerts || alertsData.summary) {
      console.log(`✅ Alert analysis loaded`);
    } else {
      console.log(`❌ FAIL: Alert analysis not loaded`);
    }
  } catch (error) {
    console.log(`❌ FAIL: Alert system error - ${error.message}`);
  }
}

// Main test execution
async function runUITests() {
  console.log('🚀 Starting RiskTwin UI Interaction Testing...\n');
  console.log('=' .repeat(60));
  
  await testHighRiskCustomerSelection();
  await testScenarioWorkflow();
  await testMLRiskRecalculation();
  await testPortfolioAnalytics();
  await testInteractiveFeatures();
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 UI Testing Complete!\n');
  console.log('📋 Manual UI Testing Steps:');
  console.log('1. Open http://localhost:3000 in browser');
  console.log('2. Click on high-risk customers to verify data population');
  console.log('3. Apply scenarios and check timeline updates');
  console.log('4. Test ML recalculation button');
  console.log('5. Navigate through all interactive features');
  console.log('6. Verify all charts and visualizations load data');
}

// Run the tests
if (require.main === module) {
  runUITests();
}

module.exports = { runUITests }; 