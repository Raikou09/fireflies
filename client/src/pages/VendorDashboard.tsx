import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  AlertTriangle,
  ArrowLeft,
  Package,
  Edit,
  Clock,
  UserPlus,
  FileEdit,
  CheckCircle,
  Mail,
  CreditCard,
  Smartphone,
  Landmark,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import EquipmentManager from "@/components/EquipmentManager";
import VendorCourtUpdateModal from "@/components/VendorCourtUpdateModal";
import VendorGalleryModal from "@/components/VendorGalleryModal";
import AddCourtModal from "@/components/AddCourtModal";
import { NotificationTestPanel } from "@/components/NotificationTestPanel";
import VendorOnboarding from "@/components/VendorOnboarding";
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

const paymentDetailsSchema = z.object({
  paymentPreference: z.enum(["bank", "mpesa", "both"]),
  mpesaNumber: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.paymentPreference === "mpesa" || data.paymentPreference === "both") {
    if (!data.mpesaNumber || data.mpesaNumber.length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "M-Pesa number required (min 10 digits)", path: ["mpesaNumber"] });
    }
  }
  if (data.paymentPreference === "bank" || data.paymentPreference === "both") {
    if (!data.bankName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required", path: ["bankName"] });
    if (!data.bankAccountNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number is required", path: ["bankAccountNumber"] });
    if (!data.bankAccountName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account holder name is required", path: ["bankAccountName"] });
  }
});
type PaymentDetailsForm = z.infer<typeof paymentDetailsSchema>;

export default function VendorDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isVendor, setIsVendor] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if user can create courts (verified vendor)
  const { data: vendorStatus } = useQuery({
    queryKey: ["/api/vendor/can-create-courts"],
    enabled: isAuthenticated && ((user as any)?.userType === "vendor" || (user as any)?.user_type === "vendor"),
  });
  const [vendorCheckLoading, setVendorCheckLoading] = useState(true);
  const [selectedCourtForEquipment, setSelectedCourtForEquipment] = useState<string | null>(null);
  const [courtToUpdate, setCourtToUpdate] = useState<CourtWithDetails | null>(null);
  const [courtForGallery, setCourtForGallery] = useState<CourtWithDetails | null>(null);
  const [showAddCourtModal, setShowAddCourtModal] = useState(false);

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

  // Fetch vendor event bookings
  const { data: vendorEventBookings = [] } = useQuery<any[]>({
    queryKey: ['/api/vendor/event-bookings'],
    enabled: isAuthenticated && isVendor,
  });

  // Payment details form
  const paymentForm = useForm<PaymentDetailsForm>({
    resolver: zodResolver(paymentDetailsSchema),
    defaultValues: {
      paymentPreference: ((user as any)?.paymentPreference as "bank" | "mpesa" | "both") || "mpesa",
      mpesaNumber: (user as any)?.mpesaNumber || "",
      bankName: (user as any)?.bankName || "",
      bankAccountNumber: (user as any)?.bankAccountNumber || "",
      bankAccountName: (user as any)?.bankAccountName || "",
    },
  });

  const paymentPreference = paymentForm.watch("paymentPreference");

  const updatePaymentMutation = useMutation({
    mutationFn: (data: PaymentDetailsForm) =>
      apiRequest("PUT", "/api/vendor/payment-details", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Payment details updated", description: "Your payment information has been saved successfully." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Could not save payment details. Please try again.", variant: "destructive" });
    },
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

  // Get verification status
  const verificationStatus = (user as any)?.vendorVerificationStatus;
  const userType = (user as any)?.userType || (user as any)?.user_type;
  
  // Check vendor verification status - PENDING
  if (userType === "vendor" && (!verificationStatus || verificationStatus === "pending")) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-orange-500" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Thank You!</CardTitle>
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
                      Our admin team is reviewing your application. You will be notified of your vendor status on your registered email soon.
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

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => setShowOnboarding(true)} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <FileEdit className="w-4 h-4 mr-2" />
                  Edit Application
                </Button>
                <Button 
                  onClick={() => window.location.href = "/"} 
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
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

            <Button 
              onClick={() => window.location.href = "/"} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // NOT a vendor - show sign up option
  if (!isVendor) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
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
                  <DollarSign className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">Earn Money</p>
                  <p className="text-sm text-gray-600">Receive M-Pesa payments directly</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <Calendar className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">Manage Bookings</p>
                  <p className="text-sm text-gray-600">Track all reservations easily</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <BarChart3 className="w-6 h-6 text-green-500 mb-2" />
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">Detailed business insights</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => setShowOnboarding(true)} 
                  className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
                  size="lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Sign Up to Be a Vendor
                </Button>
                <Button 
                  onClick={() => window.location.href = "/"} 
                  variant="outline" 
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </div>
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
  
  // Only verified vendors reach here - check verification again
  if (verificationStatus !== "verified") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Verification Required</CardTitle>
            <p className="text-gray-600">Your vendor account needs to be verified before you can access the dashboard.</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = "/"} variant="outline" className="w-full">
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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="courts">Court Analytics</TabsTrigger>
            <TabsTrigger value="manage">Manage Courts</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="cities">City Performance</TabsTrigger>
            <TabsTrigger value="bookings">View Bookings</TabsTrigger>
            <TabsTrigger value="events">Event Bookings</TabsTrigger>
            <TabsTrigger value="overview">Business Overview</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment-settings">
              <CreditCard className="h-4 w-4 mr-1 inline" />
              Payment
            </TabsTrigger>
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
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => setCourtToUpdate(court)}
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid={`update-court-${court.id}`}
                      >
                        <Edit className="h-4 w-4" />
                        Update Details
                      </Button>
                      <Button
                        onClick={() => setCourtForGallery(court)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid={`manage-court-gallery-${court.id}`}
                      >
                        <FileEdit className="h-4 w-4" />
                        Manage Photos
                      </Button>
                      <Button
                        onClick={() => setSelectedCourtForEquipment(court.id)}
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

          {/* Event Bookings Tab */}
          <TabsContent value="events" className="space-y-6">
            {/* Event Analytics Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card data-testid="card-total-event-bookings">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Event Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorEventBookings.length}</div>
                  <p className="text-xs text-muted-foreground">All time bookings</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-event-revenue">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Event Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    KSh {vendorEventBookings.reduce((sum: number, b: any) => sum + Number(b.totalAmount || 0), 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Total from event tickets</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-tickets-sold">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendorEventBookings.reduce((sum: number, b: any) => sum + Number(b.numberOfTickets || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total tickets across all events</p>
                </CardContent>
              </Card>
              
              <Card data-testid="card-confirmed-bookings">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {vendorEventBookings.filter((b: any) => b.status === 'confirmed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                </CardContent>
              </Card>
            </div>

            {/* Event-Level Breakdown */}
            <Card data-testid="card-event-analytics">
              <CardHeader>
                <CardTitle>Event Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Group bookings by event
                  const eventBreakdown = vendorEventBookings.reduce((acc: any, booking: any) => {
                    const eventId = booking.event?.id;
                    if (!eventId) return acc;
                    
                    if (!acc[eventId]) {
                      acc[eventId] = {
                        eventName: booking.event?.name,
                        venueName: booking.event?.venue?.name,
                        eventDate: booking.event?.eventDate,
                        bookings: 0,
                        tickets: 0,
                        revenue: 0,
                        confirmedCount: 0,
                      };
                    }
                    
                    acc[eventId].bookings += 1;
                    acc[eventId].tickets += Number(booking.numberOfTickets || 0);
                    acc[eventId].revenue += Number(booking.totalAmount || 0);
                    if (booking.status === 'confirmed') acc[eventId].confirmedCount += 1;
                    
                    return acc;
                  }, {});
                  
                  const breakdownArray = Object.values(eventBreakdown);
                  
                  return breakdownArray.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No event bookings to analyze</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {breakdownArray.map((event: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4" data-testid={`event-analytics-${index}`}>
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{event.eventName}</h4>
                              <p className="text-sm text-gray-600">
                                {event.venueName} • {new Date(event.eventDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">
                              KSh {event.revenue.toLocaleString()}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Bookings</p>
                              <p className="text-xl font-bold">{event.bookings}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Tickets Sold</p>
                              <p className="text-xl font-bold">{event.tickets}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Revenue</p>
                              <p className="text-xl font-bold text-primary">KSh {event.revenue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Confirmed</p>
                              <p className="text-xl font-bold text-green-600">{event.confirmedCount}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Individual Bookings List */}
            <Card data-testid="card-event-bookings">
              <CardHeader>
                <CardTitle>All Event Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {vendorEventBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No event bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vendorEventBookings.map((booking: any) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4" data-testid={`event-booking-${booking.id}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{booking.event?.name}</h4>
                            <p className="text-gray-600 flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.event?.venue?.name} - {booking.event?.venue?.city}
                            </p>
                          </div>
                          <Badge 
                            variant={booking.status === 'confirmed' ? 'default' : booking.status === 'attended' ? 'secondary' : 'destructive'}
                            data-testid={`badge-status-${booking.id}`}
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Event Date</p>
                            <p className="font-medium">{new Date(booking.event?.eventDate).toLocaleDateString()}</p>
                            <p className="text-gray-500">{booking.event?.eventTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Customer</p>
                            <p className="font-medium">{booking.customer?.firstName} {booking.customer?.lastName}</p>
                            <p className="text-gray-500">{booking.customer?.email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Booking Details</p>
                            <p className="font-medium text-primary">KSh {Number(booking.totalAmount).toLocaleString()}</p>
                            <p className="text-gray-500">{booking.numberOfTickets} ticket(s)</p>
                          </div>
                        </div>
                        {booking.specialRequests && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">Special Requests:</p>
                            <p className="text-sm">{booking.specialRequests}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-6">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Receiving Details
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Update how you receive payouts from court bookings. Changes take effect immediately.
                  </p>
                </CardHeader>
                <CardContent>
                  <Form {...paymentForm}>
                    <form
                      onSubmit={paymentForm.handleSubmit((data) => updatePaymentMutation.mutate(data))}
                      className="space-y-6"
                      data-testid="payment-settings-form"
                    >
                      {/* Payment Preference */}
                      <FormField
                        control={paymentForm.control}
                        name="paymentPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method Preference</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-payment-preference">
                                  <SelectValue placeholder="Select payment preference" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mpesa">
                                  <span className="flex items-center gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    M-Pesa only
                                  </span>
                                </SelectItem>
                                <SelectItem value="bank">
                                  <span className="flex items-center gap-2">
                                    <Landmark className="h-4 w-4" />
                                    Bank Transfer only
                                  </span>
                                </SelectItem>
                                <SelectItem value="both">
                                  <span className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Both M-Pesa & Bank
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* M-Pesa Section */}
                      {(paymentPreference === "mpesa" || paymentPreference === "both") && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                          <h4 className="font-semibold text-green-900 flex items-center gap-2">
                            <Smartphone className="h-4 w-4" />
                            M-Pesa Details
                          </h4>
                          <FormField
                            control={paymentForm.control}
                            name="mpesaNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>M-Pesa Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. 254712345678"
                                    data-testid="input-mpesa-number"
                                    {...field}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Use format 254XXXXXXXXX (Kenyan number)</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {/* Bank Section */}
                      {(paymentPreference === "bank" || paymentPreference === "both") && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                            <Landmark className="h-4 w-4" />
                            Bank Account Details
                          </h4>
                          <FormField
                            control={paymentForm.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bank Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Equity Bank, KCB, Co-op Bank" data-testid="input-bank-name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paymentForm.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your bank account number" data-testid="input-bank-account-number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={paymentForm.control}
                            name="bankAccountName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Holder Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Name as it appears on the account" data-testid="input-bank-account-name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={updatePaymentMutation.isPending}
                        className="w-full sm:w-auto"
                        data-testid="button-save-payment-details"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updatePaymentMutation.isPending ? "Saving..." : "Save Payment Details"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Current Details Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Payment Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preference</span>
                    <span className="font-medium capitalize">{(user as any)?.paymentPreference || "Not set"}</span>
                  </div>
                  {(user as any)?.mpesaNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">M-Pesa Number</span>
                      <span className="font-medium">{(user as any).mpesaNumber}</span>
                    </div>
                  )}
                  {(user as any)?.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank</span>
                      <span className="font-medium">{(user as any).bankName}</span>
                    </div>
                  )}
                  {(user as any)?.bankAccountNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number</span>
                      <span className="font-medium">{(user as any).bankAccountNumber}</span>
                    </div>
                  )}
                  {(user as any)?.bankAccountName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Holder</span>
                      <span className="font-medium">{(user as any).bankAccountName}</span>
                    </div>
                  )}
                  {!(user as any)?.paymentPreference && !(user as any)?.mpesaNumber && !(user as any)?.bankName && (
                    <p className="text-gray-500 italic">No payment details on file. Please fill in the form above.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modals */}
      <VendorCourtUpdateModal
        court={courtToUpdate}
        isOpen={!!courtToUpdate}
        onClose={() => setCourtToUpdate(null)}
      />

      <VendorGalleryModal
        court={courtForGallery}
        isOpen={!!courtForGallery}
        onClose={() => setCourtForGallery(null)}
      />
      
      <AddCourtModal
        isOpen={showAddCourtModal}
        onClose={() => setShowAddCourtModal(false)}
      />
    </div>
  );
}