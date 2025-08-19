# Production Deployment Guide

This guide covers deploying the Sika Shopping Cart Management System to production environments with best practices for security, performance, and reliability.

## Deployment Overview

### Architecture Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Edge      │    │   Application   │    │   Database      │
│   (Static)      │◄──►│   (Frontend)    │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: Static React application
- **Hosting**: Lovable hosting platform
- **Backend**: Supabase (managed service)
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth
- **CDN**: Automatic with hosting platform

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Unit tests passing
- [ ] Integration tests completed
- [ ] Security vulnerabilities patched
- [ ] Performance optimizations applied

### Environment Configuration
- [ ] Production environment variables configured
- [ ] Supabase production project setup
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Authentication providers configured

### Security Review
- [ ] Row Level Security policies tested
- [ ] Input validation implemented
- [ ] Authentication flows verified
- [ ] Authorization rules tested
- [ ] Security headers configured

### Performance Optimization
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] Code splitting implemented
- [ ] Caching strategies configured
- [ ] Database queries optimized

## Supabase Production Setup

### 1. Create Production Project

```bash
# Create new Supabase project
# Use Supabase dashboard: https://supabase.com/dashboard
# Project Name: sika-shopping-cart-prod
# Region: Choose closest to users
# Database Password: Generate strong password
```

### 2. Configure Environment Variables

```env
# Production .env
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_SUPABASE_PROJECT_ID=[your-project-id]
```

### 3. Database Migration

```sql
-- Run all migrations in order
-- 1. Create tables
-- 2. Set up RLS policies
-- 3. Create functions and triggers
-- 4. Insert initial data if needed

-- Verify deployment
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';
```

### 4. Security Configuration

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check RLS policies
SELECT tablename, policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public';
```

## Build Configuration

### 1. Production Build

```bash
# Install dependencies
npm ci --production

# Build for production
npm run build

