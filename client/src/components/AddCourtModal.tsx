import { useState, useEffect } from "react";
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
import { LocationPicker } from "./LocationPicker";
import { PlacesAutocompleteInput } from "./PlacesAutocompleteInput";
import { MapPreview } from "./MapPreview";
import { CloudUpload, X, Info, Package, Plus, Trash2, Loader2 } from "lucide-react";

interface CourtData {
  id: string;
  name: string;
  city: string;
  area: string;
  address?: string | null;
  description?: string | null;
  hourlyRate: string;
  peakHourRate?: string | null;
  openingTime: string;
  closingTime: string;
  rules?: string | null;
  availableSports?: string[];
  facilityType?: 'separate_areas' | 'shared_area';
  availableDays?: string[];
  imageUrl?: string | null;
  images?: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AddCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtToEdit?: CourtData | null;
}

export default function AddCourtModal({ isOpen, onClose, courtToEdit }: AddCourtModalProps) {
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
    address: "",
    description: "",
    hourlyRate: "",
    peakHourRate: "",
    openingTime: "",
    closingTime: "",
    rules: "",
  });

  const [locationData, setLocationData] = useState<{
    latitude: number | null;
    longitude: number | null;
    address?: string;
  }>({
    latitude: null,
    longitude: null,
  });

  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [facilityType, setFacilityType] = useState<"separate_areas" | "shared_area">("shared_area");
  const [sportCapacities, setSportCapacities] = useState<Record<string, number>>({});

  const [availableDays, setAvailableDays] = useState<string[]>([
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ]);
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Equipment setup state
  const [includeEquipment, setIncludeEquipment] = useState(false);
  const [equipmentItems, setEquipmentItems] = useState<Array<{
    name: string;
    category: string;
    pricePerHour: string;
    quantityAvailable: number;
    description: string;
  }>>([]);

  // Populate form when editing
  useEffect(() => {
    if (courtToEdit) {
      setFormData({
        name: courtToEdit.name || "",
        city: courtToEdit.city || "",
        area: courtToEdit.area || "",
        address: courtToEdit.address || "",
        description: courtToEdit.description || "",
        hourlyRate: courtToEdit.hourlyRate || "",
        peakHourRate: courtToEdit.peakHourRate || "",
        openingTime: courtToEdit.openingTime || "",
        closingTime: courtToEdit.closingTime || "",
        rules: courtToEdit.rules || "",
      });
      setSelectedSports(courtToEdit.availableSports || []);
      setFacilityType(courtToEdit.facilityType || "shared_area");
      setSportCapacities((courtToEdit as any).sportCapacities || {});
      setAvailableDays(courtToEdit.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
      setImageUrl(courtToEdit.imageUrl || "");
      const existingGallery = courtToEdit.images && courtToEdit.images.length > 0
        ? courtToEdit.images
        : (courtToEdit.imageUrl ? [courtToEdit.imageUrl] : []);
      setGalleryImages(existingGallery);
      setLocationData({
        latitude: courtToEdit.latitude || null,
        longitude: courtToEdit.longitude || null,
        address: courtToEdit.address || undefined,
      });
    } else {
      resetForm();
    }
  }, [courtToEdit, isOpen]);

  // Update mutation for editing
  const updateMutation = useMutation({
    mutationFn: async (courtData: any) => {
      const response = await apiRequest(`/api/courts/${courtToEdit?.id}`, "PUT", courtData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update court');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Court Updated Successfully!",
        description: "Your court details have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      onClose();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update the court.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update court. Please try again.",
        variant: "destructive",
      });
    },
  });

  const mutation = useMutation({
    mutationFn: async (courtData: any) => {
      console.log('Sending court data:', courtData);
      const response = await apiRequest("/api/courts", "POST", courtData);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Court creation error:', errorData);
        throw new Error(errorData.message || 'Failed to create court');
      }
      return response.json();
    },
    onSuccess: (court) => {
      // Create equipment if specified
      if (includeEquipment && equipmentItems.length > 0) {
        createEquipmentForCourt(court.id);
      }
      
      const hasEquipment = includeEquipment && equipmentItems.length > 0;
      toast({
        title: "Court Created Successfully!",
        description: hasEquipment 
          ? "Your court and equipment have been submitted for admin approval!" 
          : "Your court has been submitted for admin approval. Add equipment later to boost revenue!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/stats"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      console.error('Court creation mutation error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a court.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Court Creation Failed",
        description: error.message || "Failed to create court. Please try again.",
        variant: "destructive",
      });
    },
  });


  const resetForm = () => {
    setFormData({
      name: "",
      city: "",
      area: "",
      address: "",
      description: "",
      hourlyRate: "",
      peakHourRate: "",
      openingTime: "",
      closingTime: "",
      rules: "",
    });
    setSelectedSports([]);
    setFacilityType("shared_area");
    setSportCapacities({});
    setAvailableDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    setImageUrl("");
    setGalleryImages([]);
    setIncludeEquipment(false);
    setEquipmentItems([]);
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

  // Equipment management functions
  const addEquipmentItem = () => {
    setEquipmentItems(prev => [...prev, {
      name: "",
      category: "",
      pricePerHour: "",
      quantityAvailable: 1,
      description: ""
    }]);
  };

  const removeEquipmentItem = (index: number) => {
    setEquipmentItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateEquipmentItem = (index: number, field: string, value: any) => {
    setEquipmentItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Create equipment for the court
  const createEquipmentForCourt = async (courtId: string) => {
    const validEquipmentItems = equipmentItems.filter(item => 
      item.name && item.category && item.pricePerHour
    );

    for (const item of validEquipmentItems) {
      try {
        await apiRequest("/api/equipment", "POST", {
          courtId,
          name: item.name,
          category: item.category,
          pricePerHour: parseFloat(item.pricePerHour),
          quantityAvailable: item.quantityAvailable,
          description: item.description,
          isAvailable: true
        });
      } catch (error) {
        console.error("Error creating equipment:", error);
      }
    }
  };

  const sportsOptions = [
    "Football", "Basketball", "Volleyball", "Tennis", "Netball", "Rugby",
    "Cricket", "Badminton", "Table Tennis", "Swimming", "Athletics", 
    "Hockey", "Handball", "Squash", "Boxing"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Form data:', formData);
    console.log('Selected sports:', selectedSports);
    console.log('Available days:', availableDays);
    console.log('Location data:', locationData);
    
    if (!formData.name || selectedSports.length === 0 || !formData.city || !formData.area || 
        !formData.hourlyRate || !formData.openingTime || !formData.closingTime || availableDays.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields, select at least one sport, and select at least one day.",
        variant: "destructive",
      });
      return;
    }

    const courtPayload = {
      name: formData.name,
      availableSports: selectedSports,
      facilityType,
      sportCapacities: facilityType === 'separate_areas' ? sportCapacities : {},
      city: formData.city,
      area: formData.area,
      address: formData.address || "",
      latitude: locationData.latitude ? locationData.latitude.toString() : null,
      longitude: locationData.longitude ? locationData.longitude.toString() : null,
      description: formData.description || "",
      hourlyRate: formData.hourlyRate,
      peakHourRate: formData.peakHourRate || null,
      openingTime: formData.openingTime,
      closingTime: formData.closingTime,
      availableDays,
      imageUrl: imageUrl || null,
      images: galleryImages,
      rules: formData.rules || "",
      isActive: true,
      commissionRate: (commissionData?.defaultCommissionRate || 15).toString()
    };
    
    console.log('Final court payload:', courtPayload);
    
    if (courtToEdit) {
      updateMutation.mutate(courtPayload);
    } else {
      mutation.mutate(courtPayload);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const uploadImageFile = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);

    const response = await fetch("/api/objects/upload-file", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();
    return data.url;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImageFile(file);
      setImageUrl(url);
      if (!galleryImages.includes(url)) {
        setGalleryImages(prev => [url, ...prev]);
      }
      toast({ title: "Image Uploaded", description: "Court image has been uploaded successfully." });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
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
      setGalleryImages(prev => {
        const combined = [...prev, ...urls];
        return combined.slice(0, 8);
      });
      if (!imageUrl && urls.length > 0) {
        setImageUrl(urls[0]);
      }
      toast({ title: "Images Uploaded", description: `${urls.length} image(s) added to gallery.` });
    } catch (error) {
      console.error("Gallery upload error:", error);
      toast({ title: "Upload Failed", description: "Failed to upload some images.", variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (url: string) => {
    setGalleryImages(prev => prev.filter(img => img !== url));
    if (imageUrl === url) {
      const remaining = galleryImages.filter(img => img !== url);
      setImageUrl(remaining[0] || "");
    }
  };

  const cities = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if ((e.target as Element)?.closest?.(".pac-container")) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {courtToEdit ? 'Edit Court' : 'Add New Court'}
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

            {/* Facility Type - only show if multiple sports selected */}
            {selectedSports.length > 1 && (
              <div className="md:col-span-2">
                <Label className="mb-3 block">Facility Layout *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      facilityType === 'separate_areas' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFacilityType('separate_areas')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        facilityType === 'separate_areas' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {facilityType === 'separate_areas' && (
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Separate Areas</p>
                        <p className="text-sm text-gray-600">Each sport has its own dedicated space (e.g., separate football pitch and tennis court). Multiple sports can be booked at the same time.</p>
                      </div>
                    </div>
                  </div>
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      facilityType === 'shared_area' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFacilityType('shared_area')}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        facilityType === 'shared_area' ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {facilityType === 'shared_area' && (
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Shared Multi-Use Area</p>
                        <p className="text-sm text-gray-600">One court/space used for different sports (e.g., multipurpose hall). Only one sport can be booked per time slot.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sport Capacities - only for separate_areas */}
          {facilityType === 'separate_areas' && selectedSports.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-1">Court Count per Sport</h3>
              <p className="text-sm text-blue-700 mb-3">
                Set how many separate courts/areas are available for each sport. Customers can book multiple courts simultaneously.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedSports.map(sport => (
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

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div>
              <Label>Street Address</Label>
              <PlacesAutocompleteInput
                value={formData.address}
                onChange={(value) => handleInputChange("address", value)}
                onPlaceSelect={({ address, lat, lng }) => {
                  handleInputChange("address", address);
                  setLocationData({ latitude: lat, longitude: lng, address });
                }}
                placeholder="Search for address (e.g. Westlands, Nairobi)"
                data-testid="input-court-address"
              />
            </div>
          </div>

          {/* Map preview after address/location is set */}
          {locationData.latitude != null && locationData.longitude != null && (
            <MapPreview
              lat={locationData.latitude}
              lng={locationData.longitude}
              address={formData.address || locationData.address}
            />
          )}

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
            <Label className="mb-2 block">Court Photos (up to 8)</Label>
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                {galleryImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Court image ${idx + 1}`}
                      className={`w-full h-24 object-cover rounded-lg border-2 ${url === imageUrl ? 'border-primary' : 'border-transparent'}`}
                    />
                    {url === imageUrl && (
                      <span className="absolute top-1 left-1 bg-primary text-white text-xs px-1 rounded">Cover</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      {url !== imageUrl && (
                        <button
                          type="button"
                          onClick={() => setImageUrl(url)}
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
                <p className="text-gray-600 mb-1 text-sm">Upload court photos</p>
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

          {/* Equipment Rental Setup */}
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Equipment Rental Setup (Optional)</Label>
              </div>
              <Checkbox
                checked={includeEquipment}
                onCheckedChange={(checked) => setIncludeEquipment(checked === true)}
                id="include-equipment"
              />
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Boost your revenue by 30-50% by offering equipment rentals. Add items like balls, rackets, and protective gear.
            </p>

            {includeEquipment && (
              <div className="space-y-4">
                {equipmentItems.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Equipment Item {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEquipmentItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Equipment Name</Label>
                        <Input
                          placeholder="e.g., Basketball, Tennis Racket"
                          value={item.name}
                          onChange={(e) => updateEquipmentItem(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Category</Label>
                        <Select 
                          value={item.category} 
                          onValueChange={(value) => updateEquipmentItem(index, 'category', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="balls">Balls</SelectItem>
                            <SelectItem value="rackets">Rackets</SelectItem>
                            <SelectItem value="protective_gear">Protective Gear</SelectItem>
                            <SelectItem value="nets">Nets</SelectItem>
                            <SelectItem value="shoes">Shoes</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm">Price per Hour (KSh)</Label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={item.pricePerHour}
                          onChange={(e) => updateEquipmentItem(index, 'pricePerHour', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Quantity Available</Label>
                        <Input
                          type="number"
                          placeholder="5"
                          value={item.quantityAvailable}
                          onChange={(e) => updateEquipmentItem(index, 'quantityAvailable', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm">Description</Label>
                        <Input
                          placeholder="Professional quality equipment..."
                          value={item.description}
                          onChange={(e) => updateEquipmentItem(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEquipmentItem}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Equipment Item
                </Button>
              </div>
            )}
          </div>

          {/* Commission Rate Info */}
          {commissionData?.defaultCommissionRate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Platform Commission</h4>
              </div>
              <p className="text-sm text-blue-800">
                SportsBox charges a <span className="font-semibold">{commissionData.defaultCommissionRate}% commission</span> on all bookings made through the platform. 
                This helps us maintain and improve our services while keeping the platform free for vendors to use.
              </p>
            </div>
          )}

          {/* Location Picker */}
          <div className="mt-6">
            <LocationPicker
              onLocationSelect={(lat, lng, address) => {
                setLocationData({ latitude: lat, longitude: lng, address });
                if (address && !formData.address) {
                  setFormData(prev => ({ ...prev, address }));
                }
              }}
              className="w-full"
            />
          </div>

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
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating..." : "Create Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
