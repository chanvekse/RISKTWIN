// Interactive Risk Heat Map Service
// Provides geographic risk visualization data with state-level granularity

class HeatMapService {
  constructor(pool) {
    this.pool = pool;
    
    // US State coordinates for heat map positioning
    this.stateCoordinates = {
      'AL': { lat: 32.806671, lng: -86.791130, name: 'Alabama' },
      'AK': { lat: 61.370716, lng: -152.404419, name: 'Alaska' },
      'AZ': { lat: 33.729759, lng: -111.431221, name: 'Arizona' },
      'AR': { lat: 34.969704, lng: -92.373123, name: 'Arkansas' },
      'CA': { lat: 36.116203, lng: -119.681564, name: 'California' },
      'CO': { lat: 39.059811, lng: -105.311104, name: 'Colorado' },
      'CT': { lat: 41.597782, lng: -72.755371, name: 'Connecticut' },
      'DE': { lat: 39.318523, lng: -75.507141, name: 'Delaware' },
      'FL': { lat: 27.766279, lng: -82.640243, name: 'Florida' },
      'GA': { lat: 33.040619, lng: -83.643074, name: 'Georgia' },
      'HI': { lat: 21.094318, lng: -157.498337, name: 'Hawaii' },
      'ID': { lat: 44.240459, lng: -114.478828, name: 'Idaho' },
      'IL': { lat: 40.349457, lng: -88.986137, name: 'Illinois' },
      'IN': { lat: 39.849426, lng: -86.258278, name: 'Indiana' },
      'IA': { lat: 42.011539, lng: -93.210526, name: 'Iowa' },
      'KS': { lat: 38.526600, lng: -96.726486, name: 'Kansas' },
      'KY': { lat: 37.668140, lng: -84.670067, name: 'Kentucky' },
      'LA': { lat: 31.169546, lng: -91.867805, name: 'Louisiana' },
      'ME': { lat: 44.693947, lng: -69.381927, name: 'Maine' },
      'MD': { lat: 39.063946, lng: -76.802101, name: 'Maryland' },
      'MA': { lat: 42.230171, lng: -71.530106, name: 'Massachusetts' },
      'MI': { lat: 43.326618, lng: -84.536095, name: 'Michigan' },
      'MN': { lat: 45.694454, lng: -93.900192, name: 'Minnesota' },
      'MS': { lat: 32.741646, lng: -89.678696, name: 'Mississippi' },
      'MO': { lat: 38.572954, lng: -92.189283, name: 'Missouri' },
      'MT': { lat: 47.052952, lng: -109.633040, name: 'Montana' },
      'NE': { lat: 41.125370, lng: -98.268082, name: 'Nebraska' },
      'NV': { lat: 38.313515, lng: -117.055374, name: 'Nevada' },
      'NH': { lat: 43.452492, lng: -71.563896, name: 'New Hampshire' },
      'NJ': { lat: 40.298904, lng: -74.521011, name: 'New Jersey' },
      'NM': { lat: 34.840515, lng: -106.248482, name: 'New Mexico' },
      'NY': { lat: 42.165726, lng: -74.948051, name: 'New York' },
      'NC': { lat: 35.630066, lng: -79.806419, name: 'North Carolina' },
      'ND': { lat: 47.528912, lng: -99.784012, name: 'North Dakota' },
      'OH': { lat: 40.388783, lng: -82.764915, name: 'Ohio' },
      'OK': { lat: 35.565342, lng: -96.928917, name: 'Oklahoma' },
      'OR': { lat: 44.931109, lng: -120.767178, name: 'Oregon' },
      'PA': { lat: 40.590752, lng: -77.209755, name: 'Pennsylvania' },
      'RI': { lat: 41.680893, lng: -71.511780, name: 'Rhode Island' },
      'SC': { lat: 33.856892, lng: -80.945007, name: 'South Carolina' },
      'SD': { lat: 44.299782, lng: -99.438828, name: 'South Dakota' },
      'TN': { lat: 35.747845, lng: -86.692345, name: 'Tennessee' },
      'TX': { lat: 31.054487, lng: -97.563461, name: 'Texas' },
      'UT': { lat: 40.150032, lng: -111.862434, name: 'Utah' },
      'VT': { lat: 44.045876, lng: -72.710686, name: 'Vermont' },
      'VA': { lat: 37.769337, lng: -78.169968, name: 'Virginia' },
      'WA': { lat: 47.400902, lng: -121.490494, name: 'Washington' },
      'WV': { lat: 38.491226, lng: -80.954570, name: 'West Virginia' },
      'WI': { lat: 44.268543, lng: -89.616508, name: 'Wisconsin' },
      'WY': { lat: 42.755966, lng: -107.302490, name: 'Wyoming' }
    };

    // Risk intensity color mapping
    this.riskColors = {
      'VERY_LOW': { color: '#4CAF50', intensity: 0.2, label: 'Very Low (0-40)' },
      'LOW': { color: '#8BC34A', intensity: 0.4, label: 'Low (40-55)' },
      'MEDIUM': { color: '#FFC107', intensity: 0.6, label: 'Medium (55-70)' },
      'HIGH': { color: '#FF9800', intensity: 0.8, label: 'High (70-85)' },
      'CRITICAL': { color: '#F44336', intensity: 1.0, label: 'Critical (85+)' }
    };
  }

