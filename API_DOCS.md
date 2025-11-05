# REST API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
The REST API endpoints are **public** and do not require authentication.

---

## Endpoints

### 1. Get All Players

Retrieve a list of all players with optional filtering.

**Endpoint:** `GET /api/players`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | Search in name, position, nationality, or tags (case-insensitive) |
| position | string | Filter by exact position (Goalkeeper, Defender, Midfielder, Forward) |

**Example Requests:**

```bash
# Get all players
curl http://localhost:3000/api/players

# Search by text
curl "http://localhost:3000/api/players?search=Salah"

# Filter by position
curl "http://localhost:3000/api/players?position=Forward"

# Combine filters
curl "http://localhost:3000/api/players?position=Midfielder&search=England"
```

**Success Response (200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Mohamed Salah",
    "position": "Forward",
    "squadNumber": 11,
    "nationality": "Egypt",
    "heightCm": 175,
    "dateOfBirth": "1992-06-15T00:00:00.000Z",
    "stats": {
      "appearances": 250,
      "goals": 180,
      "assists": 70,
      "minutes": 20000
    },
    "tags": ["Captain", "Legend"],
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get Player by ID

Retrieve detailed information about a specific player.

**Endpoint:** `GET /api/players/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | MongoDB ObjectId of the player |

**Example Request:**

```bash
curl http://localhost:3000/api/players/507f1f77bcf86cd799439011
```

**Success Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Mohamed Salah",
  "position": "Forward",
  "squadNumber": 11,
  "nationality": "Egypt",
  "heightCm": 175,
  "dateOfBirth": "1992-06-15T00:00:00.000Z",
  "stats": {
    "appearances": 250,
    "goals": 180,
    "assists": 70,
    "minutes": 20000
  },
  "tags": ["Captain", "Legend"],
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request - Invalid ID format
{
  "error": "Invalid player ID"
}

// 404 Not Found - Player doesn't exist
{
  "error": "Player not found"
}
```

---

### 3. Create Player

Add a new player to the database.

**Endpoint:** `POST /api/players`

**Content-Type:** `multipart/form-data` or `application/x-www-form-urlencoded`

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Player's full name |
| position | string | No | Goalkeeper, Defender, Midfielder, or Forward (default: Midfielder) |
| squadNumber | number | No | Jersey number (1-99) |
| nationality | string | No | Player's nationality |
| heightCm | number | No | Height in centimeters |
| dateOfBirth | date | No | Birth date (ISO 8601 format) |
| stats.appearances | number | No | Number of appearances (default: 0) |
| stats.goals | number | No | Number of goals scored (default: 0) |
| stats.assists | number | No | Number of assists (default: 0) |
| stats.minutes | number | No | Minutes played (default: 0) |
| tags | string or array | No | Comma-separated tags or array |

**Example Requests:**

```bash
# PowerShell
curl -X POST http://localhost:3000/api/players `
  -F "name=Mohamed Salah" `
  -F "position=Forward" `
  -F "squadNumber=11" `
  -F "nationality=Egypt" `
  -F "heightCm=175" `
  -F "dateOfBirth=1992-06-15" `
  -F "stats[appearances]=250" `
  -F "stats[goals]=180" `
  -F "stats[assists]=70" `
  -F "stats[minutes]=20000" `
  -F "tags=Captain,Legend,Egyptian King"

# Bash (Linux/Mac)
curl -X POST http://localhost:3000/api/players \
  -F "name=Mohamed Salah" \
  -F "position=Forward" \
  -F "squadNumber=11" \
  -F "nationality=Egypt" \
  -F "heightCm=175" \
  -F "dateOfBirth=1992-06-15" \
  -F "stats[appearances]=250" \
  -F "stats[goals]=180" \
  -F "stats[assists]=70" \
  -F "stats[minutes]=20000" \
  -F "tags=Captain,Legend"
```

**Using JavaScript (fetch):**

```javascript
const formData = new FormData();
formData.append('name', 'Mohamed Salah');
formData.append('position', 'Forward');
formData.append('squadNumber', '11');
formData.append('nationality', 'Egypt');
formData.append('heightCm', '175');
formData.append('dateOfBirth', '1992-06-15');
formData.append('stats[appearances]', '250');
formData.append('stats[goals]', '180');
formData.append('stats[assists]', '70');
formData.append('stats[minutes]', '20000');
formData.append('tags', 'Captain,Legend');

fetch('http://localhost:3000/api/players', {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(data => console.log(data));
```

**Success Response (201 Created):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Mohamed Salah",
  "position": "Forward",
  "squadNumber": 11,
  "nationality": "Egypt",
  "heightCm": 175,
  "dateOfBirth": "1992-06-15T00:00:00.000Z",
  "stats": {
    "appearances": 250,
    "goals": 180,
    "assists": 70,
    "minutes": 20000
  },
  "tags": ["Captain", "Legend"],
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

**Error Response (400):**

```json
{
  "error": "Player name is required"
}
```

---

### 4. Update Player

Update an existing player's information.

**Endpoint:** `PUT /api/players/:id`

**Content-Type:** `multipart/form-data` or `application/x-www-form-urlencoded`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | MongoDB ObjectId of the player |

**Body Parameters:**
All parameters are optional. Only include fields you want to update.

| Parameter | Type | Description |
|-----------|------|-------------|
| name | string | Player's full name |
| position | string | Goalkeeper, Defender, Midfielder, or Forward |
| squadNumber | number | Jersey number (1-99) |
| nationality | string | Player's nationality |
| heightCm | number | Height in centimeters |
| dateOfBirth | date | Birth date (ISO 8601 format) |
| stats.appearances | number | Number of appearances |
| stats.goals | number | Number of goals scored |
| stats.assists | number | Number of assists |
| stats.minutes | number | Minutes played |
| tags | string or array | Comma-separated tags or array |

**Example Requests:**

```bash
# Update stats only
curl -X PUT http://localhost:3000/api/players/507f1f77bcf86cd799439011 `
  -F "stats[goals]=181" `
  -F "stats[assists]=71"

# Update multiple fields
curl -X PUT http://localhost:3000/api/players/507f1f77bcf86cd799439011 `
  -F "squadNumber=11" `
  -F "stats[appearances]=251" `
  -F "stats[goals]=181" `
  -F "tags=Captain,Legend,Top Scorer"
```

**Success Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Mohamed Salah",
  "position": "Forward",
  "squadNumber": 11,
  "nationality": "Egypt",
  "heightCm": 175,
  "dateOfBirth": "1992-06-15T00:00:00.000Z",
  "stats": {
    "appearances": 251,
    "goals": 181,
    "assists": 71,
    "minutes": 20090
  },
  "tags": ["Captain", "Legend", "Top Scorer"],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-06-15T10:30:00.000Z"
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "error": "Invalid player ID"
}

// 404 Not Found
{
  "error": "Player not found"
}
```

---

### 5. Delete Player

Remove a player from the database.

**Endpoint:** `DELETE /api/players/:id`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | MongoDB ObjectId of the player |

**Example Request:**

```bash
curl -X DELETE http://localhost:3000/api/players/507f1f77bcf86cd799439011
```

**Success Response (200):**

```json
{
  "message": "Player deleted successfully"
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "error": "Invalid player ID"
}

// 404 Not Found
{
  "error": "Player not found"
}
```

---

## Data Types

### Player Object

```typescript
{
  _id: ObjectId,              // MongoDB ObjectId (auto-generated)
  name: string,               // Required
  position: string,           // Goalkeeper|Defender|Midfielder|Forward
  squadNumber: number | null, // 1-99
  nationality: string,
  heightCm: number | null,    // Height in centimeters
  dateOfBirth: Date | null,   // ISO 8601 date
  stats: {
    appearances: number,      // Default: 0
    goals: number,            // Default: 0
    assists: number,          // Default: 0
    minutes: number           // Default: 0
  },
  tags: string[],             // Array of strings
  createdAt: Date,            // Auto-generated
  updatedAt?: Date            // Set on update
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Invalid input or ID format |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error |

---

## Testing with Postman

### Import Collection

Create a new Postman collection with these requests:

1. **Get All Players**
   - Method: GET
   - URL: `http://localhost:3000/api/players`

2. **Search Players**
   - Method: GET
   - URL: `http://localhost:3000/api/players?search=Salah`

3. **Get Player by ID**
   - Method: GET
   - URL: `http://localhost:3000/api/players/{{playerId}}`

4. **Create Player**
   - Method: POST
   - URL: `http://localhost:3000/api/players`
   - Body: form-data
     - name: Mohamed Salah
     - position: Forward
     - squadNumber: 11

5. **Update Player**
   - Method: PUT
   - URL: `http://localhost:3000/api/players/{{playerId}}`
   - Body: form-data
     - stats[goals]: 181

6. **Delete Player**
   - Method: DELETE
   - URL: `http://localhost:3000/api/players/{{playerId}}`

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common errors:
- **Invalid player ID**: The ID format is not a valid MongoDB ObjectId
- **Player not found**: No player exists with the given ID
- **Player name is required**: POST request missing required name field
- **Internal server error**: Database or server issue

---

## Rate Limiting

Currently, there is **no rate limiting** on the API. For production:
- Consider adding rate limiting middleware (express-rate-limit)
- Implement API key authentication for higher limits
- Add CORS restrictions for specific origins

---

## Best Practices

1. **Always validate ObjectId** before querying
2. **Use proper HTTP methods** (GET for read, POST for create, PUT for update, DELETE for delete)
3. **Handle errors gracefully** on the client side
4. **Include all required fields** when creating players
5. **Use ISO 8601 format** for dates (YYYY-MM-DD)
6. **Check response status codes** before processing data

---

## Examples in Different Languages

### Python (requests)

```python
import requests

# Get all players
response = requests.get('http://localhost:3000/api/players')
players = response.json()

# Create player
data = {
    'name': 'Mohamed Salah',
    'position': 'Forward',
    'squadNumber': '11',
    'nationality': 'Egypt'
}
response = requests.post('http://localhost:3000/api/players', data=data)
new_player = response.json()

# Update player
update_data = {'stats[goals]': '181'}
response = requests.put(f'http://localhost:3000/api/players/{player_id}', data=update_data)

# Delete player
response = requests.delete(f'http://localhost:3000/api/players/{player_id}')
```

### Node.js (axios)

```javascript
const axios = require('axios');

// Get all players
const players = await axios.get('http://localhost:3000/api/players');
console.log(players.data);

// Create player
const formData = new FormData();
formData.append('name', 'Mohamed Salah');
formData.append('position', 'Forward');
const newPlayer = await axios.post('http://localhost:3000/api/players', formData);

// Update player
const updateData = new FormData();
updateData.append('stats[goals]', '181');
await axios.put(`http://localhost:3000/api/players/${playerId}`, updateData);

// Delete player
await axios.delete(`http://localhost:3000/api/players/${playerId}`);
```

---

## Support

For issues or questions, refer to the main `README.md` or check the source code in `server.js`.
