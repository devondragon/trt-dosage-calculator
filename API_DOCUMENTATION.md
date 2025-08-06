# TRT Dosage Calculator API Documentation

## Overview

The TRT Dosage Calculator API provides endpoints to calculate testosterone replacement therapy (TRT) injection dosages based on target weekly dose, testosterone concentration, and injection frequency.

**Base URL**: `https://your-worker-domain.workers.dev`

## Authentication

No authentication is required for the public API endpoints.

## CORS

All API endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Endpoints

### 1. Calculate Dosage (Legacy)

**Endpoint**: `/calculate-dose`  
**Method**: `GET`  
**Description**: Calculate injection dosage using query parameters (backward compatibility endpoint)

#### Query Parameters

| Parameter | Type | Required | Description | Constraints |
|-----------|------|----------|-------------|-------------|
| `targetWeeklyDose` | number | Yes | Target weekly testosterone dose in mg | 0 < value ≤ 1000 |
| `testosteroneStrength` | number | Yes | Testosterone concentration in mg/ml | 0 < value ≤ 500 |
| `shotsPerWeek` | integer | Conditional* | Number of injections per week | 1 ≤ value ≤ 7 |
| `shotEveryXDays` | number | Conditional* | Days between injections | 0 < value ≤ 30 |

*Either `shotsPerWeek` OR `shotEveryXDays` must be provided, but not both.

#### Response

**Success (200 OK)**
```json
{
  "dosePerShotMl": "0.250"
}
```

**Error (400 Bad Request)**
```json
{
  "error": "Error message describing the issue"
}
```

#### Example Request
```bash
curl "https://your-domain.workers.dev/calculate-dose?targetWeeklyDose=100&testosteroneStrength=200&shotsPerWeek=2"
```

---

### 2. Calculate Dosage (Versioned API)

**Endpoint**: `/api/v1/calculate`  
**Methods**: `GET`, `POST`  
**Description**: Calculate injection dosage with detailed response information

#### GET Method

Uses the same query parameters as the legacy endpoint.

#### POST Method

**Headers**
```
Content-Type: application/json
```

**Request Body**
```json
{
  "targetWeeklyDose": 100,
  "testosteroneStrength": 200,
  "shotsPerWeek": 2
}
```

Or with days between shots:
```json
{
  "targetWeeklyDose": 100,
  "testosteroneStrength": 200,
  "shotEveryXDays": 3.5
}
```

#### Response

**Success (200 OK)**
```json
{
  "dosePerShotMl": "0.250",
  "dosePerShotMg": "50.0",
  "shotsPerWeek": "2.00",
  "frequency": "2 times per week"
}
```

**Error (400 Bad Request)**
```json
{
  "error": "Target weekly dose must be between 0 and 1000 mg"
}
```

#### Example Requests

**GET Request**
```bash
curl "https://your-domain.workers.dev/api/v1/calculate?targetWeeklyDose=140&testosteroneStrength=250&shotEveryXDays=7"
```

**POST Request**
```bash
curl -X POST "https://your-domain.workers.dev/api/v1/calculate" \
  -H "Content-Type: application/json" \
  -d '{"targetWeeklyDose": 100, "testosteroneStrength": 200, "shotsPerWeek": 2}'
```

---

### 3. Web Interface

**Endpoint**: `/`  
**Method**: `GET`  
**Description**: Serves an HTML form interface for the calculator

#### Features
- Mobile-responsive design
- Input validation
- Local storage for user preferences
- Loading states and animations
- Medical disclaimer
- Measurement guide

---

## Error Handling

### HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters or validation failure |
| 404 | Not Found - Invalid endpoint |

### Common Error Messages

| Error Message | Cause |
|---------------|-------|
| "Target weekly dose must be between 0 and 1000 mg" | Weekly dose outside valid range |
| "Testosterone strength must be between 0 and 500 mg/ml" | Concentration outside valid range |
| "Please specify either shots per week or days between shots" | Missing frequency parameter |
| "Please specify only one frequency option" | Both frequency parameters provided |
| "Shots per week must be between 0 and 7" | Invalid shots per week value |
| "Days between shots must be between 0 and 30" | Invalid days between shots value |
| "Invalid request format" | Malformed JSON in POST request |

---

## Calculation Formula

The API calculates the dosage using the following formulas:

1. **For shots per week**: 
   - Dose per shot (mg) = Target Weekly Dose ÷ Shots Per Week
   - Dose per shot (ml) = Dose per shot (mg) ÷ Testosterone Strength

2. **For days between shots**:
   - Shots per week = 7 ÷ Days Between Shots
   - Then applies the same formula as above

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

---

## Examples

### JavaScript/Fetch
```javascript
// Using the versioned API with POST
const response = await fetch('https://your-domain.workers.dev/api/v1/calculate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    targetWeeklyDose: 100,
    testosteroneStrength: 200,
    shotsPerWeek: 2
  })
});

const data = await response.json();
console.log(`Inject ${data.dosePerShotMl} ml per shot`);
```

### Python
```python
import requests

# Using the versioned API
url = "https://your-domain.workers.dev/api/v1/calculate"
payload = {
    "targetWeeklyDose": 100,
    "testosteroneStrength": 200,
    "shotsPerWeek": 2
}

response = requests.post(url, json=payload)
data = response.json()
print(f"Inject {data['dosePerShotMl']} ml per shot")
```

### cURL
```bash
# GET request
curl "https://your-domain.workers.dev/api/v1/calculate?targetWeeklyDose=100&testosteroneStrength=200&shotsPerWeek=2"

# POST request
curl -X POST "https://your-domain.workers.dev/api/v1/calculate" \
  -H "Content-Type: application/json" \
  -d '{"targetWeeklyDose": 100, "testosteroneStrength": 200, "shotsPerWeek": 2}'
```

---

## Medical Disclaimer

This calculator is for informational purposes only. Always consult with your healthcare provider before making any changes to your medication regimen. The calculations provided should be verified by a medical professional.

---

## Support

For issues or feature requests, please open an issue on the [GitHub repository](https://github.com/yourusername/trt-dosage-calculator).