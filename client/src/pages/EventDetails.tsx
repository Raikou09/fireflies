import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { SeatSelector } from '@/components/SeatSelector';
import { MpesaPayment } from '@/components/MpesaPayment';
import { apiRequest } from '@/lib/queryClient';
import { 
  MapPin, 
  Calendar,
  Clock,
  Users,
  ArrowLeft,
  Tag,
  Ticket,
  MinusCircle,
  PlusCircle,
  Smartphone,
  Loader2
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
  const [showMpesaPayment, setShowMpesaPayment] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const queryClient = useQueryClient();

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

  // Create event booking mutation
  const createEventBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiRequest('/api/event-bookings', 'POST', bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedBookingId(data.id);
      setShowMpesaPayment(true);
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleMpesaPaymentComplete = () => {
    setShowMpesaPayment(false);
    setBookingConfirmed(true);
    toast({
      title: "Booking Confirmed!",
      description: "Your event tickets have been booked and payment received.",
    });
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

    // Get the first selected ticket tier for the booking
    const selectedTierId = Object.keys(ticketSelections)[0];
    const selectedQuantity = ticketSelections[selectedTierId] || selectedSeats.length;
    const totalAmount = usesSeatMap ? seatsTotalPrice : getTotalPrice();

    // Create event booking
    createEventBookingMutation.mutate({
      eventId,
      ticketTierId: selectedTierId || event?.ticketTiers?.[0]?.id,
      quantity: selectedQuantity,
      seatNumbers: usesSeatMap ? selectedSeats.map(s => s.seatId) : [],
      totalAmount,
      paymentMethod: 'mpesa',
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

      <div className="max-w-5xl mx-auto px-6 py-10 pb-32">
        {/* Vertical Stack Layout */}
        <div className="space-y-10">
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
              <CardHeader className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-3xl mb-3" data-testid="text-event-name">
                      {event.name}
                    </CardTitle>
                    <Badge className="bg-gradient-to-r from-orange-600 to-pink-600 text-white" data-testid="badge-event-category">
                      <Tag className="w-3 h-3 mr-1" />
                      {event.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-6">
                {/* Date & Time */}
                <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="bg-orange-50 rounded-lg p-6 text-center">
                    <Users className="w-6 h-6 mx-auto text-orange-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-available-seats">
                      {event.availableSeats}
                    </p>
                    <p className="text-sm text-gray-600">Seats Available</p>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-6 text-center">
                    <Ticket className="w-6 h-6 mx-auto text-pink-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900" data-testid="text-total-seats">
                      {event.totalSeats}
                    </p>
                    <p className="text-sm text-gray-600">Total Seats</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Ticket/Seat Selection - Full Width Below */}
          <Card>
            <CardHeader className="p-6">
              <CardTitle className="flex items-center text-2xl">
                <Ticket className="w-6 h-6 mr-3 text-orange-600" />
                {event.venue?.hasSeatMap ? "Select Your Seats" : "Select Tickets"}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
                {event.venue?.hasSeatMap ? (
                  <SeatSelector 
                    eventId={eventId!} 
                    onSeatsSelected={handleSeatsSelected}
                    selectedSeats={selectedSeats.map(s => s.seatId)}
                  />
                ) : (event.ticketTiers && event.ticketTiers.length > 0 ? (
                  <>
                    {event.ticketTiers.map((tier) => (
                      <div 
                        key={tier.id} 
                        className="border rounded-lg p-5"
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

                  </>
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

      {/* Sticky Checkout Bar at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {event.venue?.hasSeatMap ? (
              <>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Selected Seats</p>
                    <p className="text-xl font-bold text-gray-900" data-testid="text-selected-seats-count">
                      {selectedSeats.length}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="text-xl font-bold text-orange-600" data-testid="text-checkout-total-price">
                      KES {seatsTotalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 px-8"
                  onClick={handleProceedToCheckout}
                  disabled={selectedSeats.length === 0 || createEventBookingMutation.isPending}
                  data-testid="button-checkout"
                >
                  {createEventBookingMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-5 h-5 mr-2" />
                  )}
                  {createEventBookingMutation.isPending ? 'Processing...' : 'Pay with M-Pesa'}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-xl font-bold text-gray-900" data-testid="text-total-tickets">
                      {getTotalTickets()}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div>
                    <p className="text-sm text-gray-600">Total Price</p>
                    <p className="text-xl font-bold text-orange-600" data-testid="text-total-price">
                      KSh {getTotalPrice().toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 px-8"
                  onClick={handleProceedToCheckout}
                  disabled={getTotalTickets() === 0 || createEventBookingMutation.isPending}
                  data-testid="button-checkout"
                >
                  {createEventBookingMutation.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="w-5 h-5 mr-2" />
                  )}
                  {createEventBookingMutation.isPending ? 'Processing...' : 'Pay with M-Pesa'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* M-Pesa Payment Modal */}
      {createdBookingId && (
        <MpesaPayment
          isOpen={showMpesaPayment}
          onClose={() => setShowMpesaPayment(false)}
          bookingId={createdBookingId}
          bookingType="event"
          amount={event?.venue?.hasSeatMap ? seatsTotalPrice : getTotalPrice()}
          onPaymentComplete={handleMpesaPaymentComplete}
        />
      )}
    </div>
  );
}
