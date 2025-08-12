import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import sikaLogo from "@/assets/sika-logo.png";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const user = login(email);
    
    if (user) {
      toast({
        title: "Login successful",
        description: `Welcome, ${user.name}!`,
      });
      navigate('/');
    } else {
      toast({
        title: "Login failed",
        description: "User not found. Please check your email address.",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sika-gray-light">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex justify-center mb-4">
            <img 
              src={sikaLogo} 
              alt="Sika Mozambique" 
              className="h-16 w-auto bg-white p-2 rounded"
            />
          </div>
          <CardTitle className="text-xl">Internal Requisition Management System</CardTitle>
          <p className="text-primary-foreground/80 text-sm">Sika Mozambique</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full"
                defaultValue="password"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Demo system - any password accepted
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !email}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 text-xs text-muted-foreground">
            <p className="font-medium mb-2">Demo Users:</p>
            <div className="space-y-1">
              <p>junior.jose@mz.sika.com (Requester)</p>
              <p>joana.sales@mz.sika.com (Sales Requester)</p>
              <p>braganca.carla@mz.sika.com (Manager)</p>
              <p>miguel.saleslead@mz.sika.com (Sales Manager)</p>
              <p>gm.sika@mz.sika.com (General Manager)</p>
              <p>control.finance@mz.sika.com (Controller)</p>
              <p>procurement.sika@mz.sika.com (Procurement)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};