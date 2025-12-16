# Backend API Reference

**Base URL:** `http://localhost:8000/api` (local) | `https://your-backend.onrender.com/api` (production)  
**Authentication:** JWT Bearer tokens  
**Date Format:** ISO 8601 (`2025-11-24T12:00:00Z`)  
**API Version:** v1.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Collectibles](#collectibles)
3. [Vendors](#vendors)
4. [Card Details](#card-details)
5. [Dashboard](#dashboard)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

All authenticated endpoints require a JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### 1.1 Register User

**Endpoint:** `POST /api/auth/register/`  
**Authentication:** None (public)  
**Description:** Create a new user account

**Request Body:**
```json
{
  "email": "collector@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

**Validation Rules:**
- `email`: Valid email format, must be unique
- `password`: Minimum 8 characters, must contain letter + number
- `password_confirm`: Must match `password`

**Response:** `201 Created`
```json
{
  "id": 1,
  "email": "collector@example.com",
  "vendor": {
    "id": 1,
    "name": "collector@example.com's Vendor",
    "created_at": "2025-11-24T12:00:00Z",
    "updated_at": "2025-11-24T12:00:00Z"
  },
  "created_at": "2025-11-24T12:00:00Z"
}
```

**Notes:**
- Automatically creates a vendor profile for the user
- Vendor name defaults to `<email>'s Vendor`
- User can update vendor name later

**Error Responses:**
```json
// 400 Bad Request - Validation error
{
  "email": ["User with this email already exists."],
  "password": ["Password must contain at least one number."]
}

// 400 Bad Request - Password mismatch
{
  "password_confirm": ["Passwords do not match."]
}
```

---

### 1.2 Obtain JWT Token (Login)

**Endpoint:** `POST /api/auth/token/`  
**Authentication:** None (public)  
**Description:** Login with email/password to get JWT tokens

**Request Body:**
```json
{
  "email": "collector@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Token Lifetimes:**
- Access token: 5 minutes
- Refresh token: 1 day

**Error Responses:**
```json
// 401 Unauthorized - Invalid credentials
{
  "detail": "No active account found with the given credentials"
}
```

**Usage Example:**
```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email": "collector@example.com", "password": "SecurePass123!"}'
```

---

### 1.3 Refresh JWT Token

**Endpoint:** `POST /api/auth/token/refresh/`  
**Authentication:** None (public, but requires valid refresh token)  
**Description:** Get a new access token using refresh token

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:** `200 OK`
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid or expired refresh token
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

**Frontend Flow:**
1. Store both `access` and `refresh` tokens after login
2. Use `access` token for all API requests
3. When you get a 401 error, use `refresh` token to get new `access` token
4. Retry original request with new `access` token
5. If refresh fails, redirect to login

---

### 1.4 Verify JWT Token

**Endpoint:** `POST /api/auth/token/verify/`  
**Authentication:** None (public)  
**Description:** Check if a token is valid

**Request Body:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response:** `200 OK`
```json
{}
```

**Error Responses:**
```json
// 401 Unauthorized - Invalid token
{
  "detail": "Token is invalid or expired",
  "code": "token_not_valid"
}
```

**Use Case:** Check if stored token is still valid before making API calls

---

## Collectibles

All collectible endpoints are **scoped to the authenticated user's vendor**. Users can only see/modify their own items.

### 2.1 List Collectibles

**Endpoint:** `GET /api/collectibles/`  
**Authentication:** Required  
**Description:** Get paginated list of collectibles with filtering and sorting

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Full-text search across name, description, SKU | `?search=pokemon` |
| `category` | string | Filter by category (exact match) | `?category=Trading%20Cards` |
| `condition` | string | Filter by condition | `?condition=Mint` |
| `min_intake_price` | decimal | Minimum intake price | `?min_intake_price=10.00` |
| `max_intake_price` | decimal | Maximum intake price | `?max_intake_price=100.00` |
| `min_projected_sell_price` | decimal | Minimum sell price | `?min_projected_sell_price=20.00` |
| `max_projected_sell_price` | decimal | Maximum sell price | `?max_projected_sell_price=200.00` |
| `in_stock` | boolean | Only items with quantity > 0 | `?in_stock=true` |
| `ordering` | string | Sort field (prefix with `-` for descending) | `?ordering=-created_at` |
| `page` | integer | Page number (default: 1) | `?page=2` |
| `page_size` | integer | Items per page (default: 20, max: 100) | `?page_size=50` |

**Available Sort Fields:**
- `name` - Alphabetical by name
- `created_at` - Date added (oldest/newest first)
- `updated_at` - Last modified
- `intake_price` - Price paid
- `projected_sell_price` - Expected sell price
- `quantity_in_stock` - Stock quantity

**Response:** `200 OK`
```json
{
  "count": 156,
  "next": "http://localhost:8000/api/collectibles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "vendor": 1,
      "name": "Charizard Holo 1st Edition",
      "description": "Base Set Charizard in pristine condition",
      "sku": "PKMN-BASE-004-1ST",
      "category": "Trading Cards",
      "condition": "Mint",
      "intake_price": "450.00",
      "projected_sell_price": "800.00",
      "quantity_in_stock": 1,
      "location": "Safe A1",
      "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/charizard.jpg",
      "card_details": {
        "game": "Pokemon",
        "set_name": "Base Set",
        "card_number": "4",
        "rarity": "Holo Rare",
        "is_first_edition": true,
        "is_graded": true,
        "grade_score": "9.5",
        "grading_company": "PSA"
      },
      "created_at": "2025-11-24T12:00:00Z",
      "updated_at": "2025-11-24T12:00:00Z"
    },
    {
      "id": 2,
      "vendor": 1,
      "name": "Supreme Box Logo Hoodie",
      "description": "Black on black, size L, never worn",
      "sku": "SUPR-FW23-BOGO-BLK-L",
      "category": "Fashion",
      "condition": "Mint",
      "intake_price": "600.00",
      "projected_sell_price": "1200.00",
      "quantity_in_stock": 1,
      "location": "Closet Shelf 3",
      "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/supreme.jpg",
      "card_details": null,
      "created_at": "2025-11-23T10:30:00Z",
      "updated_at": "2025-11-23T10:30:00Z"
    }
  ]
}
```

**Field Descriptions:**
- `id`: Unique identifier
- `vendor`: Vendor ID (always your vendor for your requests)
- `name`: Item name (max 255 chars)
- `description`: Detailed description (optional, text field)
- `sku`: Stock Keeping Unit, must be unique per vendor (max 100 chars)
- `category`: Free-text category (max 100 chars)
- `condition`: Item condition (max 50 chars)
- `intake_price`: What you paid for the item (decimal, 2 decimals)
- `projected_sell_price`: What you plan to sell for (decimal, 2 decimals)
- `quantity_in_stock`: How many you have (integer, min 0)
- `location`: Physical storage location (optional, max 255 chars)
- `image_url`: URL to image (optional, max 500 chars)
- `card_details`: Trading card specific data (null if not a card)
- `created_at`: When item was added
- `updated_at`: Last modification time

**Example Queries:**

```bash
# Search for Pokemon cards
GET /api/collectibles/?search=pokemon

# Get all Mint condition items sorted by highest price
GET /api/collectibles/?condition=Mint&ordering=-projected_sell_price

# Get Trading Cards with intake price between $10-$50
GET /api/collectibles/?category=Trading%20Cards&min_intake_price=10&max_intake_price=50

# Get page 2 of results, 50 per page, newest first
GET /api/collectibles/?page=2&page_size=50&ordering=-created_at

# Get only items in stock
GET /api/collectibles/?in_stock=true
```

---

### 2.2 Create Collectible

**Endpoint:** `POST /api/collectibles/`  
**Authentication:** Required  
**Description:** Add a new collectible to your inventory

**Request Body:**
```json
{
  "name": "Charizard Holo 1st Edition",
  "description": "Base Set Charizard in pristine condition",
  "sku": "PKMN-BASE-004-1ST",
  "category": "Trading Cards",
  "condition": "Mint",
  "intake_price": "450.00",
  "projected_sell_price": "800.00",
  "quantity_in_stock": 1,
  "location": "Safe A1",
  "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/charizard.jpg"
}
```

**Required Fields:**
- `name` (max 255 chars)
- `sku` (max 100 chars, must be unique per vendor)
- `category` (max 100 chars)
- `intake_price` (decimal, must be ≥ 0)
- `projected_sell_price` (decimal, must be ≥ 0)
- `quantity_in_stock` (integer, must be ≥ 0)

**Optional Fields:**
- `description` (text, no limit)
- `condition` (max 50 chars)
- `location` (max 255 chars)
- `image_url` (max 500 chars, must be valid URL)

**Response:** `201 Created`
```json
{
  "id": 1,
  "vendor": 1,
  "name": "Charizard Holo 1st Edition",
  "description": "Base Set Charizard in pristine condition",
  "sku": "PKMN-BASE-004-1ST",
  "category": "Trading Cards",
  "condition": "Mint",
  "intake_price": "450.00",
  "projected_sell_price": "800.00",
  "quantity_in_stock": 1,
  "location": "Safe A1",
  "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/charizard.jpg",
  "card_details": null,
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T12:00:00Z"
}
```

**Notes:**
- `vendor` is automatically set to your vendor (from JWT token)
- `card_details` can be added separately (see Card Details section)
- Image upload should happen client-side to Supabase, then pass URL here

**Error Responses:**
```json
// 400 Bad Request - Validation error
{
  "sku": ["Collectible with this SKU already exists for this vendor."],
  "intake_price": ["Must be a positive number."],
  "image_url": ["Enter a valid URL."]
}

// 400 Bad Request - Negative price
{
  "intake_price": ["Ensure this value is greater than or equal to 0."],
  "quantity_in_stock": ["Ensure this value is greater than or equal to 0."]
}
```

---

### 2.3 Get Single Collectible

**Endpoint:** `GET /api/collectibles/{id}/`  
**Authentication:** Required  
**Description:** Get details of a specific collectible

**Path Parameters:**
- `id` (integer): Collectible ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "vendor": 1,
  "name": "Charizard Holo 1st Edition",
  "description": "Base Set Charizard in pristine condition",
  "sku": "PKMN-BASE-004-1ST",
  "category": "Trading Cards",
  "condition": "Mint",
  "intake_price": "450.00",
  "projected_sell_price": "800.00",
  "quantity_in_stock": 1,
  "location": "Safe A1",
  "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/charizard.jpg",
  "card_details": {
    "game": "Pokemon",
    "set_name": "Base Set",
    "card_number": "4",
    "rarity": "Holo Rare",
    "is_first_edition": true,
    "is_graded": true,
    "grade_score": "9.5",
    "grading_company": "PSA"
  },
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T12:00:00Z"
}
```

**Error Responses:**
```json
// 404 Not Found - Item doesn't exist or doesn't belong to your vendor
{
  "detail": "Not found."
}
```

---

### 2.4 Update Collectible

**Endpoint:** `PUT /api/collectibles/{id}/` (full update)  
**Endpoint:** `PATCH /api/collectibles/{id}/` (partial update)  
**Authentication:** Required  
**Description:** Update an existing collectible

**Path Parameters:**
- `id` (integer): Collectible ID

**Request Body (PATCH - partial update):**
```json
{
  "quantity_in_stock": 0,
  "projected_sell_price": "900.00"
}
```

**Request Body (PUT - full update, all required fields needed):**
```json
{
  "name": "Charizard Holo 1st Edition",
  "description": "Base Set Charizard - SOLD",
  "sku": "PKMN-BASE-004-1ST",
  "category": "Trading Cards",
  "condition": "Mint",
  "intake_price": "450.00",
  "projected_sell_price": "900.00",
  "quantity_in_stock": 0,
  "location": "Sold",
  "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/charizard.jpg"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "vendor": 1,
  "name": "Charizard Holo 1st Edition",
  "description": "Base Set Charizard - SOLD",
  "sku": "PKMN-BASE-004-1ST",
  "category": "Trading Cards",
  "condition": "Mint",
  "intake_price": "450.00",
  "projected_sell_price": "900.00",
  "quantity_in_stock": 0,
  "location": "Sold",
  "image_url": "https://example.supabase.co/storage/v1/object/public/collectibles/charizard.jpg",
  "card_details": {
    "game": "Pokemon",
    "set_name": "Base Set",
    "card_number": "4",
    "rarity": "Holo Rare",
    "is_first_edition": true,
    "is_graded": true,
    "grade_score": "9.5",
    "grading_company": "PSA"
  },
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T15:30:00Z"
}
```

**Notes:**
- Use `PATCH` for updating a few fields
- Use `PUT` when replacing entire object
- Cannot change `vendor` (always your vendor)
- Cannot change `id`
- `updated_at` is automatically updated

**Error Responses:**
```json
// 404 Not Found
{
  "detail": "Not found."
}

// 400 Bad Request - SKU conflict
{
  "sku": ["Collectible with this SKU already exists for this vendor."]
}
```

---

### 2.5 Delete Collectible

**Endpoint:** `DELETE /api/collectibles/{id}/`  
**Authentication:** Required  
**Description:** Delete a collectible from inventory

**Path Parameters:**
- `id` (integer): Collectible ID

**Response:** `204 No Content`
(Empty response body)

**Error Responses:**
```json
// 404 Not Found
{
  "detail": "Not found."
}
```

**Important:** 
- Deletion is permanent
- Associated `card_details` are automatically deleted (cascade)
- Consider adding a "sold" status instead of deleting for record-keeping

---

## Vendors

Users can view and update their vendor profile. In the MVP, each user has exactly one vendor.

### 3.1 List Vendors

**Endpoint:** `GET /api/vendors/`  
**Authentication:** Required  
**Description:** Get your vendor profile (returns array with one vendor)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Melissa's Collectibles",
    "created_at": "2025-11-24T12:00:00Z",
    "updated_at": "2025-11-24T12:00:00Z"
  }
]
```

**Notes:**
- Always returns exactly 1 vendor for current user
- Other users' vendors are not visible (multi-tenant isolation)

---

### 3.2 Get Single Vendor

**Endpoint:** `GET /api/vendors/{id}/`  
**Authentication:** Required  
**Description:** Get vendor details

**Path Parameters:**
- `id` (integer): Vendor ID

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Melissa's Collectibles",
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T12:00:00Z"
}
```

