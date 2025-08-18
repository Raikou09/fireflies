import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, BarChart3, Volleyball, Star, DollarSign, Users } from "lucide-react";
import AddCourtModal from "./AddCourtModal";
import { useAuth } from "@/hooks/useAuth";

export default function VendorInterface() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAddCourtModalOpen, setIsAddCourtModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "analytics">("dashboard");

  const { data: stats } = useQuery<{
    totalCourts: number;
    activeBookings: number;
    monthlyRevenue: number;
    averageRating: number;
  }>({
    queryKey: ["/api/vendor/stats"],
    refetchInterval: false,
    enabled: isAuthenticated,
  });

  const { data: courts = [] } = useQuery<Array<{
    id: string;
    name: string;
    city: string;
    area: string;
    approvalStatus: "pending" | "approved" | "rejected";
    isActive: boolean;
    availableSports: string[];
  }>>({
    queryKey: ["/api/vendor/courts"],
    refetchInterval: false,
    enabled: isAuthenticated,
  });

  // Show login prompt if not authenticated
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in with Google to access the vendor dashboard and manage your courts.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-green-700"
            size="lg"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Dashboard</h1>
            <p className="text-gray-600">Manage your sports courts and bookings</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Courts</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalCourts || 0}</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                    <Volleyball className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.activeBookings || 0}</p>
                  </div>
                  <div className="bg-secondary bg-opacity-10 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      KES {Number(stats?.monthlyRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-accent bg-opacity-10 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {Number(stats?.averageRating || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-yellow-500 bg-opacity-10 p-3 rounded-full">
                    <Star className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  className="bg-primary text-white hover:bg-green-700 h-16"
                  onClick={() => setIsAddCourtModalOpen(true)}
                >
                  <Plus className="h-6 w-6 mr-3" />
                  <span className="font-medium">Add New Court</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16"
                  onClick={() => setActiveTab("bookings")}
                  data-testid="button-view-bookings"
                >
                  <Calendar className="h-6 w-6 mr-3" />
                  <span className="font-medium">View Bookings</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16"
                  onClick={() => setActiveTab("analytics")}
                  data-testid="button-analytics"
                >
                  <BarChart3 className="h-6 w-6 mr-3" />
                  <span className="font-medium">Analytics</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6">
            <Button
              variant={activeTab === "dashboard" ? "default" : "outline"}
              onClick={() => setActiveTab("dashboard")}
              className={activeTab === "dashboard" ? "bg-primary" : ""}
              data-testid="tab-dashboard"
            >
              Dashboard
            </Button>
            <Button
              variant={activeTab === "bookings" ? "default" : "outline"}
              onClick={() => setActiveTab("bookings")}
              className={activeTab === "bookings" ? "bg-primary" : ""}
              data-testid="tab-bookings"
            >
              Bookings
            </Button>
            <Button
              variant={activeTab === "analytics" ? "default" : "outline"}
              onClick={() => setActiveTab("analytics")}
              className={activeTab === "analytics" ? "bg-primary" : ""}
              data-testid="tab-analytics"
            >
              Analytics
            </Button>
          </div>

          {/* Dashboard Tab Content */}
          {activeTab === "dashboard" && (
            <>
              {/* Courts Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Your Courts</CardTitle>
                    <Button 
                      className="bg-primary text-white hover:bg-green-700"
                      onClick={() => setIsAddCourtModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Court
                    </Button>
                  </div>
                </CardHeader>
            <CardContent>
              {courts.length === 0 ? (
                <div className="text-center py-12">
                  <Volleyball className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No courts added yet</p>
                  <Button 
                    className="bg-primary text-white hover:bg-green-700"
                    onClick={() => setIsAddCourtModalOpen(true)}
                  >
                    Add Your First Court
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courts.map((court: any) => (
                    <div key={court.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img 
                          src={court.imageUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=80&h=80"} 
                          alt={court.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{court.name}</h4>
                          <p className="text-sm text-gray-600">{court.availableSports.join(', ')} • {court.area}, {court.city}</p>
                          <p className="text-sm text-gray-500">KES {court.hourlyRate}/hour</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          court.approvalStatus === 'approved' && court.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : court.approvalStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : court.approvalStatus === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {court.approvalStatus === 'approved' 
                            ? (court.isActive ? 'Active' : 'Approved - Inactive')
                            : court.approvalStatus === 'pending'
                            ? 'Pending Approval'
                            : court.approvalStatus === 'rejected'
                            ? 'Rejected'
                            : 'Unknown'
                          }
                        </span>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
              </Card>
            </>
          )}

          {/* Bookings Tab Content */}
          {activeTab === "bookings" && (
            <Card>
              <CardHeader>
                <CardTitle>Your Court Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">No bookings yet</p>
                  <p className="text-gray-400 text-sm">
                    Bookings for your courts will appear here once customers start making reservations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Tab Content */}
          {activeTab === "analytics" && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-4">Analytics coming soon</p>
                  <p className="text-gray-400 text-sm">
                    Detailed analytics about your court performance, revenue, and customer insights will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <AddCourtModal
        isOpen={isAddCourtModalOpen}
        onClose={() => setIsAddCourtModalOpen(false)}
      />
    </>
  );
}
