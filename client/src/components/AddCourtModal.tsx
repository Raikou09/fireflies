import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "./ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { CloudUpload, X, Info } from "lucide-react";

interface AddCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCourtModal({ isOpen, onClose }: AddCourtModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch default commission rate
  const { data: commissionData } = useQuery<{ defaultCommissionRate: number }>({
    queryKey: ["/api/default-commission-rate"],
    retry: false,
  });
  
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    area: "",
    description: "",
    hourlyRate: "",
    peakHourRate: "",
    openingTime: "",
    closingTime: "",
    rules: "",
  });

  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const [availableDays, setAvailableDays] = useState<string[]>([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ]);
  const [imageUrl, setImageUrl] = useState("");

  const mutation = useMutation({
    mutationFn: async (courtData: any) => {
      const response = await apiRequest("POST", "/api/courts", {
        ...courtData,
        availableDays,
        availableSports: selectedSports
      });
      return response.json();
    },
    onSuccess: (court) => {
      // If there's an image, update the court with the image
      if (imageUrl) {
        setCourtImage(court.id);
      } else {
        toast({
          title: "Court Created!",
          description: "Your court has been successfully added.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/vendor/courts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/vendor/stats"] });
        onClose();
        resetForm();
      }
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
        title: "Error",
        description: "Failed to create court. Please try again.",
        variant: "destructive",
      });
    },
  });

  const imageUpdateMutation = useMutation({
    mutationFn: async ({ courtId, imageURL }: { courtId: string; imageURL: string }) => {
      await apiRequest("PUT", `/api/courts/${courtId}/image`, { imageURL });
    },
    onSuccess: () => {
      toast({
        title: "Court Created!",
        description: "Your court has been successfully added with image.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/stats"] });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: "Warning",
        description: "Court created but image upload failed.",
        variant: "destructive",
      });
      onClose();
      resetForm();
    },
  });

  const setCourtImage = (courtId: string) => {
    if (imageUrl) {
      imageUpdateMutation.mutate({ courtId, imageURL: imageUrl });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      city: "",
      area: "",
      description: "",
      hourlyRate: "",
      peakHourRate: "",
      openingTime: "",
      closingTime: "",
      rules: "",
    });
    setSelectedSports([]);
    setAvailableDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    setImageUrl("");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day: string) => {
    setAvailableDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSportToggle = (sport: string) => {
    setSelectedSports(prev => 
      prev.includes(sport) 
        ? prev.filter(s => s !== sport)
        : [...prev, sport]
    );
  };

  const sportsOptions = [
    "Football", "Basketball", "Volleyball", "Tennis", "Netball", "Rugby",
    "Cricket", "Badminton", "Table Tennis", "Swimming", "Athletics", 
    "Hockey", "Handball", "Squash", "Boxing"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || selectedSports.length === 0 || !formData.city || !formData.area || 
        !formData.hourlyRate || !formData.openingTime || !formData.closingTime || availableDays.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields, select at least one sport, and select at least one day.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      ...formData,
      availableSports: selectedSports,
      availableDays,
      imageUrl: imageUrl || undefined
    });
  };

  const getUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", {});
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      setImageUrl(uploadedFile.uploadURL as string);
      toast({
        title: "Image Uploaded",
        description: "Court image has been uploaded successfully.",
      });
    }
  };

  const cities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Add New Court
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Court Name *</Label>
              <Input 
                placeholder="e.g., Westlands Basketball Court"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <Label className="mb-3 block">Available Sports * (Select all sports available at this location)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {sportsOptions.map((sport) => (
                  <div key={sport} className="flex items-center space-x-2">
                    <Checkbox
                      id={sport}
                      checked={selectedSports.includes(sport)}
                      onCheckedChange={() => handleSportToggle(sport)}
                    />
                    <Label htmlFor={sport} className="text-sm font-normal cursor-pointer">
                      {sport}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select {selectedSports.length > 0 ? selectedSports.length : '0'} sport{selectedSports.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>City *</Label>
              <Select value={formData.city} onValueChange={(value) => handleInputChange("city", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Area/Neighborhood *</Label>
              <Input 
                placeholder="e.g., Westlands"
                value={formData.area}
                onChange={(e) => handleInputChange("area", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Hourly Rate (KES) *</Label>
              <Input 
                type="number"
                placeholder="1500"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Peak Hour Rate (KES)</Label>
              <Input 
                type="number"
                placeholder="2000"
                value={formData.peakHourRate}
                onChange={(e) => handleInputChange("peakHourRate", e.target.value)}
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Opening Time *</Label>
              <Input 
                type="time"
                value={formData.openingTime}
                onChange={(e) => handleInputChange("openingTime", e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Closing Time *</Label>
              <Input 
                type="time"
                value={formData.closingTime}
                onChange={(e) => handleInputChange("closingTime", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Available Days */}
          <div>
            <Label className="mb-3 block">Available Days *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox
                    id={day}
                    checked={availableDays.includes(day)}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label htmlFor={day} className="text-sm font-normal cursor-pointer">
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea 
              rows={4}
              placeholder="Describe your court, facilities, and any special features..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          {/* Court Images */}
          <div>
            <Label className="mb-2 block">Court Images</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Upload court photos</p>
              <p className="text-sm text-gray-500 mb-4">Drag and drop or click to select files</p>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760} // 10MB
                onGetUploadParameters={getUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="bg-primary text-white hover:bg-green-700"
              >
                Choose Files
              </ObjectUploader>
              {imageUrl && (
                <p className="text-sm text-green-600 mt-2">Image uploaded successfully!</p>
              )}
            </div>
          </div>

          {/* Court Rules */}
          <div>
            <Label>Court Rules</Label>
            <Textarea 
              rows={3}
              placeholder="List any specific rules for your court..."
              value={formData.rules}
              onChange={(e) => handleInputChange("rules", e.target.value)}
            />
          </div>

          {/* Commission Rate Info */}
          {commissionData?.defaultCommissionRate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Platform Commission</h4>
              </div>
              <p className="text-sm text-blue-800">
                CourtBook Kenya charges a <span className="font-semibold">{commissionData.defaultCommissionRate}% commission</span> on all bookings made through the platform. 
                This helps us maintain and improve our services while keeping the platform free for vendors to use.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-primary text-white hover:bg-green-700"
              disabled={mutation.isPending || imageUpdateMutation.isPending}
            >
              {mutation.isPending || imageUpdateMutation.isPending ? "Creating..." : "Create Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
