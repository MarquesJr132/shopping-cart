# API Reference

This document provides comprehensive API reference for the Sika Shopping Cart Management System using Supabase client library.

## Overview

The system uses Supabase as the backend, providing:
- **REST API**: Auto-generated from database schema
- **Real-time subscriptions**: Live data updates
- **Authentication**: JWT-based session management
- **Row Level Security**: Database-enforced access control

## Client Setup

### Supabase Client Configuration

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dwlyjmgksmehgmpehzvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## Authentication API

### Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### Logout
```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Auth State Changes
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    // Handle login
  }
  if (event === 'SIGNED_OUT') {
    // Handle logout
  }
});
```

## Profiles API

### Get User Profile
```typescript
async function getProfile(userId?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      user_id,
      email,
      full_name,
      role,
      position,
      cost_center,
      manager_id,
      created_at,
      updated_at
    `)
    .eq('user_id', userId || (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (error) throw error;
  return data;
}
```

### Update Profile
```typescript
async function updateProfile(id: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Get All Profiles (Admin/Procurement)
```typescript
async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) throw error;
  return data;
}
```

## Shopping Cart API

### Get Cart Items
```typescript
async function getCartItems() {
  const { data, error } = await supabase
    .from('shopping_cart_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Add Cart Item
```typescript
async function addCartItem(item: Omit<CartItem, 'id' | 'user_id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('shopping_cart_items')
    .insert({
      ...item,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Update Cart Item
```typescript
async function updateCartItem(id: string, updates: Partial<CartItem>) {
  const { data, error } = await supabase
    .from('shopping_cart_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Delete Cart Item
```typescript
async function deleteCartItem(id: string) {
  const { error } = await supabase
    .from('shopping_cart_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

### Clear Cart
```typescript
async function clearCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('shopping_cart_items')
    .delete()
    .eq('user_id', user.id);

  if (error) throw error;
}
```

## Shopping Requests API

### Create Request
```typescript
async function createShoppingRequest(request: Partial<ShoppingRequest> & {
  requester_id: string;
  request_type: string;
  status: string;
}) {
  // Generate request number
  const { data: requestNumber } = await supabase.rpc('generate_request_number');
  
  const { data, error } = await supabase
    .from('shopping_requests')
    .insert({
      ...request,
      request_number: requestNumber
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Get All Requests
```typescript
async function getShoppingRequests() {
  const { data, error } = await supabase
    .from('shopping_requests')
    .select(`
      *,
      request_items (*),
      requester:profiles!requester_id (*),
      manager_approval:profiles!manager_approval_id (*),
      procurement_handler:profiles!procurement_handled_by (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

### Get Request by ID
```typescript
async function getShoppingRequestById(id: string) {
  const { data, error } = await supabase
    .from('shopping_requests')
    .select(`
      *,
      request_items (*),
      requester:profiles!requester_id (*),
      manager_approval:profiles!manager_approval_id (*),
      procurement_handler:profiles!procurement_handled_by (*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

### Update Request
```typescript
async function updateShoppingRequest(id: string, updates: Partial<ShoppingRequest>) {
  const { data, error } = await supabase
    .from('shopping_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Approve Request
```typescript
async function approveRequest(id: string, comments?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const profile = await getProfile(user.id);
  
  const { data, error } = await supabase
    .from('shopping_requests')
    .update({
      status: 'manager_approved',
      manager_approval_id: profile.id,
      manager_approved_at: new Date().toISOString(),
      manager_comments: comments
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Reject Request
```typescript
async function rejectRequest(id: string, reason: string) {
  const { data, error } = await supabase
    .from('shopping_requests')
    .update({
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

## Request Items API

### Add Items to Request
```typescript
async function addRequestItems(
  requestId: string, 
  items: Omit<RequestItem, 'id' | 'request_id' | 'created_at'>[]
) {
  const itemsToInsert = items.map(item => ({
    ...item,
    request_id: requestId
  }));

  const { data, error } = await supabase
    .from('request_items')
    .insert(itemsToInsert)
    .select();

  if (error) throw error;
  return data;
}
```

### Update Request Item
```typescript
async function updateRequestItem(id: string, updates: Partial<RequestItem>) {
  const { data, error } = await supabase
    .from('request_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Delete Request Items
```typescript
async function deleteRequestItems(requestId: string) {
  const { error } = await supabase
    .from('request_items')
    .delete()
    .eq('request_id', requestId);

  if (error) throw error;
}
```

## Real-time Subscriptions

### Subscribe to Request Changes
```typescript
const subscription = supabase
  .channel('shopping_requests_changes')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'shopping_requests' 
    },
    (payload) => {
      console.log('Request changed:', payload);
      // Handle real-time updates
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

### Subscribe to User's Requests
```typescript
const { data: { user } } = await supabase.auth.getUser();
const profile = await getProfile(user?.id);

const subscription = supabase
  .channel('user_requests')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shopping_requests',
      filter: `requester_id=eq.${profile.id}`
    },
    (payload) => {
      // Handle user's request updates
    }
  )
  .subscribe();
```

## Database Functions

### Generate Request Number
```typescript
const { data, error } = await supabase.rpc('generate_request_number');
```

### Get Current User Role
```typescript
const { data, error } = await supabase.rpc('get_current_user_role');
```

### Get Current User Profile ID
```typescript
const { data, error } = await supabase.rpc('get_current_user_profile_id');
```

## Authorization Helpers

### Role-based Authorization
```typescript
function canApprove(userRole: string, currentStatus: string): boolean {
  return userRole === 'manager' && currentStatus === 'pending_manager_approval';
}

function canManage(userRole: string): boolean {
  return ['admin', 'procurement'].includes(userRole);
}

function canGeneratePDF(userRole: string): boolean {
  return ['manager', 'procurement', 'admin'].includes(userRole);
}
```

## Error Handling

### Common Error Patterns
```typescript
try {
  const data = await apiCall();
  return data;
} catch (error) {
  if (error.code === 'PGRST301') {
    // Row Level Security violation
    throw new Error('Access denied');
  }
  if (error.code === '23505') {
    // Unique constraint violation
    throw new Error('Duplicate entry');
  }
  throw error;
}
```

### Type Safety
```typescript
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ShoppingRequest = Database['public']['Tables']['shopping_requests']['Row'];
type RequestItem = Database['public']['Tables']['request_items']['Row'];
```

## Rate Limiting & Performance

### Best Practices
- Use select() to limit returned columns
- Implement pagination for large datasets
- Use filters to reduce data transfer
- Cache frequently accessed data
- Use real-time subscriptions judiciously

### Query Optimization
```typescript
// Good: Select only needed columns
const { data } = await supabase
  .from('shopping_requests')
  .select('id, request_number, status')
  .eq('status', 'pending_manager_approval');

// Good: Use pagination
const { data } = await supabase
  .from('shopping_requests')
  .select('*')
  .range(0, 9); // First 10 records
```

---

This API reference provides the foundation for all data operations in the system. Always refer to the latest Supabase documentation for additional features and best practices.