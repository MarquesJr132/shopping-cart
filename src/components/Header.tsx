import { LogOut, User, BarChart3, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, logout, isAdmin } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { NotificationCenter } from "@/components/NotificationCenter";
import sikaLogo from "@/assets/sika-logo.png";

export const Header = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

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
              <h1 className="text-xl font-bold">Internal Requisition Management System</h1>
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/reports')}
              className="hidden md:flex bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>

            {isAdmin(user.id) && (
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

            <NotificationCenter />

            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.name}</span>
              <span className="text-xs bg-primary-foreground/20 px-2 py-1 rounded">
                {user.role.replace('_', ' ').toUpperCase()}
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