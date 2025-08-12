# 📊 RiskTwin Database Documentation

## 🗂️ Database Overview

**RiskTwin** uses PostgreSQL (Neon Cloud) with advanced SQL functions, JSONB support, and temporal data tracking. The database is designed for high-performance risk analytics and real-time scenario simulations.

## 📋 Complete Schema Definition

### 🔑 Table: `customers`
**Purpose**: Master customer demographics and profile data

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `customer_id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique customer identifier |
| `name` | `text` | NULLABLE | Full customer name |
| `dob` | `date` | NULLABLE | Date of birth for age calculations |
| `state` | `text` | NULLABLE | Current state of residence (affects risk) |
| `city` | `text` | NULLABLE | Current city |
| `zip` | `text` | NULLABLE | ZIP code for micro-geographic risk |
| `vehicle_use` | `text` | NULLABLE | Vehicle usage pattern (commute/pleasure) |
| `home_type` | `text` | NULLABLE | Property type (single_family/condo/apartment) |
| `risk_segment` | `text` | NULLABLE | Risk classification (standard/elevated) |

**Sample Data**:
```sql
INSERT INTO customers VALUES 
(1, 'Ava Johnson', '1988-03-12', 'TX', 'Allen', '75013', 'commute', 'single_family', 'standard'),
(2, 'Rahul Mehta', '1979-11-05', 'FL', 'Miami', '33101', 'commute', 'condo', 'elevated'),
(4, 'Carlos Ramirez', '1985-07-15', 'CA', 'Los Angeles', '90210', 'commute', 'apartment', 'elevated');
```

---

### 🧠 Table: `risk_twins`
**Purpose**: AI-powered digital twin risk models for each customer

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `twin_id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique twin model ID |
| `customer_id` | `integer` | FOREIGN KEY → customers | Links to customer record |
| `base_risk_score` | `numeric` | NULLABLE | Core risk score (0-100 scale) |
| `next12m_claim_prob` | `numeric` | NULLABLE | 12-month claim probability (0-1) |
| `next12m_expected_loss` | `numeric` | NULLABLE | Expected loss amount in dollars |
| `updated_at` | `timestamp` | DEFAULT now() | When model was last updated |

**Risk Score Calculation Logic**:
- **0-30**: Low risk (green indicators)
- **31-70**: Medium risk (yellow indicators)  
- **71-100**: High risk (red indicators)

**Sample Data**:
```sql
INSERT INTO risk_twins VALUES 
(1, 1, 46.6000, 0.469400000000000000000, 3728.000000000000000000, '2025-08-11 03:58:01.908'),
(2, 2, 78.5000, 0.756500000000000000000, 6280.000000000000000000, '2025-08-11 03:58:01.908'),
(4, 4, 90.1000, 0.860900000000000000000, 7208.000000000000000000, '2025-08-11 03:58:01.908');
```

---

### 🎯 Table: `scenarios`
**Purpose**: What-if scenario simulations and their parameters

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `scenario_id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique scenario identifier |
| `customer_id` | `integer` | FOREIGN KEY → customers | Target customer for scenario |
| `name` | `text` | NULLABLE | Human-readable scenario description |
| `change_json` | `jsonb` | NULLABLE | Flexible scenario parameters (JSON) |
| `applied_at` | `timestamp` | DEFAULT now() | When scenario was applied |
| `sim_claim_prob` | `numeric` | NULLABLE | Simulated claim probability result |
| `sim_expected_loss` | `numeric` | NULLABLE | Simulated expected loss result |

**JSONB Schema for `change_json`**:
```json
{
  "move_state": "TX",                    // Target state for relocation
  "increase_deductible": 250,            // Amount to increase deductible
  "decrease_deductible": 500,            // Amount to decrease deductible  
  "restore_deductible": 1500,            // Specific deductible to restore
  "before_deductible": 1500,             // Deductible before change
  "final_deductible": 1750,              // Deductible after change
  "no_change": true,                     // Flag for no-change scenarios
  "reason": "Already in TX with $1500"   // Reason for no change
}
```

**Sample Data**:
```sql
INSERT INTO scenarios VALUES 
(5, 4, 'What-if: move to TX + $1000 deductible', 
 '{"move_state": "TX", "increase_deductible": 1000}', 
 '2025-08-10 22:56:00', null, null),
