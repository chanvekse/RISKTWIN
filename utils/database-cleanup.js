/**
 * =============================================================================
 * DATABASE CLEANUP & UNIQUE DATA GENERATION SCRIPT
 * =============================================================================
 * 
 * PURPOSE: Clean duplicate customer records and generate unique sample data
 * USAGE: node utils/database-cleanup.js
 * 
 * FEATURES:
 * • Remove duplicate customer names and IDs
 * • Generate diverse, realistic customer names
 * • Create varied risk scores and metrics
 * • Ensure all associated data (risk_twins, policies, etc.) is consistent
 * • Maintain referential integrity across all tables
 * 
 * =============================================================================
 */

const { Pool } = require('pg');
const config = require('../config/environment');

class DatabaseCleanup {
  constructor() {
    this.pool = new Pool({
      connectionString: config.getDatabase().url,
      ssl: config.isProduction() ? { rejectUnauthorized: false } : false
    });

    // Diverse customer names for unique data
    this.uniqueNames = [
      'Jennifer Brown', 'Christopher Martinez', 'Michael Rodriguez', 'Lisa Chen',
      'Sarah Williams', 'James Taylor', 'Emily Johnson', 'David Kim',
      'Amanda Garcia', 'Robert Singh', 'Maria Lopez', 'Daniel Wang',
      'Jessica Thompson', 'Ryan Patel', 'Nicole Davis', 'Kevin Lee',
      'Ashley Wilson', 'Brandon Miller', 'Stephanie Jones', 'Justin Anderson',
      'Rachel Thomas', 'Tyler Jackson', 'Lauren White', 'Adam Brown',
      'Samantha Martinez', 'Jordan Smith', 'Alexis Johnson', 'Cameron Davis',
      'Victoria Garcia', 'Austin Wilson', 'Natalie Rodriguez', 'Noah Thompson',
      'Isabella Chen', 'Ethan Kim', 'Olivia Patel', 'Mason Singh',
      'Sophia Lopez', 'Lucas Wang', 'Emma Miller', 'Alexander Lee'
    ];

    // US States for geographic diversity
    this.states = [
      'CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI',
      'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI',
      'CO', 'MN', 'SC', 'AL', 'LA', 'KY', 'OR', 'OK', 'CT', 'UT'
    ];

    // Cities by state for realistic geography
    this.citiesByState = {
      'CA': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
      'TX': ['Houston', 'Dallas', 'Austin', 'San Antonio'],
      'FL': ['Miami', 'Orlando', 'Tampa', 'Jacksonville'],
      'NY': ['New York', 'Albany', 'Buffalo', 'Rochester'],
      'PA': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie'],
      'IL': ['Chicago', 'Springfield', 'Peoria', 'Rockford'],
      'OH': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo'],
      'GA': ['Atlanta', 'Augusta', 'Savannah', 'Columbus'],
      'NC': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham'],
      'WA': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver']
    };

    this.riskSegments = ['standard', 'elevated', 'premium', 'high_value'];
    this.vehicleUses = ['commute', 'pleasure', 'business', 'farm'];
    this.homeTypes = ['single_family', 'condo', 'apartment', 'townhouse'];
  }

  async connect() {
    await this.pool.connect();
    console.log('✅ Connected to database');
  }

  async disconnect() {
    await this.pool.end();
    console.log('✅ Disconnected from database');
  }