  // Generate comprehensive heat map data
  async generateHeatMapData(filters = {}) {
    try {
      const {
        minRiskScore = 0,
        maxRiskScore = 100,
        minCustomers = 1,
        includeStatesWithoutData = true
      } = filters;

      // Get state-level risk data
      const stateDataQuery = `
        SELECT 
          c.state,
          COUNT(*) as customer_count,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
          MIN(CAST(rt.base_risk_score AS NUMERIC)) as min_risk_score,
          MAX(CAST(rt.base_risk_score AS NUMERIC)) as max_risk_score,
          SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
          COUNT(CASE WHEN CAST(rt.base_risk_score AS NUMERIC) >= 80 THEN 1 END) as high_risk_count,
          COUNT(CASE WHEN CAST(rt.base_risk_score AS NUMERIC) >= 90 THEN 1 END) as critical_count
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        GROUP BY c.state
        HAVING 
          AVG(CAST(rt.base_risk_score AS NUMERIC)) BETWEEN $1 AND $2
          AND COUNT(*) >= $3
        ORDER BY avg_risk_score DESC
      `;

      const stateDataResult = await this.pool.query(stateDataQuery, [minRiskScore, maxRiskScore, minCustomers]);

      // Create heat map points with intensity and color coding
      const heatMapPoints = [];
      const stateDetails = {};

      // Process states with data
      stateDataResult.rows.forEach(stateData => {
        const state = stateData.state;
        const coords = this.stateCoordinates[state];
        
        if (coords) {
          const avgRisk = parseFloat(stateData.avg_risk_score);
          const riskCategory = this.getRiskCategory(avgRisk);
          const riskInfo = this.riskColors[riskCategory];
          const riskColor = riskInfo.color;

          const heatPoint = {
            lat: coords.lat,
            lng: coords.lng,
            intensity: riskInfo.intensity,
            risk_score: avgRisk,
            customer_count: parseInt(stateData.customer_count),
            state_code: state,
            state_name: coords.name
          };

          heatMapPoints.push(heatPoint);

          stateDetails[state] = {
            state_code: state,
            state_name: coords.name,
            coordinates: { lat: coords.lat, lng: coords.lng },
            customer_count: parseInt(stateData.customer_count),
            min_risk_score: parseFloat((parseFloat(stateData.min_risk_score) || 0).toFixed(2)),
            max_risk_score: parseFloat((parseFloat(stateData.max_risk_score) || 0).toFixed(2)),
            total_exposure: parseFloat(stateData.total_exposure),
            high_risk_count: parseInt(stateData.high_risk_count),
            critical_count: parseInt(stateData.critical_count),
            risk_category: riskCategory,
            color: riskColor,
            intensity: parseFloat((avgRisk / 100).toFixed(2)),
            risk_density: parseFloat(((avgRisk * parseInt(stateData.customer_count)) / 100).toFixed(2)),
            avg_risk_score: parseFloat(avgRisk.toFixed(2))
          };
        }
      });

      // Add states without data if requested
      if (includeStatesWithoutData) {
        Object.keys(this.stateCoordinates).forEach(stateCode => {
          if (!stateDetails[stateCode]) {
            const coords = this.stateCoordinates[stateCode];
            stateDetails[stateCode] = {
              state_code: stateCode,
              state_name: coords.name,
              coordinates: { lat: coords.lat, lng: coords.lng },
              customer_count: 0,
              avg_risk_score: 0,
              min_risk_score: 0,
              max_risk_score: 0,
              total_exposure: 0,
              high_risk_count: 0,
              critical_count: 0,
              risk_category: 'NO_DATA',
              color: '#E0E0E0',
              intensity: 0,
              risk_density: 0
            };
          }
        });
      }

      // Calculate portfolio-wide statistics
      const portfolioStats = this.calculatePortfolioStats(Object.values(stateDetails));

      return {
        heat_map_points: heatMapPoints,
        state_details: stateDetails,
        portfolio_statistics: portfolioStats,
        legend: this.riskColors,
        filters_applied: filters,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Heat Map Generation Error:', error);
      throw error;
    }
  }

  // Get detailed analysis for a specific state
  async getStateAnalysis(stateCode) {
    try {
      const stateQuery = `
        SELECT 
          c.customer_id,
          c.name,
          c.city,
          c.zip,
          CAST(rt.base_risk_score AS NUMERIC) as risk_score,
          CAST(rt.next12m_claim_prob AS NUMERIC) as claim_prob,
          CAST(rt.next12m_expected_loss AS NUMERIC) as expected_loss
        FROM risk_twins rt
        JOIN customers c ON rt.customer_id = c.customer_id
        WHERE c.state = $1
        ORDER BY rt.base_risk_score DESC
      `;

      const customersResult = await this.pool.query(stateQuery, [stateCode]);

      // Get state-level scenarios
      const scenariosQuery = `
        SELECT 
          s.scenario_id,
          s.name,
          s.change_json,
          s.applied_at,
          c.name as customer_name
        FROM scenarios s
        JOIN customers c ON s.customer_id = c.customer_id
        WHERE c.state = $1
        ORDER BY s.applied_at DESC
        LIMIT 10
      `;

      const scenariosResult = await this.pool.query(scenariosQuery, [stateCode]);

      const customers = customersResult.rows.map(customer => ({
        customer_id: customer.customer_id,
        name: customer.name,
        city: customer.city,
        zip: customer.zip,
        risk_score: parseFloat(customer.risk_score),
        claim_prob: parseFloat(customer.claim_prob),
        expected_loss: parseFloat(customer.expected_loss),
        risk_category: this.getRiskCategory(parseFloat(customer.risk_score))
      }));

      // Calculate state statistics
      const stateStats = {
        total_customers: customers.length,
        avg_risk_score: customers.reduce((sum, c) => sum + c.risk_score, 0) / customers.length,
        total_exposure: customers.reduce((sum, c) => sum + c.expected_loss, 0),
        risk_distribution: this.calculateRiskDistribution(customers),
        top_cities: this.getTopCitiesByRisk(customers)
      };

      return {
        state_code: stateCode,
        state_name: this.stateCoordinates[stateCode]?.name || stateCode,
        customers: customers,
        recent_scenarios: scenariosResult.rows,
        statistics: stateStats,
        analysis_timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('State Analysis Error:', error);
      throw error;
    }
  }

  // Generate heat map with time-based filtering
  async getTimeBasedHeatMap(timeFrame = '30d') {
    try {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[timeFrame] || 30;

      // Get recent scenario activity by state
      const activityQuery = `
        SELECT 
          c.state,
          COUNT(s.scenario_id) as scenario_count,
          COUNT(DISTINCT s.customer_id) as active_customers,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score
        FROM scenarios s
        JOIN customers c ON s.customer_id = c.customer_id
        JOIN risk_twins rt ON c.customer_id = rt.customer_id
        WHERE s.applied_at >= NOW() - INTERVAL '${days} days'
        GROUP BY c.state
        ORDER BY scenario_count DESC
      `;

      const activityResult = await this.pool.query(activityQuery);

      const activityHeatMap = activityResult.rows.map(activity => {
        const coords = this.stateCoordinates[activity.state];
        if (coords) {
          return {
            lat: coords.lat,
            lng: coords.lng,
            intensity: Math.min(parseInt(activity.scenario_count) / 10, 1), // Scale intensity
            state_code: activity.state,
            state_name: coords.name,
            scenario_count: parseInt(activity.scenario_count),
            active_customers: parseInt(activity.active_customers),
            avg_risk_score: parseFloat(activity.avg_risk_score),
            activity_level: this.getActivityLevel(parseInt(activity.scenario_count))
          };
        }
        return null;
      }).filter(point => point !== null);

      return {
        time_frame: timeFrame,
        activity_heat_map: activityHeatMap,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Time-based Heat Map Error:', error);
      throw error;
    }
  }

  // Helper methods
  getRiskCategory(riskScore) {
    if (riskScore >= 85) return 'CRITICAL';
    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 55) return 'MEDIUM';
    if (riskScore >= 40) return 'LOW';
    return 'VERY_LOW';
  }

  getActivityLevel(scenarioCount) {
    if (scenarioCount >= 20) return 'VERY_HIGH';
    if (scenarioCount >= 10) return 'HIGH';
    if (scenarioCount >= 5) return 'MEDIUM';
    if (scenarioCount >= 1) return 'LOW';
    return 'NONE';
  }

  calculatePortfolioStats(stateDetails) {
    const statesWithData = stateDetails.filter(state => state.customer_count > 0);
    
    if (statesWithData.length === 0) {
      return {
        total_states: 0,
        total_customers: 0,
        avg_portfolio_risk: 0,
        highest_risk_state: null,
        most_customers_state: null
      };
    }

    const totalCustomers = statesWithData.reduce((sum, state) => sum + state.customer_count, 0);
    const weightedRisk = statesWithData.reduce((sum, state) => 
      sum + (state.avg_risk_score * state.customer_count), 0
    ) / totalCustomers;

    const highestRiskState = statesWithData.reduce((prev, current) => 
      (prev.avg_risk_score > current.avg_risk_score) ? prev : current
    );

    const mostCustomersState = statesWithData.reduce((prev, current) => 
      (prev.customer_count > current.customer_count) ? prev : current
    );

    return {
      total_states: statesWithData.length,
      total_customers: totalCustomers,
      avg_portfolio_risk: parseFloat(weightedRisk.toFixed(2)),
      highest_risk_state: {
        state: highestRiskState.state_code,
        name: highestRiskState.state_name,
        risk_score: parseFloat(highestRiskState.avg_risk_score.toFixed(2))
      },
      most_customers_state: {
        state: mostCustomersState.state_code,
        name: mostCustomersState.state_name,
        customer_count: mostCustomersState.customer_count
      }
    };
  }

  calculateRiskDistribution(customers) {
    const distribution = { VERY_LOW: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    customers.forEach(customer => {
      const category = this.getRiskCategory(customer.risk_score);
      distribution[category]++;
    });
    return distribution;
  }

  getTopCitiesByRisk(customers) {
    const cityRisks = {};
    customers.forEach(customer => {
      if (!cityRisks[customer.city]) {
        cityRisks[customer.city] = { total_risk: 0, count: 0 };
      }
      cityRisks[customer.city].total_risk += customer.risk_score;
      cityRisks[customer.city].count++;
    });

    return Object.entries(cityRisks)
      .map(([city, data]) => ({
        city,
        avg_risk: parseFloat((data.total_risk / data.count).toFixed(2)),
        customer_count: data.count
      }))
      .sort((a, b) => parseFloat(b.avg_risk) - parseFloat(a.avg_risk))
      .slice(0, 5);
  }

  // Get detailed statistics for a specific state
  async getStateDetails(stateCode) {
    try {
      const stateQuery = `
        SELECT 
          c.state,
          COUNT(*) as customer_count,
          AVG(CAST(rt.base_risk_score AS NUMERIC)) as avg_risk_score,
          MAX(CAST(rt.base_risk_score AS NUMERIC)) as max_risk_score,
          MIN(CAST(rt.base_risk_score AS NUMERIC)) as min_risk_score,
          SUM(CAST(rt.next12m_expected_loss AS NUMERIC)) as total_exposure,
          AVG(CAST(rt.next12m_claim_prob AS NUMERIC)) as avg_claim_prob,
          COUNT(s.scenario_id) as scenarios_applied
        FROM customers c
        JOIN risk_twins rt ON c.customer_id = rt.customer_id
        LEFT JOIN scenarios s ON c.customer_id = s.customer_id
        WHERE c.state = $1
        GROUP BY c.state
      `;

      const stateResult = await this.pool.query(stateQuery, [stateCode]);
      
      if (stateResult.rows.length === 0) {
        return {
          state_code: stateCode,
          statistics: null,
          message: 'No data available for this state'
        };
      }

      const state = stateResult.rows[0];
      
      return {
        state_code: stateCode,
        statistics: {
          customer_count: parseInt(state.customer_count),
          avg_risk_score: parseFloat((state.avg_risk_score || 0).toFixed(2)),
          max_risk_score: parseFloat((state.max_risk_score || 0).toFixed(2)),
          min_risk_score: parseFloat((state.min_risk_score || 0).toFixed(2)),
          total_exposure: parseFloat((state.total_exposure || 0).toFixed(2)),
          avg_claim_probability: parseFloat((state.avg_claim_prob || 0).toFixed(4)),
          scenarios_applied: parseInt(state.scenarios_applied || 0),
          risk_level: this.getRiskCategory(parseFloat(state.avg_risk_score || 0))
        },
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('State Details Error:', error);
      throw error;
    }
  }
}

module.exports = HeatMapService; 