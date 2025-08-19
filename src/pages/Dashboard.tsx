import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ShoppingCart, Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle, Package, CalendarIcon, Filter, X } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { getShoppingRequests, updateShoppingRequest, getAllProfiles } from "@/lib/supabase";
import type { ShoppingRequestWithItems, Profile } from "@/lib/supabase";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ShoppingRequestWithItems[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ShoppingRequestWithItems[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    requestType: 'all',
    requester: 'all',
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (profile) {
      loadRequests();
      loadProfiles();
    }
  }, [profile]);

  const loadRequests = async () => {
    try {
      const data = await getShoppingRequests();
      setRequests(data);
      setFilteredRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await getAllProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  // Apply filters whenever filters or requests change
  useEffect(() => {
    applyFilters();
  }, [filters, requests]);

  const applyFilters = () => {
    let filtered = [...requests];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.status === filters.status);
    }

    // Request type filter
    if (filters.requestType !== 'all') {
      filtered = filtered.filter(req => req.request_type === filters.requestType);
    }

    // Requester filter
    if (filters.requester !== 'all') {
      filtered = filtered.filter(req => req.requester_id === filters.requester);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(req => new Date(req.created_at) >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(req => new Date(req.created_at) <= filters.dateTo!);
    }

    // Search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(req => 
        req.request_number.toLowerCase().includes(query) ||
        req.justification?.toLowerCase().includes(query) ||
        req.requester.full_name.toLowerCase().includes(query)
      );
    }

    setFilteredRequests(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      requestType: 'all',
      requester: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      searchQuery: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.status !== 'all' || 
           filters.requestType !== 'all' || 
           filters.requester !== 'all' || 
           filters.dateFrom || 
           filters.dateTo || 
           filters.searchQuery.trim();
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string, additionalData?: any) => {
    try {
      await updateShoppingRequest(requestId, { 
        status: newStatus,
        ...additionalData
      });
      
      await loadRequests();
      toast({
        title: "Success",
        description: "Request status updated successfully.",
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request status.",
        variant: "destructive",
      });
    }
  };

  if (!profile) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      'draft': 'secondary',
      'pending_approval': 'warning',
      'approved': 'success',
      'rejected': 'destructive',
      'completed': 'default',
      'cancelled': 'secondary'
    } as const;

    const labels = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getStats = () => {
    const targetRequests = filteredRequests;
    return {
      total: targetRequests.length,
      pending: targetRequests.filter(r => r.status === 'pending_approval').length,
      approved: targetRequests.filter(r => r.status === 'approved').length,
      completed: targetRequests.filter(r => r.status === 'completed').length,
    };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Shopping Cart Dashboard</h1>
            <p className="text-muted-foreground">Manage your shopping requests</p>
          </div>
          
          <Button onClick={() => navigate('/request/new')} className="flex items-center space-x-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Requests</CardTitle>
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-3 w-3 md:h-4 md:w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-warning">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-success">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Completed</CardTitle>
              <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {hasActiveFilters() ? 'Filtered Requests' : 'Recent Requests'}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredRequests.length} total)
                  </span>
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
            
            {/* Filters Section - Now integrated into the main card */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t space-y-4">
                {/* Search Bar */}
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by request number, description, or requester..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="pending_approval">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Request Type Filter */}
                  <div className="space-y-2">
                    <Label>Request Type</Label>
                    <Select
                      value={filters.requestType}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, requestType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Requester Filter */}
                  <div className="space-y-2">
                    <Label>Requester</Label>
                    <Select
                      value={filters.requester}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, requester: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Requesters</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From Filter */}
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.dateFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateFrom ? format(filters.dateFrom, "MMM dd, yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateFrom}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To Filter */}
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.dateTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateTo ? format(filters.dateTo, "MMM dd, yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.dateTo}
                          onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Active Filters Summary */}
                {hasActiveFilters() && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    {filters.status !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Status: {filters.status}
                      </Badge>
                    )}
                    {filters.requestType !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {filters.requestType}
                      </Badge>
                    )}
                    {filters.requester !== 'all' && (
                      <Badge variant="secondary" className="text-xs">
                        Requester: {profiles.find(p => p.id === filters.requester)?.full_name}
                      </Badge>
                    )}
                    {filters.dateFrom && (
                      <Badge variant="secondary" className="text-xs">
                        From: {format(filters.dateFrom, "MMM dd, yyyy")}
                      </Badge>
                    )}
                    {filters.dateTo && (
                      <Badge variant="secondary" className="text-xs">
                        To: {format(filters.dateTo, "MMM dd, yyyy")}
                      </Badge>
                    )}
                    {filters.searchQuery.trim() && (
                      <Badge variant="secondary" className="text-xs">
                        Search: "{filters.searchQuery}"
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      ({filteredRequests.length} of {requests.length} requests)
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {hasActiveFilters() ? (
                  <div>
                    <p>No requests match your current filters</p>
                    <Button 
                      onClick={clearFilters}
                      variant="outline"
                      className="mt-4"
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p>No requests found</p>
                    <Button 
                      onClick={() => navigate('/request/new')}
                      className="mt-4"
                    >
                      Create Your First Request
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.slice(0, hasActiveFilters() ? filteredRequests.length : 10).map((request) => (
                  <div 
                    key={request.id} 
                    className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer space-y-2 md:space-y-0"
                    onClick={() => navigate(`/request/${request.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm md:text-base truncate">{request.request_number}</h3>
                        {getStatusBadge(request.status)}
                        <Badge variant="outline" className="text-xs">
                          {request.request_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {request.justification || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested by {request.requester.full_name} on {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground flex-shrink-0 text-right md:text-left">
                      {request.request_items?.length || 0} item{(request.request_items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};