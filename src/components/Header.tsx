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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <img 
              src={sikaLogo} 
              alt="Sika Mozambique" 
              className="h-8 w-auto md:h-12 bg-white p-1 md:p-2 rounded flex-shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-sm md:text-xl font-bold truncate">Internal Shopping cart</h1>
              <p className="text-primary-foreground/80 text-xs md:text-sm truncate">Sika Mozambique</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Home className="h-4 w-4 mr-1" />
              <span className="hidden lg:inline">Dashboard</span>
            </Button>
            
            {profile.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="hidden sm:flex bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Settings className="h-4 w-4 mr-1" />
                <span className="hidden lg:inline">Admin</span>
              </Button>
            )}

            <div className="hidden md:flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm truncate max-w-24">{profile.full_name}</span>
              <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded whitespace-nowrap">
                {profile.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};