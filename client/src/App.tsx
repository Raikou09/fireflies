import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationToast } from "@/components/NotificationToast";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import FirefliesHome from "@/pages/FirefliesHome";
import Admin from "@/pages/Admin";
import VendorDashboard from "@/pages/VendorDashboard";
import CourtDetails from "@/pages/CourtDetails";
import EventDetails from "@/pages/EventDetails";
import BookingHistory from "@/pages/BookingHistory";
import UserProfile from "@/pages/UserProfile";
import NotFound from "@/pages/not-found";
import VendorOnboarding from "@/components/VendorOnboarding";
import { useState, useEffect } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Vendor Dashboard - Google Auth Required */}
      <Route path="/vendor/dashboard" component={VendorDashboard} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      
      {/* Public Routes - No Authentication Required */}
      <Route path="/" component={Home} />
      <Route path="/sportsbox" component={Home} />
      <Route path="/fireflies" component={FirefliesHome} />
      <Route path="/court/:id" component={CourtDetails} />
      <Route path="/fireflies/event/:id" component={EventDetails} />
      <Route path="/booking-history" component={BookingHistory} />
      <Route path="/profile" component={UserProfile} />
      <Route path="/ops-center" component={Admin} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isVendorOnboardingOpen, setIsVendorOnboardingOpen] = useState(false);

  useEffect(() => {
    const handleOpenVendorOnboarding = () => {
      setIsVendorOnboardingOpen(true);
    };

    window.addEventListener('openVendorOnboarding', handleOpenVendorOnboarding);
    
    return () => {
      window.removeEventListener('openVendorOnboarding', handleOpenVendorOnboarding);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationToast />
        <Toaster />
        <Router />
        <VendorOnboarding 
          isOpen={isVendorOnboardingOpen} 
          onClose={() => setIsVendorOnboardingOpen(false)} 
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
