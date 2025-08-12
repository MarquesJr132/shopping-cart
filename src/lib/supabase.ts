import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ShoppingRequest = Database['public']['Tables']['shopping_requests']['Row'];
export type RequestItem = Database['public']['Tables']['request_items']['Row'];

export interface ShoppingRequestWithItems extends ShoppingRequest {
  request_items: RequestItem[];
  requester: Profile;
  manager_approval?: Profile | null;
  procurement_handler?: Profile | null;
}

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (userId?: string) => {
  if (!userId) {
    const user = await getCurrentUser();
    if (!user) return null;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
};

// Shopping requests helpers
export const createShoppingRequest = async (request: Partial<ShoppingRequest> & { requester_id: string; request_type: string; status: string }) => {
  const { data: requestNumber } = await supabase.rpc('generate_request_number');
  
  const { data, error } = await supabase
    .from('shopping_requests')
    .insert({
      ...request,
      request_number: requestNumber
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating shopping request:', error);
    throw error;
  }

  return data;
};

export const getShoppingRequests = async () => {
  const { data, error } = await supabase
    .from('shopping_requests')
    .select(`
      *,
      request_items (*),
      requester:profiles!shopping_requests_requester_id_fkey (*),
      manager_approval:profiles!shopping_requests_manager_approval_id_fkey (*),
      procurement_handler:profiles!shopping_requests_procurement_handled_by_fkey (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching shopping requests:', error);
    throw error;
  }

  return data as ShoppingRequestWithItems[];
};

export const getShoppingRequestById = async (id: string) => {
  const { data, error } = await supabase
    .from('shopping_requests')
    .select(`
      *,
      request_items (*),
      requester:profiles!shopping_requests_requester_id_fkey (*),
      manager_approval:profiles!shopping_requests_manager_approval_id_fkey (*),
      procurement_handler:profiles!shopping_requests_procurement_handled_by_fkey (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching shopping request:', error);
    throw error;
  }

  return data as ShoppingRequestWithItems;
};

export const updateShoppingRequest = async (id: string, updates: Partial<ShoppingRequest>) => {
  const { data, error } = await supabase
    .from('shopping_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating shopping request:', error);
    throw error;
  }

  return data;
};

export const addRequestItems = async (requestId: string, items: Omit<RequestItem, 'id' | 'request_id' | 'created_at'>[]) => {
  const { data, error } = await supabase
    .from('request_items')
    .insert(items.map(item => ({ ...item, request_id: requestId })))
    .select();

  if (error) {
    console.error('Error adding request items:', error);
    throw error;
  }

  return data;
};

export const deleteRequestItems = async (requestId: string) => {
  const { error } = await supabase
    .from('request_items')
    .delete()
    .eq('request_id', requestId);

  if (error) {
    console.error('Error deleting request items:', error);
    throw error;
  }
};

// Profile management helpers
export const createProfile = async (profile: Partial<Profile> & { user_id: string; email: string; full_name: string; role: string }) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('Error creating profile:', error);
    throw error;
  }

  return data;
};

export const updateProfile = async (id: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};

export const getAllProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Error fetching profiles:', error);
    throw error;
  }

  return data;
};

// Authorization helpers
export const canApprove = (userRole: string, currentStatus: string): boolean => {
  if (currentStatus === 'pending_approval') {
    return userRole === 'manager' || userRole === 'procurement';
  }
  return false;
};

export const canManage = (userRole: string): boolean => {
  return userRole === 'procurement';
};

export const canGeneratePDF = (userRole: string): boolean => {
  return userRole === 'procurement' || userRole === 'manager' || userRole === 'admin';
};