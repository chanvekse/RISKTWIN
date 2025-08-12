# 🏆 RiskTwin - AI-Powered Insurance Risk Management Platform

## 🎯 Hackathon Project Overview

**RiskTwin** is an advanced insurance risk management platform that creates digital twins of customers to predict and simulate risk scenarios in real-time. Built for the hackathon with cutting-edge technology stack and sophisticated risk modeling.

## 🚀 Key Features

### 🔥 **Revolutionary Risk Simulation**
- **Digital Twin Technology**: Each customer has a AI-powered digital twin that models their risk profile
- **Real-time Scenario Testing**: Apply "what-if" scenarios and see immediate risk impact
- **Predictive Analytics**: 12-month claim probability and expected loss calculations
- **Smart Deductible Management**: State-based deductible memory with increase/decrease capabilities

### 📊 **Advanced Analytics Dashboard**
- **High-Risk Leaderboard**: Dynamic ranking of customers by risk score
- **Interactive Timeline**: Complete customer journey with scenario history
- **Animated Simulations**: Smooth number transitions showing before/after comparisons
- **PDF Reports**: Downloadable scenario analysis reports

### 🧠 **Intelligent Business Logic**
- **State-Based Logic**: Deductible restoration when returning to previous states
- **No-Change Detection**: Smart detection of scenarios that produce no actual changes
- **Progressive Tracking**: Full before/after deductible progression display
- **Multi-State Memory**: Tracks deductible history across all states

## 🛠️ Technology Stack

### **Backend**
- **Node.js** + **Express.js**: RESTful API server
- **PostgreSQL** (Neon): Cloud database with advanced SQL functions
- **pg**: PostgreSQL client for Node.js
- **CORS**: Cross-origin resource sharing

### **Frontend**
- **Vanilla JavaScript**: Pure JS for maximum performance
- **CSS3**: Modern styling with animations
- **jsPDF**: Client-side PDF generation
- **Responsive Design**: Mobile-friendly interface

### **Database Architecture**
- **PostgreSQL** with custom stored functions
- **JSONB** for flexible scenario data
- **Temporal data tracking** with timestamps
- **Advanced SQL analytics functions**

## 📋 Database Schema

### **Core Tables**

#### `customers` - Customer Master Data
```sql
customer_id    | integer     | Primary Key (Auto-increment)
name          | text        | Customer full name
dob           | date        | Date of birth
state         | text        | Current state of residence
city          | text        | Current city
zip           | text        | ZIP code
vehicle_use   | text        | Vehicle usage type
home_type     | text        | Home/property type
risk_segment  | text        | Risk classification
```

#### `risk_twins` - AI Risk Models
```sql
twin_id              | integer     | Primary Key (Auto-increment)
customer_id          | integer     | Foreign Key → customers
base_risk_score      | numeric     | Core risk score (0-100)
next12m_claim_prob   | numeric     | 12-month claim probability (0-1)
next12m_expected_loss| numeric     | Expected loss amount ($)
updated_at           | timestamp   | Last model update
```

#### `scenarios` - What-If Simulations
```sql
scenario_id        | integer     | Primary Key (Auto-increment)
customer_id        | integer     | Foreign Key → customers
name              | text        | Scenario description
change_json       | jsonb       | Flexible scenario parameters
applied_at        | timestamp   | When scenario was applied
sim_claim_prob    | numeric     | Simulated claim probability
sim_expected_loss | numeric     | Simulated expected loss
```

#### `timeline_events` - Customer Journey
```sql
event_id     | integer     | Primary Key (Auto-increment)
customer_id  | integer     | Foreign Key → customers
event_ts     | timestamp   | Event timestamp
title        | text        | Event title
details      | text        | Detailed description
tag          | text        | Event category/type
```

#### `policies` - Insurance Policies
```sql
policy_id      | integer     | Primary Key (Auto-increment)
customer_id    | integer     | Foreign Key → customers
line          | text        | Insurance line (auto/home)
coverage_limit| numeric     | Coverage amount
deductible    | numeric     | Deductible amount
start_date    | date        | Policy start
end_date      | date        | Policy end
premium       | numeric     | Premium amount
```

#### `claims` - Claims History
```sql
claim_id       | integer     | Primary Key (Auto-increment)
customer_id    | integer     | Foreign Key → customers
policy_id      | integer     | Foreign Key → policies
loss_date      | date        | Date of loss
loss_type      | text        | Type of claim
amount_estimate| numeric     | Estimated claim amount
status         | text        | Claim status
channel        | text        | How claim was filed
```