(8, 4, 'What-if: move to WA + $250 deductible', 
 '{"move_state": "WA", "increase_deductible": 250, "before_deductible": 1500, "final_deductible": 1750}', 
 '2025-08-10 23:36:50', null, null);
```

---

### 📅 Table: `timeline_events`
**Purpose**: Complete customer journey tracking and event history

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `event_id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique event identifier |
| `customer_id` | `integer` | FOREIGN KEY → customers | Customer this event belongs to |
| `event_ts` | `timestamp` | NULLABLE | Exact timestamp of event |
| `title` | `text` | NULLABLE | Event title/summary |
| `details` | `text` | NULLABLE | Detailed event description |
| `tag` | `text` | NULLABLE | Event category/type |

**Event Tag Categories**:
- **`onboarding`**: Customer setup and initial risk assessment
- **`scenario`**: What-if scenario applications  
- **`assessment`**: Risk profile updates
- **`policy`**: Policy changes and activations
- **`claim`**: Claims filed and processed

**Timeline Detail Formats**:

1. **Onboarding Events**:
   ```
   "Initial risk assessment completed in FL. Base deductible: $1500"
   ```

2. **Scenario Events** (with progression):
   ```
   "Applied scenario: moved to TX, increased deductible by $250 | Final deductible: $1750 in TX"
   ```

3. **No-Change Scenarios**:
   ```
   "Applied scenario: no change - Already in TX with $1500 deductible"
   ```

**Sample Data**:
```sql
INSERT INTO timeline_events VALUES 
(1, 4, '2025-01-01 00:00:00', 'Customer Onboarded', 
 'Initial risk assessment completed', 'onboarding'),
(16, 4, '2025-08-10 23:36:50', 'What-if: move to WA + $250 deductible', 
 'Applied scenario: moved to WA, increased deductible by $250 | Final deductible: $1750 in WA', 'scenario');
```

---

### 🏠 Table: `policies`
**Purpose**: Insurance policy details and coverage information

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `policy_id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique policy identifier |
| `customer_id` | `integer` | FOREIGN KEY → customers | Policy holder |
| `line` | `text` | NULLABLE | Insurance line (auto/home) |
| `coverage_limit` | `numeric` | NULLABLE | Maximum coverage amount |
| `deductible` | `numeric` | NULLABLE | Policy deductible amount |
| `start_date` | `date` | NULLABLE | Policy effective start date |
| `end_date` | `date` | NULLABLE | Policy expiration date |
| `premium` | `numeric` | NULLABLE | Annual premium amount |

**Sample Data**:
```sql
INSERT INTO policies VALUES 
(1, 1, 'auto', 50000, 500, '2024-01-01', '2025-01-01', 1100),
(2, 1, 'home', 300000, 1500, '2024-01-01', '2025-01-01', 1200),
(3, 2, 'auto', 60000, 250, '2024-01-01', '2025-01-01', 1400);
```

---

### 📋 Table: `claims`
**Purpose**: Historical claims data for risk analysis

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `claim_id` | `integer` | PRIMARY KEY, AUTO INCREMENT | Unique claim identifier |
| `customer_id` | `integer` | FOREIGN KEY → customers | Claimant customer |
| `policy_id` | `integer` | FOREIGN KEY → policies | Related policy |
| `loss_date` | `date` | NULLABLE | Date of loss occurrence |
| `loss_type` | `text` | NULLABLE | Type of claim (collision/theft/damage) |
| `amount_estimate` | `numeric` | NULLABLE | Estimated claim amount |
| `status` | `text` | NULLABLE | Claim status (open/closed) |
| `channel` | `text` | NULLABLE | How claim was filed (online/phone/agent) |

**Sample Data**:
```sql
INSERT INTO claims VALUES 
(1, 1, 1, '2024-06-15', 'auto_collision', 3200, 'closed', 'online'),
(2, 2, 3, '2024-02-10', 'auto_theft', 15000, 'open', 'phone'),
(3, 2, 4, '2023-10-03', 'water_damage', 12000, 'closed', 'agent');
```

---

## 🔧 Advanced SQL Functions

### `list_high_risk(threshold numeric, lim integer)`

**Purpose**: Identifies customers with risk scores above threshold for proactive management

**Parameters**:
- `threshold`: Minimum risk score to include (0-100)
- `lim`: Maximum number of results to return

**Returns**: Table with columns:
- `customer_id` (integer)
- `name` (text) 
- `state` (text)
- `base_risk_score` (numeric)
- `next12m_claim_prob` (numeric)
- `next12m_expected_loss` (numeric)

**Algorithm**:
```sql
SELECT c.customer_id, c.name, c.state,
       t.base_risk_score, t.next12m_claim_prob, t.next12m_expected_loss
