import { Volleyball, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "./NotificationCenter";
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
  platform?: "sportsbox" | "fireflies";
}

export default function Navigation({ userMode, setUserMode, platform = "sportsbox" }: NavigationProps) {
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User | undefined, isAuthenticated: boolean, isLoading: boolean };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center space-x-2 md:space-x-6 flex-1 min-w-0">
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
              <img 
                src={Sports_Box_logo_011} 
                alt="Logo" 
                className="h-6 md:h-8 w-auto"
              />
            </div>
            
            {/* Platform Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/sportsbox"
                className={`text-sm font-semibold transition-colors ${
                  platform === "sportsbox" 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                SportsBox
              </Link>
              <Link 
                href="/fireflies"
                className={`text-sm font-semibold transition-colors ${
                  platform === "fireflies" 
                    ? "text-primary border-b-2 border-primary pb-1" 
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Fireflies
              </Link>
              <Link 
                href="/matches"
                className="text-sm font-semibold transition-colors text-gray-600 hover:text-gray-900"
              >
                Find Players
              </Link>
              <Link 
                href="/communities"
                className="text-sm font-semibold transition-colors text-gray-600 hover:text-gray-900"
              >
                Communities
              </Link>
            </nav>
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
              <div className="flex items-center gap-2">
                {isAuthenticated && <NotificationCenter />}
                {isAuthenticated ? (
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
                      <DropdownMenuItem asChild>
                        <Link href="/profile" data-testid="link-profile">
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/booking-history" data-testid="link-booking-history">
                          Booking History
                        </Link>
                      </DropdownMenuItem>
                      {((user as any)?.user_type === "vendor" || (user as any)?.userType === "vendor") && (
                        <DropdownMenuItem asChild>
                          <Link href="/vendor/dashboard">
                            Vendor Dashboard
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {((user as any)?.user_type !== "vendor" && (user as any)?.userType !== "vendor") && (
                        <DropdownMenuItem 
                          onClick={() => {
                            // This will be handled by the VendorOnboarding component
                            const event = new CustomEvent('openVendorOnboarding');
                            window.dispatchEvent(event);
                          }}
                        >
                          Become a Vendor
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
                    onClick={() => window.location.href = "/api/login"}
                    className="bg-primary hover:bg-green-700"
                  >
                    Sign In
                  </Button>
                </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
