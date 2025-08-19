# Database Schema Documentation

This document provides a comprehensive overview of the database schema for the Sika Shopping Cart Management System.

## Overview

The system uses PostgreSQL with Supabase and implements Row Level Security (RLS) for data protection. The schema consists of four main tables with well-defined relationships and comprehensive security policies.

## Database Tables

### 1. profiles

Stores user profile information and role assignments.

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text NOT NULL,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  position text,
  cost_center text,
  manager_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### Columns
| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| user_id | uuid | No | - | References auth.users |
| email | text | No | - | User email address |
| full_name | text | No | - | User's full name |
| role | user_role | No | 'user' | User role (user/manager/procurement/admin) |
| position | text | Yes | - | Job title |
| cost_center | text | Yes | - | Department/cost center |
| manager_id | uuid | Yes | - | Reference to manager's profile |
| created_at | timestamp | No | now() | Record creation time |
| updated_at | timestamp | No | now() | Last update time |

#### Relationships
- Self-referencing: `manager_id` → `profiles.id`
- External reference: `user_id` → `auth.users.id`

### 2. shopping_requests

Main table for shopping requests with approval workflow.

```sql
CREATE TABLE public.shopping_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number text NOT NULL,
  requester_id uuid NOT NULL,
  request_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  total_amount numeric DEFAULT 0,
  justification text,
  delivery_date date,
  preferred_supplier text,
  client_name text,
  client_id text,
  manager_approval_id uuid,
  manager_approved_at timestamp with time zone,
  manager_comments text,
  rejection_reason text,
  procurement_handled_by uuid,
  procurement_notes text,
  procurement_completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### Key Columns
| Column | Type | Description |
|--------|------|-------------|
| request_number | text | Auto-generated unique identifier (SC2025XXXX) |
| requester_id | uuid | Profile ID of request creator |
| status | text | Current request status |
| manager_approval_id | uuid | Profile ID of approving manager |
| procurement_handled_by | uuid | Profile ID of procurement handler |

#### Status Values
- `draft`: Being prepared
- `pending_manager_approval`: Awaiting manager approval
- `manager_approved`: Approved by manager
- `in_procurement`: Being processed by procurement
- `completed`: Order fulfilled
- `rejected`: Request denied

### 3. request_items

Individual items within shopping requests.

```sql
CREATE TABLE public.request_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL,
  item_code text NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_price numeric,
  total_price numeric,
  supplier text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### Relationships
- `request_id` → `shopping_requests.id`

### 4. shopping_cart_items

Temporary storage for items before creating requests.

```sql
CREATE TABLE public.shopping_cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  item_code text NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  unit_price numeric,
  total_price numeric,
  supplier text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### Relationships
- `user_id` → `auth.users.id`

## User Roles Enum

```sql
CREATE TYPE public.user_role AS ENUM (
  'user',
  'manager', 
  'procurement',
  'admin'
);
```

## Database Functions

### 1. generate_request_number()

Generates unique request numbers in format SC[YEAR][SEQUENCE].

```sql
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year TEXT;
  next_number INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(request_number, 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.shopping_requests
  WHERE request_number LIKE 'SC' || current_year || '%';
  
  RETURN 'SC' || current_year || LPAD(next_number::TEXT, 4, '0');
END;
$$;
```

### 2. get_current_user_role()

Returns the current user's role for RLS policies.

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$;
```

### 3. get_current_user_profile_id()

Returns the current user's profile ID.

```sql
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;
```

### 4. handle_new_user()

Automatically creates profile for new users (auth trigger).

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    CASE 
      WHEN NEW.email = 'admin@admin.com' THEN 'admin'::public.user_role
      ELSE 'user'::public.user_role
    END
  );
  RETURN NEW;
END;
$$;
```

### 5. update_updated_at_column()

Trigger function to automatically update timestamps.

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

## Row Level Security Policies

### profiles Table Policies

#### SELECT Policies
1. **Users can view own profile**
   ```sql
   auth.uid() = user_id
   ```

2. **Managers can view direct reports**
   ```sql
   manager_id = get_current_user_profile_id()
   ```

3. **Admin staff can view all profiles**
   ```sql
   get_current_user_role() = 'admin'::text
   ```

4. **Procurement staff can view all profiles**
   ```sql
   get_current_user_role() = 'procurement'::text
   ```

#### INSERT/UPDATE/DELETE Policies
- Users can manage their own profiles
- Admins can manage any profile
- Appropriate role-based restrictions

### shopping_requests Table Policies

#### Main Access Policy
Users can view/update requests if they are:
- The requester
- The assigned manager
- Procurement staff (for approved requests)

```sql
(requester_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) 
OR (manager_approval_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())) 
OR (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'procurement'::user_role))
```

### request_items Table Policies

Access to request items follows the same pattern as shopping requests, ensuring users can only see items for requests they have access to.

### shopping_cart_items Table Policies

Simple user-based isolation:
```sql
auth.uid() = user_id
```

## Indexes and Performance

### Primary Indexes
- All tables have UUID primary keys with automatic indexes
- Foreign key columns are automatically indexed

### Custom Indexes
```sql
-- Optimize request number lookups
CREATE INDEX idx_shopping_requests_request_number ON shopping_requests(request_number);

-- Optimize status filtering
CREATE INDEX idx_shopping_requests_status ON shopping_requests(status);

-- Optimize user-based queries
CREATE INDEX idx_shopping_requests_requester_id ON shopping_requests(requester_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
```

## Data Relationships Diagram

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ├── shopping_requests (1:many) ← requester_id
    │   └── request_items (1:many)
    ├── shopping_cart_items (1:many) ← user_id  
    ├── manager relationship (self-referencing) ← manager_id
    ├── manager_approval_id → profiles.id
    └── procurement_handled_by → profiles.id
```

## Security Considerations

### Data Protection
- **RLS Enabled**: All tables have Row Level Security enabled
- **User Isolation**: Users can only access their own data
- **Role-based Access**: Different permissions for each role
- **Audit Trail**: Created/updated timestamps on all records

### Authentication Integration
- **Supabase Auth**: Leverages Supabase authentication
- **JWT Tokens**: Secure session management
- **Profile Creation**: Automatic profile creation on signup

### Best Practices
- **Least Privilege**: Users get minimum required access
- **Data Validation**: Input validation at application layer
- **Secure Functions**: Database functions use SECURITY DEFINER
- **Immutable Auditing**: Preserve historical data integrity

---

This schema provides a robust foundation for the shopping cart management system with proper security, relationships, and performance considerations.