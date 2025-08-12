/**
 * =============================================================================
 * RISKTWIN PLATFORM - SERVICE STRUCTURE ANALYSIS
 * =============================================================================
 * 
 * PURPOSE: Analyze service file structure and identify import/export issues
 * USAGE: node analyze_service_structure.js
 * 
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');

const SERVICES_DIR = './services';
const BACKEND_DIR = './backend';

// Analysis results
const analysisResults = {
  serviceFiles: [],
  importIssues: [],
  exportIssues: [],
  recommendations: []
};

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Read file content safely
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Analyze service files
function analyzeServiceFiles() {
  console.log('🔍 Analyzing service files...');
  
  if (!fileExists(SERVICES_DIR)) {
    analysisResults.importIssues.push({
      type: 'DIRECTORY_MISSING',
      file: SERVICES_DIR,
      issue: 'Services directory does not exist',
      severity: 'CRITICAL'
    });
    return;
  }
  
  const serviceFiles = fs.readdirSync(SERVICES_DIR).filter(file => file.endsWith('.js'));
  
  serviceFiles.forEach(file => {
    const filePath = path.join(SERVICES_DIR, file);
    const content = readFile(filePath);
    
    if (!content) {
      analysisResults.importIssues.push({
        type: 'READ_ERROR',
        file: filePath,
        issue: 'Cannot read service file',
        severity: 'HIGH'
      });
      return;
    }
    
    const serviceAnalysis = {
      filename: file,
      path: filePath,
      hasClass: false,
      hasConstructor: false,
      hasModuleExports: false,
      exportedClass: null,
      methods: [],
      dependencies: []
    };
    
    // Check for class definition
    const classMatch = content.match(/class\s+(\w+)/);
    if (classMatch) {
      serviceAnalysis.hasClass = true;
      serviceAnalysis.exportedClass = classMatch[1];
    }
    
    // Check for constructor
    serviceAnalysis.hasConstructor = content.includes('constructor(');
    
    // Check for module.exports
    const exportMatch = content.match(/module\.exports\s*=\s*(\w+)/);
    if (exportMatch) {
      serviceAnalysis.hasModuleExports = true;
      
      // Verify exported class matches defined class
      if (serviceAnalysis.exportedClass && exportMatch[1] !== serviceAnalysis.exportedClass) {
        analysisResults.exportIssues.push({
          type: 'EXPORT_MISMATCH',
          file: filePath,
          issue: `Exported class "${exportMatch[1]}" doesn't match defined class "${serviceAnalysis.exportedClass}"`,
          severity: 'HIGH'
        });
      }
    } else {
      analysisResults.exportIssues.push({
        type: 'MISSING_EXPORT',
        file: filePath,
        issue: 'Service file missing module.exports',
        severity: 'CRITICAL'
      });
    }
    
    // Extract method names
    const methodMatches = content.match(/async\s+(\w+)\s*\(/g) || [];
    serviceAnalysis.methods = methodMatches.map(match => match.replace(/async\s+/, '').replace(/\s*\($/, ''));
    
    // Check for require statements (dependencies)
    const requireMatches = content.match(/require\s*\(\s*['"](.*?)['"]\s*\)/g) || [];
    serviceAnalysis.dependencies = requireMatches.map(match => {
      const depMatch = match.match(/require\s*\(\s*['"](.*?)['"]\s*\)/);
      return depMatch ? depMatch[1] : '';
    });
    
    analysisResults.serviceFiles.push(serviceAnalysis);
  });
}

// Analyze server imports
function analyzeServerImports() {
  console.log('🔍 Analyzing server imports...');
  
  const serverPath = path.join(BACKEND_DIR, 'server.js');
  
  if (!fileExists(serverPath)) {
    analysisResults.importIssues.push({
      type: 'SERVER_MISSING',
      file: serverPath,
      issue: 'Server file does not exist',
      severity: 'CRITICAL'
    });
    return;
  }
  
  const serverContent = readFile(serverPath);
  if (!serverContent) {
    analysisResults.importIssues.push({
      type: 'READ_ERROR',
      file: serverPath,
      issue: 'Cannot read server file',
      severity: 'CRITICAL'
    });
    return;
  }
  
  // Extract service imports from server.js
  const serviceImports = serverContent.match(/require\s*\(\s*['"](\.\.\/services\/.*?)['"]\s*\)/g) || [];
  
  serviceImports.forEach(importStatement => {
    const pathMatch = importStatement.match(/require\s*\(\s*['"](\.\.\/services\/.*?)['"]\s*\)/);
    if (pathMatch) {
      const importPath = pathMatch[1];
      const resolvedPath = path.resolve(BACKEND_DIR, importPath);
      const relativePath = path.relative('.', resolvedPath);
      
      if (!fileExists(resolvedPath)) {
        analysisResults.importIssues.push({
          type: 'IMPORT_NOT_FOUND',
          file: serverPath,
          issue: `Imported service file not found: ${importPath}`,
          resolvedPath: relativePath,
          severity: 'CRITICAL'
        });
      }
    }
  });
  
  // Check if service classes are properly instantiated
  const serviceInstantiations = serverContent.match(/new\s+(\w+Service)\s*\(/g) || [];
  const serviceNames = analysisResults.serviceFiles.map(s => s.exportedClass);
  
  serviceInstantiations.forEach(instantiation => {
    const classMatch = instantiation.match(/new\s+(\w+Service)\s*\(/);
    if (classMatch) {
      const className = classMatch[1];
      if (!serviceNames.includes(className)) {
        analysisResults.importIssues.push({
          type: 'CLASS_NOT_FOUND',
          file: serverPath,
          issue: `Service class "${className}" is instantiated but not found in service files`,
          severity: 'HIGH'
        });
      }
    }
  });
}

// Generate recommendations
function generateRecommendations() {
  console.log('💡 Generating recommendations...');
  
  // Check for missing exports
  const missingExports = analysisResults.exportIssues.filter(issue => issue.type === 'MISSING_EXPORT');
  if (missingExports.length > 0) {
    analysisResults.recommendations.push({
      priority: 'HIGH',
      category: 'Exports',
      recommendation: 'Add module.exports to service files that are missing them',
      files: missingExports.map(issue => issue.file)
    });
  }
  
  // Check for import issues
  const importNotFound = analysisResults.importIssues.filter(issue => issue.type === 'IMPORT_NOT_FOUND');
  if (importNotFound.length > 0) {
    analysisResults.recommendations.push({
      priority: 'CRITICAL',
      category: 'Imports',
      recommendation: 'Fix missing service file imports in server.js',
      details: importNotFound.map(issue => `${issue.issue} -> Expected at: ${issue.resolvedPath}`)
    });
  }
  
  // Performance recommendations
  if (analysisResults.serviceFiles.length > 0) {
    const servicesWithoutAsync = analysisResults.serviceFiles.filter(s => s.methods.length === 0);
    if (servicesWithoutAsync.length > 0) {
      analysisResults.recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        recommendation: 'Consider adding async methods for better performance',
        files: servicesWithoutAsync.map(s => s.filename)
      });
    }
  }
  
  // Dependency recommendations
  const externalDeps = [];
  analysisResults.serviceFiles.forEach(service => {
    service.dependencies.forEach(dep => {
      if (!dep.startsWith('.') && !dep.startsWith('/') && !externalDeps.includes(dep)) {
        externalDeps.push(dep);
      }
    });
  });
  
  if (externalDeps.length > 0) {
    analysisResults.recommendations.push({
      priority: 'LOW',
      category: 'Dependencies',
      recommendation: 'Verify all external dependencies are installed',
      dependencies: externalDeps
    });
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n📊 Generating Service Structure Analysis Report...');
  
  const criticalIssues = [
    ...analysisResults.importIssues.filter(i => i.severity === 'CRITICAL'),
    ...analysisResults.exportIssues.filter(i => i.severity === 'CRITICAL')
  ].length;
  
  const highIssues = [
    ...analysisResults.importIssues.filter(i => i.severity === 'HIGH'),
    ...analysisResults.exportIssues.filter(i => i.severity === 'HIGH')
  ].length;
  
  console.log('\n' + '='.repeat(80));
  console.log('🔧 RISKTWIN PLATFORM - SERVICE STRUCTURE ANALYSIS REPORT');
  console.log('='.repeat(80));
  
  console.log(`\n📊 ANALYSIS SUMMARY:`);
  console.log(`   📁 Service Files Found: ${analysisResults.serviceFiles.length}`);
  console.log(`   🔴 Critical Issues: ${criticalIssues}`);
  console.log(`   🟠 High Priority Issues: ${highIssues}`);
  console.log(`   💡 Recommendations: ${analysisResults.recommendations.length}`);
  
  // Generate detailed markdown report
  let report = `# 🔧 RiskTwin Platform - Service Structure Analysis\n\n`;
  report += `**Generated**: ${new Date().toLocaleString()}\n\n`;
  
  // Service Files Overview
  report += `## 📁 Service Files Overview\n\n`;
  report += `| File | Class | Constructor | Exports | Methods | Status |\n`;
  report += `|------|-------|-------------|---------|---------|--------|\n`;
  
  analysisResults.serviceFiles.forEach(service => {
    const status = service.hasClass && service.hasConstructor && service.hasModuleExports ? '✅ GOOD' : '⚠️ ISSUES';
    report += `| ${service.filename} | ${service.exportedClass || 'N/A'} | ${service.hasConstructor ? '✅' : '❌'} | ${service.hasModuleExports ? '✅' : '❌'} | ${service.methods.length} | ${status} |\n`;
  });
  report += `\n`;
  
  // Issues Summary
  if (analysisResults.importIssues.length > 0 || analysisResults.exportIssues.length > 0) {
    report += `## 🚨 Issues Identified\n\n`;
    
    [...analysisResults.importIssues, ...analysisResults.exportIssues].forEach(issue => {
      const severityIcon = issue.severity === 'CRITICAL' ? '🔴' : issue.severity === 'HIGH' ? '🟠' : '🟡';
      report += `### ${severityIcon} ${issue.severity}: ${issue.type}\n`;
      report += `**File**: \`${issue.file}\`\n`;
      report += `**Issue**: ${issue.issue}\n`;
      if (issue.resolvedPath) {
        report += `**Expected Path**: \`${issue.resolvedPath}\`\n`;
      }
      report += `\n`;
    });
  }
  
  // Recommendations
  if (analysisResults.recommendations.length > 0) {
    report += `## 💡 Recommendations\n\n`;
    
    analysisResults.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'CRITICAL' ? '🔴' : rec.priority === 'HIGH' ? '🟠' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      report += `### ${index + 1}. ${priorityIcon} ${rec.priority}: ${rec.category}\n`;
      report += `**Recommendation**: ${rec.recommendation}\n`;
      
      if (rec.files) {
        report += `**Affected Files**:\n`;
        rec.files.forEach(file => {
          report += `- \`${file}\`\n`;
        });
      }
      
      if (rec.details) {
        report += `**Details**:\n`;
        rec.details.forEach(detail => {
          report += `- ${detail}\n`;
        });
      }
      
      if (rec.dependencies) {
        report += `**Dependencies**:\n`;
        rec.dependencies.forEach(dep => {
          report += `- \`${dep}\`\n`;
        });
      }
      
      report += `\n`;
    });
  }
  
  // Service Details
  report += `## 📋 Detailed Service Analysis\n\n`;
  
  analysisResults.serviceFiles.forEach(service => {
    report += `### ${service.filename}\n`;
    report += `- **Class**: ${service.exportedClass || 'Not defined'}\n`;
    report += `- **Constructor**: ${service.hasConstructor ? 'Yes' : 'No'}\n`;
    report += `- **Module Exports**: ${service.hasModuleExports ? 'Yes' : 'No'}\n`;
    report += `- **Methods**: ${service.methods.length > 0 ? service.methods.join(', ') : 'None detected'}\n`;
    report += `- **Dependencies**: ${service.dependencies.length > 0 ? service.dependencies.join(', ') : 'None'}\n`;
    report += `\n`;
  });
  
  // Next Steps
  report += `## 🚀 Next Steps\n\n`;
  if (criticalIssues > 0) {
    report += `1. **URGENT**: Fix critical issues before starting server\n`;
  }
  if (highIssues > 0) {
    report += `2. **HIGH PRIORITY**: Address high-priority issues\n`;
  }
  report += `3. Test server startup after fixes\n`;
  report += `4. Run comprehensive functionality tests\n\n`;
  
  report += `---\n`;
  report += `*Generated by RiskTwin Service Structure Analyzer*\n`;
  
  // Save report
  try {
    const reportPath = 'docs/SERVICE_ANALYSIS_REPORT.md';
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 Service analysis report saved to: ${reportPath}`);
    
    // Save JSON data
    const dataPath = 'docs/service_analysis_data.json';
    fs.writeFileSync(dataPath, JSON.stringify(analysisResults, null, 2));
    console.log(`📄 Service analysis data saved to: ${dataPath}`);
    
  } catch (error) {
    console.log(`\n❌ Could not save report: ${error.message}`);
  }
  
  return analysisResults;
}

// Main analysis function
function runServiceAnalysis() {
  console.log('🔧 Starting RiskTwin Service Structure Analysis...\n');
  
  analyzeServiceFiles();
  analyzeServerImports();
  generateRecommendations();
  const results = generateReport();
  
  console.log('\n✅ Service structure analysis completed!');
  
  return results;
}

// Run if this is the main module
if (require.main === module) {
  runServiceAnalysis();
}

module.exports = { runServiceAnalysis, analysisResults }; 