import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Calendar,
  DollarSign,
  Trophy,
  BarChart3,
  TrendingUp,
  MapPin,
  LogOut,
  AlertCircle,
  ArrowLeft,
  Package,
  Edit,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import EquipmentManager from "@/components/EquipmentManager";
import VendorCourtUpdateModal from "@/components/VendorCourtUpdateModal";
import AddCourtModal from "@/components/AddCourtModal";
import { NotificationTestPanel } from "@/components/NotificationTestPanel";
import type { CourtWithDetails } from "@shared/schema";

interface VendorStats {
  totalCourts: number;
  activeBookings: number;
  monthlyRevenue: number;
  averageRating: number;
}

interface CourtAnalytics {
  courtId: string;
  courtName: string;
  city: string;
  totalBookings: number;
  revenue: number;
  averageRating: number;
  popularSports: Array<{ sport: string; bookings: number }>;
  recentBookings: Array<{
    date: string;
    sport: string;
    revenue: number;
    customerPhone: string;
  }>;
}

interface CityAnalytics {
  city: string;
  totalCourts: number;
  totalBookings: number;
  revenue: number;
  popularSports: Array<{ sport: string; bookings: number }>;
}

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isVendor, setIsVendor] = useState(false);
  const [vendorCheckLoading, setVendorCheckLoading] = useState(true);
  const [selectedCourtForEquipment, setSelectedCourtForEquipment] = useState<string | null>(null);
  const [courtToUpdate, setCourtToUpdate] = useState<CourtWithDetails | null>(null);
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);

  // Debug courtToUpdate state changes
  React.useEffect(() => {
    console.log('courtToUpdate state changed:', courtToUpdate);
  }, [courtToUpdate]);

  // Check if current user is a vendor
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!isAuthenticated || !user) {
        setVendorCheckLoading(false);
        return;
      }

      // Check if user has user_type field directly
      if ((user as any)?.user_type === "vendor" || (user as any)?.userType === "vendor") {
        setIsVendor(true);
        setVendorCheckLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/vendor/check');
        if (response.ok) {
          const data = await response.json();
          setIsVendor(data.isVendor);
        }
      } catch (error) {
        console.error("Error checking vendor status:", error);
        // Fallback: check if user object has vendor type  
        setIsVendor((user as any)?.user_type === "vendor" || (user as any)?.userType === "vendor");
      } finally {
        setVendorCheckLoading(false);
      }
    };

    if (!isLoading) {
      checkVendorStatus();
    }
  }, [isAuthenticated, user, isLoading]);

  // Fetch vendor stats
  const { data: stats, isLoading: statsLoading } = useQuery<VendorStats>({
    queryKey: ['/api/vendor/stats'],
    enabled: isAuthenticated && isVendor,
  });

  // Fetch vendor courts
  const { data: vendorCourts = [] } = useQuery<CourtWithDetails[]>({
    queryKey: ['/api/vendor/courts'],
    enabled: isAuthenticated && isVendor,
  });

  // Fetch detailed analytics
  const { data: courtAnalytics = [] } = useQuery<CourtAnalytics[]>({
    queryKey: ['/api/vendor/analytics/courts'],
    enabled: isAuthenticated && isVendor,
  });

  const { data: cityAnalytics = [] } = useQuery<CityAnalytics[]>({
    queryKey: ['/api/vendor/analytics/cities'],
    enabled: isAuthenticated && isVendor,
  });

  // Fetch vendor bookings
  const { data: vendorBookings = [] } = useQuery<any[]>({
    queryKey: ['/api/vendor/bookings'],
    enabled: isAuthenticated && isVendor,
  });

  const handleGoogleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  if (isLoading || vendorCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Vendor Dashboard</CardTitle>
            <p className="text-gray-600">Sign in with Google to access your vendor dashboard</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleLogin} className="w-full">
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <p className="text-gray-600">This dashboard is only available to vendor accounts. Please contact support to upgrade your account.</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
              <div className="h-8 w-px bg-gray-200"></div>
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Dashboard</h1>
                <p className="text-sm text-gray-500">CourtBook Kenya</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {(user as any)?.firstName || (user as any)?.email}
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalCourts || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
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
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.averageRating?.toFixed(1) || "N/A"}</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="courts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="courts">Court Analytics</TabsTrigger>
            <TabsTrigger value="manage">Manage Courts</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="cities">City Performance</TabsTrigger>
            <TabsTrigger value="bookings">View Bookings</TabsTrigger>
            <TabsTrigger value="overview">Business Overview</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Court Analytics Tab */}
          <TabsContent value="courts" className="space-y-6">
            <div className="grid gap-6">
              {courtAnalytics.map((court) => (
                <Card key={court.courtId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{court.courtName}</CardTitle>
                        <p className="text-gray-600 flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {court.city}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-primary">
                        Rating: {court.averageRating.toFixed(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{court.totalBookings}</p>
                        <p className="text-sm text-gray-600">Total Bookings</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(court.revenue)}</p>
                        <p className="text-sm text-gray-600">Revenue Generated</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{court.popularSports.length}</p>
                        <p className="text-sm text-gray-600">Sports Offered</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Popular Sports */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Popular Sports</h4>
                        <div className="space-y-2">
                          {court.popularSports.map((sport, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium">{sport.sport}</span>
                              <Badge variant="secondary">{sport.bookings} bookings</Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Bookings */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Recent Bookings</h4>
                        <div className="space-y-2">
                          {court.recentBookings.slice(0, 4).map((booking, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                              <div>
                                <span className="font-medium">{booking.sport}</span>
                                <p className="text-gray-600">{booking.date}</p>
                              </div>
                              <span className="font-medium text-primary">{formatCurrency(booking.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Court Management Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => setSelectedCourtForEquipment(court.courtId)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid={`manage-equipment-${court.courtId}`}
                      >
                        <Package className="h-4 w-4" />
                        Manage Equipment
                      </Button>
                      <Button
                        onClick={() => {
                          const courtDetails = vendorCourts.find((c) => c.id === court.courtId);
                          if (courtDetails) {
                            setCourtToUpdate(courtDetails);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid={`update-court-${court.courtId}`}
                      >
                        <Edit className="h-4 w-4" />
                        Update Court
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Manage Courts Tab */}
          <TabsContent value="manage" className="space-y-6">
            <div className="grid gap-6">
              {vendorCourts.map((court: any) => (
                <Card key={court.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{court.name}</CardTitle>
                        <p className="text-gray-600 flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {court.area}, {court.city}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            court.approvalStatus === "approved" 
                              ? "bg-green-100 text-green-800" 
                              : court.approvalStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {court.approvalStatus.charAt(0).toUpperCase() + court.approvalStatus.slice(1)}
                        </Badge>
                        <Badge className={court.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {court.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent style={{ position: 'relative', zIndex: 1 }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Hourly Rate:</span>
                        <p className="text-lg font-semibold text-primary">KES {court.hourlyRate}</p>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Opening Hours:</span>
                        <p>{court.openingTime} - {court.closingTime}</p>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Sports:</span>
                        <p>{court.availableSports?.join(", ") || "Not specified"}</p>
                      </div>
                    </div>
                    
                    {court.approvalStatus === "pending" && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          <Clock className="h-4 w-4 inline mr-1" />
                          Court updates are pending admin approval. Your current details remain active until approved.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          alert('BUTTON WORKING!');
                          console.log('DIRECT CLICK - Court:', court);
                          setCourtToUpdate(court);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        🔧 Update Details - FIXED
                      </button>
                      <Button
                        onClick={() => {
                          alert('Equipment button works!');
                          setSelectedCourtForEquipment(court.id);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid={`manage-court-equipment-${court.id}`}
                      >
                        <Package className="h-4 w-4" />
                        Manage Equipment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {vendorCourts.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No courts yet</h3>
                    <p className="text-gray-600 mb-6">
                      Add your first court to start accepting bookings from customers. After creating a court, you can add equipment for rental.
                    </p>
                    <Button 
                      onClick={() => setShowAddCourtModal(true)}
                      className="bg-primary hover:bg-green-700"
                    >
                      Add Your First Court
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Equipment Management Tab */}
          <TabsContent value="equipment" className="space-y-6">
            {/* Equipment Management Guide */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Package className="h-8 w-8 text-blue-600 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Equipment Rental Opportunities</h3>
                    <p className="text-blue-800 mb-3">
                      Boost your revenue by 30-50% by offering equipment rentals! Customers love the convenience of renting balls, rackets, and protective gear directly at your courts.
                    </p>
                    <div className="text-sm text-blue-700">
                      <p>• Set hourly rental rates for maximum profit</p>
                      <p>• Track inventory and availability automatically</p>
                      <p>• Equipment costs are added seamlessly to customer bookings</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {selectedCourtForEquipment ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Equipment Management</h3>
                  <Button
                    onClick={() => setSelectedCourtForEquipment(null)}
                    variant="outline"
                    size="sm"
                    data-testid="back-to-court-selection"
                  >
                    ← Back to Court Selection
                  </Button>
                </div>
                <EquipmentManager
                  courtId={selectedCourtForEquipment}
                  courtName={vendorCourts.find((c: any) => c.id === selectedCourtForEquipment)?.name || "Court"}
                />
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-6">Select a Court to Manage Equipment</h3>
                <div className="grid gap-4">
                  {vendorCourts.map((court: any) => (
                    <Card key={court.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent 
                        className="p-4"
                        onClick={() => setSelectedCourtForEquipment(court.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{court.name}</h4>
                            <p className="text-sm text-gray-600">{court.area}, {court.city}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <span className="text-sm text-gray-600">Manage Equipment</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {vendorCourts.length === 0 && (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No courts available</h3>
                        <p className="text-gray-600">
                          Add courts first to manage equipment for them.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* City Analytics Tab */}
          <TabsContent value="cities" className="space-y-6">
            <div className="grid gap-6">
              {cityAnalytics.map((city) => (
                <Card key={city.city}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      {city.city}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{city.totalCourts}</p>
                        <p className="text-sm text-gray-600">Courts in City</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{city.totalBookings}</p>
                        <p className="text-sm text-gray-600">Total Bookings</p>
                      </div>
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(city.revenue)}</p>
                        <p className="text-sm text-gray-600">City Revenue</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Most Popular Sports</h4>
                      <div className="flex flex-wrap gap-2">
                        {city.popularSports.map((sport, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm">
                            {sport.sport} ({sport.bookings} bookings)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* View Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  All Bookings ({vendorBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendorBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendorBookings.map((booking: any) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{booking.court?.name}</h4>
                            <p className="text-gray-600 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.court?.city}
                            </p>
                          </div>
                          <Badge 
                            variant={booking.status === 'active' ? 'default' : booking.status === 'completed' ? 'secondary' : 'destructive'}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Sport & Date</p>
                            <p className="font-medium">{booking.selectedSport}</p>
                            <p className="text-gray-500">{booking.bookingDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time & Customer</p>
                            <p className="font-medium">{booking.timeSlot}</p>
                            <p className="text-gray-500">{booking.customerPhone}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Amount & Payment</p>
                            <p className="font-medium text-primary">{formatCurrency(Number(booking.totalAmount))}</p>
                            <p className="text-gray-500">{booking.paymentMethod}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue</span>
                    <span className="font-bold text-lg">{formatCurrency(stats?.monthlyRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average per Court</span>
                    <span className="font-bold text-lg">
                      {formatCurrency(stats?.totalCourts ? (stats.monthlyRevenue / stats.totalCourts) : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Booking Rate</span>
                    <span className="font-bold text-lg">
                      {stats?.totalCourts ? ((stats.activeBookings / stats.totalCourts) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900">Expand to New Cities</p>
                    <p className="text-sm text-blue-700">Consider adding courts in high-demand areas</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-green-900">Popular Sports Focus</p>
                    <p className="text-sm text-green-700">Optimize scheduling for high-demand sports</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="font-medium text-purple-900">Rating Improvement</p>
                    <p className="text-sm text-purple-700">Focus on customer experience enhancement</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Testing Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <NotificationTestPanel />
              </div>
              
              <div className="w-full lg:w-80">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notification Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900">Email Notifications</p>
                          <p className="text-sm text-green-700">SendGrid integration active</p>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium text-blue-900">SMS Notifications</p>
                          <p className="text-sm text-blue-700">Kenya SMS gateway ready</p>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div>
                          <p className="font-medium text-purple-900">In-App Notifications</p>
                          <p className="text-sm text-purple-700">Real-time updates active</p>
                        </div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Notification Types</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Booking confirmations</li>
                        <li>• Payment confirmations</li>
                        <li>• Court approvals/rejections</li>
                        <li>• Booking reminders</li>
                        <li>• Vendor earnings alerts</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Debug Info */}
      <div style={{ 
        position: 'fixed', 
        top: '10px', 
        right: '10px', 
        backgroundColor: 'yellow', 
        padding: '5px', 
        fontSize: '12px',
        zIndex: 10000 
      }}>
        Modal State: {courtToUpdate ? 'OPEN' : 'CLOSED'}
        <br />
        Court: {courtToUpdate?.name || 'None'}
      </div>
      
      {/* Modals */}
      <VendorCourtUpdateModal
        court={courtToUpdate}
        isOpen={!!courtToUpdate}
        onClose={() => {
          console.log('Closing modal, setting courtToUpdate to null');
          setCourtToUpdate(null);
        }}
      />
      
      <AddCourtModal
        isOpen={showAddCourtModal}
        onClose={() => setShowAddCourtModal(false)}
      />
    </div>
  );
}