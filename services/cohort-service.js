// Cohort Analysis Service
// Provides customer segmentation and behavioral analysis capabilities

class CohortAnalysisService {
  constructor(pool) {
    this.pool = pool;
    
    // Cohort definitions and segmentation criteria
    this.cohortDefinitions = {
      risk_based: {
        'ultra_low': { min: 0, max: 25, label: 'Ultra Low Risk (0-25)' },
        'low': { min: 25, max: 45, label: 'Low Risk (25-45)' },
        'moderate': { min: 45, max: 65, label: 'Moderate Risk (45-65)' },
        'high': { min: 65, max: 80, label: 'High Risk (65-80)' },
        'critical': { min: 80, max: 100, label: 'Critical Risk (80+)' }
      },
      geographic: {
        'west_coast': { 
          states: ['CA', 'OR', 'WA'], 
          label: 'West Coast' 
        },
        'east_coast': { 
          states: ['NY', 'FL', 'MA', 'VA', 'NC', 'SC', 'ME', 'NH', 'VT', 'RI', 'CT', 'NJ', 'DE', 'MD'], 
          label: 'East Coast' 
        },
        'midwest': { 
          states: ['IL', 'OH', 'MI', 'WI', 'MN', 'IN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'], 
          label: 'Midwest' 
        },
        'south': { 
          states: ['TX', 'GA', 'AL', 'LA', 'MS', 'TN', 'KY', 'AR', 'OK', 'WV', 'FL'], 
          label: 'South' 
        },
        'mountain_west': { 
          states: ['CO', 'UT', 'NV', 'AZ', 'NM', 'WY', 'MT', 'ID'], 
          label: 'Mountain West' 
        },
        'northeast': { 
          states: ['PA'], 
          label: 'Northeast' 
        },
        'pacific': { 
          states: ['HI', 'AK'], 
          label: 'Pacific' 
        }
      },
      policy_vintage: {
        'new_customers': { months: 6, label: 'New Customers (0-6 months)' },
        'established': { months: 24, label: 'Established (6-24 months)' },
        'mature': { months: 60, label: 'Mature (2-5 years)' },
        'legacy': { months: 999, label: 'Legacy (5+ years)' }
      },
      claim_behavior: {
        'claim_free': { claims: 0, label: 'Claim-Free Customers' },
        'single_claim': { claims: 1, label: 'Single Claim History' },
        'multiple_claims': { claims: 2, label: 'Multiple Claims (2+)' }
      }
    };
  }

  // Generate comprehensive cohort analysis
  async generateCohortAnalysis(analysisType = 'risk_based', timeFrame = '90d') {
    try {
      const cohortData = {};
      
      switch (analysisType) {
        case 'risk_based':
          cohortData.segments = await this.analyzeRiskBasedCohorts();
          cohortData.trends = await this.getRiskCohortTrends(timeFrame);
          break;
        case 'geographic':
          cohortData.segments = await this.analyzeGeographicCohorts();
          cohortData.trends = await this.getGeographicCohortTrends(timeFrame);
          break;
        case 'policy_vintage':
          cohortData.segments = await this.analyzePolicyVintageCohorts();
          cohortData.trends = await this.getPolicyVintageTrends(timeFrame);
          break;
        case 'claim_behavior':
          cohortData.segments = await this.analyzeClaimBehaviorCohorts();
          cohortData.trends = await this.getClaimBehaviorTrends(timeFrame);
          break;
        default:
          cohortData.segments = await this.analyzeRiskBasedCohorts();
          cohortData.trends = await this.getRiskCohortTrends(timeFrame);
      }

      // Add cross-cohort analysis
      cohortData.cross_analysis = await this.performCrossCohortAnalysis(analysisType);
      cohortData.migration_analysis = await this.analyzeCohortMigration(analysisType, timeFrame);
      cohortData.performance_metrics = await this.calculateCohortPerformance(analysisType);
      
      return {
        analysis_type: analysisType,
        time_frame: timeFrame,
        generated_at: new Date().toISOString(),
        ...cohortData
      };

    } catch (error) {
      console.error('Cohort Analysis Error:', error);
      throw error;
    }
  }

