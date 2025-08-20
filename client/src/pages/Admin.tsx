import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import AdminInterface from "@/components/AdminInterface";
import AdminLogin from "@/components/AdminLogin";

export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Check server-side admin authentication instead of sessionStorage
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/admin/auth');
        if (response.ok) {
          const data = await response.json();
          setIsAdminAuthenticated(data.authenticated);
        } else {
          setIsAdminAuthenticated(false);
        }
      } catch (error) {
        console.error('Error checking admin authentication:', error);
        setIsAdminAuthenticated(false);
      }
    };

    checkAdminAuth();
  }, []);

  const handleLoginSuccess = () => {
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
            onClick={async () => {
              try {
                await fetch('/api/admin/logout', { method: 'POST' });
                setIsAdminAuthenticated(false);
              } catch (error) {
                console.error('Error logging out:', error);
                setIsAdminAuthenticated(false);
              }
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