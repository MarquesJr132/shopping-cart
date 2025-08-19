# Installation Guide

This guide will help you set up the Sika Shopping Cart Management System on your local development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** (version 18.0.0 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Supabase Account
- Create a free account at [supabase.com](https://supabase.com)
- You'll need this for backend services

## Step-by-Step Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sika-shopping-cart
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

### 3. Environment Configuration

The project includes environment variables for Supabase configuration:

```bash
# .env file (already configured)
VITE_SUPABASE_PROJECT_ID="dwlyjmgksmehgmpehzvj"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://dwlyjmgksmehgmpehzvj.supabase.co"
```

**Note**: These credentials are already configured for the existing Supabase project.

### 4. Database Setup

The database is already configured with:
- ✅ User profiles table
- ✅ Shopping requests table  
- ✅ Request items table
- ✅ Shopping cart items table
- ✅ Row Level Security policies
- ✅ Database functions and triggers

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Verification

### 1. Check Application Loading
- Navigate to `http://localhost:5173`
- You should see the authentication page with Sika logo

### 2. Test Authentication
- Try logging in with valid credentials
- The system should redirect to the dashboard

### 3. Verify Database Connection
- Check browser console for any connection errors
- Test creating a shopping cart item

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# If port 5173 is busy, Vite will automatically use the next available port
# Check the terminal output for the actual port
```

#### Node Version Issues
```bash
# Check your Node.js version
node --version

# Should be 18.0.0 or higher
# Update Node.js if needed
```

#### Dependency Installation Errors
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

#### Supabase Connection Issues
- Verify your internet connection
- Check Supabase project status at [status.supabase.com](https://status.supabase.com)
- Ensure environment variables are correctly set

### Getting Help

If you encounter issues:

1. Check the [troubleshooting guide](../development/troubleshooting.md)
2. Review browser console for error messages
3. Verify all prerequisites are met
4. Open an issue with detailed error information

## Next Steps

After successful installation:

1. Review the [Architecture Overview](../architecture/overview.md)
2. Explore [User Features](../features/user-guide.md)
3. Check [Development Guidelines](../development/guidelines.md)

---

**Installation Complete!** 🎉

You're now ready to start developing or using the Sika Shopping Cart Management System.