**Error Responses:**
```json
// 404 Not Found - Vendor doesn't exist or isn't yours
{
  "detail": "Not found."
}
```

---

### 3.3 Update Vendor

**Endpoint:** `PATCH /api/vendors/{id}/`  
**Authentication:** Required  
**Description:** Update your vendor name

**Path Parameters:**
- `id` (integer): Vendor ID

**Request Body:**
```json
{
  "name": "Premium Card Collectibles"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Premium Card Collectibles",
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T16:45:00Z"
}
```

**Validation:**
- `name` is required
- Max length: 255 characters
- Cannot be blank

**Error Responses:**
```json
// 400 Bad Request
{
  "name": ["This field may not be blank."]
}

// 404 Not Found
{
  "detail": "Not found."
}
```

---

## Card Details

Trading card specific data, linked to a collectible. Only relevant when `category = "Trading Cards"`.

### 4.1 Create Card Details

**Endpoint:** `POST /api/collectibles/{collectible_id}/card-details/`  
**Authentication:** Required  
**Description:** Add trading card specific details to a collectible

**Path Parameters:**
- `collectible_id` (integer): Parent collectible ID

**Request Body:**
```json
{
  "game": "Pokemon",
  "set_name": "Base Set",
  "card_number": "4",
  "rarity": "Holo Rare",
  "is_first_edition": true,
  "is_graded": true,
  "grade_score": "9.5",
  "grading_company": "PSA"
}
```

