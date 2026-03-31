import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CloudUpload, X, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LocationPicker } from "./LocationPicker";
import { PlacesAutocompleteInput } from "./PlacesAutocompleteInput";
import { MapPreview } from "./MapPreview";
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

  const [locationData, setLocationData] = useState<{
    latitude: number | null;
    longitude: number | null;
    address?: string;
  }>({
    latitude: null,
    longitude: null,
  });

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [facilityType, setFacilityType] = useState<"separate_areas" | "shared_area">("shared_area");
  const [sportCapacities, setSportCapacities] = useState<Record<string, number>>({});

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

      const existingImages = court.images && court.images.length > 0
        ? court.images
        : (court.imageUrl ? [court.imageUrl] : []);
      setGalleryImages(existingImages);
      setCoverImageUrl(court.imageUrl || existingImages[0] || "");
      
      // Set existing location data if available
      if (court.latitude != null && court.longitude != null) {
        setLocationData({
          latitude: court.latitude,
          longitude: court.longitude,
          address: court.address || undefined
        });
      }
      setFacilityType((court as any).facilityType || "shared_area");
      setSportCapacities((court as any).sportCapacities || {});
    }
  }, [court]);

  const uploadImageFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);

    const response = await fetch("/api/objects/upload-file", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (galleryImages.length + files.length > 8) {
      toast({ title: "Too many images", description: "You can upload up to 8 images.", variant: "destructive" });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB.`, variant: "destructive" });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setIsUploadingGallery(true);
    try {
      const urls = await Promise.all(validFiles.map(uploadImageFile));
      setGalleryImages(prev => [...prev, ...urls].slice(0, 8));
      if (!coverImageUrl && urls.length > 0) setCoverImageUrl(urls[0]);
      toast({ title: "Images Uploaded", description: `${urls.length} image(s) added to gallery.` });
    } catch (error) {
      toast({ title: "Upload Failed", description: "Failed to upload some images.", variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (url: string) => {
    setGalleryImages(prev => prev.filter(img => img !== url));
    if (coverImageUrl === url) {
      const remaining = galleryImages.filter(img => img !== url);
      setCoverImageUrl(remaining[0] || "");
    }
  };

  const updateCourtMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Mutation - Updating court with data:', data, 'Court ID:', court?.id);
      const response = await apiRequest(`/api/vendor/courts/${court?.id}`, "PUT", {
        ...data,
        hourlyRate: parseFloat(data.hourlyRate),
        peakHourRate: data.peakHourRate ? parseFloat(data.peakHourRate) : null,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        images: galleryImages,
        imageUrl: coverImageUrl || galleryImages[0] || null,
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
    updateCourtMutation.mutate({
      ...formData,
      facilityType,
      sportCapacities: facilityType === 'separate_areas' ? sportCapacities : {},
    });
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
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{ zIndex: 9999 }}
        onInteractOutside={(e) => {
          if ((e.target as Element)?.closest?.(".pac-container")) {
            e.preventDefault();
          }
        }}
      >
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
            <PlacesAutocompleteInput
              id="address"
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              onPlaceSelect={({ address, lat, lng }) => {
                setFormData((prev) => ({ ...prev, address }));
                setLocationData({ latitude: lat, longitude: lng, address });
              }}
              placeholder="Search for address (e.g. Westlands, Nairobi)"
              data-testid="input-court-address"
            />
          </div>

          {/* Map preview after address / GPS location is set */}
          {locationData.latitude != null && locationData.longitude != null && (
            <MapPreview
              lat={locationData.latitude}
              lng={locationData.longitude}
              address={formData.address || locationData.address}
            />
          )}

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

          {/* Sport Capacities - only for separate_areas */}
          {facilityType === 'separate_areas' && formData.availableSports.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-1">Court Count per Sport</h3>
              <p className="text-sm text-blue-700 mb-3">
                How many separate courts/areas are available for each sport simultaneously?
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.availableSports.map(sport => (
                  <div key={sport} className="flex items-center gap-2">
                    <Label className="w-24 shrink-0 text-sm">{sport}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={sportCapacities[sport] ?? 1}
                      onChange={e => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setSportCapacities(prev => ({ ...prev, [sport]: val }));
                      }}
                      className="w-20"
                    />
                    <span className="text-xs text-gray-500">courts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Location Picker */}
          <div className="mt-6">
            <LocationPicker
              onLocationSelect={(lat, lng, address) => {
                setLocationData({ latitude: lat, longitude: lng, address });
                if (address && !formData.address) {
                  setFormData(prev => ({ ...prev, address }));
                }
              }}
              initialLat={locationData.latitude || undefined}
              initialLng={locationData.longitude || undefined}
              className="w-full"
            />
          </div>

          {/* Court Photos */}
          <div>
            <Label className="mb-2 block">Court Photos (up to 8)</Label>
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {galleryImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Court image ${idx + 1}`}
                      className={`w-full h-24 object-cover rounded-lg border-2 ${url === coverImageUrl ? 'border-primary' : 'border-transparent'}`}
                    />
                    {url === coverImageUrl && (
                      <span className="absolute top-1 left-1 bg-primary text-white text-xs px-1 rounded">Cover</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      {url !== coverImageUrl && (
                        <button
                          type="button"
                          onClick={() => setCoverImageUrl(url)}
                          className="bg-white text-gray-800 text-xs px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(url)}
                        className="bg-red-500 text-white p-1 rounded hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {galleryImages.length < 8 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <CloudUpload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-1 text-sm">Add more court photos</p>
                <p className="text-xs text-gray-500 mb-3">Max 10MB per image • {galleryImages.length}/8 uploaded</p>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-primary text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium">
                  {isUploadingGallery ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Photos
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryUpload}
                    disabled={isUploadingGallery}
                  />
                </label>
              </div>
            )}
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