FROM customers c
JOIN risk_twins t USING(customer_id)
WHERE t.base_risk_score >= threshold
ORDER BY t.base_risk_score DESC
LIMIT lim;
```

**Business Use Case**: Insurance underwriters can quickly identify their highest-risk customers for review, policy adjustments, or proactive outreach.

**Example Usage**:
```sql
-- Get top 5 customers with risk score >= 50
SELECT * FROM list_high_risk(50, 5);

-- Get all high-risk customers (score >= 75)  
SELECT * FROM list_high_risk(75, 100);
```

---

### `get_twin(p_customer_id integer)`

**Purpose**: Retrieves complete digital twin profile combining customer data with risk model

**Parameters**:
- `p_customer_id`: Target customer ID

**Returns**: Single record with columns:
- `customer_id` (integer)
- `name` (text)
- `state` (text)  
- `city` (text)
- `zip` (text)
- `base_risk_score` (numeric)
- `next12m_claim_prob` (numeric)
- `next12m_expected_loss` (numeric)
- `updated_at` (timestamp)

**Algorithm**:
```sql
SELECT c.customer_id, c.name, c.state, c.city, c.zip,
       t.base_risk_score, t.next12m_claim_prob, t.next12m_expected_loss, t.updated_at
FROM customers c
JOIN risk_twins t USING(customer_id)
WHERE c.customer_id = p_customer_id;
```

**Business Use Case**: Customer service representatives can instantly access complete risk profile when customers call or chat.

**Example Usage**:
```sql
-- Get Carlos Ramirez's complete profile
SELECT * FROM get_twin(4);
```

---

### `timeline_for_customer(p_customer_id integer)`

**Purpose**: Generates complete chronological timeline of customer events

**Parameters**:
- `p_customer_id`: Target customer ID

**Returns**: Table with columns:
- `event_ts` (timestamp)
- `title` (text)
- `details` (text)  
- `tag` (text)

**Algorithm**:
```sql
SELECT event_ts, title, details, tag
FROM timeline_events
WHERE customer_id = p_customer_id
ORDER BY event_ts;
```

**Business Use Case**: Complete customer journey visualization for customer service, claims investigation, or account review.

**Example Usage**:
```sql
-- Get Rahul's complete timeline
SELECT * FROM timeline_for_customer(2);
```

---

### `apply_scenario(p_customer_id integer, p_name text, p_change_json jsonb)`

**Purpose**: Applies what-if scenario and stores in database for analysis

**Parameters**:
- `p_customer_id`: Target customer ID
- `p_name`: Human-readable scenario description
- `p_change_json`: JSONB object with scenario parameters

**Returns**: `integer` (new scenario_id)

**Algorithm**:
```sql
DECLARE sid INT;
BEGIN
  INSERT INTO scenarios(customer_id, name, change_json)
  VALUES (p_customer_id, p_name, p_change_json)
  RETURNING scenario_id INTO sid;
  RETURN sid;
