# Quick Fix for ACC API Access

## The Problem
Your APS application currently only has `viewables:read` scope, but ACC APIs require additional permissions.

## Solution: Add Required Scopes

### Step 1: Update APS Application
1. Go to [https://aps.autodesk.com/myapps](https://aps.autodesk.com/myapps)
2. Click on your APS application
3. Go to the **API Access** tab
4. Add these scopes:
   - ✅ `data:read` - Read project data
   - ✅ `data:write` - Write project data (optional)
   - ✅ `account:read` - Read account information

### Step 2: Wait for Approval
- Some scopes require Autodesk approval
- This can take 1-2 business days
- You'll get an email when approved

### Step 3: Alternative - Test with Different API Endpoints

While waiting for approval, let's try the correct ACC API endpoints:

#### Current (Incorrect):
```
GET /issues/v1/containers/{containerId}/issues
```

#### Correct ACC API Format:
```
GET /construction/issues/v1/containers/{containerId}/issues
```

## Immediate Fix

Let's update the API endpoints to use the correct format: 