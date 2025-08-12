import { LogOut, User, BarChart3, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate } from "react-router-dom";

import sikaLogo from "@/assets/sika-logo.png";

export const Header = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  if (!profile) return null;

  return (
    <header className="bg-primary text-primary-foreground shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={sikaLogo} 
              alt="Sika Mozambique" 
              className="h-12 w-auto bg-white p-2 rounded"
            />
            <div>
              <h1 className="text-xl font-bold">Internal Shopping cart</h1>
              <p className="text-primary-foreground/80 text-sm">Sika Mozambique</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden md:flex bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            

            {profile.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="hidden md:flex bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}

            

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{profile.full_name}</span>
              <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">
                {profile.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};