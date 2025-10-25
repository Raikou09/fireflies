import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Clock, Users, Tag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Event, Venue } from "@shared/schema";

interface EventsGridProps {
  city: string;
  eventType: string;
  dateFilter: string;
  searchQuery: string;
}

interface EventWithVenue extends Event {
  venue?: Venue;
}

export default function EventsGrid({ city, eventType, dateFilter, searchQuery }: EventsGridProps) {
  const { data: events, isLoading, error } = useQuery<EventWithVenue[]>({
    queryKey: ["/api/events"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Loading Events...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 text-lg">Failed to load events. Please try again.</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
        <p className="text-gray-600">
          Try adjusting your search filters or check back later for new events.
        </p>
      </div>
    );
  }

  // Filter events based on search criteria
  const filteredEvents = events.filter((event) => {
    // City filter
    if (city !== "All Cities" && event.venue && event.venue.city !== city) {
      return false;
    }

    // Event type filter
    if (eventType !== "All Events" && event.category !== eventType) {
      return false;
    }

    // Date filter
    if (dateFilter !== "All Dates") {
      const eventDate = new Date(event.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "Today") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (eventDate < today || eventDate >= tomorrow) {
          return false;
        }
      } else if (dateFilter === "This Weekend") {
        const dayOfWeek = today.getDay();
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - dayOfWeek));
        const monday = new Date(saturday);
        monday.setDate(saturday.getDate() + 2);
        if (eventDate < saturday || eventDate >= monday) {
          return false;
        }
      } else if (dateFilter === "This Week") {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        if (eventDate < today || eventDate >= nextWeek) {
          return false;
        }
      } else if (dateFilter === "This Month") {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        if (eventDate < today || eventDate >= nextMonth) {
          return false;
        }
      } else if (dateFilter === "Next Month") {
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 1);
        if (eventDate < thisMonthEnd || eventDate >= nextMonthEnd) {
          return false;
        }
      }
    }

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = event.name.toLowerCase().includes(query);
      const matchesDescription = event.description?.toLowerCase().includes(query);
      const matchesVenue = event.venue?.name.toLowerCase().includes(query);
      if (!matchesName && !matchesDescription && !matchesVenue) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {filteredEvents.length} Event{filteredEvents.length !== 1 ? 's' : ''} Found
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-event-${event.id}`}>
            {event.posterImageUrl && (
              <div className="h-48 bg-gradient-to-br from-orange-100 to-pink-100 relative overflow-hidden">
                <img
                  src={event.posterImageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  data-testid={`img-event-${event.id}`}
                />
                <Badge className="absolute top-3 right-3 bg-white text-gray-900 hover:bg-white" data-testid={`badge-event-type-${event.id}`}>
                  <Tag className="w-3 h-3 mr-1" />
                  {event.category}
                </Badge>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-xl" data-testid={`text-event-name-${event.id}`}>
                {event.name}
              </CardTitle>
              {event.venue && (
                <div className="flex items-center text-sm text-gray-600" data-testid={`text-venue-${event.id}`}>
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.venue.name}, {event.venue.city}
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span data-testid={`text-event-date-${event.id}`}>
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {event.eventTime && (
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span data-testid={`text-event-time-${event.id}`}>
                    {event.eventTime}
                  </span>
                </div>
              )}

              {event.totalSeats && (
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span data-testid={`text-event-capacity-${event.id}`}>
                    Capacity: {event.totalSeats} seats
                  </span>
                </div>
              )}

              {event.description && (
                <p className="text-sm text-gray-600 line-clamp-2" data-testid={`text-event-description-${event.id}`}>
                  {event.description}
                </p>
              )}
            </CardContent>

            <CardFooter>
              <Link href={`/fireflies/event/${event.id}`}>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  data-testid={`button-view-event-${event.id}`}
                >
                  View Details & Book
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
