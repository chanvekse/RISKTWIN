/**
 * =============================================================================
 * MACHINE LEARNING RISK SCORING SERVICE
 * =============================================================================
 * 
 * MODULE: services/ml-service.js
 * PURPOSE: Real-time ML-powered risk assessment and external factor integration
 * 
 * DESCRIPTION:
 * This service provides advanced machine learning capabilities for risk scoring
 * in the RiskTwin platform. It simulates real-world ML models that would 
 * integrate with external data sources (weather, economic indicators, traffic
 * patterns, market volatility) to provide dynamic risk adjustments.
 * 
 * CORE FUNCTIONALITY:
 * • Real-time risk score recalculation with external factors
 * • Risk trend analysis and forecasting
 * • Model confidence scoring and version tracking
 * • External factor simulation (weather, economic, traffic, market, temporal)
 * • Historical risk progression analysis
 * 
 * KEY FEATURES:
 * • Multi-factor risk assessment (5 external factor categories)
 * • Dynamic risk adjustment algorithms
 * • Confidence interval calculations
 * • Model versioning for auditability
 * • Realistic simulation of ML prediction systems
 * 
 * INTEGRATION POINTS:
 * • Called by backend/server.js for risk recalculation endpoints
 * • Provides data for timeline event creation
 * • Supports predictive analytics workflows
 * • Integrates with customer risk twin data
 * 
 * EXTERNAL FACTORS SIMULATED:
 * • Weather: Severe weather events affecting risk
 * • Economic: Market conditions and economic indicators
 * • Traffic: Regional traffic patterns and congestion
 * • Market: Insurance market volatility and trends
 * • Temporal: Time-based risk factors (seasonality, etc.)
 * 
 * ALGORITHMS SIMULATED:
 * • Weighted factor scoring
 * • Risk adjustment calculations
 * • Confidence interval generation
 * • Trend analysis and forecasting
 * • Model performance simulation
 * 
 * AUTHOR: RiskTwin ML Team
 * VERSION: 2.1.3
 * LAST UPDATED: August 2025
 * =============================================================================
 */

// Machine Learning Risk Scoring Service
// Simulates real-time ML-powered risk assessment with external factors

class MLRiskService {
  constructor(pool = null) {
    this.modelVersion = "v2.1.3";
    this.lastUpdated = new Date();
    this.pool = pool; // Add pool parameter to support database queries
  }

  // Simulate external data sources
  async getExternalFactors(customerState) {
    // Mock external data that would affect risk
    const externalFactors = {
      weather: {
        severe_weather_probability: Math.random() * 0.3, // 0-30% chance
        hurricane_season: this.isHurricaneSeason(),
        winter_storm_risk: this.isWinterStormSeason()
      },
      economic: {
        unemployment_rate: this.getStateUnemployment(customerState),
        inflation_rate: 0.041, // Mock 4.1%
        gas_prices: 3.45 + (Math.random() * 0.5 - 0.25) // $3.20-$3.70
      },
      traffic: {
        accident_rate_increase: Math.random() * 0.1, // 0-10% increase
        construction_zones: Math.floor(Math.random() * 5), // 0-5 zones
        road_conditions: this.getSeasonalRoadConditions()
      },
      market: {
        claims_frequency_trend: (Math.random() - 0.5) * 0.2, // -10% to +10%
        competitor_pricing_pressure: Math.random() * 0.15,
        regulatory_changes: Math.random() > 0.9 // 10% chance of reg changes
      }
    };

    return externalFactors;
  }

  // Enhanced risk calculation with ML simulation
  async calculateRiskScore(customerData, externalFactors) {
    const baseScore = parseFloat(customerData.base_risk_score);
    
    // Simulate ML model adjustments based on external factors
    let adjustments = {
      weather: 0,
      economic: 0,
      traffic: 0,
      market: 0,
      temporal: 0
    };

    // Weather risk adjustments
    if (externalFactors.weather.severe_weather_probability > 0.2) {
      adjustments.weather += externalFactors.weather.severe_weather_probability * 10;
    }
    
    if (externalFactors.weather.hurricane_season && ['FL', 'TX', 'LA', 'NC', 'SC'].includes(customerData.state)) {
      adjustments.weather += 3;
    }

    // Economic factors
    if (externalFactors.economic.unemployment_rate > 0.06) {
      adjustments.economic += (externalFactors.economic.unemployment_rate - 0.06) * 50;
    }

    // Traffic and road conditions
    adjustments.traffic += externalFactors.traffic.accident_rate_increase * 20;

    // Market conditions
    adjustments.market += externalFactors.market.claims_frequency_trend * 15;

    // Temporal factors (time of day, day of week, season)
    adjustments.temporal += this.getTemporalAdjustment();

    // Calculate total adjustment
    const totalAdjustment = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0);
    
    // Apply ML smoothing and bounds
    const smoothedAdjustment = totalAdjustment * 0.7; // ML smoothing factor
    const newScore = Math.max(0, Math.min(100, baseScore + smoothedAdjustment));