END;
```

**Business Use Case**: Risk analysts can test impact of policy changes, relocations, or coverage adjustments before implementation.

**Example Usage**:
```sql
-- Test moving customer to high-risk state with deductible increase
SELECT apply_scenario(
  4, 
  'What-if: move to FL + $500 deductible',
  '{"move_state": "FL", "increase_deductible": 500}'::jsonb
);
```

---

## 🚀 Performance Optimizations

### **Indexing Strategy**
```sql
-- Primary keys (automatic indexes)
CREATE INDEX idx_customers_pk ON customers(customer_id);
CREATE INDEX idx_risk_twins_pk ON risk_twins(twin_id);
CREATE INDEX idx_scenarios_pk ON scenarios(scenario_id);
CREATE INDEX idx_timeline_events_pk ON timeline_events(event_id);

-- Foreign key indexes for joins
CREATE INDEX idx_risk_twins_customer_id ON risk_twins(customer_id);
CREATE INDEX idx_scenarios_customer_id ON scenarios(customer_id);
CREATE INDEX idx_timeline_events_customer_id ON timeline_events(customer_id);

-- Performance indexes for queries
CREATE INDEX idx_risk_twins_risk_score ON risk_twins(base_risk_score DESC);
CREATE INDEX idx_timeline_events_timestamp ON timeline_events(event_ts);
CREATE INDEX idx_customers_state ON customers(state);
```

### **Query Optimization**
- **Materialized Views**: For complex risk aggregations
- **Partial Indexes**: For active policies and open claims
- **JSONB Indexes**: For scenario parameter searches

---

## 📊 Data Relationships

```
customers (1) ←→ (1) risk_twins
    ↓
    ↓ (1:N)
    ↓
scenarios, timeline_events, policies
    ↓
    ↓ (1:N)  
    ↓
claims ←→ policies
```

### **Referential Integrity**
- All foreign keys maintain data consistency
- Cascade deletes ensure clean data removal
- Check constraints validate risk scores (0-100)
- Date constraints ensure logical date ranges

---

## 🔍 Business Intelligence Queries

### **High-Risk Customer Analysis**
```sql
-- Customers with multiple high-risk factors
SELECT c.name, c.state, t.base_risk_score, 
       COUNT(cl.claim_id) as claim_count,
       SUM(cl.amount_estimate) as total_claims
FROM customers c
JOIN risk_twins t USING(customer_id)
LEFT JOIN claims cl USING(customer_id)
WHERE t.base_risk_score >= 70
GROUP BY c.customer_id, c.name, c.state, t.base_risk_score
ORDER BY t.base_risk_score DESC;
```

### **State-Based Risk Distribution**
```sql
-- Average risk by state
SELECT c.state, 
       COUNT(*) as customer_count,
       AVG(t.base_risk_score) as avg_risk_score,
       AVG(t.next12m_expected_loss) as avg_expected_loss
FROM customers c
JOIN risk_twins t USING(customer_id)
GROUP BY c.state
ORDER BY avg_risk_score DESC;
```

### **Scenario Analysis Trends**
```sql
-- Most common scenario types
SELECT 
  CASE 
    WHEN change_json->>'move_state' IS NOT NULL THEN 'State Move'
    WHEN change_json->>'increase_deductible' IS NOT NULL THEN 'Deductible Increase'
    WHEN change_json->>'decrease_deductible' IS NOT NULL THEN 'Deductible Decrease'
    WHEN change_json->>'restore_deductible' IS NOT NULL THEN 'Deductible Restore'
    ELSE 'Other'
  END as scenario_type,
  COUNT(*) as frequency
FROM scenarios
GROUP BY scenario_type
ORDER BY frequency DESC;
```

---

## 🔐 Security Considerations

### **Data Protection**
- **Row-Level Security**: Customer data isolation
- **Encrypted Connections**: SSL/TLS for all database connections
- **Audit Logging**: Track all data modifications
- **Access Controls**: Role-based permissions

### **PII Handling**
- Customer names and addresses are PII
- Date of birth used for age calculations only
- Geographic data aggregated for privacy
- Scenario data anonymized for analytics

---

This database design provides a robust foundation for advanced insurance risk analytics while maintaining performance, security, and scalability for enterprise deployment. 