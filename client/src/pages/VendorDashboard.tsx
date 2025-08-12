import { useState, useEffect } from "react";
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
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

  // Check if current user is a vendor
  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!isAuthenticated || !user) {
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
  const { data: vendorCourts = [] } = useQuery({
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
  const { data: vendorBookings = [] } = useQuery({
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
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Vendor Dashboard</h1>
                <p className="text-sm text-gray-500">CourtBook Kenya</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.email}
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="courts">Court Analytics</TabsTrigger>
            <TabsTrigger value="cities">City Performance</TabsTrigger>
            <TabsTrigger value="bookings">View Bookings</TabsTrigger>
            <TabsTrigger value="overview">Business Overview</TabsTrigger>
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
                  </CardContent>
                </Card>
              ))}
            </div>
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
        </Tabs>
      </div>
    </div>
  );
}