import { Volleyball, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Sports_Box_logo_011 from "@assets/Sports Box logo_011.jpg";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  userType: string;
}

interface NavigationProps {
  userMode: "customer" | "vendor";
  setUserMode: (mode: "customer" | "vendor") => void;
}

export default function Navigation({ userMode, setUserMode }: NavigationProps) {
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User | undefined, isAuthenticated: boolean, isLoading: boolean };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <div className="flex items-center space-x-1 md:space-x-2">
              <img 
                src={Sports_Box_logo_011} 
                alt="SportsBox Logo" 
                className="h-6 md:h-8 w-auto flex-shrink-0"
              />
              <span className="text-base md:text-xl font-bold text-gray-900 truncate">SportsBox</span>
            </div>
          </div>
          
          {/* Mobile-Optimized Controls */}
          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            <div className="bg-gray-100 p-1 rounded-lg">
              <Button
                size="sm"
                variant={userMode === "customer" ? "default" : "ghost"}
                onClick={() => setUserMode("customer")}
                className={`text-xs md:text-sm px-2 md:px-3 ${userMode === "customer" ? "bg-primary text-white" : "text-gray-600"}`}
              >
                <span className="hidden sm:inline">Customer</span>
                <span className="sm:hidden">Buy</span>
              </Button>
              <Button
                size="sm"
                variant={userMode === "vendor" ? "default" : "ghost"}
                onClick={() => setUserMode("vendor")}
                className={`text-xs md:text-sm px-2 md:px-3 ${userMode === "vendor" ? "bg-primary text-white" : "text-gray-600"}`}
              >
                <span className="hidden sm:inline">Vendor</span>
                <span className="sm:hidden">Sell</span>
              </Button>
            </div>
            
            {/* Authentication Section */}
            {!isLoading && (
              isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <img 
                        src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32"} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-700">{user?.firstName || 'User'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {((user as any)?.user_type === "vendor" || (user as any)?.userType === "vendor") && (
                      <DropdownMenuItem asChild>
                        <Link href="/vendor/dashboard">
                          Vendor Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.href = "/api/auth/google"}
                    className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                  <Button 
                    onClick={() => window.location.href = "/api/login"}
                    className="bg-primary hover:bg-green-700"
                  >
                    Sign In
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
