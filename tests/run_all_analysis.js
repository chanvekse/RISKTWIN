/**
 * =============================================================================
 * RISKTWIN PLATFORM - MASTER ANALYSIS AND TESTING SCRIPT
 * =============================================================================
 * 
 * PURPOSE: Run all analysis and testing scripts in sequence
 * USAGE: node run_all_analysis.js
 * 
 * =============================================================================
 */

const { runServiceAnalysis } = require('./analyze_service_structure.js');
const fs = require('fs');

console.log('🌙 RiskTwin Platform - Master Analysis and Testing');
console.log('='.repeat(60));
console.log('Running comprehensive analysis and testing suite...\n');

async function runMasterAnalysis() {
  const results = {
    serviceAnalysis: null,
    testResults: null,
    timestamp: new Date().toISOString(),
    summary: {
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    }
  };

  try {
    // Phase 1: Service Structure Analysis
    console.log('🔧 PHASE 1: SERVICE STRUCTURE ANALYSIS');
    console.log('-'.repeat(40));
    
    results.serviceAnalysis = runServiceAnalysis();
    
    // Count issues from service analysis
    const criticalService = results.serviceAnalysis.importIssues.filter(i => i.severity === 'CRITICAL').length +
                           results.serviceAnalysis.exportIssues.filter(i => i.severity === 'CRITICAL').length;
    const highService = results.serviceAnalysis.importIssues.filter(i => i.severity === 'HIGH').length +
                       results.serviceAnalysis.exportIssues.filter(i => i.severity === 'HIGH').length;
    
    results.summary.criticalIssues += criticalService;
    results.summary.highIssues += highService;
    
    console.log(`\n✅ Service analysis complete. Found ${results.serviceAnalysis.serviceFiles.length} service files.`);
    
    if (criticalService > 0) {
      console.log(`🔴 CRITICAL: ${criticalService} critical issues found in services - server may not start`);
      console.log('   Recommendation: Fix service issues before proceeding with testing');
    }

    // Phase 2: Check if we can proceed with server testing
    console.log('\n📊 PHASE 2: TESTING FEASIBILITY CHECK');
    console.log('-'.repeat(40));
    
    if (criticalService === 0) {
      console.log('✅ No critical service issues - proceeding with comprehensive testing');
      
      try {
        // Try to run testing
        const { runComprehensiveNightTesting } = require('./comprehensive_night_testing.js');
        
        console.log('\n🧪 PHASE 3: COMPREHENSIVE FUNCTIONALITY TESTING');
        console.log('-'.repeat(40));
        
        await runComprehensiveNightTesting();
        console.log('✅ Comprehensive testing completed successfully');
        
      } catch (testError) {
        console.log(`⚠️  Testing could not be completed: ${testError.message}`);
        console.log('   This may be due to server not running - will document in final report');
        
        results.testResults = {
          error: testError.message,
          completed: false
        };
      }
    } else {
      console.log(`❌ Cannot proceed with testing - ${criticalService} critical service issues must be fixed first`);
      console.log('   Please review the service analysis report and fix issues');
      
      results.testResults = {
        error: 'Critical service issues prevent testing',
        completed: false
      };
    }

    // Phase 3: Generate Master Report
    console.log('\n📊 PHASE 4: MASTER REPORT GENERATION');
    console.log('-'.repeat(40));
    
    generateMasterReport(results);
    
    console.log('\n🎉 Master analysis and testing completed!');
    console.log('📋 Check the docs/ directory for detailed reports');
    
  } catch (error) {
    console.error(`\n❌ Master analysis failed: ${error.message}`);
    console.error('Stack trace:', error.stack);
  }
}