**Required Fields:**
- `game` (max 100 chars) - Pokemon, MTG, Yu-Gi-Oh!, etc.
- `set_name` (max 255 chars) - Base Set, Fusion Strike, etc.

**Optional Fields:**
- `card_number` (max 50 chars) - "4", "025/102", etc.
- `rarity` (max 50 chars) - Common, Uncommon, Rare, Holo Rare, etc.
- `is_first_edition` (boolean, default false)
- `is_graded` (boolean, default false)
- `grade_score` (max 10 chars) - "9.5", "10", "BGS 9", etc.
- `grading_company` (max 50 chars) - PSA, BGS, CGC, etc.

**Response:** `201 Created`
```json
{
  "id": 1,
  "collectible": 1,
  "game": "Pokemon",
  "set_name": "Base Set",
  "card_number": "4",
  "rarity": "Holo Rare",
  "is_first_edition": true,
  "is_graded": true,
  "grade_score": "9.5",
  "grading_company": "PSA",
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T12:00:00Z"
}
```

**Notes:**
- Each collectible can have only ONE card_details record
- Trying to create a second one returns 400 error
- Card details are automatically deleted when parent collectible is deleted

**Error Responses:**
```json
// 400 Bad Request - Card details already exist
{
  "detail": "Card details already exist for this collectible."
}

// 404 Not Found - Collectible doesn't exist
{
  "detail": "Collectible not found."
}
```

