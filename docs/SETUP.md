# Bridge Platform - Setup Guide

## Prerequisites
- Airtable account (free tier works)
- GitHub account
- Basic web browser

## Step 1: Airtable Setup

### Create Your Base
1. Log in to [Airtable](https://airtable.com)
2. Create a new base named "Bridge Real Estate"
3. Create the following 6 tables with exact names:

### Required Tables

#### 1. Agents
| Field Name | Type | Required |
|------------|------|----------|
| Name | Single line text | Yes |
| Email | Email | Yes |
| Phone | Phone | Yes |
| Agency | Single line text | Yes |
| Verified | Checkbox | No |
| Rating | Number (1 decimal) | No |
| DealsCompleted | Number | No |

#### 2. Properties  
| Field Name | Type | Required |
|------------|------|----------|
| PropertyType | Single select | Yes |
| Area | Single line text | Yes |
| FullAddress | Long text | Yes |
| Price | Number | Yes |
| Bedrooms | Number | Yes |
| Bathrooms | Number (1 decimal) | Yes |
| Size | Single line text | No |
| TotalCommission | Number (1 decimal) | Yes |
| CommissionSplit | Single select | Yes |
| Description | Long text | No |
| Images | Attachment | No |
| AgentName | Single line text | Yes |
| AgentEmail | Email | Yes |
| Agency | Single line text | Yes |
| Status | Single select | Yes |
| CreatedDate | Date | Yes |

#### 3. DeveloperProjects
| Field Name | Type | Required |
|------------|------|----------|
| ProjectName | Single line text | Yes |
| Developer | Single line text | Yes |
| Area | Single line text | Yes |
| PriceFrom | Number | Yes |
| PriceTo | Number | Yes |
| TotalUnits | Number | Yes |
| UnitsAvailable | Number | Yes |
| Commission | Number (1 decimal) | Yes |
| CompletionDate | Single line text | No |
| PropertyTypes | Single line text | No |
| Amenities | Long text | No |
| MainImage | Attachment | No |
| ContactName | Single line text | No |
| ContactPhone | Phone | No |
| ContactEmail | Email | No |
| Status | Single select | Yes |

#### 4. ProjectMedia
| Field Name | Type | Required |
|------------|------|----------|
| ProjectId | Single line text | Yes |
| Type | Single select | Yes |
| Name | Single line text | Yes |
| FileUrl | URL | Yes |

#### 5. Connections
| Field Name | Type | Required |
|------------|------|----------|
| PropertyId | Single line text | Yes |
| ListingAgentId | Single line text | Yes |
| RequestingAgentId | Single line text | Yes |
| RequestingAgentName | Single line text | Yes |
| Status | Single select | Yes |
| RequestedDate | Date | Yes |

#### 6. PropertyViews
| Field Name | Type | Required |
|------------|------|----------|
| PropertyId | Single line text | Yes |
| AgentId | Single line text | Yes |
| ViewedAt | Date | Yes |

### Single Select Options

**PropertyType Options:**
- Apartment
- House
- Townhouse
- Land
- Commercial

**Status Options:**
- Active
- Pending
- Sold
- Inactive

**CommissionSplit Options:**
- 50-50
- 60-40
- 40-60

## Step 2: Get Airtable Credentials

1. Go to [Airtable Account](https://airtable.com/account)
2. Generate a personal access token
3. Add scopes: `data.records:read` and `data.records:write`
4. Select your Bridge base
5. Copy the token

## Step 3: Configure the Platform

1. Copy `config.js.example` to `config.js`
2. Add your Airtable API key
3. Add your Base ID (from Airtable URL)
4. Customize agents and areas

## Step 4: Deploy

### Option A: GitHub Pages
1. Push all files to GitHub
2. Go to Settings → Pages
3. Select main branch
4. Save and wait 2-3 minutes

### Option B: Local Testing
1. Open `index.html` in Chrome/Firefox
2. Use demo credentials to log in

## Troubleshooting

**"Failed to load properties"**
- Check API key is correct
- Verify Base ID matches
- Ensure table names are exact
- Check browser console for errors

**"Cannot submit listing"**
- Verify all required fields are filled
- Check Airtable write permissions
- Ensure Status field has correct options

## Support

Contact: support@bridge.co.ke
