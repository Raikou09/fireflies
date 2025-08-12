import { Volleyball, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  userMode: "customer" | "vendor";
  setUserMode: (mode: "customer" | "vendor") => void;
}

export default function Navigation({ userMode, setUserMode }: NavigationProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Volleyball className="text-primary text-2xl" />
              <span className="text-xl font-bold text-gray-900">CourtBook</span>
              <span className="text-sm bg-primary text-white px-2 py-1 rounded-full">KE</span>
            </div>
          </div>
          
          {/* User Type Toggle */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-100 p-1 rounded-lg">
              <Button
                size="sm"
                variant={userMode === "customer" ? "default" : "ghost"}
                onClick={() => setUserMode("customer")}
                className={userMode === "customer" ? "bg-primary text-white" : "text-gray-600"}
              >
                Customer
              </Button>
              <Button
                size="sm"
                variant={userMode === "vendor" ? "default" : "ghost"}
                onClick={() => setUserMode("vendor")}
                className={userMode === "vendor" ? "bg-primary text-white" : "text-gray-600"}
              >
                Vendor
              </Button>
            </div>
            
            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <img 
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=32&h=32"} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <span>{user?.firstName || user?.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
