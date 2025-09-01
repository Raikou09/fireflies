import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CourtWithDetails } from "@shared/schema";

interface VendorCourtUpdateModalProps {
  court: CourtWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorCourtUpdateModal({ court, isOpen, onClose }: VendorCourtUpdateModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hourlyRate: "",
    peakHourRate: "",
    openingTime: "",
    closingTime: "",
    area: "",
    address: "",
    rules: "",
    availableSports: [] as string[],
    availableDays: [] as string[],
  });

  React.useEffect(() => {
    console.log('VendorCourtUpdateModal - Court data:', court);
    if (court) {
      console.log('Setting form data:', court);
      setFormData({
        name: court.name,
        description: court.description || "",
        hourlyRate: court.hourlyRate,
        peakHourRate: court.peakHourRate || "",
        openingTime: court.openingTime,
        closingTime: court.closingTime,
        area: court.area,
        address: court.address || "",
        rules: court.rules || "",
        availableSports: court.availableSports || [],
        availableDays: court.availableDays || [],
      });
    }
  }, [court]);

  const updateCourtMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Mutation - Updating court with data:', data, 'Court ID:', court?.id);
      const response = await apiRequest(`/api/vendor/courts/${court?.id}`, "PUT", {
        ...data,
        hourlyRate: parseFloat(data.hourlyRate),
        peakHourRate: data.peakHourRate ? parseFloat(data.peakHourRate) : null,
      });
      console.log('Mutation - API response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Mutation - API error:', errorData);
        throw new Error(errorData.message || 'Failed to update court');
      }
      const result = await response.json();
      console.log('Mutation - Success result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Mutation - Success callback with data:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/courts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courts/${court?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/stats"] });
      onClose();
      toast({
        title: "Court Updated Successfully",
        description: data.message || "Your court details have been updated and are pending admin approval.",
      });
    },
    onError: (error: any) => {
      console.error('Mutation - Error callback:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update court details. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sports = [
    "Football", "Basketball", "Tennis", "Volleyball", "Badminton", 
    "Table Tennis", "Cricket", "Rugby", "Hockey", "Netball",
    "Baseball", "Swimming", "Athletics", "Boxing", "Wrestling"
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const handleSportToggle = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      availableSports: prev.availableSports.includes(sport)
        ? prev.availableSports.filter(s => s !== sport)
        : [...prev.availableSports, sport]
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    updateCourtMutation.mutate(formData);
  };

  console.log('VendorCourtUpdateModal - Props received:', { 
    courtExists: !!court, 
    courtName: court?.name || 'No name',
    isOpen 
  });
  
  if (!court) {
    console.log('VendorCourtUpdateModal - No court data, returning null');
    return null;
  }

  console.log('VendorCourtUpdateModal - Rendering modal for:', court.name, 'isOpen:', isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Update Court Details
            {court.approvalStatus === "pending" && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Clock className="h-3 w-3 mr-1" />
                Pending Approval
              </Badge>
            )}
          </DialogTitle>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-orange-800 mb-1">Important Notice</p>
              <p className="text-orange-700">
                Any changes to your court details will require admin approval before they become visible to customers. 
                Your court will remain active with current details until approved.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Court Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-court-name"
              />
            </div>
            <div>
              <Label htmlFor="area">Area *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                required
                data-testid="input-court-area"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your court facilities, features, etc."
              data-testid="input-court-description"
            />
          </div>

          <div>
            <Label htmlFor="address">Full Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete address for directions"
              data-testid="input-court-address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate (KES) *</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                required
                data-testid="input-hourly-rate"
              />
            </div>
            <div>
              <Label htmlFor="peakHourRate">Peak Hour Rate (KES)</Label>
              <Input
                id="peakHourRate"
                type="number"
                step="0.01"
                value={formData.peakHourRate}
                onChange={(e) => setFormData({ ...formData, peakHourRate: e.target.value })}
                placeholder="Optional - for busy periods"
                data-testid="input-peak-rate"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="openingTime">Opening Time *</Label>
              <Input
                id="openingTime"
                type="time"
                value={formData.openingTime}
                onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                required
                data-testid="input-opening-time"
              />
            </div>
            <div>
              <Label htmlFor="closingTime">Closing Time *</Label>
              <Input
                id="closingTime"
                type="time"
                value={formData.closingTime}
                onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                required
                data-testid="input-closing-time"
              />
            </div>
          </div>

          <div>
            <Label>Available Sports *</Label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
              {sports.map((sport) => (
                <Button
                  key={sport}
                  type="button"
                  variant={formData.availableSports.includes(sport) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleSportToggle(sport)}
                  className="text-xs"
                  data-testid={`sport-${sport.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Available Days *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {days.map((day) => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.availableDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDayToggle(day)}
                  data-testid={`day-${day.toLowerCase()}`}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="rules">Court Rules & Guidelines</Label>
            <Textarea
              id="rules"
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              placeholder="Any specific rules, dress code, equipment requirements, etc."
              data-testid="input-court-rules"
            />
          </div>

          <div className="flex gap-2 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              data-testid="button-cancel-update"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary hover:bg-green-700"
              disabled={updateCourtMutation.isPending}
              data-testid="button-submit-update"
            >
              {updateCourtMutation.isPending ? "Updating..." : "Update Court Details"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}