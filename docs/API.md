# Bridge Platform - API Documentation

## Overview

Bridge uses the Airtable API directly from the browser. This document outlines all API calls made by the platform.

## Authentication

All requests require an Authorization header:
```
Authorization: Bearer YOUR_AIRTABLE_API_KEY
```

## Base URL
```
https://api.airtable.com/v0/YOUR_BASE_ID/
```

## Endpoints Used

### 1. Get Properties
```
GET /Properties?filterByFormula={Status}='Active'&sort[0][field]=CreatedDate&sort[0][direction]=desc
```

**Response Fields:**
- PropertyType
- Area (public)
- Price
- Bedrooms
- Bathrooms
- Size
- TotalCommission
- CommissionSplit
- Images

**Private Fields (not shown initially):**
- FullAddress
- AgentEmail
- AgentPhone

### 2. Create Property
```
POST /Properties
Content-Type: application/json

{
  "fields": {
    "PropertyType": "Apartment",
    "Area": "Westlands",
    "FullAddress": "123 Example Street",
    "Price": 15000000,
    "Bedrooms": 3,
    "Bathrooms": 2,
    "Size": "145 sqm",
    "TotalCommission": 3,
    "CommissionSplit": "50-50",
    "AgentName": "John Doe",
    "AgentEmail": "john@example.com",
    "Status": "Pending"
  }
}
```

### 3. Get Developer Projects
```
GET /DeveloperProjects?filterByFormula={Status}='Active'
```

**Response:** All fields are public for developer projects

### 4. Get Project Media
```
GET /ProjectMedia?filterByFormula={ProjectId}='PROJECT_ID'
```

### 5. Create Connection Request
```
POST /Connections
Content-Type: application/json

{
  "fields": {
    "PropertyId": "rec123456",
    "ListingAgentId": "agent@email.com",
    "RequestingAgentId": "requester@email.com",
    "RequestingAgentName": "Jane Smith",
    "Status": "Pending",
    "RequestedDate": "2024-01-15T10:30:00.000Z"
  }
}
```

### 6. Log Property View
```
POST /PropertyViews
Content-Type: application/json

{
  "fields": {
    "PropertyId": "rec123456",
    "AgentId": "agent@email.com",
    "ViewedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Rate Limits

Airtable API limits:
- 5 requests per second per base
- Use caching to minimize requests

## Error Handling

Common errors:
- 401: Invalid API key
- 404: Table or record not found
- 422: Invalid field data
- 429: Rate limit exceeded

## Security Notes

1. API key is exposed in browser - use scoped tokens
2. Implement field-level permissions in Airtable
3. Consider proxy server for production
