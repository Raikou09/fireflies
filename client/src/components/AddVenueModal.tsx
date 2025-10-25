import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVenueSchema, type InsertVenue } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { SeatMapBuilder } from "./SeatMapBuilder";
import { TemplateSelector } from "./TemplateSelector";

const CITIES = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

interface AddVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddVenueModal({ isOpen, onClose }: AddVenueModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"template" | "basic" | "seatmap">("template");
  const [createdVenueId, setCreatedVenueId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  const { data: templateData } = useQuery<any>({
    queryKey: ['/api/venue-templates', selectedTemplateId],
    queryFn: async () => {
      const res = await fetch(`/api/venue-templates/${selectedTemplateId}`);
      if (!res.ok) throw new Error('Failed to fetch template');
      return res.json();
    },
    enabled: !!selectedTemplateId,
  });

  const form = useForm<InsertVenue>({
    resolver: zodResolver(insertVenueSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "Nairobi",
      area: "",
      latitude: "0",
      longitude: "0",
      capacity: 100,
      amenities: [],
      imageUrl: "",
    },
  });

  const createVenueMutation = useMutation({
    mutationFn: async (data: InsertVenue & { templateId?: string | null }) => {
      const res = await apiRequest("/api/venues", "POST", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      setCreatedVenueId(data.id);
      toast({
        title: "Venue Created!",
        description: "Now you can optionally add a seat map for this venue.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/venues"] });
      setStep("seatmap");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create venue. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveSeatMapMutation = useMutation({
    mutationFn: async ({ sections, seats }: { sections: any[]; seats: any[] }) => {
      if (!createdVenueId) throw new Error("No venue ID");
      const res = await apiRequest(`/api/venues/${createdVenueId}/seat-map`, "POST", { sections, seats });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Seat Map Saved!",
        description: "Your venue seat map has been configured successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/venues"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save seat map. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setStep("template");
    setCreatedVenueId(null);
    setSelectedTemplateId(null);
    onClose();
  };
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setStep("basic");
  };
  
  const handleCustomDesign = () => {
    setSelectedTemplateId(null);
    setStep("basic");
  };

  const handleSkipSeatMap = () => {
    toast({
      title: "Venue Submitted",
      description: "Your venue has been submitted for admin approval.",
    });
    handleClose();
  };

  const handleSaveSeatMap = async (sections: any[], seats: any[]) => {
    await saveSeatMapMutation.mutateAsync({ sections, seats });
  };

  const onSubmit = (data: InsertVenue) => {
    createVenueMutation.mutate({ ...data, templateId: selectedTemplateId });
  };

  const getDialogTitle = () => {
    switch(step) {
      case "template": return "Choose Venue Design";
      case "basic": return "Add New Venue";
      case "seatmap": return "Configure Seat Map (Optional)";
    }
  };
  
  const getDialogDescription = () => {
    switch(step) {
      case "template": return "Select a professional template or design from scratch";
      case "basic": return "Submit your venue details for admin approval";
      case "seatmap": return "Design a visual seat layout for your venue. This step is optional and can be skipped.";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={`${step === "seatmap" ? "max-w-7xl max-h-[95vh]" : "max-w-2xl max-h-[90vh]"} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {step === "template" ? (
          <TemplateSelector 
            onSelectTemplate={handleTemplateSelect}
            onCustomDesign={handleCustomDesign}
          />
        ) : step === "basic" ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., KICC Convention Center"
                      {...field}
                      data-testid="input-venue-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your venue, facilities, and unique features..."
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-venue-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-venue-city">
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Westlands"
                        {...field}
                        data-testid="input-venue-area"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-venue-capacity"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., City Hall Way, Nairobi"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-venue-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., -1.286389"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-venue-latitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 36.817223"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        data-testid="input-venue-longitude"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/venue-image.jpg"
                      {...field}
                      value={field.value || ""}
                      data-testid="input-venue-image-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("template")}
                disabled={createVenueMutation.isPending}
                data-testid="button-back-to-template"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createVenueMutation.isPending}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createVenueMutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  data-testid="button-submit-venue"
                >
                  {createVenueMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Submit for Approval
                </Button>
              </div>
            </div>
          </form>
        </Form>
        ) : (
          <div className="space-y-6">
            <SeatMapBuilder 
              onSave={handleSaveSeatMap} 
              templateData={selectedTemplateId ? templateData : undefined}
            />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipSeatMap}
                data-testid="button-skip-seat-map"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