function generateMasterReport(results) {
  const report = `# 🌙 RiskTwin Platform - Master Analysis Report

**Generated**: ${new Date().toLocaleString()}
**Analysis Type**: Complete platform analysis and testing
**Timestamp**: ${results.timestamp}

## 📋 Executive Summary

This master report provides a comprehensive analysis of the RiskTwin platform, including service structure analysis and functional testing results.

### 🚨 Critical Issues Summary
- **Critical Issues**: ${results.summary.criticalIssues}
- **High Priority Issues**: ${results.summary.highIssues}
- **Medium Priority Issues**: ${results.summary.mediumIssues}

### 📊 Service Analysis Results
- **Service Files Analyzed**: ${results.serviceAnalysis ? results.serviceAnalysis.serviceFiles.length : 'N/A'}
- **Services with Issues**: ${results.serviceAnalysis ? 
    results.serviceAnalysis.serviceFiles.filter(s => !s.hasClass || !s.hasConstructor || !s.hasModuleExports).length : 'N/A'}
- **Import Issues**: ${results.serviceAnalysis ? results.serviceAnalysis.importIssues.length : 'N/A'}
- **Export Issues**: ${results.serviceAnalysis ? results.serviceAnalysis.exportIssues.length : 'N/A'}

 ### 🧪 Testing Status
 ${results.testResults ? 
   (results.testResults.completed ? 
     `- **Status**: ✅ Completed successfully
 - **Total Tests**: ${results.testResults.totalTests || 'N/A'}
 - **Passed**: ${results.testResults.passedTests || 'N/A'}
 - **Failed**: ${results.testResults.failedTests || 'N/A'}` :
     `- **Status**: ❌ Could not complete testing
 - **Reason**: ${results.testResults.error}`) :
   '- **Status**: ⏳ Testing not attempted due to critical issues'}

## 🔧 Service Structure Analysis

${results.serviceAnalysis && results.serviceAnalysis.serviceFiles.length > 0 ? `
### Service Files Status

| Service File | Class | Constructor | Exports | Status |
|--------------|-------|-------------|---------|--------|
 ${results.serviceAnalysis.serviceFiles.map(service => 
   `| ${service.filename} | ${service.exportedClass || 'N/A'} | ${service.hasConstructor ? '✅' : '❌'} | ${service.hasModuleExports ? '✅' : '❌'} | ${service.hasClass && service.hasConstructor && service.hasModuleExports ? '✅ GOOD' : '⚠️ ISSUES'} |`
 ).join('\n')}
` : 'No service files found or analysis failed.'}

## 🚨 Critical Issues Requiring Immediate Attention

${results.serviceAnalysis && (results.serviceAnalysis.importIssues.length > 0 || results.serviceAnalysis.exportIssues.length > 0) ? `
 ${[...results.serviceAnalysis.importIssues, ...results.serviceAnalysis.exportIssues]
   .filter(issue => issue.severity === 'CRITICAL')
   .map(issue => `### 🔴 ${issue.type}
 **File**: \`${issue.file}\`
 **Issue**: ${issue.issue}
 ${issue.resolvedPath ? `**Expected Path**: \`${issue.resolvedPath}\`` : ''}
 `).join('\n')}
` : 'No critical issues found in service structure.'}

## 🚀 Recommended Next Steps

### Immediate Actions (Critical)
${results.summary.criticalIssues > 0 ? `
1. **Fix Critical Service Issues**: Address all critical issues identified in service analysis
2. **Verify File Paths**: Ensure all service files are in correct locations
3. **Check Module Exports**: Verify all services have proper module.exports
4. **Test Server Startup**: Try starting server after fixes
` : `
1. **Server Startup**: Try starting the server with: \`cd backend && node server.js\`
2. **Manual Testing**: Open http://localhost:3000 to test UI
`}

### High Priority Actions
${results.summary.highIssues > 0 ? `
1. **Address High Priority Issues**: Fix issues that may cause functionality problems
2. **Test Individual Services**: Verify each service works correctly
3. **Database Connectivity**: Ensure database connection is working
` : `
1. **Run Comprehensive Tests**: Execute full testing suite
2. **Performance Review**: Check response times and optimize if needed
`}

### Medium Priority Actions
1. **Code Review**: Review service implementations for best practices
2. **Documentation Update**: Ensure all documentation is current
3. **Performance Optimization**: Optimize slow endpoints if any
4. **Error Handling**: Improve error handling throughout the application

## 📁 Generated Reports

The following detailed reports have been generated:

1. **Service Analysis Report**: \`docs/SERVICE_ANALYSIS_REPORT.md\`
   - Detailed service structure analysis
   - Import/export validation
   - Recommendations for fixes

2. **Service Analysis Data**: \`docs/service_analysis_data.json\`
   - Machine-readable analysis results
   - Detailed issue tracking

${results.testResults && results.testResults.completed ? `
3. **Night Testing Report**: \`docs/NIGHT_TESTING_REPORT.md\`
   - Comprehensive functionality test results
   - Performance analysis
   - Issue identification

4. **Testing Data**: \`docs/night_testing_data.json\`
   - Detailed test results and metrics
   - Performance data
` : ''}

## 🏁 Conclusion

${results.summary.criticalIssues === 0 ? `
The RiskTwin platform appears to be structurally sound with no critical issues preventing operation. 
${results.testResults && results.testResults.completed ? 
  'Comprehensive testing has been completed successfully.' : 
  'Testing should be performed once the server is started.'}
` : `
The RiskTwin platform has ${results.summary.criticalIssues} critical issue(s) that must be addressed 
before the platform can operate correctly. Please review the detailed analysis reports and implement 
the recommended fixes.
`}

### Platform Status: ${results.summary.criticalIssues === 0 ? '🟢 READY FOR OPERATION' : '🔴 REQUIRES FIXES'}

---
*Generated by RiskTwin Master Analysis Suite*
*For detailed technical information, please review the individual analysis reports.*
`;

  try {
    const reportPath = 'docs/MASTER_ANALYSIS_REPORT.md';
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Master analysis report saved to: ${reportPath}`);
    
    // Save master results data
    const dataPath = 'docs/master_analysis_data.json';
    fs.writeFileSync(dataPath, JSON.stringify(results, null, 2));
    console.log(`📄 Master analysis data saved to: ${dataPath}`);
    
  } catch (error) {
    console.log(`❌ Could not save master report: ${error.message}`);
  }
}

// Run the master analysis
if (require.main === module) {
  runMasterAnalysis();
}

module.exports = { runMasterAnalysis }; 