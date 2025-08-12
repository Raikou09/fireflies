import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AdminInterface from "@/components/AdminInterface";
import AdminLogin from "@/components/AdminLogin";

export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin is already authenticated (from sessionStorage)
    const adminAuth = sessionStorage.getItem("adminAuthenticated");
    if (adminAuth === "true") {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    sessionStorage.setItem("adminAuthenticated", "true");
    setIsAdminAuthenticated(true);
  };

  if (!isAdminAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation userMode="customer" setUserMode={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem("adminAuthenticated");
              setIsAdminAuthenticated(false);
            }}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Sign Out from Admin
          </button>
        </div>
        <AdminInterface />
      </div>
    </div>
  );
}