# Verify build output
ls -la dist/
```

### 2. Build Optimization

```typescript
// vite.config.ts - Production optimizations
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false, // Disable for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          charts: ['recharts'],
          pdf: ['jspdf'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
```

### 3. Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for large dependencies
npx webpack-bundle-analyzer dist/assets/*.js
```

## Deployment Process

### 1. Lovable Platform Deployment

```bash
# Deploy using Lovable's built-in deployment
# Click "Publish" button in Lovable interface
# Or use CLI if available

# Verify deployment
curl -I https://your-app.lovable.app
```

### 2. Custom Domain Setup

```bash
# Configure custom domain in Lovable dashboard
# Update DNS records:
# CNAME: your-domain.com -> your-app.lovable.app
# A record: @ -> [Lovable IP addresses]

# Verify SSL certificate
curl -I https://your-domain.com
```

### 3. Environment Variables

```typescript
// Ensure production environment detection
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  isDevelopment: !isProduction,
  apiUrl: isProduction ? 'https://api.yourdomain.com' : 'http://localhost:3000',
};
```

## Security Configuration

### 1. HTTP Security Headers

```typescript
// Configure security headers (if using custom server)
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // Required for React
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.supabase.co",
    "font-src 'self'",
  ].join('; '),
};
```

### 2. Supabase Security

```sql
-- Production security settings
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_min_duration_statement = 1000;

-- Enable audit logging for sensitive tables
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Configure connection pooling
-- Done automatically by Supabase
```

### 3. Authentication Security

```typescript
// Production auth configuration
const authConfig = {
  detectSessionInUrl: true,
  persistSession: true,
  autoRefreshToken: true,
  storage: localStorage, // Use secure storage in production
  storageKey: 'sb-auth-token',
  flowType: 'pkce', // Use PKCE for better security
};
```

## Monitoring & Logging

### 1. Application Monitoring

```typescript
// Error tracking
const logError = (error: Error, context?: any) => {
  console.error('Application error:', error, context);
  
  // Send to monitoring service
  if (isProduction) {
    // Integration with monitoring service
    // e.g., Sentry, LogRocket, etc.
  }
};

// Performance monitoring
const logPerformance = (metric: string, value: number) => {
  if (isProduction) {
    // Track performance metrics
    console.log(`Performance: ${metric} = ${value}ms`);
  }
};
```

### 2. Database Monitoring

```sql
-- Monitor database performance
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Monitor active connections
SELECT 
  state,
  COUNT(*) as connections
FROM pg_stat_activity 
GROUP BY state;
```

### 3. Supabase Analytics

```typescript
// Enable Supabase analytics
const { data, error } = await supabase
  .from('analytics_events')
  .insert({
    event_type: 'page_view',
    event_data: { page: '/dashboard' },
    user_id: user?.id,
    timestamp: new Date().toISOString(),
  });
```

## Performance Optimization

### 1. Frontend Optimization

```typescript
// Code splitting by routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RequestForm = lazy(() => import('./pages/RequestForm'));
const RequestDetail = lazy(() => import('./pages/RequestDetail'));

// Preload critical routes
const preloadCriticalRoutes = () => {
  import('./pages/Dashboard');
  import('./pages/RequestForm');
};
```

### 2. Database Optimization

```sql
-- Create indexes for production queries
CREATE INDEX CONCURRENTLY idx_shopping_requests_status_created 
ON shopping_requests(status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_shopping_requests_requester_status 
ON shopping_requests(requester_id, status);

CREATE INDEX CONCURRENTLY idx_request_items_request_id 
ON request_items(request_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM shopping_requests 
WHERE status = 'pending_manager_approval' 
ORDER BY created_at DESC;
```

### 3. Caching Strategy

```typescript
// TanStack Query production configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
```

## Backup & Recovery

### 1. Database Backups

```sql
-- Supabase provides automatic backups
-- Verify backup configuration in Supabase dashboard
-- Test backup restoration process

-- Manual backup for critical data
pg_dump -h [host] -U [user] -d [database] > backup.sql
```

### 2. Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Frequency**: Daily automated, weekly manual verification
4. **Failover Process**: Documented step-by-step procedure

### 3. Data Recovery Procedures

```sql
-- Point-in-time recovery
-- Available through Supabase dashboard
-- Restore to specific timestamp if needed

-- Export critical data
COPY (SELECT * FROM shopping_requests) TO '/tmp/requests_backup.csv' CSV HEADER;
COPY (SELECT * FROM profiles) TO '/tmp/profiles_backup.csv' CSV HEADER;
```

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Health check endpoints
curl -f https://your-domain.com/
curl -f https://your-domain.com/auth

# API connectivity
curl -H "Authorization: Bearer [token]" \
     https://[project-ref].supabase.co/rest/v1/profiles
```

### 2. Performance Testing

```bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://your-domain.com/

# Check Core Web Vitals
# Use Google PageSpeed Insights
# Monitor Largest Contentful Paint (LCP)
# Monitor First Input Delay (FID)
# Monitor Cumulative Layout Shift (CLS)
```

### 3. Security Testing

```bash
# SSL certificate check
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | \
openssl x509 -noout -dates

# Security headers check
curl -I https://your-domain.com

# Authentication flow testing
# Manual testing of login/logout
# Password reset functionality
# Role-based access control
```

## Maintenance Procedures

### 1. Regular Updates

```bash
# Weekly dependency updates
npm audit
npm update

# Monthly security patches
npm audit fix

# Quarterly major updates
# Review breaking changes
# Test in staging environment
```

### 2. Database Maintenance

```sql
-- Weekly vacuum analyze
VACUUM ANALYZE;

-- Monthly reindex
REINDEX DATABASE postgres;

-- Quarterly statistics update
ANALYZE;
```

### 3. Performance Monitoring

```typescript
// Monitor key metrics
const performanceMetrics = {
  pageLoadTime: 'target < 2s',
  timeToInteractive: 'target < 3s',
  databaseQueryTime: 'target < 100ms',
  apiResponseTime: 'target < 200ms',
  errorRate: 'target < 0.1%',
  uptime: 'target > 99.9%',
};
```

## Rollback Procedures

### 1. Application Rollback

```bash
# Rollback to previous version
# Through Lovable dashboard version history
# Or redeploy previous Git commit

# Verify rollback success
curl -f https://your-domain.com/
```

### 2. Database Rollback

```sql
-- Point-in-time recovery through Supabase
-- Restore to pre-deployment state
-- Requires coordination with application rollback
```

### 3. Emergency Procedures

1. **Immediate Response**
   - Assess impact and severity
   - Implement temporary workarounds
   - Communicate with stakeholders

2. **Rollback Decision**
   - Determine if rollback is necessary
   - Execute rollback procedures
   - Verify system stability

3. **Post-Incident**
   - Conduct root cause analysis
   - Update deployment procedures
   - Improve monitoring and alerts

---

This production deployment guide ensures a secure, performant, and reliable deployment of the Sika Shopping Cart Management System. Regular reviews and updates of these procedures help maintain production quality over time.