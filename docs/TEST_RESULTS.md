# 🧪 RiskTwin Platform - Test Results

**Generated**: 8/10/2025, 10:48:53 PM
**Test Environment**: http://localhost:3000

## 📊 Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ PASS | 8 | 72.7% |
| ❌ FAIL | 2 | 18.2% |
| ⚠️ WARN | 1 | 9.1% |
| **TOTAL** | **11** | **100%** |

## 🔍 Detailed Test Results

| Test Case | Endpoint | Status | Expected | Actual | Details |
|-----------|----------|--------|----------|--------|---------|
| Dashboard Loading | `/` | ✅ PASS | HTML page with Risk Twin title | Status: 200, Contains title: true |  |
| High-Risk Customer List | `/api/high-risk` | ✅ PASS | Array of customers with required fields | Found 10 customers, has required fields: 94.5 |  |
| Customer Twin Data Loading | `/api/twin/11` | ✅ PASS | Complete twin data with all required fields | Has all fields: true, Fields: customer_id, name, state, city, zip, base_risk_score, next12m_claim_prob, next12m_expected_loss, updated_at |  |
| Twin Data Type Validation | `/api/twin/11` | ✅ PASS | Numeric values for risk metrics | Risk Score: 94.5, Claim Prob: 0.285, Expected Loss: 10200 |  |
| Combined Customer Data | `/api/customer/11` | ✅ PASS | Customer object with id, twin, and timeline | Has ID: true, Has Twin: 11, Has Timeline: true |  |
| Timeline Data Loading | `/api/timeline/11` | ⚠️ WARN | Timeline events array | Empty timeline array | Timeline will be auto-populated on first UI load |
| Scenario Application | `/api/scenario` | ✅ PASS | Successful scenario application with ID | Success: 60, Response: {"success":true,"scenario_id":60,"message":"Scenario applied successfully","deductible_progression":{"before":1500,"change":500,"final":2000}} |  |
| ML Risk Recalculation | `/api/risk/recalculate` | ❌ FAIL | Status 200 with ML risk data | Status: 500, Error: None |  |
| Portfolio Summary | `/api/portfolio/summary` | ✅ PASS | Portfolio data with overview and risk tiers | Has overview: 35, Has risk tiers: true |  |
| Cohort Analysis | `/api/cohort/risk_based` | ✅ PASS | Cohort data with segments and performance metrics | Has segments: true, Has performance: [object Object],[object Object],[object Object] |  |
| Geographic Heat Map | `/api/heatmap/geographic` | ❌ FAIL | Heat map data with states and summary | Has states: false, Has metrics: undefined |  |
