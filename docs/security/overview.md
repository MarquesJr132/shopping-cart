# Security Overview

This document outlines the comprehensive security measures implemented in the Sika Shopping Cart Management System.

## Security Architecture

### Multi-Layer Security Model

```
┌─────────────────────────────────────────────┐
│              Frontend Security              │
│  • Input Validation                         │
│  • XSS Protection                          │
│  • Route Protection                        │
│  • Type Safety                             │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│           Authentication Layer              │
│  • JWT Token Management                    │
│  • Session Handling                        │
│  • Role-based Access                       │
│  • Password Security                       │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│              Backend Security               │
│  • Row Level Security (RLS)                │
│  • SQL Injection Prevention                │
│  • API Rate Limiting                       │
│  • HTTPS Encryption                        │
└─────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────┐
│             Database Security               │
│  • Encrypted Storage                       │
│  • Backup Encryption                       │
│  • Access Logging                          │
│  • Connection Security                     │
└─────────────────────────────────────────────┘
```

## Authentication & Authorization

### Authentication Flow

1. **User Login**
   - Email/password validation
   - JWT token generation
   - Session establishment
   - Profile data retrieval

2. **Session Management**
   - Automatic token refresh
   - Secure token storage
   - Session timeout handling
   - Logout cleanup

3. **Role-based Authorization**
   - User role verification
   - Permission checking
   - Resource access control
   - Action authorization

### User Roles & Permissions

#### 👤 User (Standard Employee)
```typescript
permissions: {
  shopping_requests: {
    create: true,     // Own requests only
    read: true,       // Own requests only
    update: true,     // Own drafts only
    delete: false,
  },
  shopping_cart_items: {
    create: true,     // Own items only
    read: true,       // Own items only
    update: true,     // Own items only
    delete: true,     // Own items only
  },
  profiles: {
    read: true,       // Own profile only
    update: true,     // Own profile only
  }
}
```

#### 👔 Manager
```typescript
permissions: {
  // Inherits User permissions plus:
  shopping_requests: {
    read: true,       // Direct reports' requests
    update: true,     // Approval actions
  },
  profiles: {
    read: true,       // Direct reports' profiles
  }
}
```

#### 📦 Procurement Staff
```typescript
permissions: {
  // Inherits User permissions plus:
  shopping_requests: {
    read: true,       // All approved requests
    update: true,     // Procurement actions
  },
  profiles: {
    read: true,       // All profiles
  }
}
```

#### ⚙️ Administrator
```typescript
permissions: {
  // Full system access
  shopping_requests: { create: true, read: true, update: true, delete: true },
  shopping_cart_items: { create: true, read: true, update: true, delete: true },
  profiles: { create: true, read: true, update: true, delete: true },
  system_administration: true,
}
```

## Row Level Security (RLS)

### Implementation Strategy

All database tables implement Row Level Security to ensure data isolation and proper access control.

### Profiles Table Security

```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = user_id);

-- Managers can view direct reports
CREATE POLICY "Managers can view direct reports" ON profiles
FOR SELECT USING (manager_id = get_current_user_profile_id());

-- Admin and procurement can view all profiles
CREATE POLICY "Admin staff can view all profiles" ON profiles
FOR SELECT USING (get_current_user_role() = 'admin'::text);

CREATE POLICY "Procurement staff can view all profiles" ON profiles
FOR SELECT USING (get_current_user_role() = 'procurement'::text);
```

### Shopping Requests Security

```sql
-- Complex policy ensuring users can only access requests they're authorized for
CREATE POLICY "Users can view their own requests and requests they can manage" 
ON shopping_requests FOR SELECT USING (
  -- Own requests
  (requester_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())) 
  OR 
  -- Requests assigned for approval
  (manager_approval_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())) 
  OR 
  -- Procurement staff can see approved requests
  (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'procurement'::user_role))
);
```

### Shopping Cart Security

```sql
-- Simple user isolation for cart items
CREATE POLICY "Users can view their own cart items" ON shopping_cart_items
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items" ON shopping_cart_items
FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Frontend Security

### Input Validation & Sanitization

```typescript
// Zod schemas for validation
const requestSchema = z.object({
  requestType: z.string()
    .min(1, 'Request type is required')
    .max(50, 'Request type too long')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'Invalid characters'),
  
  justification: z.string()
    .min(10, 'Justification required')
    .max(1000, 'Justification too long'),
  
  deliveryDate: z.date()
    .min(new Date(), 'Date must be in future'),
});

// Input sanitization
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000);   // Limit length
};
```

### XSS Protection

```typescript
// React's built-in XSS protection through JSX
const SafeComponent = ({ userInput }: { userInput: string }) => (
  <div>
    {/* Safe - React automatically escapes */}
    <p>{userInput}</p>
    
    {/* Dangerous - avoid dangerouslySetInnerHTML */}
    <div dangerouslySetInnerHTML={{ __html: userInput }} />
  </div>
);

