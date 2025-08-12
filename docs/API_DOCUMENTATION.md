# 🚀 RiskTwin API Documentation

## 📡 API Overview

The **RiskTwin API** is a RESTful service built with **Node.js** and **Express.js** that provides real-time access to customer risk profiles, scenario simulations, and timeline analytics. Designed for high-performance insurance risk management with enterprise-grade reliability.

**Base URL**: `http://localhost:3000`
**Content-Type**: `application/json`
**CORS**: Enabled for cross-origin requests

## 🔧 Core Dependencies

```json
{
  "express": "^4.18.0",
  "pg": "^8.8.0",
  "cors": "^2.8.5"
}
```

## 📋 API Endpoints

### 🏥 **Health Check**

#### `GET /health`
**Purpose**: Server health and availability check

**Parameters**: None

**Response**:
```json
{
  "ok": true
}
```

**Use Case**: Load balancer health checks, monitoring systems

**Example**:
```bash
curl http://localhost:3000/health
```

---

### 📊 **High-Risk Customer Leaderboard**

#### `GET /api/high-risk`
**Purpose**: Retrieve customers with highest risk scores for proactive management

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `threshold` | number | 50 | Minimum risk score to include (0-100) |
| `limit` | number | 5 | Maximum number of results |

**Response**:
```json
[
  {
    "customer_id": 4,
    "name": "Carlos Ramirez",
    "state": "CA",
    "base_risk_score": "90.1000",
    "next12m_claim_prob": "0.860900000000000000000",
    "next12m_expected_loss": "7208.000000000000000000"
  },
  {
    "customer_id": 2,
    "name": "Rahul Mehta", 
    "state": "FL",
    "base_risk_score": "78.5000",
    "next12m_claim_prob": "0.756500000000000000000",
    "next12m_expected_loss": "6280.000000000000000000"
  }
]
```

**Business Logic**: 
- Calls `list_high_risk(threshold, limit)` SQL function
- Orders by risk score descending
- Numeric values converted to floats for calculations

**Example**:
```bash
# Get top 10 customers with risk score >= 75
curl "http://localhost:3000/api/high-risk?threshold=75&limit=10"
```

---

### 👤 **Individual Customer Twin**

#### `GET /api/twin/:id`
**Purpose**: Retrieve complete digital twin profile for specific customer

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Customer ID |

**Response**:
```json
{
  "customer_id": 4,
  "name": "Carlos Ramirez",
  "state": "CA",
  "city": "Los Angeles",
  "zip": "90210",
  "base_risk_score": 90.1,
  "next12m_claim_prob": 0.8609,
  "next12m_expected_loss": 7208.0,
  "updated_at": "2025-08-11T03:58:01.908Z"
}
```

**Data Processing**:
- `base_risk_score`: Converted to float for UI animations
- `next12m_claim_prob`: Converted to float (0-1 scale)
- `next12m_expected_loss`: Converted to float for currency display

**Error Handling**:
- Returns `null` if customer not found
- 500 status for database errors

**Example**:
```bash
curl http://localhost:3000/api/twin/4
```

---

### 📅 **Customer Timeline**

#### `GET /api/timeline/:id`
**Purpose**: Retrieve complete chronological event history for customer

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Customer ID |

**Response**:
```json
[
  {
    "event_ts": "2025-01-01T00:00:00.000Z",
    "title": "Customer Onboarded",
    "details": "Initial risk assessment completed",
    "tag": "onboarding"
  },
  {
    "event_ts": "2025-08-10T23:36:50.000Z",
    "title": "What-if: move to WA + $250 deductible",
    "details": "Applied scenario: moved to WA, increased deductible by $250 | Final deductible: $1750 in WA",
    "tag": "scenario"
  }
]
```

**Event Tags**:
- **`onboarding`**: Initial customer setup
- **`scenario`**: What-if simulations
- **`assessment`**: Risk profile updates
- **`policy`**: Policy changes
- **`claim`**: Claims processing