---

### 4.2 Update Card Details

**Endpoint:** `PATCH /api/collectibles/{collectible_id}/card-details/`  
**Authentication:** Required  
**Description:** Update existing card details

**Path Parameters:**
- `collectible_id` (integer): Parent collectible ID

**Request Body (partial update):**
```json
{
  "is_graded": true,
  "grade_score": "10",
  "grading_company": "PSA"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "collectible": 1,
  "game": "Pokemon",
  "set_name": "Base Set",
  "card_number": "4",
  "rarity": "Holo Rare",
  "is_first_edition": true,
  "is_graded": true,
  "grade_score": "10",
  "grading_company": "PSA",
  "created_at": "2025-11-24T12:00:00Z",
  "updated_at": "2025-11-24T17:00:00Z"
}
```

---

### 4.3 Delete Card Details

**Endpoint:** `DELETE /api/collectibles/{collectible_id}/card-details/`  
**Authentication:** Required  
**Description:** Remove card details from a collectible

**Path Parameters:**
- `collectible_id` (integer): Parent collectible ID

**Response:** `204 No Content`

**Note:** The collectible itself remains, only card details are removed.

---

## Dashboard

Summary statistics for dashboard display.

### 5.1 Get Dashboard Summary

**Endpoint:** `GET /api/dashboard/summary/`  
**Authentication:** Required  
**Description:** Get high-level inventory statistics