    return {
      original_score: baseScore,
      new_score: parseFloat(newScore.toFixed(1)),
      adjustment: parseFloat(smoothedAdjustment.toFixed(1)),
      factors: adjustments,
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
      model_version: this.modelVersion,
      calculated_at: new Date().toISOString()
    };
  }

  // Main method called by server for risk recalculation
  async recalculateRisk(customerId) {
    try {
      // Get customer data first
      const customerResult = await this.pool.query('SELECT * FROM get_twin($1);', [customerId]);
      const customer = customerResult.rows[0];
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Get external factors for risk calculation
      const externalFactors = await this.getExternalFactors(customer.state);
      
      // Calculate new risk score using ML
      const riskCalculation = await this.calculateRiskScore(customer, externalFactors);
      
      return {
        customer_id: parseInt(customerId),
        risk_calculation: riskCalculation,
        external_factors: externalFactors,
        updated_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('ML Risk Recalculation Error:', error);
      throw error;
    }
  }

  // Get risk trend data
  async getRiskTrend(customerId) {
    return await this.analyzeRiskTrend(customerId, 30);
  }

  // Helper methods for realistic data simulation
  isHurricaneSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    return month >= 6 && month <= 11; // June-November
  }

  isWinterStormSeason() {
    const month = new Date().getMonth() + 1;
    return month >= 11 || month <= 3; // Nov-Mar
  }

  getStateUnemployment(state) {
    // Mock state unemployment rates
    const stateRates = {
      'CA': 0.047, 'TX': 0.037, 'FL': 0.041, 'NY': 0.045,
      'PA': 0.039, 'IL': 0.043, 'OH': 0.042, 'GA': 0.034,
      'NC': 0.038, 'MI': 0.044, 'NJ': 0.046, 'VA': 0.035,
      'WA': 0.041, 'AZ': 0.036, 'MA': 0.040, 'TN': 0.033
    };
    return stateRates[state] || 0.040; // Default 4.0%
  }

  getSeasonalRoadConditions() {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'poor'; // Winter
    if (month >= 3 && month <= 5) return 'fair';  // Spring
    if (month >= 6 && month <= 8) return 'good';  // Summer
    return 'fair'; // Fall
  }

  getTemporalAdjustment() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // Higher risk during rush hours and weekends
    let adjustment = 0;
    
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      adjustment += 1.5; // Rush hour
    }
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      adjustment += 1; // Weekend
    }
    
    if (hour >= 22 || hour <= 5) {
      adjustment += 2; // Late night/early morning
    }
    
    return adjustment;
  }

  // Simulate risk trend analysis
  async analyzeRiskTrend(customerId, days = 30) {
    // Mock trend analysis
    const trendData = [];
    const baseDate = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - i);
      
      // Simulate risk score fluctuation
      const variation = (Math.random() - 0.5) * 4; // ±2 points variation
      const score = 75 + Math.sin(i * 0.2) * 5 + variation; // Base trend with noise
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        risk_score: parseFloat(Math.max(0, Math.min(100, score)).toFixed(1)),
        factors: ['weather', 'traffic', 'economic'][Math.floor(Math.random() * 3)]
      });
    }
    
    return {
      customer_id: customerId,
      trend_period: `${days} days`,
      data_points: trendData,
      trend_direction: trendData[trendData.length - 1].risk_score > trendData[0].risk_score ? 'increasing' : 'decreasing',
      volatility: this.calculateVolatility(trendData.map(d => d.risk_score)),
      prediction_confidence: 0.78 + Math.random() * 0.15
    };
  }

  calculateVolatility(scores) {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return parseFloat(Math.sqrt(variance).toFixed(2));
  }

  // Simulate real-time market data
  async getMarketInsights(customerState) {
    return {
      state: customerState,
      market_conditions: {
        competitive_intensity: Math.random() * 10, // 0-10 scale
        average_premium: 1200 + Math.random() * 800, // $1200-$2000
        loss_ratio_trend: (Math.random() - 0.5) * 0.3, // ±15%
        customer_acquisition_cost: 150 + Math.random() * 100,
        retention_rate: 0.85 + Math.random() * 0.1
      },
      risk_factors: {
        natural_disasters: this.getNaturalDisasterRisk(customerState),
        crime_rate: Math.random() * 50, // crimes per 1000
        traffic_density: Math.random() * 100,
        economic_stability: Math.random() * 10
      },
      recommendations: [
        "Consider dynamic pricing adjustments",
        "Monitor weather patterns closely",
        "Evaluate competitive positioning"
      ]
    };
  }

  getNaturalDisasterRisk(state) {
    const risks = {
      'FL': ['hurricane', 'flooding'],
      'CA': ['earthquake', 'wildfire'],
      'TX': ['hurricane', 'tornado', 'flooding'],
      'OK': ['tornado'],
      'LA': ['hurricane', 'flooding'],
      'WA': ['earthquake'],
      'NY': ['winter_storm', 'flooding']
    };
    return risks[state] || ['storm'];
  }
}

module.exports = MLRiskService; 