**Timeline Features**:
- Events ordered chronologically
- Rich detail formatting for UI parsing
- Deductible progression tracking

**Example**:
```bash
curl http://localhost:3000/api/timeline/4
```

---

### 🔄 **Combined Customer Data**

#### `GET /api/customer/:id`
**Purpose**: Efficient endpoint combining twin profile and timeline in single request

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Customer ID |

**Response**:
```json
{
  "id": 4,
  "twin": {
    "customer_id": 4,
    "name": "Carlos Ramirez",
    "state": "CA",
    "city": "Los Angeles", 
    "zip": "90210",
    "base_risk_score": 90.1,
    "next12m_claim_prob": 0.8609,
    "next12m_expected_loss": 7208.0,
    "updated_at": "2025-08-11T03:58:01.908Z"
  },
  "timeline": [
    {
      "event_ts": "2025-01-01T00:00:00.000Z",
      "title": "Customer Onboarded", 
      "details": "Initial risk assessment completed",
      "tag": "onboarding"
    }
  ],
  "timeline_count": 1
}
```

**Performance Benefits**:
- Single round-trip for complete customer view
- Parallel query execution using `Promise.all()`
- Optimized for dashboard loading

**Example**:
```bash
curl http://localhost:3000/api/customer/4
```

---

### 🎯 **Apply Scenario Simulation**

#### `POST /api/scenario`
**Purpose**: Apply what-if scenario and automatically create timeline event

**Request Body**:
```json
{
  "customer_id": 4,
  "name": "What-if: move to TX + $250 deductible",
  "change_json": {
    "move_state": "TX",
    "increase_deductible": 250,
    "before_deductible": 1500,
    "final_deductible": 1750
  }
}
```

**Advanced Scenario Parameters**:

#### **State Move with Deductible Increase**:
```json
{
  "customer_id": 2,
  "name": "What-if: move to CA + $500 deductible",
  "change_json": {
    "move_state": "CA",
    "increase_deductible": 500,
    "before_deductible": 1500,
    "final_deductible": 2000
  }
}
```

#### **Deductible Decrease**:
```json
{
  "customer_id": 2,
  "name": "What-if: decrease deductible by $300",
  "change_json": {
    "decrease_deductible": 300,
    "before_deductible": 1750,
    "final_deductible": 1450
  }
}
```

#### **State Restoration**:
```json
{
  "customer_id": 4,
  "name": "What-if: move to TX (restore deductible)",
  "change_json": {
    "move_state": "TX",
    "restore_deductible": 1500
  }
}
```

#### **No-Change Detection**:
```json
{
  "customer_id": 4,
  "name": "What-if: no change (already optimal)",
  "change_json": {
    "no_change": true,
    "reason": "Already in TX with $1500 deductible"
  }
}
```

**Response**:
```json
{
  "scenario_id": 12
}
```

**Automatic Timeline Creation**:
The API automatically creates a corresponding timeline event with enhanced details:

**For Increases**:
```
"Applied scenario: moved to TX, increased deductible by $250 | Final deductible: $1750 in TX"
```

**For Decreases**:
```  
"Applied scenario: decreased deductible by $300 | Final deductible: $1450"
```

**For No-Change**:
```
"Applied scenario: no change - Already in TX with $1500 deductible"
```

**Business Logic Flow**:
1. Insert scenario into `scenarios` table
2. Generate detailed timeline description
3. Insert timeline event into `timeline_events` table
4. Return scenario ID for tracking

**Example**:
```bash
curl -X POST http://localhost:3000/api/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 4,
    "name": "What-if: move to FL + $300 deductible", 
    "change_json": {
      "move_state": "FL",
      "increase_deductible": 300,
      "before_deductible": 1750,
      "final_deductible": 2050
    }
  }'
```

---

## 🧠 Advanced Business Logic

### **Smart Deductible Management**

The API implements sophisticated deductible logic based on UI-calculated values:

#### **State-Based Memory**:
- Tracks deductible history per state
- Automatic restoration when returning to previous states
- Progressive tracking of all changes

