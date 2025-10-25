import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema, insertTicketTierSchema, type InsertEvent, type InsertTicketTier, type Venue } from "@shared/schema";
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
import { Loader2, Plus, X } from "lucide-react";
import { z } from "zod";

const EVENT_CATEGORIES = [
  "Concert",
  "Sports Event",
  "Theater",
  "Conference",
  "Festival",
  "Comedy Show",
  "Exhibition",
  "Workshop",
  "Other"
];

const TIER_TYPES = ["VIP", "General", "Early Bird", "Student", "Other"];

// Ticket tier schema for form (without eventId since it doesn't exist yet)
const formTicketTierSchema = insertTicketTierSchema.omit({ eventId: true });

// Extended schema for event creation with ticket tiers
const eventWithTiersSchema = z.object({
  event: insertEventSchema,
  ticketTiers: z.array(formTicketTierSchema).min(1, "At least one ticket tier is required"),
});

type EventWithTiers = z.infer<typeof eventWithTiersSchema>;

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEventModal({ isOpen, onClose }: AddEventModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vendor's venues
  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/vendor/venues"],
  });

  const approvedVenues = venues.filter(v => v.approvalStatus === 'approved' && v.isActive);

  const form = useForm<EventWithTiers>({
    resolver: zodResolver(eventWithTiersSchema),
    defaultValues: {
      event: {
        venueId: "",
        name: "",
        description: "",
        category: "Concert",
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: "19:00",
        duration: 120,
        posterImageUrl: "",
        hasSeatMap: false,
        totalSeats: 100,
        availableSeats: 100,
      },
      ticketTiers: [
        {
          name: "General Admission",
          tierType: "General",
          price: 1000,
          description: "",
          totalQuantity: 100,
          availableQuantity: 100,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ticketTiers",
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: EventWithTiers) => {
      const eventData = {
        ...data.event,
        eventDate: new Date(data.event.eventDate as string).toISOString(),
      };
      const payload = {
        event: eventData,
        ticketTiers: data.ticketTiers,
      };
      return await apiRequest<any>("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your event has been submitted for admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/events"] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EventWithTiers) => {
    createEventMutation.mutate(data);
  };

  if (approvedVenues.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Approved Venues</DialogTitle>
            <DialogDescription>
              You need at least one approved venue before you can create events.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              Please create and get approval for a venue first.
            </p>
            <Button onClick={onClose} data-testid="button-close">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Submit your event details for admin approval
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              
              <FormField
                control={form.control}
                name="event.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Summer Music Festival 2025"
                        {...field}
                        data-testid="input-event-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event.venueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-event-venue">
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {approvedVenues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} - {venue.city}
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
                name="event.category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-event-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
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
                name="event.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your event, lineup, schedule, and what attendees can expect..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                        data-testid="textarea-event-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="event.eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={typeof field.value === 'string' ? field.value.split('T')[0] : ''}
                          data-testid="input-event-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event.eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-event-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event.duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                          data-testid="input-event-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="event.totalSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Seats *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 500"
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            field.onChange(value);
                            form.setValue('event.availableSeats', value);
                          }}
                          data-testid="input-event-total-seats"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event.availableSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Seats *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          disabled
                          data-testid="input-event-available-seats"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="event.posterImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poster Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/event-poster.jpg"
                        {...field}
                        value={field.value || ""}
                        data-testid="input-event-poster-url"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ticket Tiers Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Ticket Tiers</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    name: "",
                    tierType: "General",
                    price: 0,
                    description: "",
                    totalQuantity: 0,
                    availableQuantity: 0,
                  })}
                  data-testid="button-add-ticket-tier"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="border p-4 rounded-lg space-y-4 relative">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => remove(index)}
                      data-testid={`button-remove-tier-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`ticketTiers.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., VIP Pass"
                              {...field}
                              data-testid={`input-tier-name-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ticketTiers.${index}.tierType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tier Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid={`select-tier-type-${index}`}>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIER_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`ticketTiers.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What's included in this tier..."
                            {...field}
                            value={field.value || ""}
                            data-testid={`textarea-tier-description-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`ticketTiers.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (KES) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1000"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid={`input-tier-price-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ticketTiers.${index}.totalQuantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                field.onChange(value);
                                form.setValue(`ticketTiers.${index}.availableQuantity`, value);
                              }}
                              data-testid={`input-tier-quantity-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`ticketTiers.${index}.availableQuantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              disabled
                              data-testid={`input-tier-available-${index}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createEventMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                data-testid="button-submit-event"
              >
                {createEventMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Submit for Approval
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
