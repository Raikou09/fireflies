import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { SeatSelector } from '@/components/SeatSelector';
import { 
  MapPin, 
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Tag,
  Ticket,
  MinusCircle,
  PlusCircle
} from 'lucide-react';
import type { Event, Venue, TicketTier } from '@shared/schema';

interface EventWithDetails extends Event {
  venue?: Venue;
  ticketTiers?: TicketTier[];
}

interface TicketSelection {
  tierId: string;
  tierName: string;
  price: string;
  quantity: number;
}

export default function EventDetails() {
  const [match, params] = useRoute('/fireflies/event/:id');
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [ticketSelections, setTicketSelections] = useState<Record<string, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<{ seatId: string; price: number }[]>([]);
  const [seatsTotalPrice, setSeatsTotalPrice] = useState(0);

  const eventId = params?.id;

  // Fetch event details
  const { data: event, isLoading } = useQuery<EventWithDetails>({
    queryKey: ['/api/events', eventId],
    enabled: !!eventId,
  });

  if (!match || !eventId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Event not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</p>
          <p className="text-gray-600 mb-6">This event may have been removed or is no longer available.</p>
          <Link href="/fireflies">
            <Button className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700" data-testid="button-back-to-events">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleTicketQuantityChange = (tierId: string, change: number) => {
    setTicketSelections(prev => {
      const currentQty = prev[tierId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      if (newQty === 0) {
        const { [tierId]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [tierId]: newQty };
    });
  };

  const getTotalTickets = () => {
    return Object.values(ticketSelections).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    if (!event.ticketTiers) return 0;
    
    return Object.entries(ticketSelections).reduce((sum, [tierId, qty]) => {
      const tier = event.ticketTiers!.find(t => t.id === tierId);
      if (tier) {
        return sum + (parseFloat(tier.price) * qty);
      }
      return sum;
    }, 0);
  };

  const handleSeatsSelected = (seats: { seatId: string; price: number }[], totalPrice: number) => {
    setSelectedSeats(seats);
    setSeatsTotalPrice(totalPrice);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to book tickets for this event.",
        variant: "destructive",
      });
      return;
    }

    const usesSeatMap = event?.venue?.hasSeatMap;
    
    if (usesSeatMap) {
      if (selectedSeats.length === 0) {
        toast({
          title: "Select seats",
          description: "Please select at least one seat to proceed.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (getTotalTickets() === 0) {
        toast({
          title: "Select tickets",
          description: "Please select at least one ticket to proceed.",
          variant: "destructive",
        });
        return;
      }
    }

    // TODO: Implement checkout flow
    toast({
      title: "Checkout coming soon",
      description: "Event booking checkout is under development.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-pink-600 py-4 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/fireflies">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Poster */}
            {event.posterImageUrl && (
              <div className="w-full h-96 bg-gradient-to-br from-orange-100 to-pink-100 rounded-lg overflow-hidden">
                <img
                  src={event.posterImageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  data-testid="img-event-poster"
                />
              </div>
            )}

            {/* Event Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-2" data-testid="text-event-name">
                      {event.name}
                    </CardTitle>
                    <Badge className="bg-gradient-to-r from-orange-600 to-pink-600 text-white" data-testid="badge-event-category">
                      <Tag className="w-3 h-3 mr-1" />
                      {event.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Date & Time */}
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <Calendar className="w-5 h-5 mr-3 text-orange-600" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-sm text-gray-600" data-testid="text-event-date">
                        {new Date(event.eventDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <Clock className="w-5 h-5 mr-3 text-orange-600" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-gray-600" data-testid="text-event-time">
                        {event.eventTime}
                        {event.duration && ` (${event.duration} minutes)`}
                      </p>
                    </div>
                  </div>

                  {event.venue && (
                    <div className="flex items-start text-gray-700">
                      <MapPin className="w-5 h-5 mr-3 text-orange-600 mt-1" />
                      <div>
                        <p className="font-medium" data-testid="text-venue-name">{event.venue.name}</p>
                        <p className="text-sm text-gray-600" data-testid="text-venue-address">
                          {event.venue.address}, {event.venue.city}
                        </p>
                        {event.venue.capacity && (
                          <p className="text-sm text-gray-500 mt-1">
                            <Users className="w-4 h-4 inline mr-1" />
                            Venue capacity: {event.venue.capacity}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Description */}
                {event.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">About This Event</h3>
                    <p className="text-gray-700 whitespace-pre-line" data-testid="text-event-description">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Event Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-available-seats">
                      {event.availableSeats}
                    </p>
                    <p className="text-sm text-gray-600">Seats Available</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 text-center">
                    <Ticket className="w-6 h-6 mx-auto text-pink-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-total-seats">
                      {event.totalSeats}
                    </p>
                    <p className="text-sm text-gray-600">Total Seats</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket/Seat Selection - Right Column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ticket className="w-5 h-5 mr-2 text-orange-600" />
                  {event.venue?.hasSeatMap ? "Select Your Seats" : "Select Tickets"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {event.venue?.hasSeatMap ? (
                  <>
                    <SeatSelector 
                      eventId={eventId!} 
                      onSeatsSelected={handleSeatsSelected}
                      selectedSeats={selectedSeats.map(s => s.seatId)}
                    />
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                        onClick={handleProceedToCheckout}
                        disabled={selectedSeats.length === 0}
                        data-testid="button-checkout"
                      >
                        <Ticket className="w-4 h-4 mr-2" />
                        Proceed to Checkout (KES {seatsTotalPrice.toLocaleString()})
                      </Button>
                    </div>
                  </>
                ) : (event.ticketTiers && event.ticketTiers.length > 0 ? (
                  <>
                    {event.ticketTiers.map((tier) => (
                      <div 
                        key={tier.id} 
                        className="border rounded-lg p-4"
                        data-testid={`ticket-tier-${tier.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900" data-testid={`text-tier-name-${tier.id}`}>
                              {tier.name}
                            </h4>
                            {tier.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {tier.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900" data-testid={`text-tier-price-${tier.id}`}>
                              KSh {parseFloat(tier.price).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-gray-600">
                            {tier.availableQuantity} left
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleTicketQuantityChange(tier.id, -1)}
                              disabled={!ticketSelections[tier.id]}
                              data-testid={`button-decrease-${tier.id}`}
                            >
                              <MinusCircle className="w-4 h-4" />
                            </Button>
                            
                            <span className="w-8 text-center font-medium" data-testid={`text-quantity-${tier.id}`}>
                              {ticketSelections[tier.id] || 0}
                            </span>
                            
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleTicketQuantityChange(tier.id, 1)}
                              disabled={tier.availableQuantity === 0 || (ticketSelections[tier.id] || 0) >= tier.availableQuantity}
                              data-testid={`button-increase-${tier.id}`}
                            >
                              <PlusCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Separator />

                    {/* Order Summary */}
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900">Order Summary</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Tickets:</span>
                        <span className="font-medium" data-testid="text-total-tickets">{getTotalTickets()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-orange-600" data-testid="text-total-price">
                          KSh {getTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                      onClick={handleProceedToCheckout}
                      disabled={getTotalTickets() === 0}
                      data-testid="button-checkout"
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No tickets available for this event.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Ticket className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">No tickets available for this event.</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
