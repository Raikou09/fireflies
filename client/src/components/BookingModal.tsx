import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Users, CreditCard, Calendar as CalendarIcon, Package, Smartphone, LogIn } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { CourtWithDetails, User } from '@shared/schema';
import EquipmentRentalModal from './EquipmentRentalModal';
import { MpesaPayment } from './MpesaPayment';

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
  selectedSport: string;
  sportSegments?: Array<{hour: number, sport: string}>;
}

export function BookingModal({ court, isOpen, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [sportSegments, setSportSegments] = useState<Array<{hour: number, sport: string}>>([]);
  const [step, setStep] = useState<'datetime' | 'payment' | 'confirmation'>('datetime');
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{equipmentId: string, quantity: number, pricePerHour: number, name: string}>>([]);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMpesaPayment, setShowMpesaPayment] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is logged in
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const isLoggedIn = !!currentUser && !isLoadingUser;

  // Auto-select sport if only one available
  useEffect(() => {
    if (court.availableSports?.length === 1 && !selectedSport) {
      setSelectedSport(court.availableSports[0]);
    }
  }, [court.availableSports, selectedSport]);

  // Rebuild sport segments when selectedSport or selectedTimeSlot changes
  useEffect(() => {
    if (selectedSport && selectedTimeSlot && selectedDuration > 0) {
      const segments = buildSportSegments(selectedDuration);
      setSportSegments(segments);
    }
  }, [selectedSport, selectedTimeSlot]);

  // Fetch existing bookings for the selected date
  const { data: availabilityData } = useQuery<{
    bookings: Array<{
      id: string;
      timeSlot: string;
      startTime: string;
      endTime: string;
      duration: number;
      selectedSport: string;
      sportSegments?: Array<{hour: number, sport: string}>;
    }>;
    facilityType: 'separate_areas' | 'shared_area';
    availableSports: string[];
  }>({
    queryKey: ['/api/bookings/availability', court.id, selectedDate?.toISOString().split('T')[0]],
    enabled: !!selectedDate,
    queryFn: async () => {
      const response = await fetch(`/api/bookings/availability/${court.id}?date=${selectedDate?.toISOString().split('T')[0]}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json();
    }
  });

  const existingBookings = availabilityData?.bookings || [];
  const facilityType = availabilityData?.facilityType || 'shared_area';

  // Check if a time slot is available based on existing bookings (considers multi-sport via sportSegments)
  const isSlotAvailable = (time: string): boolean => {
    // If no sport selected yet, assume available (will be checked again after selection)
    if (!selectedSport) return true;
    
    const hour = parseInt(time.split(':')[0]);
    
    for (const booking of existingBookings) {
      const bookingStart = parseInt(booking.startTime?.split(':')[0] || booking.timeSlot.split(':')[0]);
      const bookingEnd = bookingStart + (booking.duration || 1);
      
      // Check if hour falls within booking range
      if (hour >= bookingStart && hour < bookingEnd) {
        // For shared areas, any booking blocks the slot
        if (facilityType === 'shared_area') {
          return false;
        }
        
        // For separate areas, check sportSegments for per-hour blocking
        let sportForThisHour = booking.selectedSport;
        if (booking.sportSegments && Array.isArray(booking.sportSegments)) {
          const segmentForHour = booking.sportSegments.find((seg: {hour: number, sport: string}) => seg.hour === hour);
          if (segmentForHour) {
            sportForThisHour = segmentForHour.sport;
          }
        }
        
        // Block if same sport is booked for this hour
        if (sportForThisHour === selectedSport) {
          return false;
        }
      }
    }
    return true;
  };

  // Calculate max consecutive hours available from a given time slot
  const getMaxConsecutiveHours = (startTime: string): number => {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(court.closingTime.split(':')[0]);
    let maxHours = 0;
    
    for (let hour = startHour; hour < endHour && hour < startHour + 4; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      if (isSlotAvailable(time)) {
        maxHours++;
      } else {
        break;
      }
    }
    return maxHours;
  };

  // Get alternative sports available for a blocked time slot
  const getAlternativeSports = (time: string): string[] => {
    if (facilityType !== 'separate_areas' || !selectedSport) return [];
    
    const hour = parseInt(time.split(':')[0]);
    const bookedSports = new Set<string>();
    
    for (const booking of existingBookings) {
      const bookingStart = parseInt(booking.startTime?.split(':')[0] || booking.timeSlot.split(':')[0]);
      const bookingEnd = bookingStart + (booking.duration || 1);
      
      if (hour >= bookingStart && hour < bookingEnd) {
        bookedSports.add(booking.selectedSport);
      }
    }
    
    return (court.availableSports || []).filter(sport => !bookedSports.has(sport) && sport !== selectedSport);
  };

  // Get all available sports for a specific hour (considers multi-sport bookings via sportSegments)
  const getAvailableSportsForHour = (hour: number): string[] => {
    const bookedSports = new Set<string>();
    
    for (const booking of existingBookings) {
      const bookingStart = parseInt(booking.startTime?.split(':')[0] || booking.timeSlot.split(':')[0]);
      const bookingEnd = bookingStart + (booking.duration || 1);
      
      if (hour >= bookingStart && hour < bookingEnd) {
        if (facilityType === 'shared_area') {
          return []; // Shared area - if any booking exists, no sports available
        }
        
        // Check sportSegments for per-hour sport assignments
        if (booking.sportSegments && Array.isArray(booking.sportSegments)) {
          const segmentForHour = booking.sportSegments.find((seg: {hour: number, sport: string}) => seg.hour === hour);
          if (segmentForHour) {
            bookedSports.add(segmentForHour.sport);
          } else {
            // Fallback to selectedSport if no segment for this hour
            bookedSports.add(booking.selectedSport);
          }
        } else {
          // No segments, use selectedSport for all hours
          bookedSports.add(booking.selectedSport);
        }
      }
    }
    
    return (court.availableSports || []).filter(sport => !bookedSports.has(sport));
  };

  // Check if a duration is possible with multi-sport booking
  const canBookDurationWithMultiSport = (duration: number): boolean => {
    if (!selectedTimeSlot) return false;
    const startHour = parseInt(selectedTimeSlot.split(':')[0]);
    const endHour = parseInt(court.closingTime.split(':')[0]);
    
    // Check if duration fits within operating hours
    if (startHour + duration > endHour) return false;
    
    // Check each hour to see if any sport is available
    for (let i = 0; i < duration; i++) {
      const hour = startHour + i;
      const availableSports = getAvailableSportsForHour(hour);
      if (availableSports.length === 0) return false;
    }
    return true;
  };

  // Build sport segments for a given duration
  const buildSportSegments = (duration: number): Array<{hour: number, sport: string}> => {
    if (!selectedTimeSlot || !selectedSport) return [];
    const startHour = parseInt(selectedTimeSlot.split(':')[0]);
    const segments: Array<{hour: number, sport: string}> = [];
    
    for (let i = 0; i < duration; i++) {
      const hour = startHour + i;
      const availableSports = getAvailableSportsForHour(hour);
      
      // Use selected sport if available, otherwise use first available alternative
      if (availableSports.includes(selectedSport)) {
        segments.push({ hour, sport: selectedSport });
      } else if (availableSports.length > 0) {
        segments.push({ hour, sport: availableSports[0] });
      }
    }
    return segments;
  };

  // Update sport for a specific hour in segments
  const updateSportForHour = (hour: number, sport: string) => {
    setSportSegments(prev => prev.map(seg => 
      seg.hour === hour ? { ...seg, sport } : seg
    ));
  };

  // Generate time slots based on court operating hours
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = parseInt(court.openingTime.split(':')[0]);
    const endHour = parseInt(court.closingTime.split(':')[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isPastHour = new Date().getHours() > hour && 
                        selectedDate?.toDateString() === new Date().toDateString();
      
      const isAvailable = !isPastHour && isSlotAvailable(time);
      
      slots.push({
        time,
        isAvailable,
        isSelected: selectedTimeSlot === time,
        price: hour >= 17 && hour <= 20 ? Number(court.peakHourRate || court.hourlyRate) : Number(court.hourlyRate)
      });
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const selectedSlot = timeSlots.find(slot => slot.time === selectedTimeSlot);
  const maxConsecutiveHours = selectedTimeSlot ? getMaxConsecutiveHours(selectedTimeSlot) : 4;
  
  // Calculate total amount including equipment
  const courtCost = selectedSlot ? selectedSlot.price * selectedDuration : 0;
  const equipmentCost = selectedEquipment.reduce((total, item) => 
    total + (item.pricePerHour * item.quantity * selectedDuration), 0);
  const totalAmount = courtCost + equipmentCost;

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: BookingData) => {
      const response = await apiRequest('/api/bookings', 'POST', bookingData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedBookingId(data.id);
      setShowMpesaPayment(true);
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
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
    if (!selectedDate || !selectedTimeSlot || !selectedSport) return;
    
    const bookingData: BookingData = {
      courtId: court.id,
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot,
      duration: selectedDuration,
      totalAmount,
      selectedSport,
      sportSegments: sportSegments.length > 0 ? sportSegments : undefined
    };
    
    createBookingMutation.mutate(bookingData);
  };

  const handleMpesaPaymentComplete = () => {
    setShowMpesaPayment(false);
    setStep('confirmation');
    toast({
      title: "Booking Confirmed!",
      description: "Your court has been successfully booked and payment received.",
    });
  };

  const resetModal = () => {
    setSelectedDate(new Date());
    setSelectedTimeSlot('');
    setSelectedDuration(1);
    setSelectedSport('');
    setSportSegments([]);
    setSelectedEquipment([]);
    setStep('datetime');
    setShowMpesaPayment(false);
    setCreatedBookingId(null);
    setCustomerPhone('');
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
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] md:w-full overflow-y-auto p-4 md:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
            <CalendarIcon className="h-4 w-4 md:h-5 md:w-5" />
            Book {court.name}
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
            {court.area}, {court.city}
          </div>
        </DialogHeader>

        {/* Login Required Message */}
        {!isLoggedIn && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center max-w-md">
              <LogIn className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Login Required</h3>
              <p className="text-amber-700 mb-4">
                Please sign in to book this court. It only takes a moment!
              </p>
              <Button 
                onClick={() => window.location.href = '/api/login'}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Button>
            </div>
          </div>
        )}

        {isLoggedIn && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Booking Section */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'datetime' && (
              <>
                {/* Sport Selection - show if court has multiple sports */}
                {court.availableSports && court.availableSports.length > 1 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Select Sport</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {court.availableSports.map((sport) => (
                        <Button
                          key={sport}
                          variant={selectedSport === sport ? "default" : "outline"}
                          onClick={() => {
                            setSelectedSport(sport);
                            setSelectedTimeSlot('');
                            setSelectedDuration(1);
                          }}
                          className="h-auto py-3"
                          data-testid={`button-sport-${sport.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {sport}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                
                {/* Date Selection - show after sport is selected (or if only 1 sport) */}
                {(selectedSport || court.availableSports?.length === 1) && (
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
                )}

                {/* Time Slot Selection - requires sport to be selected */}
                {selectedDate && selectedSport && (
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

                {/* Duration Selection with Multi-Sport Support */}
                {selectedTimeSlot && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Duration</h3>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map((duration) => {
                        const singleSportAvailable = duration <= maxConsecutiveHours;
                        const multiSportAvailable = !singleSportAvailable && facilityType === 'separate_areas' && canBookDurationWithMultiSport(duration);
                        const isAvailable = singleSportAvailable || multiSportAvailable;
                        
                        return (
                          <div key={duration} className="relative group">
                            <Button
                              variant={selectedDuration === duration ? "default" : isAvailable ? "outline" : "ghost"}
                              onClick={() => {
                                if (isAvailable) {
                                  setSelectedDuration(duration);
                                  // Build sport segments when duration changes
                                  const segments = buildSportSegments(duration);
                                  setSportSegments(segments);
                                }
                              }}
                              className={`${!isAvailable ? 'opacity-50 cursor-not-allowed line-through' : ''} ${multiSportAvailable && !singleSportAvailable ? 'border-amber-400 border-2' : ''}`}
                              data-testid={`button-duration-${duration}`}
                            >
                              {duration} hour{duration > 1 ? 's' : ''}
                              {multiSportAvailable && !singleSportAvailable && (
                                <span className="ml-1 text-amber-500">*</span>
                              )}
                            </Button>
                            {!isAvailable && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <div className="bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap shadow-lg">
                                  <p>Time slot fully booked</p>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {facilityType === 'separate_areas' && maxConsecutiveHours < 4 && (
                      <p className="text-sm text-amber-600 mt-2">
                        * Requires switching sports for some hours
                      </p>
                    )}
                  </div>
                )}

                {/* Hour-by-Hour Sport Selection */}
                {selectedTimeSlot && sportSegments.length > 1 && sportSegments.some(seg => seg.sport !== selectedSport) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold mb-3 text-amber-800">Hour-by-Hour Sports</h3>
                    <p className="text-sm text-amber-700 mb-3">Some hours require a different sport. Customize below:</p>
                    <div className="space-y-2">
                      {sportSegments.map((segment) => {
                        const availableSports = getAvailableSportsForHour(segment.hour);
                        const timeStr = `${segment.hour.toString().padStart(2, '0')}:00`;
                        
                        return (
                          <div key={segment.hour} className="flex items-center gap-3 bg-white rounded-md p-2">
                            <span className="text-sm font-medium w-16">{timeStr}</span>
                            <select
                              value={segment.sport}
                              onChange={(e) => updateSportForHour(segment.hour, e.target.value)}
                              className="flex-1 text-sm border rounded-md px-2 py-1"
                            >
                              {availableSports.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                              ))}
                            </select>
                            {segment.sport !== selectedSport && (
                              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700">
                                Different
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Equipment Rental Section */}
                {selectedTimeSlot && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Equipment Rental</h3>
                      <Button
                        onClick={() => setShowEquipmentModal(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        data-testid="button-select-equipment"
                      >
                        <Package className="h-4 w-4" />
                        {selectedEquipment.length > 0 ? 'Update Equipment' : 'Add Equipment'}
                      </Button>
                    </div>
                    
                    {selectedEquipment.length > 0 ? (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">Selected Equipment:</p>
                        {selectedEquipment.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span className="font-medium">KSh {item.pricePerHour * item.quantity * selectedDuration}</span>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span>Equipment Total:</span>
                          <span>KSh {equipmentCost}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">No equipment selected. Click "Add Equipment" to browse available items.</p>
                    )}
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
                  Your {selectedSport} booking at {court.name} on {selectedDate?.toDateString()} at {selectedTimeSlot} has been confirmed.
                  You'll receive a confirmation email shortly.
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

                  {sportSegments.length > 1 && sportSegments.some(seg => seg.sport !== selectedSport) ? (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium">Sports by hour:</p>
                      {sportSegments.map((seg) => (
                        <div key={seg.hour} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-12">{seg.hour.toString().padStart(2, '0')}:00</span>
                          <Badge variant={seg.sport === selectedSport ? "default" : "secondary"} className={`text-xs ${seg.sport === selectedSport ? 'bg-green-600' : 'bg-amber-100 text-amber-700'}`}>
                            {seg.sport}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : selectedSport ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs bg-green-600">
                        {selectedSport}
                      </Badge>
                    </div>
                  ) : (
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
                  )}

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
                        <div className="flex justify-between text-sm">
                          <span>Court Cost</span>
                          <span>KSh {courtCost}</span>
                        </div>
                        {equipmentCost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Equipment Cost</span>
                            <span>KSh {equipmentCost}</span>
                          </div>
                        )}
                        <Separator />
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
                  <p>• Professional equipment rental available</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </DialogContent>
      
      {/* Equipment Rental Modal */}
      <EquipmentRentalModal
        isOpen={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        courtId={court.id}
        onEquipmentSelected={(equipment) => {
          setSelectedEquipment(equipment);
          setShowEquipmentModal(false);
        }}
      />

      {/* M-Pesa Payment Modal */}
      {createdBookingId && (
        <MpesaPayment
          isOpen={showMpesaPayment}
          onClose={() => setShowMpesaPayment(false)}
          bookingId={createdBookingId}
          bookingType="court"
          amount={totalAmount}
          onPaymentComplete={handleMpesaPaymentComplete}
          defaultPhone={customerPhone}
        />
      )}
    </Dialog>
  );
}