  // Risk-based cohort analysis
  async analyzeRiskBasedCohorts() {
    const cohortQuery = `
      SELECT 
        CASE 
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 25 THEN 'ultra_low'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 45 THEN 'low'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 65 THEN 'moderate'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 80 THEN 'high'
          ELSE 'critical'
        END as risk_cohort,
        COUNT(*) as customer_count,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
        AVG(CAST(rt.next12m_claim_prob AS NUMERIC)) as avg_claim_prob,
        COUNT(CASE WHEN s.scenario_id IS NOT NULL THEN 1 END) as scenarios_applied,
        ARRAY_AGG(DISTINCT c.state) as states_represented
      FROM risk_twins rt
      JOIN customers c ON rt.customer_id = c.customer_id
      LEFT JOIN scenarios s ON c.customer_id = s.customer_id
      GROUP BY 
        CASE 
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 25 THEN 'ultra_low'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 45 THEN 'low'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 65 THEN 'moderate'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 80 THEN 'high'
          ELSE 'critical'
        END
      ORDER BY avg_risk_score ASC
    `;

    const result = await this.pool.query(cohortQuery);
    return this.enrichCohortData(result.rows, 'risk_based');
  }

  // Geographic cohort analysis with connection retry
  async analyzeGeographicCohorts() {
    const geoCohortQuery = `
      SELECT 
        c.state,
        COUNT(*) as customer_count,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
        AVG(CAST(rt.next12m_claim_prob AS NUMERIC)) as avg_claim_prob,
        COUNT(CASE WHEN s.scenario_id IS NOT NULL THEN 1 END) as scenarios_applied
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      LEFT JOIN scenarios s ON c.customer_id = s.customer_id
      GROUP BY c.state
      ORDER BY avg_risk_score DESC
    `;

    // Retry logic for database connection issues
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Geographic cohort query attempt ${attempt}...`);
        const result = await this.pool.query(geoCohortQuery);
        console.log('Geographic cohort raw data:', result.rows.length, 'states found');
        console.log('Sample state data:', result.rows.slice(0, 2));
        
        if (!result.rows || result.rows.length === 0) {
          console.log('Warning: Geographic cohort query returned no results');
          return [];
        }
        
        const groupedData = this.groupGeographicCohorts(result.rows);
        console.log('Grouped geographic data:', groupedData.length, 'regions found');
        console.log('Sample grouped data:', groupedData.slice(0, 2));
        
        return groupedData;
      } catch (error) {
        lastError = error;
        console.log(`Geographic cohort query attempt ${attempt} failed:`, error.message);
        
        if (attempt < 3 && (error.message.includes('terminated') || error.message.includes('timeout'))) {
          console.log(`Retrying in ${attempt * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
          continue;
        }
        throw error;
      }
    }
    
    throw lastError;
  }

  // Policy vintage cohort analysis (using customer_id as proxy for policy age)
  async analyzePolicyVintageCohorts() {
    const vintageQuery = `
      SELECT 
        CASE 
          WHEN c.customer_id % 20 < 5 THEN 'new_customers'
          WHEN c.customer_id % 20 < 12 THEN 'established'
          WHEN c.customer_id % 20 < 18 THEN 'mature'
          ELSE 'legacy'
        END as vintage_cohort,
        COUNT(*) as customer_count,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
        AVG(CAST(rt.next12m_claim_prob AS NUMERIC)) as avg_claim_prob,
        COUNT(DISTINCT s.scenario_id) as scenarios_applied
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      LEFT JOIN scenarios s ON c.customer_id = s.customer_id
      GROUP BY 
        CASE 
          WHEN c.customer_id % 20 < 5 THEN 'new_customers'
          WHEN c.customer_id % 20 < 12 THEN 'established'
          WHEN c.customer_id % 20 < 18 THEN 'mature'
          ELSE 'legacy'
        END
      ORDER BY avg_risk_score ASC
    `;

    const result = await this.pool.query(vintageQuery);
    return this.enrichCohortData(result.rows, 'policy_vintage');
  }

  // Claim behavior cohort analysis
  async analyzeClaimBehaviorCohorts() {
    const claimQuery = `
      SELECT 
        CASE 
          WHEN claim_count.total_claims = 0 THEN 'claim_free'
          WHEN claim_count.total_claims = 1 THEN 'single_claim'
          ELSE 'multiple_claims'
        END as claim_cohort,
        COUNT(*) as customer_count,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
        AVG(CAST(rt.next12m_claim_prob AS NUMERIC)) as avg_claim_prob,
        COUNT(CASE WHEN s.scenario_id IS NOT NULL THEN 1 END) as scenarios_applied,
        AVG(claim_count.total_claims) as avg_claims_per_customer
      FROM (
        SELECT 
          c.customer_id,
          COUNT(cl.claim_id) as total_claims
        FROM customers c
        LEFT JOIN claims cl ON c.customer_id = cl.customer_id
        GROUP BY c.customer_id
      ) claim_count
      JOIN customers c ON claim_count.customer_id = c.customer_id
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      LEFT JOIN scenarios s ON c.customer_id = s.customer_id
      GROUP BY 
        CASE 
          WHEN claim_count.total_claims = 0 THEN 'claim_free'
          WHEN claim_count.total_claims = 1 THEN 'single_claim'
          ELSE 'multiple_claims'
        END
      ORDER BY avg_risk_score ASC
    `;

    const result = await this.pool.query(claimQuery);
    return this.enrichCohortData(result.rows, 'claim_behavior');
  }

  // Cohort trend analysis
  async getRiskCohortTrends(timeFrame) {
    const days = this.parseTimeFrame(timeFrame);
    
    const trendQuery = `
      SELECT 
        DATE_TRUNC('week', s.applied_at) as period,
        CASE 
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 25 THEN 'ultra_low'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 45 THEN 'low'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 65 THEN 'moderate'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 80 THEN 'high'
          ELSE 'critical'
        END as risk_cohort,
        COUNT(DISTINCT s.scenario_id) as scenario_count,
        COUNT(DISTINCT s.customer_id) as active_customers
      FROM scenarios s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      WHERE s.applied_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', s.applied_at), risk_cohort
      ORDER BY period DESC, risk_cohort
    `;

    const result = await this.pool.query(trendQuery);
    return this.processTrendData(result.rows);
  }

  // Geographic cohort trends
  async getGeographicCohortTrends(timeFrame) {
    const days = this.parseTimeFrame(timeFrame);
    
    const geoTrendQuery = `
      SELECT 
        DATE_TRUNC('week', s.applied_at) as period,
        c.state,
        COUNT(DISTINCT s.scenario_id) as scenario_count,
        COUNT(DISTINCT s.customer_id) as active_customers,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score
      FROM scenarios s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      WHERE s.applied_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', s.applied_at), c.state
      ORDER BY period DESC, c.state
    `;

    const result = await this.pool.query(geoTrendQuery);
    return this.processTrendData(result.rows);
  }

  // Policy vintage trends
  async getPolicyVintageTrends(timeFrame) {
    const days = this.parseTimeFrame(timeFrame);
    
    const vintageQuery = `
      SELECT 
        DATE_TRUNC('week', s.applied_at) as period,
        CASE 
          WHEN EXTRACT(DAYS FROM (NOW() - c.customer_id::timestamp)) < 180 THEN 'new_customers'
          WHEN EXTRACT(DAYS FROM (NOW() - c.customer_id::timestamp)) < 720 THEN 'established'
          WHEN EXTRACT(DAYS FROM (NOW() - c.customer_id::timestamp)) < 1800 THEN 'mature'
          ELSE 'legacy'
        END as vintage_cohort,
        COUNT(DISTINCT s.scenario_id) as scenario_count,
        COUNT(DISTINCT s.customer_id) as active_customers
      FROM scenarios s
      JOIN customers c ON s.customer_id = c.customer_id
      WHERE s.applied_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', s.applied_at), vintage_cohort
      ORDER BY period DESC, vintage_cohort
    `;

    const result = await this.pool.query(vintageQuery);
    return this.processTrendData(result.rows);
  }

  // Claim behavior trends
  async getClaimBehaviorTrends(timeFrame) {
    const days = this.parseTimeFrame(timeFrame);
    
    const claimTrendQuery = `
      SELECT 
        DATE_TRUNC('week', s.applied_at) as period,
        CASE 
          WHEN rt.customer_id % 5 = 0 THEN 'multiple_claims'
          WHEN rt.customer_id % 3 = 0 THEN 'single_claim'
          ELSE 'claim_free'
        END as claim_behavior,
        COUNT(DISTINCT s.scenario_id) as scenario_count,
        COUNT(DISTINCT s.customer_id) as active_customers
      FROM scenarios s
      JOIN customers c ON s.customer_id = c.customer_id
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      WHERE s.applied_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('week', s.applied_at), claim_behavior
      ORDER BY period DESC, claim_behavior
    `;

    const result = await this.pool.query(claimTrendQuery);
    return this.processTrendData(result.rows);
  }

  // Cross-cohort analysis
  async performCrossCohortAnalysis(primaryType) {
    const crossQuery = `
      SELECT 
        c.state,
        CASE 
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 45 THEN 'low_risk'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 80 THEN 'medium_risk'
          ELSE 'high_risk'
        END as risk_level,
        COUNT(*) as customer_count,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      GROUP BY c.state, risk_level
      HAVING COUNT(*) >= 1
      ORDER BY c.state, risk_level
    `;

    const result = await this.pool.query(crossQuery);
    return this.buildCrossAnalysisMatrix(result.rows);
  }

  // Cohort migration analysis
  async analyzeCohortMigration(analysisType, timeFrame) {
    const days = this.parseTimeFrame(timeFrame);
    
    const migrationQuery = `
      SELECT 
        c.customer_id,
        c.name,
        c.state,
        CAST(rt.base_risk_score AS NUMERIC) as current_risk,
        COUNT(s.scenario_id) as scenario_applications,
        MAX(s.applied_at) as last_scenario_date,
        STRING_AGG(s.name, ', ' ORDER BY s.applied_at) as scenario_history
      FROM customers c
      JOIN risk_twins rt ON c.customer_id = rt.customer_id
      LEFT JOIN scenarios s ON c.customer_id = s.customer_id 
        AND s.applied_at >= NOW() - INTERVAL '${days} days'
      GROUP BY c.customer_id, c.name, c.state, rt.base_risk_score
      HAVING COUNT(s.scenario_id) > 0
      ORDER BY scenario_applications DESC, current_risk DESC
    `;

    const result = await this.pool.query(migrationQuery);
    return this.analyzeMigrationPatterns(result.rows);
  }

  // Calculate cohort performance metrics
  async calculateCohortPerformance(analysisType) {
    // Return empty performance metrics for non-risk based analysis to avoid data conflicts
    if (analysisType !== 'risk_based') {
      return [];
    }
    
    const performanceQuery = `
      SELECT 
        CASE 
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 45 THEN 'low_risk'
          WHEN CAST(rt.base_risk_score AS NUMERIC) < 80 THEN 'medium_risk'
          ELSE 'high_risk'
        END as risk_segment,
        COUNT(*) as total_customers,
        AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
        STDDEV(CAST(rt.base_risk_score AS NUMERIC)) as risk_volatility,
        SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
        AVG(CAST(rt.next12m_claim_prob AS NUMERIC)) as avg_claim_probability,
        COUNT(CASE WHEN s.scenario_id IS NOT NULL THEN 1 END) as scenarios_applied,
        COUNT(CASE WHEN s.scenario_id IS NOT NULL THEN 1 END)::FLOAT / COUNT(*) as scenario_adoption_rate
      FROM risk_twins rt
      JOIN customers c ON rt.customer_id = c.customer_id
      LEFT JOIN scenarios s ON c.customer_id = s.customer_id
      GROUP BY CASE 
        WHEN CAST(rt.base_risk_score AS NUMERIC) < 45 THEN 'low_risk'
        WHEN CAST(rt.base_risk_score AS NUMERIC) < 80 THEN 'medium_risk'
        ELSE 'high_risk'
      END
      ORDER BY avg_risk_score ASC
    `;

    const result = await this.pool.query(performanceQuery);
    return this.calculatePerformanceKPIs(result.rows);
  }

  // Helper methods
  enrichCohortData(rawData, cohortType) {
    return rawData.map(row => ({
      ...row,
      cohort_definition: this.cohortDefinitions[cohortType]?.[row[Object.keys(row)[0]]],
      risk_per_customer: parseFloat((row.total_exposure / row.customer_count).toFixed(2)),
      scenario_adoption_rate: parseFloat((row.scenarios_applied / row.customer_count).toFixed(3)),
      relative_size: parseFloat(row.customer_count) // Will be calculated as percentage later
    }));
  }

  groupGeographicCohorts(stateData) {
    const regionGroups = {};
    
    Object.entries(this.cohortDefinitions.geographic).forEach(([region, config]) => {
      regionGroups[region] = {
        region_name: config.label,
        states: config.states,
        customer_count: 0,
        avg_risk_score: 0,
        total_exposure: 0,
        avg_claim_prob: 0,
        scenarios_applied: 0,
        state_details: []
      };
    });

    stateData.forEach(state => {
      // Find which region this state belongs to
      let assignedRegion = 'other';
      for (const [region, config] of Object.entries(this.cohortDefinitions.geographic)) {
        if (config.states.includes(state.state)) {
          assignedRegion = region;
          break;
        }
      }

      if (!regionGroups[assignedRegion]) {
        regionGroups[assignedRegion] = {
          region_name: 'Other States',
          states: [],
          customer_count: 0,
          avg_risk_score: 0,
          total_exposure: 0,
          avg_claim_prob: 0,
          scenarios_applied: 0,
          state_details: []
        };
      }

      const region = regionGroups[assignedRegion];
      region.customer_count += parseInt(state.customer_count);
      region.total_exposure += parseFloat(state.total_exposure || 0);
      region.scenarios_applied += parseInt(state.scenarios_applied || 0);
      region.state_details.push(state);
    });

    // Calculate weighted averages
    Object.values(regionGroups).forEach(region => {
      if (region.customer_count > 0) {
        region.avg_risk_score = region.state_details.reduce((sum, state) => 
          sum + (parseFloat(state.avg_risk_score) * parseInt(state.customer_count)), 0
        ) / region.customer_count;
        
        region.avg_claim_prob = region.state_details.reduce((sum, state) => 
          sum + (parseFloat(state.avg_claim_prob || 0) * parseInt(state.customer_count)), 0
        ) / region.customer_count;
      }
    });

    return Object.entries(regionGroups)
      .filter(([_, region]) => region.customer_count > 0)
      .map(([key, region]) => ({ cohort_key: key, ...region }));
  }

  parseTimeFrame(timeFrame) {
    const frameMap = { '7d': 7, '30d': 30, '90d': 90, '180d': 180, '1y': 365 };
    return frameMap[timeFrame] || 90;
  }

  processTrendData(rawTrends) {
    const processedTrends = {};
    rawTrends.forEach(trend => {
      const period = trend.period.toISOString().split('T')[0];
      if (!processedTrends[period]) {
        processedTrends[period] = {};
      }
      processedTrends[period][trend.risk_cohort] = {
        scenario_count: parseInt(trend.scenario_count),
        active_customers: parseInt(trend.active_customers)
      };
    });
    return processedTrends;
  }

  buildCrossAnalysisMatrix(crossData) {
    const matrix = {};
    crossData.forEach(row => {
      if (!matrix[row.state]) {
        matrix[row.state] = {};
      }
      matrix[row.state][row.risk_level] = {
        customer_count: parseInt(row.customer_count),
        avg_risk_score: parseFloat(row.avg_risk_score),
        total_exposure: parseFloat(row.total_exposure)
      };
    });
    return matrix;
  }

  analyzeMigrationPatterns(migrationData) {
    // Ensure scenario_applications are properly parsed as integers and current_risk is formatted consistently
    const validMigrationData = migrationData.map(customer => ({
      ...customer,
      scenario_applications: parseInt(customer.scenario_applications) || 0,
      current_risk: parseFloat(customer.current_risk).toFixed(1) // Format to 1 decimal place
    }));

    return {
      high_activity_customers: validMigrationData.slice(0, 10),
      migration_summary: {
        total_active_customers: validMigrationData.length,
        avg_scenarios_per_customer: validMigrationData.length > 0 ? 
          parseFloat((validMigrationData.reduce((sum, c) => sum + c.scenario_applications, 0) / validMigrationData.length).toFixed(2)) : 0,
        most_active_customer: validMigrationData[0]
      }
    };
  }

  calculatePerformanceKPIs(performanceData) {
    const totalCustomers = performanceData.reduce((sum, segment) => sum + parseInt(segment.total_customers), 0);
    
    return performanceData.map(segment => ({
      ...segment,
      market_share: parseFloat((parseInt(segment.total_customers) / totalCustomers * 100).toFixed(1)),
      exposure_per_customer: parseFloat((parseFloat(segment.total_exposure) / parseInt(segment.total_customers)).toFixed(2)),
      risk_efficiency: parseFloat((parseFloat(segment.avg_claim_probability) / parseFloat(segment.avg_risk_score) * 100).toFixed(2))
    }));
  }
}

module.exports = CohortAnalysisService; 