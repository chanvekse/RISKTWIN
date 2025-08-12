// Portfolio Risk Analytics Service
// Provides aggregate insights across the entire customer portfolio

class PortfolioAnalyticsService {
  constructor(pool) {
    this.pool = pool;
    this.riskTiers = {
      'LOW': { min: 0, max: 40, color: '#4CAF50', label: 'Low Risk' },
      'MEDIUM': { min: 40, max: 70, color: '#FF9800', label: 'Medium Risk' },
      'HIGH': { min: 70, max: 85, color: '#F44336', label: 'High Risk' },
      'CRITICAL': { min: 85, max: 100, color: '#8B0000', label: 'Critical Risk' }
    };
  }

  // Get overall portfolio summary
  async getPortfolioSummary() {
    try {
      // Portfolio overview metrics
      const overviewQuery = `
        SELECT 
          COUNT(*) as total_customers,
          ROUND(AVG(rt.base_risk_score), 1) as avg_risk_score,
          ROUND(SUM(rt.next12m_expected_loss), 2) as total_expected_loss,
          ROUND(AVG(rt.next12m_claim_prob), 4) as avg_claim_probability,
          ROUND(MAX(rt.base_risk_score), 1) as max_risk_score,
          ROUND(MIN(rt.base_risk_score), 1) as min_risk_score
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
      `;
      
      const overviewResult = await this.pool.query(overviewQuery);
      const overview = overviewResult.rows[0];

      // Risk tier distribution
      const tierQuery = `
        SELECT 
          CASE 
            WHEN rt.base_risk_score < 40 THEN 'LOW'
            WHEN rt.base_risk_score < 70 THEN 'MEDIUM'
            WHEN rt.base_risk_score < 85 THEN 'HIGH'
            ELSE 'CRITICAL'
          END as risk_tier,
          COUNT(*) as customer_count,
          ROUND(AVG(rt.base_risk_score), 1) as avg_score,
          ROUND(SUM(rt.next12m_expected_loss), 2) as total_exposure
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        GROUP BY 
          CASE 
            WHEN rt.base_risk_score < 40 THEN 'LOW'
            WHEN rt.base_risk_score < 70 THEN 'MEDIUM'
            WHEN rt.base_risk_score < 85 THEN 'HIGH'
            ELSE 'CRITICAL'
          END
        ORDER BY 
          CASE 
            WHEN CASE 
              WHEN rt.base_risk_score < 40 THEN 'LOW'
              WHEN rt.base_risk_score < 70 THEN 'MEDIUM'
              WHEN rt.base_risk_score < 85 THEN 'HIGH'
              ELSE 'CRITICAL'
            END = 'LOW' THEN 1
            WHEN CASE 
              WHEN rt.base_risk_score < 40 THEN 'LOW'
              WHEN rt.base_risk_score < 70 THEN 'MEDIUM'
              WHEN rt.base_risk_score < 85 THEN 'HIGH'
              ELSE 'CRITICAL'
            END = 'MEDIUM' THEN 2
            WHEN CASE 
              WHEN rt.base_risk_score < 40 THEN 'LOW'
              WHEN rt.base_risk_score < 70 THEN 'MEDIUM'
              WHEN rt.base_risk_score < 85 THEN 'HIGH'
              ELSE 'CRITICAL'
            END = 'HIGH' THEN 3
            ELSE 4
          END
      `;
      
      const tierResult = await this.pool.query(tierQuery);

      // State distribution
      const stateQuery = `
        SELECT 
          c.state,
          COUNT(*) as customer_count,
          ROUND(AVG(rt.base_risk_score), 1) as avg_risk_score,
          ROUND(SUM(rt.next12m_expected_loss), 2) as total_exposure
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        GROUP BY c.state
        ORDER BY avg_risk_score DESC
      `;
      
      const stateResult = await this.pool.query(stateQuery);

      // Recent scenario activity
      const activityQuery = `
        SELECT 
          COUNT(*) as total_scenarios,
          COUNT(DISTINCT customer_id) as active_customers,
          DATE_TRUNC('day', applied_at) as scenario_date,
          COUNT(*) as daily_scenarios
        FROM scenarios
        WHERE applied_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', applied_at)
        ORDER BY scenario_date DESC
        LIMIT 7
      `;
      
      const activityResult = await this.pool.query(activityQuery);

      return {
        overview: {
          total_customers: parseInt(overview.total_customers),
          avg_risk_score: overview.avg_risk_score,
          total_expected_loss: overview.total_expected_loss,
          avg_claim_probability: overview.avg_claim_probability,
          max_risk_score: overview.max_risk_score,
          min_risk_score: overview.min_risk_score,
          risk_spread: overview.max_risk_score - overview.min_risk_score
        },
        risk_tiers: (() => {
          const totalCustomers = parseInt(overview.total_customers);
          return tierResult.rows.map(tier => ({
            tier: tier.risk_tier,
            label: this.riskTiers[tier.risk_tier].label,
            color: this.riskTiers[tier.risk_tier].color,
            customer_count: parseInt(tier.customer_count),
            avg_score: tier.avg_score,
            total_exposure: tier.total_exposure,
            percentage: totalCustomers > 0 ? parseFloat((parseInt(tier.customer_count) / totalCustomers * 100).toFixed(1)) : 0
          }));
        })(),
        geographic_distribution: stateResult.rows.map(state => ({
          state: state.state,
          customer_count: parseInt(state.customer_count),
          avg_risk_score: state.avg_risk_score,
          total_exposure: state.total_exposure,
          risk_level: this.getRiskLevel(parseFloat(state.avg_risk_score || 0))
        })),
        activity_summary: {
          recent_scenarios: activityResult.rows.map(activity => ({
            date: activity.scenario_date,
            daily_scenarios: parseInt(activity.daily_scenarios)
          }))
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Portfolio Summary Error:', error);
      throw error;
    }
  }

  // Get portfolio risk trends over time
  async getPortfolioTrends(days = 30) {
    try {
      // Simulate portfolio risk trends (in production, you'd have historical data)
      const trendData = [];
      const baseDate = new Date();
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() - i);
        
        // Simulate portfolio metrics with some realistic variation
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const seasonalFactor = Math.sin(dayOfYear * 2 * Math.PI / 365) * 2; // Seasonal variation
        const randomFactor = (Math.random() - 0.5) * 3; // Random daily variation
        
        const basePortfolioRisk = 67.5; // Base portfolio average
        const portfolioRisk = Math.max(50, Math.min(85, basePortfolioRisk + seasonalFactor + randomFactor));
        
        trendData.push({
          date: date.toISOString().split('T')[0],
          avg_portfolio_risk: parseFloat(portfolioRisk.toFixed(1)),
          high_risk_count: Math.floor(15 + Math.random() * 8), // 15-23 high risk customers
          scenario_count: Math.floor(Math.random() * 12), // 0-12 scenarios per day
          total_exposure: parseFloat((850000 + Math.random() * 200000).toFixed(0)) // $850k-$1M exposure
        });
      }
      
      return {
        period: `${days} days`,
        data_points: trendData,
        trend_analysis: {
          risk_direction: trendData[trendData.length - 1].avg_portfolio_risk > trendData[0].avg_portfolio_risk ? 'increasing' : 'decreasing',
          max_risk: Math.max(...trendData.map(d => d.avg_portfolio_risk)),
          min_risk: Math.min(...trendData.map(d => d.avg_portfolio_risk)),
          avg_scenarios_per_day: (trendData.reduce((sum, d) => sum + d.scenario_count, 0) / trendData.length).toFixed(1)
        }
      };
    } catch (error) {
      console.error('Portfolio Trends Error:', error);
      throw error;
    }
  }