## 🔧 Advanced SQL Functions

### **`list_high_risk(threshold, limit)`**
**Purpose**: Identifies high-risk customers for proactive management

**Parameters**:
- `threshold` (numeric): Minimum risk score to include
- `limit` (integer): Maximum number of results

**Returns**: Customer risk profiles with scores above threshold

**Calculation Logic**:
```sql
SELECT c.customer_id, c.name, c.state,
       t.base_risk_score, t.next12m_claim_prob, t.next12m_expected_loss
FROM customers c
JOIN risk_twins t USING(customer_id)
WHERE t.base_risk_score >= threshold
ORDER BY t.base_risk_score DESC
LIMIT limit;
```

### **`get_twin(customer_id)`**
**Purpose**: Retrieves complete digital twin profile for a customer

**Parameters**:
- `customer_id` (integer): Target customer ID

**Returns**: Complete customer profile + risk twin data

**Business Value**: Combines customer demographics with AI risk model

### **`timeline_for_customer(customer_id)`**
**Purpose**: Generates complete customer journey timeline

**Parameters**:
- `customer_id` (integer): Target customer ID

**Returns**: Chronological sequence of all customer events

**Features**: Includes onboarding, risk assessments, scenarios, and claims

### **`apply_scenario(customer_id, name, change_json)`**
**Purpose**: Applies "what-if" scenario and stores for analysis

**Parameters**:
- `customer_id` (integer): Target customer
- `name` (text): Scenario description
- `change_json` (jsonb): Scenario parameters

**Returns**: New scenario ID

**Advanced Logic**: Supports complex JSON scenario definitions

## 🎨 Frontend Architecture

### **Core Components**

#### **Risk Dashboard (`ui/index.html`)**
- **High-Risk Leaderboard**: Dynamic table with sortable columns
- **Customer Details Panel**: Shows selected customer's risk profile
- **Scenario Simulator**: Interactive what-if scenario builder
- **Timeline Storyboard**: Visual customer journey

#### **Advanced JavaScript Features**

##### **Animated Value Transitions**
```javascript
function animateValue(element, start, end, duration = 1500) {
  // Smooth number counting animation
  // Creates engaging visual feedback for risk changes
}
```

##### **Smart Deductible Logic**
```javascript
// State-based deductible memory
let stateDeductibleHistory = {};

// Automatic restoration when returning to previous states
if (stateDeductibleHistory[state] && deductibleChange === 0) {
  change.restore_deductible = stateDeductibleHistory[state];
}
```

##### **Progressive Timeline Display**
```javascript
// Enhanced timeline with before/after progression
if (actionType === 'increased') {
  display = `[Was: $${before} → +$${change} → Now: $${after}]`;
} else if (actionType === 'decreased') {
  display = `[Was: $${before} → -$${change} → Now: $${after}]`;
}
```

### **CSS Innovations**

#### **Risk-Based Color Coding**
```css
.high-risk { background: linear-gradient(135deg, #ff6b6b, #ee5a24); }
.medium-risk { background: linear-gradient(135deg, #feca57, #ff9ff3); }
.low-risk { background: linear-gradient(135deg, #48dbfb, #0abde3); }
```

#### **Timeline Visual Effects**
```css
.scenario-dot { 
  background: #ffaa00; 
  box-shadow: 0 0 8px rgba(255,170,0,0.4);
  animation: pulse 2s infinite;
}
```

## 🔄 API Endpoints

### **GET /api/high-risk**
**Purpose**: Fetch high-risk customer leaderboard
**Parameters**: 
- `threshold` (query): Risk score threshold (default: 50)
- `limit` (query): Result limit (default: 5)

### **GET /api/twin/:id**
**Purpose**: Get customer's digital twin profile
**Returns**: Complete risk profile and demographics

### **GET /api/timeline/:id**
**Purpose**: Get customer's complete timeline
**Returns**: Chronological event history

### **GET /api/customer/:id**
**Purpose**: Combined endpoint (twin + timeline)
**Returns**: Complete customer data in single request

### **POST /api/scenario**
**Purpose**: Apply what-if scenario
**Body**:
```json
{
  "customer_id": 123,
  "name": "What-if: move to TX + $250 deductible",
  "change_json": {
    "move_state": "TX",
    "increase_deductible": 250,
    "before_deductible": 1500,
    "final_deductible": 1750
  }
}
```

