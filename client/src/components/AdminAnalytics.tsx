import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  BarChart3,
  PieChart,
  Building2,
  MapPin,
  Star,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

interface CourtAnalyticsOverview {
  id: string;
  name: string;
  location: string;
  sport: string;
  vendor: {
    name: string;
    email: string;
  };
  financial: {
    totalRevenue: number;
    commissionEarned: number;
    vendorEarnings: number;
    hourlyRate: number;
    commissionRate: number;
  };
  performance: {
    totalBookings: number;
    averageBookingValue: number;
    recentBookings: number;
    previousBookings: number;
    bookingTrend: number;
    trendDirection: 'growing' | 'declining' | 'stable';
  };
}

interface CourtAnalyticsDetail {
  court: {
    id: string;
    name: string;
    city: string;
    area: string;
    sport: string;
    hourlyRate: number;
    peakHourRate: number;
    commissionRate: number;
    vendor: {
      name: string;
      email: string;
    };
  };
  financial: {
    totalRevenue: number;
    commissionEarned: number;
    averageBookingValue: number;
    vendorEarnings: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    firstBookingDate: string;
    lastBookingDate: string;
  };
  trends: {
    monthlyData: Array<{
      month: string;
      bookings: number;
      revenue: number;
    }>;
    recentBookingTrend: number;
    recentRevenueTrend: number;
    trendDirection: 'growing' | 'declining' | 'stable';
  };
}