**Response:** `200 OK`
```json
{
  "total_items": 156,
  "total_vendors": 1,
  "total_categories": 8,
  "total_intake_value": "12450.00",
  "total_projected_value": "28900.00",
  "potential_profit": "16450.00",
  "items_in_stock": 143,
  "items_out_of_stock": 13
}
```

**Field Descriptions:**
- `total_items`: Total number of collectibles
- `total_vendors`: Always 1 in MVP
- `total_categories`: Number of unique categories
- `total_intake_value`: Sum of all (intake_price * quantity_in_stock)
- `total_projected_value`: Sum of all (projected_sell_price * quantity_in_stock)
- `potential_profit`: Difference between projected and intake value
- `items_in_stock`: Count of items with quantity > 0
- `items_out_of_stock`: Count of items with quantity = 0

**Notes:**
- All values are scoped to your vendor
- Calculations exclude out-of-stock items (quantity = 0)
- Prices are in string format to preserve decimal precision

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing/invalid token, authentication failed |
| 403 | Forbidden | Valid token but no permission |
| 404 | Not Found | Resource doesn't exist or isn't yours |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected server error |

### Error Response Format

All errors return JSON with `detail` or field-specific errors:

**Single Error:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Field Validation Errors:**
```json
{
  "name": ["This field is required."],
  "sku": ["Collectible with this SKU already exists for this vendor."],
  "intake_price": ["Must be a positive number."]
}
```

