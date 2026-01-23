import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Building2, Ticket, DollarSign, Users, MapPin, UserPlus, Clock, AlertTriangle, CheckCircle, Mail, FileEdit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AddVenueModal from "./AddVenueModal";
import AddEventModal from "./AddEventModal";
import VendorOnboarding from "./VendorOnboarding";

export default function EventsVendorInterface() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"venues" | "events">("venues");
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Get user verification status
  const userType = (user as any)?.userType || (user as any)?.user_type;
  const verificationStatus = (user as any)?.vendorVerificationStatus;
  const isVerifiedVendor = userType === "vendor" && verificationStatus === "verified";

  const { data: venues = [] } = useQuery<Array<{
    id: string;
    name: string;
    city: string;
    capacity: number;
    approvalStatus: "pending" | "approved" | "rejected";
    isActive: boolean;
  }>>({
    queryKey: ["/api/vendor/venues"],
    enabled: isAuthenticated && isVerifiedVendor,
  });

  const { data: events = [] } = useQuery<Array<{
    id: string;
    name: string;
    category: string;
    eventDate: string;
    approvalStatus: "pending" | "approved" | "rejected";
    isActive: boolean;
    venue?: { name: string };
  }>>({
    queryKey: ["/api/vendor/events"],
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
            Please sign in with Google to access the vendor dashboard and manage your venues and events.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
            size="lg"
            data-testid="button-signin"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
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
                className="w-full bg-orange-600 hover:bg-orange-700"
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
              <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-10 w-10 text-orange-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">Become a Vendor</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-gray-600 text-lg">
                Join Fireflies and start listing your events and venues to reach thousands of customers.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-orange-500 mb-2" />
                  <p className="font-medium text-gray-900">Create Venues</p>
                  <p className="text-sm text-gray-600">Add your event spaces</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-orange-500 mb-2" />
                  <p className="font-medium text-gray-900">Host Events</p>
                  <p className="text-sm text-gray-600">Create concerts, shows & more</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-orange-500 mb-2" />
                  <p className="font-medium text-gray-900">M-Pesa Payments</p>
                  <p className="text-sm text-gray-600">Receive payments directly</p>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <CheckCircle className="w-6 h-6 text-orange-500 mb-2" />
                  <p className="font-medium text-gray-900">Seat Maps</p>
                  <p className="text-sm text-gray-600">Interactive seating layouts</p>
                </div>
              </div>

              <Button 
                onClick={() => setShowOnboarding(true)}
                className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-lg py-6"
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
      <AddVenueModal isOpen={isAddVenueModalOpen} onClose={() => setIsAddVenueModalOpen(false)} />
      <AddEventModal isOpen={isAddEventModalOpen} onClose={() => setIsAddEventModalOpen(false)} />
      
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fireflies Vendor Dashboard</h1>
          <p className="text-gray-600">Manage your venues and events</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Venues
              </CardTitle>
              <Building2 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-venues">
                {venues.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-events">
                {events.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Approval
              </CardTitle>
              <Ticket className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-approval">
                {venues.filter(v => v.approvalStatus === 'pending').length + events.filter(e => e.approvalStatus === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Approved
              </CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-approved">
                {venues.filter(v => v.approvalStatus === 'approved').length + events.filter(e => e.approvalStatus === 'approved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("venues")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "venues"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-venues"
            >
              <Building2 className="inline w-4 h-4 mr-2" />
              Venues ({venues.length})
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "events"
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              data-testid="tab-events"
            >
              <Calendar className="inline w-4 h-4 mr-2" />
              Events ({events.length})
            </button>
          </div>
        </div>

        {/* Venues Tab */}
        {activeTab === "venues" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Venues</h2>
              <Button
                onClick={() => setIsAddVenueModalOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                data-testid="button-add-venue"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Venue
              </Button>
            </div>

            {venues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Venues Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first venue to start hosting events
                  </p>
                  <Button
                    onClick={() => setIsAddVenueModalOpen(true)}
                    className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Venue
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue) => (
                  <Card key={venue.id} data-testid={`card-venue-${venue.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg" data-testid={`text-venue-name-${venue.id}`}>
                          {venue.name}
                        </CardTitle>
                        <Badge
                          variant={
                            venue.approvalStatus === "approved"
                              ? "default"
                              : venue.approvalStatus === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          data-testid={`badge-venue-status-${venue.id}`}
                        >
                          {venue.approvalStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {venue.city}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Capacity: {venue.capacity}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Your Events</h2>
              <Button
                onClick={() => setIsAddEventModalOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                disabled={venues.length === 0}
                data-testid="button-add-event"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>

            {venues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Venues Yet</h3>
                  <p className="text-gray-600 mb-6">
                    You need to create a venue before you can add events
                  </p>
                  <Button
                    onClick={() => setActiveTab("venues")}
                    className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  >
                    Go to Venues
                  </Button>
                </CardContent>
              </Card>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first event to start selling tickets
                  </p>
                  <Button
                    onClick={() => setIsAddEventModalOpen(true)}
                    className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} data-testid={`card-event-${event.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg" data-testid={`text-event-name-${event.id}`}>
                          {event.name}
                        </CardTitle>
                        <Badge
                          variant={
                            event.approvalStatus === "approved"
                              ? "default"
                              : event.approvalStatus === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          data-testid={`badge-event-status-${event.id}`}
                        >
                          {event.approvalStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Ticket className="w-4 h-4 mr-2" />
                          {event.category}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(event.eventDate).toLocaleDateString()}
                        </div>
                        {event.venue && (
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-2" />
                            {event.venue.name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
    </>
  );
}
