import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { Analytics } from "@/components/Analytics";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { BulkOperations } from "@/components/BulkOperations";
import { getMovements, MaterialMovement } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";
import { BarChart3, Search, Settings, TrendingUp } from "lucide-react";

export const Reports = () => {
  const [movements, setMovements] = useState<MaterialMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<MaterialMovement[]>([]);
  const user = getCurrentUser();

  useEffect(() => {
    const allMovements = getMovements();
    setMovements(allMovements);
    setFilteredMovements(allMovements);
  }, []);

  const refreshData = () => {
    const allMovements = getMovements();
    setMovements(allMovements);
    setFilteredMovements(allMovements);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into material movements</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Search & Filter
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Bulk Operations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <Analytics />
          </TabsContent>

          <TabsContent value="search" className="space-y-6 mt-6">
            <SearchAndFilter 
              movements={movements} 
              onFilteredMovements={setFilteredMovements}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Filtered Results ({filteredMovements.length} movements)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredMovements.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No movements match your search criteria</p>
                    </div>
                  ) : (
                    filteredMovements.map((movement) => (
                      <div 
                        key={movement.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium">{movement.journalNumber}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              movement.status === 'completed' ? 'bg-green-100 text-green-800' :
                              movement.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                              movement.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {movement.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {movement.requestedByName} • {new Date(movement.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {movement.items.length} items
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6 mt-6">
            <BulkOperations 
              movements={movements} 
              onMovementsChange={refreshData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};