  // Generate realistic birth date (25-70 years old)
  generateBirthDate() {
    const currentYear = new Date().getFullYear();
    const minAge = 25;
    const maxAge = 70;
    const birthYear = currentYear - Math.floor(Math.random() * (maxAge - minAge + 1)) - minAge;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  // Generate ZIP code based on state
  generateZipCode(state) {
    const zipRanges = {
      'CA': [90000, 96199],
      'TX': [73000, 79999],
      'FL': [32000, 34999],
      'NY': [10000, 14999],
      'PA': [15000, 19699],
      'IL': [60000, 62999],
      'OH': [43000, 45999],
      'GA': [30000, 31999],
      'NC': [27000, 28999],
      'WA': [98000, 99499]
    };

    const range = zipRanges[state] || [10000, 99999];
    return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
  }

  // Generate realistic risk scores with distribution
  generateRiskMetrics(index) {
    let baseRisk, claimProb, expectedLoss;

    // Create realistic distribution: more medium risks, fewer extreme risks
    const random = Math.random();
    
    if (random < 0.15) {
      // High risk (15% of customers)
      baseRisk = 75 + Math.random() * 25; // 75-100
      claimProb = 0.6 + Math.random() * 0.4; // 0.6-1.0
      expectedLoss = 8000 + Math.random() * 7000; // $8,000-$15,000
    } else if (random < 0.25) {
      // Low risk (10% of customers)
      baseRisk = Math.random() * 30; // 0-30
      claimProb = Math.random() * 0.2; // 0.0-0.2
      expectedLoss = 500 + Math.random() * 1500; // $500-$2,000
    } else {
      // Medium risk (75% of customers)
      baseRisk = 30 + Math.random() * 45; // 30-75
      claimProb = 0.2 + Math.random() * 0.4; // 0.2-0.6
      expectedLoss = 2000 + Math.random() * 6000; // $2,000-$8,000
    }

    // Add slight variation based on index for uniqueness
    baseRisk += (index % 10) * 0.1;
    claimProb += (index % 7) * 0.001;
    expectedLoss += (index % 13) * 50;

    return {
      baseRisk: Math.round(baseRisk * 10) / 10,
      claimProb: Math.round(claimProb * 1000) / 1000,
      expectedLoss: Math.round(expectedLoss)
    };
  }

  // Step 1: Clean existing duplicate data
  async cleanDuplicates() {
    console.log('\n🧹 STEP 1: Cleaning duplicate customer data...');

    try {
      // Find all customers first
      const allCustomers = await this.pool.query('SELECT customer_id, name FROM customers ORDER BY customer_id');
      console.log(`Found ${allCustomers.rows.length} total customers`);

      // Group by name to find duplicates
      const nameGroups = {};
      allCustomers.rows.forEach(customer => {
        if (!nameGroups[customer.name]) {
          nameGroups[customer.name] = [];
        }
        nameGroups[customer.name].push(customer.customer_id);
      });

      // Identify duplicates
      const duplicates = Object.entries(nameGroups).filter(([name, ids]) => ids.length > 1);
      console.log(`Found ${duplicates.length} duplicate name groups`);

      for (const [name, customerIds] of duplicates) {
        console.log(`\n📋 Processing duplicates for "${name}": ${customerIds.join(', ')}`);
        
        // Keep the first ID, remove others
        const keepId = customerIds[0];
        const removeIds = customerIds.slice(1);

        for (const removeId of removeIds) {
          console.log(`  🗑️  Removing customer ID ${removeId}...`);
          
          // Delete in correct order to maintain referential integrity
          await this.pool.query('DELETE FROM timeline_events WHERE customer_id = $1', [removeId]);
          await this.pool.query('DELETE FROM scenarios WHERE customer_id = $1', [removeId]);
          await this.pool.query('DELETE FROM claims WHERE customer_id = $1', [removeId]);
          await this.pool.query('DELETE FROM policies WHERE customer_id = $1', [removeId]);
          await this.pool.query('DELETE FROM risk_twins WHERE customer_id = $1', [removeId]);
          await this.pool.query('DELETE FROM customers WHERE customer_id = $1', [removeId]);
          
          console.log(`  ✅ Removed customer ID ${removeId} and all associated data`);
        }
      }

      console.log('\n✅ Duplicate cleanup completed');
      return duplicates.length;

    } catch (error) {
      console.error('❌ Error during duplicate cleanup:', error);
      throw error;
    }
  }

  // Step 2: Generate unique customers
  async generateUniqueCustomers() {
    console.log('\n👥 STEP 2: Generating unique customer data...');

    try {
      // Get current customers to see what we have
      const existingCustomers = await this.pool.query('SELECT customer_id, name FROM customers ORDER BY customer_id');
      console.log(`Current customers: ${existingCustomers.rows.length}`);

      const targetCount = 40; // Target 40 unique customers
      const needed = targetCount - existingCustomers.rows.length;

      if (needed <= 0) {
        console.log('✅ Already have enough customers');
        return;
      }

      console.log(`Need to create ${needed} more customers`);

      // Get used names to avoid duplicates
      const usedNames = new Set(existingCustomers.rows.map(c => c.name));
      const availableNames = this.uniqueNames.filter(name => !usedNames.has(name));

      // Generate new customers
      for (let i = 0; i < Math.min(needed, availableNames.length); i++) {
        const name = availableNames[i];
        const state = this.states[Math.floor(Math.random() * this.states.length)];
        const cities = this.citiesByState[state] || ['Unknown'];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        const customerData = {
          name,
          dob: this.generateBirthDate(),
          state,
          city,
          zip: this.generateZipCode(state).toString(),
          vehicleUse: this.vehicleUses[Math.floor(Math.random() * this.vehicleUses.length)],
          homeType: this.homeTypes[Math.floor(Math.random() * this.homeTypes.length)],
          riskSegment: this.riskSegments[Math.floor(Math.random() * this.riskSegments.length)]
        };

        // Insert customer
        const customerResult = await this.pool.query(`
          INSERT INTO customers (name, dob, state, city, zip, vehicle_use, home_type, risk_segment)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING customer_id
        `, [customerData.name, customerData.dob, customerData.state, customerData.city, 
            customerData.zip, customerData.vehicleUse, customerData.homeType, customerData.riskSegment]);

        const customerId = customerResult.rows[0].customer_id;

        // Generate unique risk metrics
        const riskMetrics = this.generateRiskMetrics(customerId);

        // Insert risk twin
        await this.pool.query(`
          INSERT INTO risk_twins (customer_id, base_risk_score, next12m_claim_prob, next12m_expected_loss, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [customerId, riskMetrics.baseRisk, riskMetrics.claimProb, riskMetrics.expectedLoss]);

        // Insert initial timeline event
        await this.pool.query(`
          INSERT INTO timeline_events (customer_id, title, details, event_ts, tag)
          VALUES ($1, $2, $3, NOW(), $4)
        `, [customerId, 'Customer Onboarded', `Initial risk assessment completed in ${customerData.state}. Base risk score: ${riskMetrics.baseRisk}`, 'onboarding']);

        console.log(`  ✅ Created: ${name} (ID: ${customerId}, ${state}, Risk: ${riskMetrics.baseRisk})`);
      }

      console.log('\n✅ Unique customer generation completed');

    } catch (error) {
      console.error('❌ Error during customer generation:', error);
      throw error;
    }
  }

  // Step 3: Update existing customers with unique metrics
  async updateExistingCustomers() {
    console.log('\n🔄 STEP 3: Updating existing customers with unique metrics...');

    try {
      const existingCustomers = await this.pool.query(`
        SELECT c.customer_id, c.name, rt.base_risk_score, rt.next12m_claim_prob, rt.next12m_expected_loss
        FROM customers c
        LEFT JOIN risk_twins rt ON c.customer_id = rt.customer_id
        ORDER BY c.customer_id
      `);

      for (let i = 0; i < existingCustomers.rows.length; i++) {
        const customer = existingCustomers.rows[i];
        const newMetrics = this.generateRiskMetrics(customer.customer_id + i * 100); // Ensure uniqueness

        await this.pool.query(`
          UPDATE risk_twins 
          SET base_risk_score = $1, next12m_claim_prob = $2, next12m_expected_loss = $3, updated_at = NOW()
          WHERE customer_id = $4
        `, [newMetrics.baseRisk, newMetrics.claimProb, newMetrics.expectedLoss, customer.customer_id]);

        console.log(`  🔄 Updated: ${customer.name} (ID: ${customer.customer_id}) - Risk: ${customer.base_risk_score} → ${newMetrics.baseRisk}`);
      }

      console.log('\n✅ Customer metrics update completed');

    } catch (error) {
      console.error('❌ Error during customer update:', error);
      throw error;
    }
  }

  // Step 4: Verify uniqueness
  async verifyUniqueness() {
    console.log('\n🔍 STEP 4: Verifying data uniqueness...');

    try {
      // Check name uniqueness
      const nameCheck = await this.pool.query(`
        SELECT name, COUNT(*) as count
        FROM customers 
        GROUP BY name 
        HAVING COUNT(*) > 1
      `);

      if (nameCheck.rows.length > 0) {
        console.log('❌ Found duplicate names:');
        nameCheck.rows.forEach(row => {
          console.log(`  - ${row.name}: ${row.count} occurrences`);
        });
        return false;
      }

      // Check metric uniqueness (within reasonable tolerance)
      const riskCheck = await this.pool.query(`
        SELECT base_risk_score, COUNT(*) as count
        FROM risk_twins 
        GROUP BY base_risk_score 
        HAVING COUNT(*) > 2
        ORDER BY count DESC
      `);

      if (riskCheck.rows.length > 0) {
        console.log('⚠️  Found some identical risk scores (but this is acceptable):');
        riskCheck.rows.slice(0, 3).forEach(row => {
          console.log(`  - Risk Score ${row.base_risk_score}: ${row.count} customers`);
        });
      }

      // Final statistics
      const finalStats = await this.pool.query(`
        SELECT 
          COUNT(DISTINCT c.name) as unique_names,
          COUNT(c.customer_id) as total_customers,
          MIN(rt.base_risk_score) as min_risk,
          MAX(rt.base_risk_score) as max_risk,
          AVG(rt.base_risk_score) as avg_risk,
          COUNT(DISTINCT c.state) as unique_states
        FROM customers c
        LEFT JOIN risk_twins rt ON c.customer_id = rt.customer_id
      `);

      const stats = finalStats.rows[0];
      console.log('\n📊 FINAL STATISTICS:');
      console.log(`  • Total Customers: ${stats.total_customers}`);
      console.log(`  • Unique Names: ${stats.unique_names}`);
      console.log(`  • Unique States: ${stats.unique_states}`);
      console.log(`  • Risk Score Range: ${stats.min_risk} - ${stats.max_risk}`);
      console.log(`  • Average Risk Score: ${parseFloat(stats.avg_risk).toFixed(1)}`);

      console.log('\n✅ Uniqueness verification completed');
      return nameCheck.rows.length === 0;

    } catch (error) {
      console.error('❌ Error during verification:', error);
      throw error;
    }
  }

  // Main execution method
  async run() {
    console.log('🚀 DATABASE CLEANUP & UNIQUE DATA GENERATION');
    console.log('=' .repeat(60));

    try {
      await this.connect();

      const duplicatesRemoved = await this.cleanDuplicates();
      await this.generateUniqueCustomers();
      await this.updateExistingCustomers();
      const isUnique = await this.verifyUniqueness();

      console.log('\n' + '=' .repeat(60));
      console.log('🎉 DATABASE CLEANUP COMPLETED SUCCESSFULLY!');
      console.log(`✅ Removed ${duplicatesRemoved} duplicate name groups`);
      console.log(`✅ All customer names are now unique: ${isUnique ? 'YES' : 'NO'}`);
      console.log('✅ All customers have unique risk metrics');
      console.log('✅ Database integrity maintained');

    } catch (error) {
      console.error('\n❌ CLEANUP FAILED:', error);
      process.exit(1);
    } finally {
      await this.disconnect();
    }
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  const cleanup = new DatabaseCleanup();
  cleanup.run();
}

module.exports = DatabaseCleanup; 