// For HTML content, use sanitization
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHtml = DOMPurify.sanitize(userInput);
```

### Route Protection

```typescript
const ProtectedRoute = ({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();

  // Loading state
  if (loading) return <LoadingSpinner />;
  
  // Authentication check
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Authorization check
  if (requiredRole && profile?.role !== requiredRole) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

### Secure State Management

```typescript
// Secure authentication context
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    // Secure session handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Clear sensitive data on logout
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          // Clear any cached data
          queryClient.clear();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Backend Security

### SQL Injection Prevention

```typescript
// Supabase client automatically handles parameterized queries
const getUserRequests = async (userId: string) => {
  // Safe - parameters are automatically escaped
  const { data, error } = await supabase
    .from('shopping_requests')
    .select('*')
    .eq('requester_id', userId); // Automatically parameterized
    
  return data;
};

// Database functions with secure parameter handling
const { data } = await supabase.rpc('get_user_requests', {
  user_id: userId // Safely passed as parameter
});
```

### API Security

```typescript
// Rate limiting and request validation
const apiCall = async (endpoint: string, data: any) => {
  // Validate request data
  const validatedData = schema.parse(data);
  
  // Include authentication headers
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(validatedData),
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  return response.json();
};
```

### Database Functions Security

```sql
-- Security definer functions with explicit search path
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'  -- Prevent search path attacks
AS $$
  SELECT role::text FROM profiles WHERE user_id = auth.uid();
$$;
```

## Data Protection

### Encryption

#### Data at Rest
- **Supabase Storage**: AES-256 encryption
- **Database**: Transparent data encryption
- **Backups**: Encrypted backup storage
- **Logs**: Encrypted log storage

#### Data in Transit
- **HTTPS**: All communication encrypted with TLS 1.3
- **API Calls**: Encrypted client-server communication
- **Database Connections**: Encrypted connections to PostgreSQL
- **File Uploads**: Secure encrypted transfer

### Data Privacy

#### Personal Data Handling
```typescript
// GDPR compliance considerations
interface PersonalData {
  email: string;        // Required for authentication
  fullName: string;     // Required for identification
  position?: string;    // Optional business data
  costCenter?: string;  // Optional business data
}

// Data retention policies
const DATA_RETENTION_POLICIES = {
  activeUsers: 'Indefinite',
  inactiveUsers: '2 years',
  deletedUsers: '30 days (soft delete)',
  auditLogs: '7 years',
  requestHistory: '5 years',
};
```

#### Data Minimization
```typescript
// Only collect necessary data
const createProfile = (userData: {
  email: string;
  fullName: string;
  // Don't collect unnecessary personal information
}) => {
  // Implementation
};
```

## Audit & Monitoring

### Audit Trail

```sql
-- Automatic audit logging
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    operation,
    old_values,
    new_values,
    user_id,
    timestamp
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW),
    auth.uid(),
    NOW()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER shopping_requests_audit
  AFTER INSERT OR UPDATE OR DELETE ON shopping_requests
  FOR EACH ROW EXECUTE FUNCTION audit_changes();
```

### Security Monitoring

```typescript
// Frontend error monitoring
const logSecurityEvent = (event: SecurityEvent) => {
  console.warn('Security event:', event);
  
  // Send to monitoring service
  if (event.severity === 'high') {
    // Alert administrators
    notifyAdministrators(event);
  }
};

// Monitor failed authentication attempts
const monitorAuthFailures = () => {
  let failureCount = 0;
  const MAX_FAILURES = 5;
  
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      failureCount = 0; // Reset on success
    } else if (event === 'SIGNED_OUT' && failureCount > 0) {
      failureCount++;
      
      if (failureCount >= MAX_FAILURES) {
        logSecurityEvent({
          type: 'repeated_auth_failures',
          severity: 'high',
          count: failureCount,
        });
      }
    }
  });
};
```

## Security Best Practices

### Development Guidelines

1. **Input Validation**
   - Validate all user inputs on frontend and backend
   - Use TypeScript for compile-time type checking
   - Implement Zod schemas for runtime validation

2. **Authentication**
   - Use strong password requirements
   - Implement session timeout
   - Secure token storage
   - Multi-factor authentication (future enhancement)

3. **Authorization**
   - Implement least privilege principle
   - Use RLS for database-level access control
   - Regular permission audits

4. **Error Handling**
   - Don't expose sensitive information in error messages
   - Log security events for monitoring
   - Implement proper fallbacks

5. **Dependencies**
   - Regular security updates
   - Vulnerability scanning
   - Dependency auditing

### Deployment Security

```typescript
// Environment-specific configurations
const securityConfig = {
  production: {
    forceHttps: true,
    secureCookies: true,
    strictCSP: true,
    auditLogging: true,
  },
  development: {
    forceHttps: false,
    secureCookies: false,
    strictCSP: false,
    auditLogging: false,
  },
};
```

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor security alerts
   - User reports
   - Automated detection

2. **Assessment**
   - Determine severity
   - Identify affected systems
   - Assess potential impact

3. **Containment**
   - Isolate affected systems
   - Prevent further damage
   - Preserve evidence

4. **Mitigation**
   - Apply security patches
   - Update security policies
   - Reset compromised credentials

5. **Recovery**
   - Restore normal operations
   - Verify system integrity
   - Update documentation

6. **Lessons Learned**
   - Conduct post-incident review
   - Update security measures
   - Improve monitoring

## Compliance & Standards

### Data Protection Regulations
- **GDPR**: European data protection compliance
- **CCPA**: California privacy compliance
- **SOX**: Financial reporting compliance (if applicable)

### Security Standards
- **OWASP Top 10**: Web application security
- **ISO 27001**: Information security management
- **NIST Cybersecurity Framework**: Risk management

---

This security overview provides a comprehensive foundation for maintaining a secure shopping cart management system. Regular security reviews and updates ensure continued protection against evolving threats.