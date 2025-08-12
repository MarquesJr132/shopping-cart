import { useState } from "react";
import { Search, Filter, Calendar, User, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { MaterialMovement } from "@/lib/database";
import { format } from "date-fns";

interface SearchAndFilterProps {
  movements: MaterialMovement[];
  onFilteredMovements: (filtered: MaterialMovement[]) => void;
}

export const SearchAndFilter = ({ movements, onFilteredMovements }: SearchAndFilterProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [requesterFilter, setRequesterFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const applyFilters = () => {
    let filtered = movements;

    if (searchTerm) {
      filtered = filtered.filter(movement => 
        movement.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.items.some(item => 
          item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(movement => movement.status === statusFilter);
    }

    if (requesterFilter) {
      filtered = filtered.filter(movement => movement.requestedByName === requesterFilter);
    }

    if (dateFrom) {
      filtered = filtered.filter(movement => new Date(movement.date) >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(movement => new Date(movement.date) <= dateTo);
    }

    onFilteredMovements(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setRequesterFilter("");
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilteredMovements(movements);
  };

  const uniqueRequesters = [...new Set(movements.map(m => m.requestedByName))];
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "pending_manager_approval", label: "Pending Manager" },
    { value: "pending_final_approval", label: "Pending Final" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Search & Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search movements, items, codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={requesterFilter} onValueChange={setRequesterFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Requester" />
            </SelectTrigger>
            <SelectContent>
              {uniqueRequesters.map(requester => (
                <SelectItem key={requester} value={requester}>
                  {requester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PP") : "From Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PP") : "To Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button variant="outline" onClick={clearFilters}>Clear All</Button>
        </div>

        {/* Filter Summary */}
        <div className="text-sm text-muted-foreground">
          {searchTerm && <span className="inline-block bg-secondary px-2 py-1 rounded mr-2">Search: "{searchTerm}"</span>}
          {statusFilter && <span className="inline-block bg-secondary px-2 py-1 rounded mr-2">Status: {statusOptions.find(s => s.value === statusFilter)?.label}</span>}
          {requesterFilter && <span className="inline-block bg-secondary px-2 py-1 rounded mr-2">Requester: {requesterFilter}</span>}
          {dateFrom && <span className="inline-block bg-secondary px-2 py-1 rounded mr-2">From: {format(dateFrom, "PP")}</span>}
          {dateTo && <span className="inline-block bg-secondary px-2 py-1 rounded mr-2">To: {format(dateTo, "PP")}</span>}
        </div>
      </CardContent>
    </Card>
  );
};