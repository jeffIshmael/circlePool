# Circle Pool API Routes

**Author:** Jeff Muchiri

This directory contains secure API routes for reading Circle Pool contract state from Hedera.

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```env
# Hedera Client Configuration (required)
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=302e...
HEDERA_NETWORK=testnet  # or "mainnet"

# API Key for protecting routes (optional but recommended)
API_KEY=your-secret-api-key-here
```

### Authentication

All API routes are protected by an API key system. Include the API key in the `x-api-key` header:

```bash
curl -H "x-api-key: your-secret-api-key-here" \
  http://localhost:3000/api/circles
```

**Note:** If `API_KEY` environment variable is not set, routes will be unprotected (development mode only).

## Available Endpoints

### 1. Get Circle by ID
`GET /api/circle/[circleId]`

Returns detailed information about a specific circle.

**Example:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/circle/0
```

**Response:**
```json
{
  "circleId": 0,
  "payDate": 1234567890,
  "amount": 1000000000,
  "startDate": 1234560000,
  "duration": 30,
  "round": 1,
  "cycle": 1,
  "admin": "0x...",
  "members": ["0x...", "0x..."],
  "loanableAmount": 50000000,
  "interestPercent": 5,
  "leftPercent": 10
}
```

### 2. Get All Circles
`GET /api/circles`

Returns a list of all circles.

**Example:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/circles
```

**Response:**
```json
{
  "circles": [
    {
      "circleId": 0,
      "amount": 1000000000,
      "startDate": 1234560000,
      "duration": 30,
      "loanableAmount": 50000000,
      "admin": "0x..."
    }
  ],
  "total": 1
}
```

### 3. Get Member Balance
`GET /api/circle/[circleId]/balance?member=<address>`

Returns balance and loan information for a specific member in a circle.

**Example:**
```bash
curl -H "x-api-key: your-api-key" \
  "http://localhost:3000/api/circle/0/balance?member=0x1234..."
```

**Response:**
```json
{
  "circleId": 0,
  "member": "0x1234...",
  "balance": 100000000,
  "loan": 0
}
```

### 4. Get All Members' Balances
`GET /api/circle/[circleId]/members`

Returns balance and loan information for all members in a circle.

**Example:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/circle/0/members
```

**Response:**
```json
{
  "circleId": 0,
  "members": [
    {
      "address": "0x...",
      "balance": 100000000,
      "loan": 0
    }
  ],
  "total": 1
}
```

### 5. Get Payout Order
`GET /api/circle/[circleId]/payout-order`

Returns the payout order for a circle.

**Example:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/circle/0/payout-order
```

**Response:**
```json
{
  "circleId": 0,
  "payoutOrder": ["0x...", "0x..."],
  "total": 2
}
```

### 6. Get All Payments
`GET /api/payments`

Returns all payment records.

**Example:**
```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:3000/api/payments
```

**Response:**
```json
{
  "payments": [
    {
      "id": 0,
      "circleId": 0,
      "receiver": "0x...",
      "amount": 5000000000,
      "timestamp": 1234567890
    }
  ],
  "total": 1
}
```

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error message here"
}
```

Status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid API key)
- `500` - Internal Server Error

## Notes

- All amounts are returned in tinybars (the smallest unit of HBAR)
- Addresses are returned as strings (Hedera account IDs or EVM addresses)
- Timestamps are Unix timestamps (seconds since epoch)
- Array parsing may need adjustment based on Hedera SDK behavior - test thoroughly

