import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import AdminInterface from "@/components/AdminInterface";
import AdminManagement from "@/components/AdminManagement";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OpsCenter() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!isAuthenticated || !adminData?.isAdmin) {
        setLocation("/");
      }
    }
  }, [authLoading, adminLoading, isAuthenticated, adminData, setLocation]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated || !adminData?.isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ops Center</h1>
              <p className="text-sm text-gray-500">
                {adminData.email}
                <span className="ml-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {adminData.role}
                </span>
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            window.location.href = "/";
          }}>
            Sign Out
          </Button>
        </div>
        {adminData.role === "owner" && <div className="mb-6"><AdminManagement /></div>}
        <AdminInterface />
      </div>
    </div>
  );
}