#### **Before/After Calculation**:
- UI calculates `before_deductible` and `final_deductible`
- Server uses these for accurate timeline generation
- Fallback to baseline calculations if UI data unavailable

#### **Change Detection**:
```javascript
// Server-side timeline generation
if (change_json.increase_deductible) {
  details += `, increased deductible by $${change_json.increase_deductible}`;
  if (change_json.before_deductible !== undefined) {
    details += ` | Final deductible: $${change_json.final_deductible}`;
  }
} else if (change_json.decrease_deductible) {
  details += `, decreased deductible by $${change_json.decrease_deductible}`;
  if (change_json.before_deductible !== undefined) {
    details += ` | Final deductible: $${change_json.final_deductible}`;
  }
}
```

### **Error Handling**

#### **Database Connection Errors**:
```json
{
  "error": "Connection timeout"
}
```

#### **Invalid Customer ID**:
```json
{
  "twin": null,
  "timeline": [],
  "timeline_count": 0
}
```

#### **Malformed Scenario Data**:
```json
{
  "error": "Invalid JSON in change_json field"
}
```

### **Performance Optimizations**

#### **Connection Pooling**:
```javascript
const pool = new Pool({ connectionString });
// Reuses connections for optimal performance
```

#### **Parallel Queries**:
```javascript
const [twinResult, timelineResult] = await Promise.all([
  pool.query('SELECT * FROM get_twin($1)', [customerId]),
  pool.query('SELECT * FROM timeline_for_customer($1)', [customerId])
]);
```

#### **Prepared Statements**:
All queries use parameterized statements to prevent SQL injection and improve performance.

---

## 🔒 Security Features

### **SQL Injection Prevention**:
```javascript
// Safe parameterized queries
await pool.query('SELECT * FROM get_twin($1)', [customerId]);
// NOT: `SELECT * FROM get_twin(${customerId})`
```

### **CORS Configuration**:
```javascript
app.use(cors()); // Allows cross-origin requests for web dashboard
```

### **Input Validation**:
- Customer IDs converted to integers
- Numeric thresholds validated
- JSON schema validation for scenario parameters

### **Error Sanitization**:
- Database errors logged server-side
- Sanitized error messages returned to clients
- No sensitive information exposed

---

## 📊 API Usage Patterns

### **Dashboard Loading Sequence**:
1. `GET /api/high-risk` - Load leaderboard
2. `GET /api/customer/:id` - Load selected customer details
3. `POST /api/scenario` - Apply what-if scenarios
4. `GET /api/customer/:id` - Refresh with new data

### **Real-time Simulation Flow**:
1. User selects scenario parameters in UI
2. UI calculates before/after values using state memory
3. `POST /api/scenario` with complete change data
4. Server creates timeline event with progression details
5. UI displays animated transitions and updated timeline

### **Performance Monitoring**:
- Health check every 30 seconds: `GET /health`
- Connection pool metrics in server logs
- Query execution times tracked

---

## 🚀 Deployment Configuration

### **Environment Variables**:
```javascript
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL || "postgresql://...";
```

### **Production Optimizations**:
- Connection pool sizing based on load
- Query result caching for static data
- Rate limiting for scenario endpoints
- Comprehensive logging and monitoring

### **Docker Support**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🧪 Testing Examples

### **Load Testing**:
```bash
# Test high-risk endpoint under load
ab -n 1000 -c 10 http://localhost:3000/api/high-risk

# Test scenario creation performance  
ab -n 500 -c 5 -p scenario.json -T application/json \
   http://localhost:3000/api/scenario
```

### **Integration Testing**:
```javascript
// Test complete customer workflow
const customer = await fetch('/api/customer/4');
const scenario = await fetch('/api/scenario', {
  method: 'POST',
  body: JSON.stringify(scenarioData)
});
const updatedCustomer = await fetch('/api/customer/4');
```

---

This API design provides a robust, scalable foundation for enterprise insurance risk management while maintaining simplicity and performance for real-time dashboard interactions. 