export default function AdminAnalytics() {
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  const { data: analyticsOverview, isLoading: isLoadingOverview } = useQuery<CourtAnalyticsOverview[]>({
    queryKey: ["/api/admin/courts/analytics/overview"],
    retry: false,
  });

  const { data: courtDetail, isLoading: isLoadingDetail } = useQuery<CourtAnalyticsDetail>({
    queryKey: ["/api/admin/courts", selectedCourtId, "analytics"],
    enabled: !!selectedCourtId,
    retry: false,
  });

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const getTrendIcon = (direction: string, trend: number) => {
    if (direction === 'growing') return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (direction === 'declining') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (direction: string) => {
    if (direction === 'growing') return 'text-green-600 bg-green-50 border-green-200';
    if (direction === 'declining') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (isLoadingOverview) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Court Analytics Dashboard</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  const courts = (analyticsOverview as CourtAnalyticsOverview[]) || [];
  const totalRevenue = courts.reduce((sum, court) => sum + court.financial.totalRevenue, 0);
  const totalCommission = courts.reduce((sum, court) => sum + court.financial.commissionEarned, 0);
  const totalBookings = courts.reduce((sum, court) => sum + court.performance.totalBookings, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <p className="text-gray-600">Financial insights and performance metrics for all courts</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview & Rankings
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Detailed Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-gray-600">Across all courts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                <PieChart className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalCommission)}</div>
                <p className="text-xs text-gray-600">{((totalCommission/totalRevenue) * 100).toFixed(1)}% of total revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{totalBookings}</div>
                <p className="text-xs text-gray-600">All-time bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Courts Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>Courts Performance Ranking</CardTitle>
              <p className="text-sm text-gray-600">Ranked by total revenue generated</p>
            </CardHeader>
            <CardContent>
              {courts.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Court Data Available</h3>
                  <p className="text-gray-600">No approved courts with analytics data found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courts.map((court, index) => (
                    <div key={court.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{court.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {court.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {court.sport}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {court.vendor.name}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(court.financial.totalRevenue)}
                          </p>
                          <p className="text-sm text-gray-600">Total Revenue</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(court.financial.commissionEarned)}
                          </p>
                          <p className="text-sm text-gray-600">Commission ({court.financial.commissionRate}%)</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {court.performance.totalBookings}
                          </p>
                          <p className="text-sm text-gray-600">Bookings</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={`flex items-center gap-1 ${getTrendColor(court.performance.trendDirection)}`}>
                            {getTrendIcon(court.performance.trendDirection, court.performance.bookingTrend)}
                            {court.performance.trendDirection}
                          </Badge>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedCourtId(court.id)}
                          data-testid={`button-view-details-${court.id}`}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="mt-6 space-y-6">
          {selectedCourtId ? (
            <>
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading detailed analytics...</p>
                  </div>
                </div>
              ) : courtDetail ? (
                <div className="space-y-6">
                  {/* Court Header */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">{courtDetail.court.name}</CardTitle>
                          <p className="text-gray-600">{courtDetail.court.city}, {courtDetail.court.area}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Vendor</p>
                          <p className="font-semibold">{courtDetail.court.vendor.name}</p>
                          <p className="text-sm text-gray-500">{courtDetail.court.vendor.email}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Financial Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(courtDetail.financial.totalRevenue)}
                        </div>
                        <p className="text-xs text-gray-600">All-time earnings</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(courtDetail.financial.commissionEarned)}
                        </div>
                        <p className="text-xs text-gray-600">@{courtDetail.court.commissionRate}% rate</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Vendor Earnings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(courtDetail.financial.vendorEarnings)}
                        </div>
                        <p className="text-xs text-gray-600">After commission</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {formatCurrency(courtDetail.financial.averageBookingValue)}
                        </div>
                        <p className="text-xs text-gray-600">Per booking</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Booking Statistics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{courtDetail.bookings.total}</div>
                          <p className="text-sm text-gray-600">Total Bookings</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{courtDetail.bookings.confirmed}</div>
                          <p className="text-sm text-gray-600">Confirmed</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600">{courtDetail.bookings.completed}</div>
                          <p className="text-sm text-gray-600">Completed</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-red-600">{courtDetail.bookings.cancelled}</div>
                          <p className="text-sm text-gray-600">Cancelled</p>
                        </div>
                      </div>
                      
                      {courtDetail.bookings.firstBookingDate && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>First Booking: {new Date(courtDetail.bookings.firstBookingDate).toLocaleDateString()}</span>
                            <span>Last Booking: {new Date(courtDetail.bookings.lastBookingDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Performance Trends</CardTitle>
                      <p className="text-sm text-gray-600">Last 30 days vs previous 30 days</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${getTrendColor(courtDetail.trends.trendDirection).replace('text-', 'bg-').replace('bg-', 'bg-').replace('-600', '-100')}`}>
                            {getTrendIcon(courtDetail.trends.trendDirection, courtDetail.trends.recentBookingTrend)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">Booking Trend</p>
                            <p className="text-2xl font-bold">
                              {courtDetail.trends.recentBookingTrend > 0 ? '+' : ''}{courtDetail.trends.recentBookingTrend}
                            </p>
                            <p className="text-sm text-gray-600">vs previous month</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${getTrendColor(courtDetail.trends.trendDirection).replace('text-', 'bg-').replace('bg-', 'bg-').replace('-600', '-100')}`}>
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Revenue Trend</p>
                            <p className="text-2xl font-bold">
                              {courtDetail.trends.recentRevenueTrend > 0 ? '+' : ''}{formatCurrency(courtDetail.trends.recentRevenueTrend)}
                            </p>
                            <p className="text-sm text-gray-600">vs previous month</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Monthly Trends Chart */}
                  {courtDetail.trends.monthlyData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Performance (Last 12 Months)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {courtDetail.trends.monthlyData.map((month, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <p className="font-medium">{new Date(month.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
                              </div>
                              <div className="flex gap-6 text-sm">
                                <div className="text-right">
                                  <p className="font-semibold">{month.bookings}</p>
                                  <p className="text-gray-600">Bookings</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-green-600">{formatCurrency(month.revenue)}</p>
                                  <p className="text-gray-600">Revenue</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Analytics Not Available</h3>
                    <p className="text-gray-600">No detailed analytics data found for this court.</p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Court</h3>
                <p className="text-gray-600">Click "Details" on any court in the Overview tab to see detailed analytics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}