import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { CourtWithDetails } from "@shared/schema";
import { X, Lock, Smartphone, CreditCard } from "lucide-react";

interface BookingModalProps {
  court: CourtWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ court, isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [bookingDate, setBookingDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");

  const timeSlots = [
    "09:00", "11:00", "14:00", "16:00", "18:00", "20:00"
  ];

  const mutation = useMutation({
    mutationFn: async (bookingData: any) => {
      await apiRequest("POST", "/api/bookings", bookingData);
    },
    onSuccess: () => {
      toast({
        title: "Booking Confirmed!",
        description: "You will receive SMS and email confirmation shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings/customer"] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Booking Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setBookingDate("");
    setSelectedTimeSlot("");
    setSelectedSport("");
    setCustomerPhone("");
    setCustomerEmail(user?.email || "");
    setSelectedEquipment([]);
    setPaymentMethod("mpesa");
  };

  const calculateTotal = () => {
    if (!court) return 0;
    
    let total = Number(court.hourlyRate);
    
    // Add equipment costs
    selectedEquipment.forEach(equipmentId => {
      const equipment = court.equipment.find(eq => eq.id === equipmentId);
      if (equipment) {
        total += Number(equipment.price);
      }
    });
    
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!court || !bookingDate || !selectedTimeSlot || !selectedSport || !customerPhone) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including sport selection.",
        variant: "destructive",
      });
      return;
    }

    const bookingData = {
      courtId: court.id,
      selectedSport,
      bookingDate,
      timeSlot: selectedTimeSlot,
      totalAmount: calculateTotal().toString(),
      equipmentIds: selectedEquipment,
      customerPhone,
      customerEmail,
      paymentMethod,
    };

    mutation.mutate(bookingData);
  };

  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentId) 
        ? prev.filter(id => id !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  if (!court) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Book Court
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Court Info */}
        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={court.imageUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"} 
            alt={court.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div>
            <h4 className="text-lg font-semibold text-gray-900">{court.name}</h4>
            <p className="text-gray-600">{court.area}, {court.city}</p>
            <p className="text-primary font-semibold">KES {court.hourlyRate}/hour</p>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div>
            <Label>Select Date</Label>
            <Input 
              type="date" 
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Sport Selection */}
          <div>
            <Label className="mb-3 block">Select Sport *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {court.availableSports?.map((sport) => (
                <Button
                  key={sport}
                  type="button"
                  variant={selectedSport === sport ? "default" : "outline"}
                  className={selectedSport === sport ? "bg-primary text-white" : ""}
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <Label className="mb-3 block">Available Time Slots</Label>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant={selectedTimeSlot === slot ? "default" : "outline"}
                  className={selectedTimeSlot === slot ? "bg-primary text-white" : ""}
                  onClick={() => setSelectedTimeSlot(slot)}
                >
                  <div className="text-center">
                    <div className="font-medium">{slot}</div>
                    <div className="text-xs">Available</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Equipment Rental */}
          {court.equipment.length > 0 && (
            <div>
              <Label className="mb-3 block">Equipment Rental (Optional)</Label>
              <div className="space-y-3">
                {court.equipment.map((equipment) => (
                  <div key={equipment.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedEquipment.includes(equipment.id)}
                      onCheckedChange={() => toggleEquipment(equipment.id)}
                    />
                    <span className="text-gray-700">
                      {equipment.name} (KES {equipment.price})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Phone Number</Label>
              <Input 
                type="tel" 
                placeholder="+254 7XX XXX XXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                type="email" 
                placeholder="your@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-3">Booking Summary</h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Court rental (1 hour)</span>
                <span>KES {court.hourlyRate}</span>
              </div>
              {selectedEquipment.length > 0 && (
                <div className="flex justify-between">
                  <span>Equipment rental</span>
                  <span>
                    KES {selectedEquipment.reduce((total, equipmentId) => {
                      const equipment = court.equipment.find(eq => eq.id === equipmentId);
                      return total + (equipment ? Number(equipment.price) : 0);
                    }, 0)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>KES {calculateTotal()}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="mb-3 block">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="flex items-center space-x-2 cursor-pointer">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span className="font-medium">M-Pesa</span>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Credit/Debit Card</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-primary text-white hover:bg-green-700"
            disabled={mutation.isPending}
          >
            <Lock className="h-4 w-4 mr-2" />
            {mutation.isPending ? "Processing..." : "Confirm Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