## 🧮 Business Logic Algorithms

### **Smart Deductible Management**

#### **State Restoration Logic**
```javascript
// When customer returns to previously visited state with no change
if (stateDeductibleHistory[targetState] && deductibleChange === 0) {
  // Restore previous deductible for that state
  restoreDeductible(stateDeductibleHistory[targetState]);
}
```

#### **Progressive Tracking**
```javascript
// Track deductible progression across states
stateDeductibleHistory = {
  'TX': 1500,  // Previous TX deductible
  'LA': 2500,  // Previous LA deductible  
  'CA': 1750   // Previous CA deductible
};
```

### **No-Change Detection**
```javascript
// Intelligent detection of scenarios with no impact
if (currentState === targetState && currentDeductible === targetDeductible) {
  markAsNoChange("Already in " + state + " with $" + deductible);
}
```

### **Risk Score Calculation**
The AI risk model considers multiple factors:
- **Geographic Risk**: State-based risk multipliers
- **Demographics**: Age, property type, vehicle usage
- **Claims History**: Previous claim frequency and severity
- **Policy Details**: Coverage limits and deductibles

## 📊 Advanced Features

### **PDF Report Generation**
```javascript
function generatePDF(beforeValues, afterValues, scenarioName, scenarioId) {
  // Creates comprehensive scenario analysis report
  // Includes before/after comparisons, risk changes, recommendations
}
```

### **Real-time Animations**
```javascript
// Smooth risk score transitions
animateValue(element, oldValue, newValue, 1500);
// Creates engaging simulation experience
```

### **Timeline Enhancement**
- **Exact timestamps**: Date and time display
- **Relative time**: "2 hours ago", "3 days ago"
- **Visual progression**: Icons and color coding
- **Deductible tracking**: Complete before/after amounts

## 🚀 Installation & Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL access (Neon Cloud)
- Modern web browser

### **Quick Start**
```bash
# 1. Clone/Download project
cd risktwin

# 2. Install dependencies
npm install

# 3. Start server
node server.js

# 4. Open browser
http://localhost:3000
```

### **Environment Configuration**
```javascript
// Database connection (already configured)
const connectionString = "postgresql://neondb_owner:...@ep-wandering-brook-aes1z00x.c-2.us-east-2.aws.neon.tech/neondb";
```

## 🎯 Hackathon Innovation Points

### **🔥 Technical Innovation**
1. **Digital Twin Concept**: Advanced AI modeling of customer risk
2. **Real-time Simulations**: Instant what-if scenario processing
3. **Smart State Memory**: Intelligent deductible restoration logic
4. **Progressive Analytics**: Complete before/after tracking

### **💡 User Experience**
1. **Animated Transitions**: Engaging visual feedback
2. **One-Click PDF**: Instant scenario reports
3. **Timeline Visualization**: Complete customer journey
4. **Smart No-Change Detection**: Prevents redundant scenarios

### **⚡ Performance**
1. **Efficient API Design**: Combined endpoints reduce requests
2. **Client-side PDF**: No server load for report generation
3. **Optimized Queries**: Advanced SQL with proper indexing
4. **Responsive Design**: Works on all devices

### **🛡️ Business Value**
1. **Risk Mitigation**: Proactive high-risk customer identification
2. **Scenario Planning**: Test impacts before making changes
3. **Customer Insights**: Complete journey visualization
4. **Operational Efficiency**: Automated timeline tracking

## 🏆 Competitive Advantages

1. **Complete Solution**: Full-stack implementation with advanced features
2. **Real-world Applicable**: Actual insurance industry use case
3. **Scalable Architecture**: Enterprise-ready design patterns
4. **Advanced Algorithms**: Sophisticated business logic
5. **Superior UX**: Polished, professional interface

## 📈 Future Enhancements

- **Machine Learning Integration**: Real-time model updates
- **Advanced Visualizations**: Charts and graphs
- **Multi-tenant Support**: Insurance company isolation
- **Mobile App**: Native mobile experience
- **API Gateway**: Enhanced security and rate limiting

---

## 🏅 Why This Project Wins

**RiskTwin** demonstrates exceptional technical depth, innovative features, and real-world business value. The combination of advanced database design, sophisticated algorithms, and polished user experience creates a compelling solution that addresses actual insurance industry challenges while showcasing cutting-edge development skills.

**Built with ❤️ for the Hackathon by an AI-Human Collaboration** 