**Multiple Errors:**
```json
{
  "email": ["Enter a valid email address."],
  "password": [
    "Password must be at least 8 characters.",
    "Password must contain at least one number."
  ]
}
```

### Common Error Scenarios

**1. Expired Token:**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is invalid or expired"
    }
  ]
}
```
**Solution:** Use refresh token to get new access token

**2. Missing Authentication:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solution:** Add `Authorization: Bearer <token>` header

**3. Vendor Isolation Violation:**
```json
{
  "detail": "Not found."
}
```
**Context:** Trying to access another user's collectible  
**Solution:** This is expected behavior (multi-tenant security)

**4. Unique Constraint Violation:**
```json
{
  "sku": ["Collectible with this SKU already exists for this vendor."]
}
```
**Solution:** Use a different SKU

---

## Rate Limiting

**Current Limits:** None (MVP)

**Planned Limits (Production):**
- Authenticated users: 1000 requests/hour
- Unauthenticated: 100 requests/hour
- Burst: 20 requests/minute

**Rate Limit Headers (future):**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1700000000
```

---

## Complete API Flow Example

### Typical User Session

**1. Register:**
```bash
POST /api/auth/register/
{
  "email": "collector@example.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
# Returns: user object with vendor
```

**2. Login:**
```bash
POST /api/auth/token/
{
  "email": "collector@example.com",
  "password": "SecurePass123!"
}
# Returns: { "access": "...", "refresh": "..." }
# Store both tokens in localStorage/sessionStorage
```

**3. Get Vendor Profile:**
```bash
GET /api/vendors/
Authorization: Bearer <access_token>
# Returns: [{ "id": 1, "name": "...", ... }]
```

**4. Create Collectible:**
```bash
POST /api/collectibles/
Authorization: Bearer <access_token>
{
  "name": "Charizard Holo",
  "sku": "PKMN-001",
  "category": "Trading Cards",
  "intake_price": "450.00",
  "projected_sell_price": "800.00",
  "quantity_in_stock": 1
}
# Returns: collectible object with id
```

**5. Add Card Details:**
```bash
POST /api/collectibles/1/card-details/
Authorization: Bearer <access_token>
{
  "game": "Pokemon",
  "set_name": "Base Set",
  "is_first_edition": true
}
# Returns: card_details object
```

**6. List Collectibles (with filters):**
```bash
GET /api/collectibles/?category=Trading%20Cards&ordering=-projected_sell_price
Authorization: Bearer <access_token>
# Returns: paginated list sorted by price descending
```

**7. Get Dashboard Stats:**
```bash
GET /api/dashboard/summary/
Authorization: Bearer <access_token>
# Returns: { "total_items": 1, "total_intake_value": "450.00", ... }
```

**8. Token Expires (after 5 minutes):**
```bash
# Next API call returns 401
# Use refresh token:
POST /api/auth/token/refresh/
{
  "refresh": "<refresh_token>"
}
# Returns: { "access": "<new_access_token>" }
# Update stored access token and retry failed request
```