  // Get top risk concentrations
  async getRiskConcentrations() {
    try {
      // Geographic risk concentration
      const geoConcentrationQuery = `
        SELECT 
          c.state,
          COUNT(*) as customer_count,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk,
          SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
          COUNT(CASE WHEN CAST(rt.base_risk_score AS NUMERIC) >= 80 THEN 1 END) as critical_count
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        GROUP BY c.state
        HAVING COUNT(*) >= 2
        ORDER BY avg_risk DESC
      `;
      
      const geoResult = await this.pool.query(geoConcentrationQuery);

      // Risk score clustering
      const clusteringQuery = `
        SELECT 
          FLOOR(CAST(rt.base_risk_score AS NUMERIC) / 10) * 10 as risk_bucket,
          COUNT(*) as customer_count,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_score,
          SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as bucket_exposure
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        GROUP BY FLOOR(CAST(rt.base_risk_score AS NUMERIC) / 10)
        ORDER BY risk_bucket DESC
      `;
      
      const clusterResult = await this.pool.query(clusteringQuery);

      // Top individual risks
      const topRisksQuery = `
        SELECT 
          rt.customer_id,
          c.name,
          c.state,
          CAST(rt.base_risk_score AS NUMERIC) as risk_score,
          CAST(rt.next12m_expected_loss AS NUMERIC) as expected_loss,
          CAST(rt.next12m_claim_prob AS NUMERIC) as claim_prob
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        ORDER BY CAST(rt.base_risk_score AS NUMERIC) DESC
        LIMIT 10
      `;
      
      const topRisksResult = await this.pool.query(topRisksQuery);

      return {
        geographic_concentrations: geoResult.rows.map(geo => ({
          state: geo.state,
          customer_count: parseInt(geo.customer_count),
          avg_risk: parseFloat(geo.avg_risk).toFixed(1),
          total_exposure: parseFloat(geo.total_exposure),
          critical_count: parseInt(geo.critical_count),
          risk_density: (parseFloat(geo.avg_risk) * parseInt(geo.customer_count) / 100).toFixed(1)
        })),
        risk_clustering: clusterResult.rows.map(cluster => ({
          risk_bucket: `${cluster.risk_bucket}-${parseInt(cluster.risk_bucket) + 9}`,
          customer_count: parseInt(cluster.customer_count),
          avg_score: parseFloat(cluster.avg_score).toFixed(1),
          bucket_exposure: parseFloat(cluster.bucket_exposure),
          percentage: 0 // Will calculate after we have total
        })),
        top_individual_risks: topRisksResult.rows.map(risk => ({
          customer_id: risk.customer_id,
          name: risk.name,
          state: risk.state,
          risk_score: parseFloat(risk.risk_score).toFixed(1),
          expected_loss: parseFloat(risk.expected_loss),
          claim_prob: parseFloat(risk.claim_prob).toFixed(3),
          risk_tier: this.getRiskTier(parseFloat(risk.risk_score))
        })),
        analysis_timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Risk Concentrations Error:', error);
      throw error;
    }
  }

  // Get portfolio alerts and recommendations
  async getPortfolioAlerts() {
    try {
      const alerts = [];
      
      // Check for high-risk concentrations
      const concentrationQuery = `
        SELECT 
          c.state,
          COUNT(*) as customer_count,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        GROUP BY c.state
        HAVING COUNT(*) >= 3 AND AVG(CAST(rt.base_risk_score AS NUMERIC)) > 75
      `;
      
      const concentrationResult = await this.pool.query(concentrationQuery);
      
      concentrationResult.rows.forEach(conc => {
        alerts.push({
          type: 'HIGH_CONCENTRATION',
          severity: 'HIGH',
          title: `High Risk Concentration in ${conc.state}`,
          description: `${conc.customer_count} customers with ${parseFloat(conc.avg_risk).toFixed(1)} average risk score`,
          recommendation: `Consider portfolio rebalancing or enhanced monitoring in ${conc.state}`,
          created_at: new Date().toISOString()
        });
      });

      // Check for critical individual risks
      const criticalQuery = `
        SELECT c.name, c.state, CAST(rt.base_risk_score AS NUMERIC) as risk_score
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        WHERE CAST(rt.base_risk_score AS NUMERIC) >= 90
      `;
      
      const criticalResult = await this.pool.query(criticalQuery);
      
      criticalResult.rows.forEach(crit => {
        alerts.push({
          type: 'CRITICAL_RISK',
          severity: 'CRITICAL',
          title: `Critical Risk: ${crit.name}`,
          description: `Risk score of ${parseFloat(crit.risk_score).toFixed(1)} requires immediate attention`,
          recommendation: `Schedule immediate risk assessment and intervention for ${crit.name}`,
          created_at: new Date().toISOString()
        });
      });

      // Check portfolio health
      const healthQuery = `
        SELECT AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
      `;
      
      const healthResult = await this.pool.query(healthQuery);
      const avgRisk = parseFloat(healthResult.rows[0].avg_risk);
      
      if (avgRisk > 70) {
        alerts.push({
          type: 'PORTFOLIO_HEALTH',
          severity: 'MEDIUM',
          title: 'Portfolio Risk Above Threshold',
          description: `Average portfolio risk of ${avgRisk.toFixed(1)} exceeds recommended 70.0 threshold`,
          recommendation: 'Consider portfolio-wide risk reduction strategies',
          created_at: new Date().toISOString()
        });
      }

      return {
        total_alerts: alerts.length,
        alerts: alerts.sort((a, b) => {
          const severityOrder = { 'CRITICAL': 3, 'HIGH': 2, 'MEDIUM': 1, 'LOW': 0 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        }),
        summary: {
          critical: alerts.filter(a => a.severity === 'CRITICAL').length,
          high: alerts.filter(a => a.severity === 'HIGH').length,
          medium: alerts.filter(a => a.severity === 'MEDIUM').length,
          low: alerts.filter(a => a.severity === 'LOW').length
        }
      };
    } catch (error) {
      console.error('Portfolio Alerts Error:', error);
      throw error;
    }
  }

  // Helper methods
  getRiskLevel(score) {
    if (score >= 85) return 'CRITICAL';
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  getRiskTier(score) {
    return this.getRiskLevel(score);
  }

  // Calculate risk-adjusted metrics
      async getPortfolioMetrics() {
    try {
      const metricsQuery = `
        SELECT 
          COUNT(*) as total_customers,
          SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk,
          STDDEV(CAST(rt.base_risk_score AS NUMERIC)) as risk_volatility,
          SUM(CAST(rt.next12m_expected_loss AS NUMERIC) * CAST(rt.base_risk_score AS NUMERIC) / 100) as risk_weighted_exposure
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
      `;
      
      const result = await this.pool.query(metricsQuery);
      const metrics = result.rows[0];

      return {
        portfolio_size: parseInt(metrics.total_customers),
        total_exposure: parseFloat(metrics.total_exposure || 0),
        average_risk: parseFloat(metrics.avg_risk || 0).toFixed(1),
        risk_volatility: parseFloat(metrics.risk_volatility || 0).toFixed(2),
        risk_weighted_exposure: parseFloat(metrics.risk_weighted_exposure || 0),
        diversification_ratio: (parseFloat(metrics.risk_volatility || 0) / parseFloat(metrics.avg_risk || 1)).toFixed(3),
        calculated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Portfolio Metrics Error:', error);
      throw error;
    }
  }
}

module.exports = PortfolioAnalyticsService; 