import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  LogOut,
  BarChart3,
  Trophy,
  Clock
} from "lucide-react";
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
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check vendor authentication
  useEffect(() => {
    const vendorToken = localStorage.getItem('vendorToken');
    if (!vendorToken) {
      navigate('/vendor/login');
      return;
    }
    setIsAuthenticated(true);
  }, [navigate]);

  // Fetch vendor stats
  const { data: stats } = useQuery<VendorStats>({
    queryKey: ['/api/vendor/stats'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch('/api/vendor/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Fetch vendor courts
  const { data: courts = [] } = useQuery<CourtWithDetails[]>({
    queryKey: ['/api/vendor/courts'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch('/api/vendor/courts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch courts');
      return response.json();
    },
  });

  // Fetch detailed analytics
  const { data: courtAnalytics = [] } = useQuery<CourtAnalytics[]>({
    queryKey: ['/api/vendor/analytics/courts'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch('/api/vendor/analytics/courts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch court analytics');
      return response.json();
    },
  });

  const { data: cityAnalytics = [] } = useQuery<CityAnalytics[]>({
    queryKey: ['/api/vendor/analytics/cities'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = localStorage.getItem('vendorToken');
      const response = await fetch('/api/vendor/analytics/cities', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch city analytics');
      return response.json();
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('vendorToken');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate('/vendor/login');
  };

  if (!isAuthenticated) {
    return null;
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
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courts">Court Analytics</TabsTrigger>
            <TabsTrigger value="cities">City Performance</TabsTrigger>
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
                      <MapPin className="h-5 w-5 mr-2 text-primary" />
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