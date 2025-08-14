import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Users, CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { CourtWithDetails } from '@shared/schema';

interface BookingModalProps {
  court: CourtWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
  price: number;
}

interface BookingData {
  courtId: string;
  date: string;
  timeSlot: string;
  duration: number;
  totalAmount: number;
}

export function BookingModal({ court, isOpen, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [step, setStep] = useState<'datetime' | 'payment' | 'confirmation'>('datetime');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate time slots based on court operating hours
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = parseInt(court.openingTime.split(':')[0]);
    const endHour = parseInt(court.closingTime.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isCurrentHour = new Date().getHours() === hour && 
                           selectedDate?.toDateString() === new Date().toDateString();
      const isPastHour = new Date().getHours() > hour && 
                        selectedDate?.toDateString() === new Date().toDateString();
      
      // Mock availability - in real app, this would come from API
      const isAvailable = !isPastHour && Math.random() > 0.3;
      
      slots.push({
        time,
        isAvailable,
        isSelected: selectedTimeSlot === time,
        price: hour >= 17 && hour <= 20 ? court.peakHourRate || court.hourlyRate : court.hourlyRate
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const selectedSlot = timeSlots.find(slot => slot.time === selectedTimeSlot);
  const totalAmount = selectedSlot ? selectedSlot.price * selectedDuration : 0;

  // Fetch existing bookings for the selected date
  const { data: existingBookings } = useQuery({
    queryKey: ['/api/bookings/availability', court.id, selectedDate?.toISOString().split('T')[0]],
    enabled: !!selectedDate,
    queryFn: async () => {
      const response = await fetch(`/api/bookings/availability/${court.id}?date=${selectedDate?.toISOString().split('T')[0]}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    }
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingData) => {
      return apiRequest('POST', '/api/bookings', bookingData);
    },
    onSuccess: () => {
      setStep('confirmation');
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      toast({
        title: "Booking Confirmed!",
        description: "Your court has been successfully booked.",
      });
    },
    onError: (error) => {
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTimeSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleContinueToPayment = () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time slot.",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTimeSlot) return;
    
    const bookingData: BookingData = {
      courtId: court.id,
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot,
      duration: selectedDuration,
      totalAmount
    };
    
    createBookingMutation.mutate(bookingData);
  };

  const resetModal = () => {
    setSelectedDate(new Date());
    setSelectedTimeSlot('');
    setSelectedDuration(1);
    setStep('datetime');
    onClose();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Book {court.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Booking Section */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'datetime' && (
              <>
                {/* Date Selection */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isPastDate}
                    className="rounded-md border"
                    data-testid="calendar-date-picker"
                  />
                </div>

                {/* Time Slot Selection */}
                {selectedDate && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Available Time Slots - {selectedDate.toDateString()}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={slot.isSelected ? "default" : "outline"}
                          disabled={!slot.isAvailable}
                          onClick={() => handleTimeSlotSelect(slot.time)}
                          className="flex flex-col p-3 h-auto"
                          data-testid={`button-timeslot-${slot.time}`}
                        >
                          <span className="font-medium">{slot.time}</span>
                          <span className="text-xs">
                            KSh {slot.price}/hr
                          </span>
                          {!slot.isAvailable && (
                            <span className="text-xs text-red-500">Booked</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration Selection */}
                {selectedTimeSlot && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Duration</h3>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((duration) => (
                        <Button
                          key={duration}
                          variant={selectedDuration === duration ? "default" : "outline"}
                          onClick={() => setSelectedDuration(duration)}
                          data-testid={`button-duration-${duration}`}
                        >
                          {duration} hour{duration > 1 ? 's' : ''}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTimeSlot && (
                  <Button 
                    onClick={handleContinueToPayment}
                    className="w-full"
                    size="lg"
                    data-testid="button-continue-payment"
                  >
                    Continue to Payment - KSh {totalAmount}
                  </Button>
                )}
              </>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Payment Method</h3>
                
                {/* Payment Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-2 border-green-500 bg-green-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">M-Pesa</h4>
                        <p className="text-sm text-gray-600">Pay with your mobile money</p>
                      </div>
                    </div>
                  </Card>
                  
                  <Card className="p-4 border-2 border-gray-200 opacity-50">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-8 h-8 text-gray-400" />
                      <div>
                        <h4 className="font-semibold text-gray-400">Card Payment</h4>
                        <p className="text-sm text-gray-400">Coming soon</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('datetime')}
                    data-testid="button-back-datetime"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleConfirmBooking}
                    disabled={createBookingMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-booking"
                  >
                    {createBookingMutation.isPending ? 'Processing...' : `Pay KSh ${totalAmount} with M-Pesa`}
                  </Button>
                </div>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-600">Booking Confirmed!</h3>
                <p className="text-gray-600">
                  Your booking for {court.name} on {selectedDate?.toDateString()} at {selectedTimeSlot} has been confirmed.
                  You'll receive a confirmation SMS shortly.
                </p>
                <Button onClick={resetModal} data-testid="button-done">
                  Done
                </Button>
              </div>
            )}
          </div>

          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Booking Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">{court.name}</p>
                      <p className="text-sm text-gray-600">{court.area}, {court.city}</p>
                      {court.address && (
                        <p className="text-xs text-gray-500">{court.address}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {court.availableSports.slice(0, 3).map((sport) => (
                      <Badge key={sport} variant="secondary" className="text-xs">
                        {sport}
                      </Badge>
                    ))}
                    {court.availableSports.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{court.availableSports.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {selectedDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedDate.toDateString()}</span>
                    </div>
                  )}

                  {selectedTimeSlot && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {selectedTimeSlot} - {parseInt(selectedTimeSlot.split(':')[0]) + selectedDuration}:00
                      </span>
                    </div>
                  )}

                  {selectedDuration && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedDuration} hour{selectedDuration > 1 ? 's' : ''}</span>
                    </div>
                  )}

                  {totalAmount > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Rate (per hour)</span>
                          <span>KSh {selectedSlot?.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Duration</span>
                          <span>{selectedDuration} hour{selectedDuration > 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>KSh {totalAmount}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• Cancellation allowed up to 2 hours before booking</p>
                  <p>• Full refund for cancellations made 24 hours in advance</p>
                  <p>• Equipment rental available on-site</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}