# User Guide

This guide covers all features and workflows available to different user roles in the Sika Shopping Cart Management System.

## Getting Started

### Logging In

1. Navigate to the application URL
2. Enter your email and password
3. Click "Sign In"
4. You'll be redirected to the dashboard based on your role

### Dashboard Overview

The dashboard provides:
- **Recent Requests**: Your latest shopping requests
- **Quick Stats**: Request counts by status
- **Filter Options**: Advanced filtering and search
- **Action Buttons**: Create new requests, access cart

## User Roles & Permissions

### 👤 User (Standard Employee)
**Can do:**
- Create and manage shopping requests
- Add items to shopping cart
- View own request history
- Edit draft requests
- Submit requests for approval

**Cannot do:**
- Approve requests
- View other users' requests
- Access admin functions

### 👔 Manager
**Can do:**
- Everything a User can do
- View and approve direct reports' requests
- Add approval comments
- Reject requests with reasons

**Cannot do:**
- Access procurement functions
- Manage system users

### 📦 Procurement Staff
**Can do:**
- View all approved requests
- Process approved requests
- Update procurement status
- Add procurement notes
- Mark requests as completed

**Cannot do:**
- Approve manager-level requests
- Access admin functions

### ⚙️ Administrator
**Can do:**
- Everything all other roles can do
- Manage user accounts
- Access system administration
- View all requests across the system

## Core Features

### 🛒 Shopping Cart Management

#### Adding Items to Cart
1. Click "Add to Cart" from dashboard
2. Fill in item details:
   - **Item Code**: Product identifier
   - **Description**: Clear item description
   - **Quantity**: Number of items needed
   - **Unit**: Measurement unit (pieces, boxes, etc.)
   - **Unit Price**: Cost per unit (optional)
   - **Supplier**: Preferred vendor (optional)
   - **Notes**: Additional information

3. Click "Add Item" to save to cart

#### Managing Cart Items
- **Edit**: Click pencil icon to modify item details
- **Remove**: Click trash icon to delete items
- **Bulk Actions**: Select multiple items for batch operations

### 📝 Request Creation & Management

#### Creating a New Request

1. **From Cart**:
   - Add items to cart
   - Click "Create Request from Cart"
   - Fill in request details
   - Submit for approval

2. **Direct Creation**:
   - Click "New Request" on dashboard
   - Add items directly in the request form
   - Complete request information

#### Request Information Required
- **Request Type**: Category of request
- **Justification**: Business reason for the request
- **Delivery Date**: When items are needed
- **Client Information**: 
  - Client Name
  - Client ID
- **Preferred Supplier**: Vendor preference

#### Request Statuses
- **Draft**: Being prepared, not yet submitted
- **Pending Manager Approval**: Waiting for manager review
- **Manager Approved**: Approved by manager, pending procurement
- **In Procurement**: Being processed by procurement team
- **Completed**: Order fulfilled and delivered
- **Rejected**: Request denied with reason

### ✅ Approval Workflow

#### For Managers
1. Navigate to dashboard
2. View "Pending Approval" section
3. Click on request to review details
4. Choose action:
   - **Approve**: Add optional comments and approve
   - **Reject**: Provide rejection reason

#### Approval Criteria
- Budget compliance
- Business justification
- Proper authorization
- Complete information

### 📊 Request Tracking

#### Status Updates
- Real-time status tracking
- Email notifications (when configured)
- History of all status changes
- Comments and notes from approvers

#### Filtering & Search
- **By Status**: Filter by request status
- **By Date Range**: Specific time periods
- **By Request Type**: Category filtering
- **Text Search**: Search request numbers, descriptions

### 📋 Request Details

#### Viewing Request Information
- Complete item list with quantities and prices
- Approval history and comments
- Current status and next steps
- Associated documents and notes

#### Editing Requests
- **Draft Requests**: Full editing capability
- **Submitted Requests**: Limited editing based on status
- **Version History**: Track all changes

### 📄 PDF Report Generation

#### Generating Reports
1. Open approved request
2. Click "Generate PDF Report" 
3. PDF includes:
   - Request header information
   - Complete item list
   - Approval signatures
   - Total costs
   - Delivery information

#### Report Uses
- Purchase order creation
- Vendor communication
- Budget tracking
- Audit documentation

## Advanced Features

### 🔍 Advanced Filtering

#### Filter Options
- **Status**: Multiple status selection
- **Date Range**: Custom date periods
- **Request Type**: Category filtering
- **Amount Range**: Budget-based filtering
- **Assigned To**: User-specific filtering

#### Saved Filters
- Save frequently used filter combinations
- Quick access to common views
- Team-shared filter sets

### 📈 Dashboard Analytics

#### Quick Stats Display
- Total requests by status
- Monthly request trends
- Average approval times
- Budget utilization

#### Performance Metrics
- Request processing times
- Approval rates
- Common rejection reasons
- Supplier performance

### 🔔 Notifications

#### Real-time Updates
- Status change notifications
- New request assignments
- Approval deadline reminders
- System announcements

#### Notification Settings
- Email preferences
- In-app notification control
- Frequency settings
- Role-based notifications

## Best Practices

### ✅ Creating Effective Requests

1. **Clear Descriptions**: Use specific, detailed item descriptions
2. **Accurate Quantities**: Double-check quantities and units
3. **Business Justification**: Provide clear business need
4. **Realistic Timelines**: Allow adequate processing time
5. **Complete Information**: Fill all required fields

### ✅ Approval Guidelines

1. **Timely Reviews**: Review requests promptly
2. **Clear Communication**: Provide specific feedback
3. **Documentation**: Record approval reasoning
4. **Budget Awareness**: Consider budget implications

### ✅ System Usage

1. **Regular Updates**: Keep profile information current
2. **Security**: Log out when finished
3. **Data Accuracy**: Verify all entered information
4. **Feedback**: Report issues or suggestions

## Troubleshooting

### Common Issues

#### Cannot Create Request
- Check if all required fields are completed
- Verify you have proper permissions
- Ensure cart is not empty (if creating from cart)

#### Request Not Appearing
- Check applied filters
- Verify date range settings
- Ensure proper permissions for request access

#### PDF Generation Fails
- Check browser popup blocker settings
- Verify request is in approved status
- Try refreshing the page

#### Login Issues
- Verify email and password
- Check caps lock status
- Contact administrator if account is locked

### Getting Help

1. **In-App Help**: Look for help icons and tooltips
2. **System Administrator**: Contact your admin for account issues
3. **IT Support**: For technical problems
4. **Process Questions**: Consult your manager or procurement team

---

This user guide covers the essential functionality for all user roles. For technical documentation, see the [Developer Guide](../development/guidelines.md).