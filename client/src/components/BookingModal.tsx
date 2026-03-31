import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Users, CreditCard, Calendar as CalendarIcon, Package, Smartphone, LogIn, Gift, User as UserIcon, Mail, Phone, Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { CourtWithDetails, User } from '@shared/schema';
import EquipmentRentalModal from './EquipmentRentalModal';
import { MpesaPayment } from './MpesaPayment';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  courtsBooked?: number;
  // Guest booking fields
  isGuestBooking?: boolean;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  // Discount fields
  discountAmount?: number;
  discountType?: string;
  originalAmount?: number;
}

interface SportSegment {
  hour: number;
  sport: string;
}

export function BookingModal({ court, isOpen, onClose }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [sportSegments, setSportSegments] = useState<SportSegment[]>([]);
  const [step, setStep] = useState<'datetime' | 'payment' | 'confirmation'>('datetime');
  const [selectedEquipment, setSelectedEquipment] = useState<Array<{equipmentId: string, quantity: number, pricePerHour: number, name: string}>>([]);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showMpesaPayment, setShowMpesaPayment] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Court count state (for large groups booking multiple courts)
  const [selectedCourtsCount, setSelectedCourtsCount] = useState(1);

  // Multi-sport booking state
  const [isAddingMoreSports, setIsAddingMoreSports] = useState(false);
  
  // Guest booking state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is logged in
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ['/api/auth/user'],
  });

  const isLoggedIn = !!currentUser && !isLoadingUser;
  
  // Check if user is eligible for first booking discount (10% off)
  const isEligibleForDiscount = isLoggedIn && currentUser && !currentUser.hasUsedFirstDiscount;
  const discountPercentage = 10; // 10% discount for first booking

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
      courtsBooked?: number;
      status?: string;
    }>;
    facilityType: 'separate_areas' | 'shared_area';
    availableSports: string[];
    sportCapacities: Record<string, number>;
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
  const sportCapacities: Record<string, number> = availabilityData?.sportCapacities || {};

  // Get capacity for a sport (defaults to 1 if not configured)
  const getSportCapacity = (sport: string): number => {
    if (facilityType !== 'separate_areas') return 1;
    return sportCapacities[sport] ?? 1;
  };

  // Count how many courts are already booked for a sport at a given hour
  const getCourtsBookedAtHour = (sport: string, hour: number): number => {
    let count = 0;
    for (const booking of existingBookings) {
      if (booking.status === 'cancelled') continue;
      const bStart = parseInt((booking.startTime || booking.timeSlot).split(':')[0]);
      const bEnd = bStart + (booking.duration || 1);
      if (hour < bStart || hour >= bEnd) continue;
      let sportAtHour = booking.selectedSport;
      if (booking.sportSegments && Array.isArray(booking.sportSegments)) {
        const seg = booking.sportSegments.find((s: {hour: number, sport: string}) => s.hour === hour);
        if (seg) sportAtHour = seg.sport;
      }
      if (sportAtHour === sport) count += (booking.courtsBooked ?? 1);
    }
    return count;
  };

  // Returns remaining available courts for a sport at a given hour
  const getRemainingCourts = (sport: string, hour: number): number => {
    const cap = getSportCapacity(sport);
    const booked = getCourtsBookedAtHour(sport, hour);
    return Math.max(0, cap - booked);
  };

  // Check if a time slot is available based on existing bookings and capacities
  const isSlotAvailable = (time: string): boolean => {
    if (!selectedSport) return true;
    const hour = parseInt(time.split(':')[0]);

    if (facilityType === 'shared_area') {
      // Shared area: any booking at this hour blocks it
      for (const booking of existingBookings) {
        if (booking.status === 'cancelled') continue;
        const bStart = parseInt((booking.startTime || booking.timeSlot).split(':')[0]);
        const bEnd = bStart + (booking.duration || 1);
        if (hour >= bStart && hour < bEnd) return false;
      }
      return true;
    }

    // Separate areas: check remaining capacity for this sport
    return getRemainingCourts(selectedSport, hour) > 0;
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

  // Get all available sports for a specific hour (capacity-aware)
  const getAvailableSportsForHour = (hour: number): string[] => {
    if (facilityType === 'shared_area') {
      for (const booking of existingBookings) {
        if (booking.status === 'cancelled') continue;
        const bStart = parseInt((booking.startTime || booking.timeSlot).split(':')[0]);
        const bEnd = bStart + (booking.duration || 1);
        if (hour >= bStart && hour < bEnd) return [];
      }
      return court.availableSports || [];
    }
    // Separate areas: a sport is available if remaining capacity > 0
    return (court.availableSports || []).filter(sport => getRemainingCourts(sport, hour) > 0);
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

  // Get the end hour of current booking (for adding more sports)
  const getBookingEndHour = (): number => {
    if (!selectedTimeSlot) return 0;
    const startHour = parseInt(selectedTimeSlot.split(':')[0]);
    return startHour + selectedDuration;
  };

  // Check if we can add another sport segment after current booking
  const canAddMoreSports = (): boolean => {
    if (facilityType !== 'separate_areas') return false; // Only for separate areas
    const endHour = getBookingEndHour();
    const closingHour = parseInt(court.closingTime.split(':')[0]);
    if (endHour >= closingHour) return false;
    // Check if any sport is available for the next hour
    const availableSports = getAvailableSportsForHour(endHour);
    return availableSports.length > 0;
  };

  // Add another sport segment to the booking
  const handleAddAnotherSport = (sport: string, additionalHours: number) => {
    const endHour = getBookingEndHour();
    const newSegments: SportSegment[] = [];
    
    // Only add hours where the selected sport is actually available
    // Do NOT auto-substitute different sports - user explicitly chose this sport
    for (let i = 0; i < additionalHours; i++) {
      const hour = endHour + i;
      const availableSports = getAvailableSportsForHour(hour);
      if (availableSports.includes(sport)) {
        newSegments.push({ hour, sport });
      } else {
        // Stop adding if selected sport is not available for this hour
        break;
      }
    }
    
    // Only update if we successfully added at least one segment
    if (newSegments.length > 0) {
      setSportSegments(prev => [...prev, ...newSegments]);
      setSelectedDuration(prev => prev + newSegments.length);
    }
    setIsAddingMoreSports(false);
  };

  // Get available sports for adding after current segment
  const getAvailableSportsForNextSegment = (): string[] => {
    const endHour = getBookingEndHour();
    return getAvailableSportsForHour(endHour);
  };

  // Get max hours available for a sport starting from end of current booking
  const getMaxHoursForSport = (sport: string): number => {
    const startHour = getBookingEndHour();
    const closingHour = parseInt(court.closingTime.split(':')[0]);
    let maxHours = 0;
    
    for (let hour = startHour; hour < closingHour && maxHours < 4; hour++) {
      const availableSports = getAvailableSportsForHour(hour);
      if (availableSports.includes(sport)) {
        maxHours++;
      } else {
        break; // Stop at first unavailable hour
      }
    }
    return maxHours;
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
  
  // Calculate total amount including equipment, courts count, and discount
  const courtCost = selectedSlot ? selectedSlot.price * selectedDuration * selectedCourtsCount : 0;
  const equipmentCost = selectedEquipment.reduce((total, item) => 
    total + (item.pricePerHour * item.quantity * selectedDuration), 0);
  const subtotal = courtCost + equipmentCost;
  const discountAmount = isEligibleForDiscount ? Math.round(subtotal * discountPercentage / 100) : 0;
  const totalAmount = subtotal - discountAmount;

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
    
    // Validate guest info if not logged in
    if (!isLoggedIn) {
      if (!guestName.trim()) {
        toast({
          title: "Name Required",
          description: "Please enter your name to continue.",
          variant: "destructive",
        });
        return;
      }
      if (!guestEmail.trim() || !guestEmail.includes('@')) {
        toast({
          title: "Valid Email Required",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
      if (!guestPhone.trim()) {
        toast({
          title: "Phone Required",
          description: "Please enter your phone number for M-Pesa payment.",
          variant: "destructive",
        });
        return;
      }
    }
    
    const bookingData: BookingData = {
      courtId: court.id,
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot,
      duration: selectedDuration,
      totalAmount,
      selectedSport,
      sportSegments: sportSegments.length > 0 ? sportSegments : undefined,
      courtsBooked: selectedCourtsCount > 1 ? selectedCourtsCount : undefined,
      // Guest booking fields
      isGuestBooking: !isLoggedIn,
      guestName: !isLoggedIn ? guestName : undefined,
      guestEmail: !isLoggedIn ? guestEmail : undefined,
      guestPhone: !isLoggedIn ? guestPhone : undefined,
      // Discount fields
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      discountType: discountAmount > 0 ? 'first_booking' : undefined,
      originalAmount: discountAmount > 0 ? subtotal : undefined,
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
    setSelectedCourtsCount(1);
    setStep('datetime');
    setShowMpesaPayment(false);
    setCreatedBookingId(null);
    setCustomerPhone('');
    setGuestName('');
    setGuestEmail('');
    setGuestPhone('');
    setIsAddingMoreSports(false);
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

        {/* Signup Incentive Banner for Guests */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <Gift className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Sign up and get 10% off your first booking!
                </p>
                <p className="text-xs text-green-600">
                  Create an account to unlock exclusive discounts
                </p>
              </div>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/api/login'}
                className="border-green-500 text-green-700 hover:bg-green-100"
              >
                <LogIn className="h-3 w-3 mr-1" />
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* First Booking Discount Badge for Logged-in Users */}
        {isEligibleForDiscount && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-full p-2">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">
                  10% First Booking Discount Applied!
                </p>
                <p className="text-xs text-purple-600">
                  Welcome bonus - your discount will be shown in the total
                </p>
              </div>
            </div>
          </div>
        )}

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
                            setSelectedCourtsCount(1);
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
                      {timeSlots.map((slot) => {
                        const hour = parseInt(slot.time.split(':')[0]);
                        const capacity = selectedSport ? getSportCapacity(selectedSport) : 1;
                        const remaining = selectedSport && facilityType === 'separate_areas'
                          ? getRemainingCourts(selectedSport, hour)
                          : slot.isAvailable ? 1 : 0;
                        const showCapacity = facilityType === 'separate_areas' && capacity > 1 && selectedSport;
                        return (
                          <Button
                            key={slot.time}
                            variant={slot.isSelected ? "default" : "outline"}
                            disabled={!slot.isAvailable}
                            onClick={() => {
                              handleTimeSlotSelect(slot.time);
                              setSelectedCourtsCount(1);
                            }}
                            className="flex flex-col p-3 h-auto"
                            data-testid={`button-timeslot-${slot.time}`}
                          >
                            <span className="font-medium">{slot.time}</span>
                            <span className="text-xs">KSh {slot.price}/hr</span>
                            {showCapacity && slot.isAvailable && (
                              <span className="text-xs text-green-600">
                                {remaining}/{capacity} courts
                              </span>
                            )}
                            {!slot.isAvailable && (
                              <span className="text-xs text-red-500">
                                {showCapacity ? 'Full' : 'Booked'}
                              </span>
                            )}
                          </Button>
                        );
                      })}
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

                {/* Court Count Selector - shown for separate_areas courts with capacity > 1 */}
                {selectedTimeSlot && facilityType === 'separate_areas' && selectedSport && (() => {
                  const startHour = parseInt(selectedTimeSlot.split(':')[0]);
                  // Find the minimum remaining courts across all booked hours
                  const minRemaining = Math.min(
                    ...Array.from({ length: selectedDuration }, (_, i) =>
                      getRemainingCourts(selectedSport, startHour + i)
                    )
                  );
                  const capacity = getSportCapacity(selectedSport);
                  if (capacity <= 1) return null;
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-md font-semibold mb-2 text-blue-800 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Number of Courts
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        {minRemaining} of {capacity} {selectedSport} courts available at this time. Book multiple courts for a large group.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCourtsCount(c => Math.max(1, c - 1))}
                          disabled={selectedCourtsCount <= 1}
                        >
                          −
                        </Button>
                        <span className="text-lg font-bold w-8 text-center">{selectedCourtsCount}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCourtsCount(c => Math.min(minRemaining, c + 1))}
                          disabled={selectedCourtsCount >= minRemaining}
                        >
                          +
                        </Button>
                        <span className="text-sm text-gray-600 ml-2">
                          court{selectedCourtsCount > 1 ? 's' : ''} × KSh {selectedSlot?.price ?? 0}/hr
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Hour-by-Hour Sport Selection - shown when booking has multiple different sports */}
                {selectedTimeSlot && sportSegments.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-md font-semibold mb-3 text-blue-800">Your Booking Schedule</h3>
                    <div className="space-y-2">
                      {sportSegments.map((segment, index) => {
                        const availableSports = getAvailableSportsForHour(segment.hour);
                        const timeStr = `${segment.hour.toString().padStart(2, '0')}:00`;
                        const endTimeStr = `${(segment.hour + 1).toString().padStart(2, '0')}:00`;
                        
                        return (
                          <div key={segment.hour} className="flex items-center gap-3 bg-white rounded-md p-2">
                            <span className="text-sm font-medium w-24">{timeStr} - {endTimeStr}</span>
                            <select
                              value={segment.sport}
                              onChange={(e) => updateSportForHour(segment.hour, e.target.value)}
                              className="flex-1 text-sm border rounded-md px-2 py-1"
                              data-testid={`select-sport-${segment.hour}`}
                            >
                              {availableSports.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                              ))}
                            </select>
                            {index > 0 && segment.sport !== sportSegments[index - 1]?.sport && (
                              <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                                Switch
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Another Sport Section */}
                {selectedTimeSlot && facilityType === 'separate_areas' && canAddMoreSports() && !isAddingMoreSports && (
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-4 bg-green-50/50">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingMoreSports(true)}
                      className="w-full border-green-500 text-green-700 hover:bg-green-100"
                      data-testid="button-add-another-sport"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Sport (from {getBookingEndHour()}:00)
                    </Button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Book multiple sports in one session - each in their designated area
                    </p>
                  </div>
                )}

                {/* Add Another Sport Selection UI */}
                {isAddingMoreSports && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold text-green-800">Add Another Sport</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingMoreSports(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-700">
                      Available from {getBookingEndHour()}:00 onwards. Select a sport:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableSportsForNextSegment().map((sport) => {
                        const maxHours = getMaxHoursForSport(sport);
                        return (
                          <div key={sport} className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start border-green-400 hover:bg-green-100"
                              onClick={() => handleAddAnotherSport(sport, 1)}
                              data-testid={`button-add-sport-${sport.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              {sport}
                            </Button>
                            {maxHours > 1 && (
                              <div className="flex gap-1 justify-center">
                                {[...Array(Math.min(maxHours, 3))].map((_, i) => (
                                  <Button
                                    key={i + 1}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddAnotherSport(sport, i + 1)}
                                    className="text-xs px-2 py-1 h-6"
                                  >
                                    +{i + 1}hr
                                  </Button>
                                ))}
                              </div>
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
                {/* Guest Info Form (only show if not logged in) */}
                {!isLoggedIn && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <UserIcon className="h-5 w-5" />
                      Your Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="guestName">Full Name *</Label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="guestName"
                            placeholder="John Doe"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="pl-10"
                            data-testid="input-guest-name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestEmail">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="guestEmail"
                            type="email"
                            placeholder="john@example.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="pl-10"
                            data-testid="input-guest-email"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestPhone">Phone Number (for M-Pesa) *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="guestPhone"
                          placeholder="254712345678"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="pl-10"
                          data-testid="input-guest-phone"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Enter your M-Pesa registered number (e.g., 254712345678)</p>
                    </div>
                  </div>
                )}

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

                  {subtotal > 0 && (
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
                          <span>
                            Court Cost
                            {selectedCourtsCount > 1 && (
                              <span className="text-xs text-blue-600 ml-1">×{selectedCourtsCount} courts</span>
                            )}
                          </span>
                          <span>KSh {courtCost}</span>
                        </div>
                        {equipmentCost > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Equipment Cost</span>
                            <span>KSh {equipmentCost}</span>
                          </div>
                        )}
                        {discountAmount > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>Subtotal</span>
                              <span>KSh {subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600 font-medium">
                              <span className="flex items-center gap-1">
                                <Gift className="h-3 w-3" />
                                First Booking Discount (10%)
                              </span>
                              <span>-KSh {discountAmount}</span>
                            </div>
                          </>
                        )}
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span className={discountAmount > 0 ? 'text-green-600' : ''}>KSh {totalAmount}</span>
                        </div>
                        {discountAmount > 0 && (
                          <p className="text-xs text-green-600">You're saving KSh {discountAmount}!</p>
                        )}
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