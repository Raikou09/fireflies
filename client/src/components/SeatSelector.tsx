import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ZoomIn, ZoomOut, Loader2, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SeatSection {
  id: string;
  venueId: string;
  name: string;
  color: string;
  basePrice: number;
  description?: string;
}

interface Seat {
  id: string;
  venueId: string;
  sectionId: string;
  row: string;
  number: number;
  seatLabel: string;
  priceOverride?: number;
  x: number;
  y: number;
  isAccessible: boolean;
}

interface SeatAvailability {
  seat: Seat;
  section: SeatSection;
  status: "available" | "booked" | "reserved";
  price: number;
}

interface SeatSelectorProps {
  eventId: string;
  onSeatsSelected: (seats: { seatId: string; price: number }[], totalPrice: number) => void;
  selectedSeats?: string[];
}

const GRID_SIZE = 40;
const SEAT_SIZE = 32;

export function SeatSelector({ eventId, onSeatsSelected, selectedSeats: initialSelectedSeats = [] }: SeatSelectorProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>(initialSelectedSeats);

  const { data: availability, isLoading, refetch } = useQuery<SeatAvailability[]>({
    queryKey: ["/api/events", eventId, "seat-availability"],
    refetchInterval: 10000, // Refresh availability every 10 seconds
  });

  useEffect(() => {
    if (!availability) return;

    const selectedSeatData = availability
      .filter(a => selectedSeats.includes(a.seat.id))
      .map(a => ({ seatId: a.seat.id, price: a.price }));

    const totalPrice = selectedSeatData.reduce((sum, seat) => sum + seat.price, 0);
    onSeatsSelected(selectedSeatData, totalPrice);
  }, [selectedSeats, availability]);

  const handleSeatClick = (seat: Seat, status: string) => {
    if (status !== "available") return;

    setSelectedSeats(prev => {
      if (prev.includes(seat.id)) {
        return prev.filter(id => id !== seat.id);
      } else {
        return [...prev, seat.id];
      }
    });
  };

  const getSeatStatus = (seatId: string, apiStatus: string): "available" | "booked" | "reserved" | "selected" => {
    if (selectedSeats.includes(seatId)) return "selected";
    return apiStatus as "available" | "booked" | "reserved";
  };

  const getSeatColor = (status: string, sectionColor: string): string => {
    switch (status) {
      case "selected":
        return "#10B981"; // Green
      case "booked":
        return "#EF4444"; // Red
      case "reserved":
        return "#F59E0B"; // Amber
      case "available":
        return sectionColor;
      default:
        return "#9CA3AF"; // Gray
    }
  };

  const getSeatCursor = (status: string): string => {
    return status === "available" || status === "selected" ? "pointer" : "not-allowed";
  };

  const groupedSections = availability?.reduce((acc, item) => {
    if (!acc[item.section.id]) {
      acc[item.section.id] = {
        section: item.section,
        totalSeats: 0,
        availableSeats: 0,
        selectedSeats: 0,
      };
    }
    acc[item.section.id].totalSeats++;
    if (item.status === "available") acc[item.section.id].availableSeats++;
    if (selectedSeats.includes(item.seat.id)) acc[item.section.id].selectedSeats++;
    return acc;
  }, {} as Record<string, { section: SeatSection; totalSeats: number; availableSeats: number; selectedSeats: number }>);

  if (isLoading) {
    return (
      <Card data-testid="card-seat-selector-loading">
        <CardContent className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!availability || availability.length === 0) {
    return (
      <Card data-testid="card-seat-selector-empty">
        <CardContent className="flex flex-col items-center justify-center h-96 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Seat Map Available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            This event does not have a seat map configured yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSelected = selectedSeats.length;
  const totalPrice = availability
    .filter(a => selectedSeats.includes(a.seat.id))
    .reduce((sum, a) => sum + a.price, 0);

  return (
    <div className="space-y-6" data-testid="seat-selector">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select Your Seats</h2>
          <p className="text-sm text-muted-foreground">
            Click on available seats to select them
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.min(zoom + 0.2, 2))}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.max(zoom - 0.2, 0.4))}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Seat Map Canvas */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Venue Seat Map</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-white" style={{ backgroundColor: "#10B981" }} />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-white" style={{ backgroundColor: "#9CA3AF" }} />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-white" style={{ backgroundColor: "#F59E0B" }} />
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-white" style={{ backgroundColor: "#EF4444" }} />
                  <span>Booked</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-auto bg-muted/30" style={{ height: "500px" }}>
              <div
                className="relative"
                style={{
                  width: "2000px",
                  height: "2000px",
                  backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                  `,
                  backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                }}
                data-testid="canvas-seat-map"
              >
                {availability.map((item) => {
                  const { seat, section, status } = item;
                  const seatStatus = getSeatStatus(seat.id, status);
                  const seatColor = getSeatColor(seatStatus, section.color);
                  const cursor = getSeatCursor(seatStatus);

                  return (
                    <TooltipProvider key={seat.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute flex items-center justify-center rounded border-2 text-xs font-semibold shadow-sm transition-all hover:scale-110"
                            style={{
                              left: `${seat.x * GRID_SIZE}px`,
                              top: `${seat.y * GRID_SIZE}px`,
                              width: `${SEAT_SIZE}px`,
                              height: `${SEAT_SIZE}px`,
                              backgroundColor: seatColor,
                              borderColor: seatStatus === "selected" ? "#ffffff" : "rgba(255, 255, 255, 0.5)",
                              color: "#000",
                              cursor,
                              opacity: status === "booked" ? 0.5 : 1,
                            }}
                            onClick={() => handleSeatClick(seat, status)}
                            data-testid={`seat-${seat.id}`}
                          >
                            {seat.seatLabel}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">{seat.seatLabel}</p>
                            <p>Section: {section.name}</p>
                            <p>Price: KES {item.price.toLocaleString()}</p>
                            <p className="capitalize">Status: {seatStatus}</p>
                            {seat.isAccessible && <p className="text-blue-500">Accessible</p>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Zoom: <strong data-testid="text-zoom-level">{Math.round(zoom * 100)}%</strong>
              </span>
              <span className="text-muted-foreground">
                {totalSelected > 0 
                  ? `${totalSelected} seat${totalSelected > 1 ? 's' : ''} selected`
                  : "Click on seats to select them"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Selection Summary Panel */}
        <Card className="lg:col-span-1" data-testid="card-selection-summary">
          <CardHeader>
            <CardTitle className="text-lg">Your Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {groupedSections && Object.values(groupedSections).map(({ section, totalSeats, availableSeats, selectedSeats }) => (
                  <div key={section.id} className="p-3 rounded-lg border" data-testid={`section-summary-${section.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: section.color }}
                      />
                      <p className="font-medium text-sm">{section.name}</p>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <p>Base Price: KES {section.basePrice.toLocaleString()}</p>
                      <p>Available: {availableSeats}/{totalSeats}</p>
                      {selectedSeats > 0 && (
                        <p className="text-green-600 font-medium">
                          Selected: {selectedSeats}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 pt-6 border-t space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Seats:</span>
                <span className="font-bold" data-testid="text-total-selected">{totalSelected}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Price:</span>
                <span className="font-bold text-primary" data-testid="text-total-price">
                  KES {totalPrice.toLocaleString()}
                </span>
              </div>
              {totalSelected > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p>Selected Seats:</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {availability
                      .filter(a => selectedSeats.includes(a.seat.id))
                      .map(a => (
                        <Badge 
                          key={a.seat.id} 
                          variant="secondary"
                          data-testid={`badge-selected-${a.seat.id}`}
                        >
                          {a.seat.seatLabel}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
