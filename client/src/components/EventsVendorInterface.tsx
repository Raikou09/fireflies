import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Building2, Ticket, DollarSign, Users, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AddVenueModal from "./AddVenueModal";
import AddEventModal from "./AddEventModal";

export default function EventsVendorInterface() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"venues" | "events">("venues");
  const [isAddVenueModalOpen, setIsAddVenueModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  const { data: venues = [] } = useQuery<Array<{
    id: string;
    name: string;
    city: string;
    capacity: number;
    approvalStatus: "pending" | "approved" | "rejected";
    isActive: boolean;
  }>>({
    queryKey: ["/api/vendor/venues"],
    enabled: isAuthenticated,
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
