// Alert & Notification System
// Provides real-time monitoring and alerting for risk management

class AlertNotificationService {
  constructor(pool) {
    this.pool = pool;
    
    // Alert configurations and thresholds
    this.alertTypes = {
      high_risk_customer: {
        threshold: 80,
        severity: 'high',
        description: 'Customer risk score exceeds critical threshold'
      },
      portfolio_concentration: {
        threshold: 0.3,
        severity: 'medium',
        description: 'Geographic risk concentration warning'
      },
      claim_probability_spike: {
        threshold: 0.7,
        severity: 'high',
        description: 'Claim probability significantly increased'
      },
      scenario_impact: {
        threshold: 15,
        severity: 'medium',
        description: 'Scenario application caused significant risk change'
      },
      market_volatility: {
        threshold: 0.2,
        severity: 'low',
        description: 'Market conditions showing increased volatility'
      }
    };

    // Notification channels
    this.channels = {
      dashboard: { enabled: true, realtime: true },
      email: { enabled: false, batch: true },
      sms: { enabled: false, urgent_only: true },
      webhook: { enabled: false, api_integration: true }
    };
  }

  // Generate comprehensive alert analysis
  async generateAlertAnalysis() {
    try {
      const alerts = [];
      
      // Check high-risk customers
      const highRiskAlerts = await this.checkHighRiskCustomers();
      alerts.push(...highRiskAlerts);
      
      // Check portfolio concentration
      const concentrationAlerts = await this.checkPortfolioConcentration();
      alerts.push(...concentrationAlerts);
      
      // Check recent scenario impacts
      const scenarioAlerts = await this.checkScenarioImpacts();
      alerts.push(...scenarioAlerts);
      
      // Check claim probability spikes
      const claimAlerts = await this.checkClaimProbabilitySpikes();
      alerts.push(...claimAlerts);
      
      // Check market conditions
      const marketAlerts = await this.checkMarketConditions();
      alerts.push(...marketAlerts);

      // Prioritize and categorize alerts
      const categorizedAlerts = this.categorizeAlerts(alerts);
      
      // Generate summary statistics
      const alertSummary = this.generateAlertSummary(alerts);

      return {
        alert_summary: alertSummary,
        alerts_by_severity: categorizedAlerts,
        all_alerts: alerts.sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at)),
        generated_at: new Date().toISOString(),
        next_check_time: this.calculateNextCheckTime()
      };

    } catch (error) {
      console.error('Alert Analysis Error:', error);
      throw error;
    }
  }

  // Check for high-risk customers
  async checkHighRiskCustomers() {
    const threshold = this.alertTypes.high_risk_customer.threshold;
    
    const query = `
      SELECT 
        c.customer_id,
        c.name,
        c.state,
        CAST(rt.base_risk_score AS NUMERIC) as risk_score,
        CAST(rt.next12m_claim_prob AS NUMERIC) as claim_prob,
        CAST(rt.next12m_expected_loss AS NUMERIC) as expected_loss
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      WHERE CAST(rt.base_risk_score AS NUMERIC) >= $1
      ORDER BY rt.base_risk_score DESC
    `;

    const result = await this.pool.query(query, [threshold]);
    
    return result.rows.map(customer => ({
      alert_id: `high_risk_${customer.customer_id}_${Date.now()}`,
      alert_type: 'high_risk_customer',
      severity: 'high',
      title: `High Risk Customer Alert: ${customer.name}`,
      description: `Customer ${customer.name} has a risk score of ${customer.risk_score}, exceeding the critical threshold of ${threshold}`,
      customer_id: customer.customer_id,
      customer_name: customer.name,
      current_risk_score: parseFloat(customer.risk_score),
      claim_probability: parseFloat(customer.claim_prob),
      expected_loss: parseFloat(customer.expected_loss),
      geographic_location: customer.state,
      triggered_at: new Date().toISOString(),
      recommended_actions: [
        'Review customer profile immediately',
        'Consider risk mitigation strategies',
        'Evaluate policy terms and conditions',
        'Schedule customer consultation'
      ],
      urgency_level: customer.risk_score >= 90 ? 'critical' : 'high'
    }));
  }

  // Check portfolio concentration risks
  async checkPortfolioConcentration() {
    const concentrationQuery = `
      SELECT 
        c.state,
        COUNT(*) as customer_count,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
        (COUNT(*)::FLOAT / (SELECT COUNT(*) FROM customers)) as concentration_ratio
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      GROUP BY c.state
      HAVING (COUNT(*)::FLOAT / (SELECT COUNT(*) FROM customers)) >= $1
      ORDER BY concentration_ratio DESC
    `;

    const threshold = this.alertTypes.portfolio_concentration.threshold;
    const result = await this.pool.query(concentrationQuery, [threshold]);
    
    return result.rows.map(concentration => ({
      alert_id: `concentration_${concentration.state}_${Date.now()}`,
      alert_type: 'portfolio_concentration',
      severity: 'medium',
      title: `Geographic Concentration Alert: ${concentration.state}`,
      description: `${(concentration.concentration_ratio * 100).toFixed(1)}% of portfolio concentrated in ${concentration.state}`,
      geographic_location: concentration.state,
      customer_count: parseInt(concentration.customer_count),
      avg_risk_score: parseFloat(concentration.avg_risk_score),
      total_exposure: parseFloat(concentration.total_exposure),
      concentration_ratio: parseFloat(concentration.concentration_ratio),
      triggered_at: new Date().toISOString(),
      recommended_actions: [
        'Review geographic diversification strategy',
        'Consider risk transfer options',
        'Evaluate state-specific risk factors',
        'Monitor market conditions in region'
      ],
      urgency_level: concentration.concentration_ratio >= 0.5 ? 'high' : 'medium'
    }));
  }

  // Check recent scenario impacts
  async checkScenarioImpacts() {
    const impactQuery = `
      SELECT 
        s.scenario_id,
        s.customer_id,
        c.name as customer_name,
        s.name as scenario_name,
        s.change_json,
        s.applied_at,
        CAST(rt.base_risk_score AS NUMERIC) as current_risk_score
      FROM scenarios s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      WHERE s.applied_at >= NOW() - INTERVAL '7 days'
      ORDER BY s.applied_at DESC
    `;

    const result = await this.pool.query(impactQuery);
    const threshold = this.alertTypes.scenario_impact.threshold;
    
    return result.rows
      .map(scenario => {
        const riskChange = this.extractRiskChange(scenario.change_json);
        const absRiskChange = Math.abs(riskChange);
        
        if (absRiskChange >= threshold) {
          return {
            alert_id: `scenario_impact_${scenario.scenario_id}_${Date.now()}`,
            alert_type: 'scenario_impact',
            severity: absRiskChange >= 25 ? 'high' : 'medium',
            title: `Significant Scenario Impact: ${scenario.customer_name}`,
            description: `Scenario "${scenario.scenario_name}" caused a ${riskChange > 0 ? 'increase' : 'decrease'} of ${absRiskChange.toFixed(1)} points in risk score`,
            customer_id: scenario.customer_id,
            customer_name: scenario.customer_name,
            scenario_name: scenario.scenario_name,
            risk_change: riskChange,
            current_risk_score: parseFloat(scenario.current_risk_score),
            applied_at: scenario.applied_at,
            triggered_at: new Date().toISOString(),
            recommended_actions: riskChange > 0 ? [
              'Review scenario justification',
              'Consider additional risk mitigation',
              'Monitor customer closely',
              'Evaluate policy adjustments'
            ] : [
              'Document successful risk reduction',
              'Consider applying similar scenarios to other customers',
              'Update risk management strategies'
            ],
            urgency_level: absRiskChange >= 25 ? 'high' : 'medium'
          };
        }
        return null;
      })
      .filter(alert => alert !== null);
  }

  // Check claim probability spikes
  async checkClaimProbabilitySpikes() {
    const claimQuery = `
      SELECT 
        c.customer_id,
        c.name,
        c.state,
        CAST(rt.base_risk_score AS NUMERIC) as risk_score,
        CAST(rt.next12m_claim_prob AS NUMERIC) as claim_prob
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      WHERE CAST(rt.next12m_claim_prob AS NUMERIC) >= $1
      ORDER BY rt.next12m_claim_prob DESC
    `;

    const threshold = this.alertTypes.claim_probability_spike.threshold;
    const result = await this.pool.query(claimQuery, [threshold]);
    
    return result.rows.map(customer => ({
      alert_id: `claim_spike_${customer.customer_id}_${Date.now()}`,
      alert_type: 'claim_probability_spike',
      severity: 'high',
      title: `High Claim Probability: ${customer.name}`,
      description: `Customer ${customer.name} has a claim probability of ${(customer.claim_prob * 100).toFixed(1)}%, indicating high likelihood of claim`,
      customer_id: customer.customer_id,
      customer_name: customer.name,
      risk_score: parseFloat(customer.risk_score),
      claim_probability: parseFloat(customer.claim_prob),
      geographic_location: customer.state,
      triggered_at: new Date().toISOString(),
      recommended_actions: [
        'Proactive customer outreach',
        'Review prevention strategies',
        'Consider claim reserve adjustments',
        'Evaluate policy terms'
      ],
      urgency_level: customer.claim_prob >= 0.8 ? 'critical' : 'high'
    }));
  }

  // Check market conditions
  async checkMarketConditions() {
    // Mock market condition alerts
    const marketAlerts = [];
    
    // Simulate market volatility detection
    const volatilityLevel = Math.random() * 0.3; // Random volatility for demo
    const threshold = this.alertTypes.market_volatility.threshold;
    
    if (volatilityLevel >= threshold) {
      marketAlerts.push({
        alert_id: `market_volatility_${Date.now()}`,
        alert_type: 'market_volatility',
        severity: 'low',
        title: 'Market Volatility Warning',
        description: `Current market volatility index at ${(volatilityLevel * 100).toFixed(1)}%, above normal threshold`,
        volatility_index: volatilityLevel,
        market_factors: ['Economic uncertainty', 'Regulatory changes', 'External events'],
        triggered_at: new Date().toISOString(),
        recommended_actions: [
          'Monitor portfolio exposure',
          'Review risk management strategies',
          'Consider hedging options',
          'Increase monitoring frequency'
        ],
        urgency_level: volatilityLevel >= 0.25 ? 'medium' : 'low'
      });
    }

    return marketAlerts;
  }

  // Categorize alerts by severity
  categorizeAlerts(alerts) {
    const categorized = {
      critical: alerts.filter(alert => alert.urgency_level === 'critical'),
      high: alerts.filter(alert => alert.severity === 'high' && alert.urgency_level !== 'critical'),
      medium: alerts.filter(alert => alert.severity === 'medium'),
      low: alerts.filter(alert => alert.severity === 'low')
    };

    return categorized;
  }

  // Generate alert summary
  generateAlertSummary(alerts) {
    const summary = {
      total_alerts: alerts.length,
      critical_alerts: alerts.filter(a => a.urgency_level === 'critical').length,
      high_severity: alerts.filter(a => a.severity === 'high').length,
      medium_severity: alerts.filter(a => a.severity === 'medium').length,
      low_severity: alerts.filter(a => a.severity === 'low').length,
      by_type: {}
    };

    // Count by alert type
    Object.keys(this.alertTypes).forEach(type => {
      summary.by_type[type] = alerts.filter(a => a.alert_type === type).length;
    });

    // Calculate priority score
    summary.priority_score = (
      summary.critical_alerts * 4 +
      summary.high_severity * 3 +
      summary.medium_severity * 2 +
      summary.low_severity * 1
    );

    return summary;
  }

  // Get real-time dashboard alerts
  async getDashboardAlerts(limit = 10) {
    const alerts = await this.generateAlertAnalysis();
    
    // Return the most recent and high-priority alerts for dashboard
    return {
      recent_alerts: alerts.all_alerts.slice(0, limit),
      alert_counts: alerts.alert_summary,
      priority_alerts: [
        ...alerts.alerts_by_severity.critical,
        ...alerts.alerts_by_severity.high.slice(0, 5)
      ],
      system_status: this.calculateSystemStatus(alerts.alert_summary)
    };
  }

  // Calculate overall system status
  calculateSystemStatus(summary) {
    if (summary.critical_alerts > 0) return 'critical';
    if (summary.high_severity > 3) return 'warning';
    if (summary.medium_severity > 5) return 'attention';
    return 'normal';
  }

  // Utility methods
  extractRiskChange(changeJson) {
    try {
      const changes = typeof changeJson === 'string' ? JSON.parse(changeJson) : changeJson;
      return changes.risk_adjustment || 0;
    } catch {
      return 0;
    }
  }

  calculateNextCheckTime() {
    const nextCheck = new Date();
    nextCheck.setMinutes(nextCheck.getMinutes() + 15); // Check every 15 minutes
    return nextCheck.toISOString();
  }
}

module.exports = AlertNotificationService; 