---

## Frontend Integration Tips

### 1. Token Management
```typescript
// Store tokens
localStorage.setItem('access_token', response.access)
localStorage.setItem('refresh_token', response.refresh)

// Add to axios interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token')
      const { data } = await axios.post('/api/auth/token/refresh/', {
        refresh: refreshToken
      })
      localStorage.setItem('access_token', data.access)
      // Retry original request
      error.config.headers.Authorization = `Bearer ${data.access}`
      return axios(error.config)
    }
    return Promise.reject(error)
  }
)
```

### 2. React Query Setup
```typescript
// Fetch collectibles with React Query
const useCollectibles = (filters: FilterParams) => {
  return useQuery({
    queryKey: ['collectibles', filters],
    queryFn: () => collectiblesApi.list(filters),
    staleTime: 30000, // 30 seconds
  })
}

// Create mutation
const useCreateCollectible = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: collectiblesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['collectibles'])
      toast.success('Item created!')
    },
    onError: (error) => {
      toast.error('Failed to create item')
    }
  })
}
```

### 3. Form Validation with Zod
```typescript
import { z } from 'zod'

const collectibleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100),
  category: z.string().min(1, 'Category is required'),
  intake_price: z.number().min(0, 'Price cannot be negative'),
  projected_sell_price: z.number().min(0, 'Price cannot be negative'),
  quantity_in_stock: z.number().int().min(0, 'Quantity cannot be negative'),
  description: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional(),
})

// Use with React Hook Form
const form = useForm({
  resolver: zodResolver(collectibleSchema),
})
```

### 4. Image Upload Flow
```typescript
// 1. Upload to Supabase
const uploadImage = async (file: File) => {
  const { data, error } = await supabase.storage
    .from('collectibles')
    .upload(`${Date.now()}-${file.name}`, file)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('collectibles')
    .getPublicUrl(data.path)
  
  return publicUrl
}

// 2. Create collectible with image URL
const handleSubmit = async (formData) => {
  let imageUrl = formData.image_url
  
  if (selectedFile) {
    imageUrl = await uploadImage(selectedFile)
  }
  
  await createCollectible({
    ...formData,
    image_url: imageUrl
  })
}
```

---

## Testing Endpoints

### Using cURL

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","password_confirm":"Pass123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!"}'

# List collectibles (with auth)
TOKEN="your_access_token_here"
curl -X GET http://localhost:8000/api/collectibles/ \
  -H "Authorization: Bearer $TOKEN"

# Create collectible
curl -X POST http://localhost:8000/api/collectibles/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Card","sku":"TEST-001","category":"Trading Cards","intake_price":"10.00","projected_sell_price":"20.00","quantity_in_stock":1}'
```

### Using Python Requests

```python
import requests

BASE_URL = "http://localhost:8000/api"

# Login
response = requests.post(f"{BASE_URL}/auth/token/", json={
    "email": "test@example.com",
    "password": "Pass123!"
})
tokens = response.json()
access_token = tokens['access']

# Headers with auth
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# List collectibles
response = requests.get(f"{BASE_URL}/collectibles/", headers=headers)
collectibles = response.json()

# Create collectible
response = requests.post(f"{BASE_URL}/collectibles/", headers=headers, json={
    "name": "Test Card",
    "sku": "TEST-001",
    "category": "Trading Cards",
    "intake_price": "10.00",
    "projected_sell_price": "20.00",
    "quantity_in_stock": 1
})
new_item = response.json()
```

---

## Changelog

### v1.0 (2025-11-24)
- Initial API documentation
- 15 endpoints documented
- Authentication, Collectibles, Vendors, Card Details, Dashboard
- JWT token management
- Multi-tenant vendor scoping
- Comprehensive filtering and sorting
- Error handling patterns
- Frontend integration examples
