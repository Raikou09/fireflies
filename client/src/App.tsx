import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotificationToast } from "@/components/NotificationToast";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Admin from "@/pages/Admin";
import VendorDashboard from "@/pages/VendorDashboard";
import CourtDetails from "@/pages/CourtDetails";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Vendor Dashboard - Google Auth Required */}
      <Route path="/vendor/dashboard" component={VendorDashboard} />
      <Route path="/vendor-dashboard" component={VendorDashboard} />
      
      {/* Public Routes - No Authentication Required */}
      <Route path="/" component={Home} />
      <Route path="/court/:id" component={CourtDetails} />
      <Route path="/admin" component={Admin} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <NotificationToast />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
