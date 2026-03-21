import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, BarChart3, Volleyball, Star, DollarSign, Users, UserPlus, Clock, AlertTriangle, CheckCircle, Mail, FileEdit, ArrowRight } from "lucide-react";
import AddCourtModal from "./AddCourtModal";
import VendorOnboarding from "./VendorOnboarding";
import { useAuth } from "@/hooks/useAuth";

interface CourtData {
  id: string;
  name: string;
  city: string;
  area: string;
  address?: string | null;
  description?: string | null;
  hourlyRate: string;
  peakHourRate?: string | null;
  openingTime: string;
  closingTime: string;
  rules?: string | null;
  availableSports?: string[];
  facilityType?: 'separate_areas' | 'shared_area';
  availableDays?: string[];
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  approvalStatus: "pending" | "approved" | "rejected";
  isActive: boolean;
}

export default function VendorInterface() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isAddCourtModalOpen, setIsAddCourtModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "bookings" | "analytics">("dashboard");
  const [courtToEdit, setCourtToEdit] = useState<CourtData | null>(null);

  // Get user verification status
  const userType = (user as any)?.userType || (user as any)?.user_type;
  const verificationStatus = (user as any)?.vendorVerificationStatus;
  const isVerifiedVendor = userType === "vendor" && verificationStatus === "verified";

  const { data: stats } = useQuery<{
    totalCourts: number;
    activeBookings: number;
    monthlyRevenue: number;
    averageRating: number;
  }>({
    queryKey: ["/api/vendor/stats"],
    refetchInterval: false,
    enabled: isAuthenticated && isVerifiedVendor,
  });

  const { data: courts = [] } = useQuery<CourtData[]>({
    queryKey: ["/api/vendor/courts"],
    refetchInterval: false,
    enabled: isAuthenticated && isVerifiedVendor,
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

  // PENDING vendor - show thank you with edit option
  if (userType === "vendor" && (!verificationStatus || verificationStatus === "pending")) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Application Under Review</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-gray-600 text-lg">
                Your vendor application has been submitted successfully.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">What happens next?</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Our admin team is reviewing your application. You will be notified on your registered email soon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <FileEdit className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Need to make changes?</p>
                    <p className="text-sm text-gray-600 mt-1">
                      You can still edit your application details before approval.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowOnboarding(true)} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileEdit className="w-4 h-4 mr-2" />
                Edit Application
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <VendorOnboarding 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)}
          existingData={user}
          isEditing={true}
        />
      </>
    );
  }

  // REJECTED vendor
  if (userType === "vendor" && verificationStatus === "rejected") {
    const rejectionReason = (user as any)?.rejectionReason;
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Application Not Approved</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-gray-600">
              Unfortunately, your vendor application was not approved at this time.
            </p>
            
            {rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="font-medium text-red-900 mb-1">Reason:</p>
                <p className="text-sm text-red-700">{rejectionReason}</p>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600">
                If you believe this is an error or would like to reapply, please contact our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // NOT a vendor - show sign up option
  if (!isVerifiedVendor) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Become a Vendor</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-gray-600 text-lg">
                Join SportsBox and start listing your sports courts to reach thousands of customers.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">List Your Courts</p>
                  <p className="text-sm text-gray-600">Add unlimited sports facilities</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">Get Bookings</p>
                  <p className="text-sm text-gray-600">Receive bookings from customers</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">M-Pesa Payments</p>
                  <p className="text-sm text-gray-600">Receive payments directly</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">Track your business growth</p>
                </div>
              </div>

              <Button 
                onClick={() => setShowOnboarding(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                size="lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Sign Up to Be a Vendor
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <VendorOnboarding 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)}
        />
      </>
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
                          src={court.imageUrl || court.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e8f5e9'/%3E%3Ccircle cx='40' cy='35' r='14' fill='%2366bb6a' opacity='0.5'/%3E%3Ctext x='40' y='65' text-anchor='middle' font-family='sans-serif' font-size='9' fill='%23388e3c'%3ENo photo%3C/text%3E%3C/svg%3E"} 
                          alt={court.name}
                          className="w-16 h-16 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23e8f5e9'/%3E%3Ccircle cx='40' cy='35' r='14' fill='%2366bb6a' opacity='0.5'/%3E%3Ctext x='40' y='65' text-anchor='middle' font-family='sans-serif' font-size='9' fill='%23388e3c'%3ENo photo%3C/text%3E%3C/svg%3E";
                          }}
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setCourtToEdit(court);
                            setIsAddCourtModalOpen(true);
                          }}
                        >
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
        onClose={() => {
          setIsAddCourtModalOpen(false);
          setCourtToEdit(null);
        }}
        courtToEdit={courtToEdit}
      />
    </>
  );
}
