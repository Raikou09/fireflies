import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Grid3x3, Save, ZoomIn, ZoomOut, Undo } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SeatSection {
  tempId: string;
  name: string;
  color: string;
  basePrice: number;
  description?: string;
}

interface Seat {
  tempId: string;
  sectionId: string;
  row: string;
  number: number;
  seatLabel: string;
  priceOverride?: number;
  x: number;
  y: number;
  isAccessible: boolean;
}

interface SeatMapBuilderProps {
  onSave: (sections: SeatSection[], seats: Seat[]) => Promise<void>;
  initialSections?: SeatSection[];
  initialSeats?: Seat[];
}

const PRESET_COLORS = [
  { name: "VIP Gold", color: "#FFD700" },
  { name: "Premium Blue", color: "#4A90E2" },
  { name: "General Red", color: "#E74C3C" },
  { name: "Standard Green", color: "#27AE60" },
  { name: "Balcony Purple", color: "#9B59B6" },
  { name: "Accessible Orange", color: "#F39C12" },
];

const GRID_SIZE = 40;
const SEAT_SIZE = 32;

export function SeatMapBuilder({ onSave, initialSections = [], initialSeats = [] }: SeatMapBuilderProps) {
  const [sections, setSections] = useState<SeatSection[]>(initialSections);
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [tool, setTool] = useState<"select" | "add" | "remove">("add");
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [newSection, setNewSection] = useState({
    name: "",
    color: PRESET_COLORS[0].color,
    basePrice: 0,
    description: "",
  });

  useEffect(() => {
    if (sections.length > 0 && !selectedSection) {
      setSelectedSection(sections[0].tempId);
    }
  }, [sections, selectedSection]);

  const addSection = () => {
    if (!newSection.name || newSection.basePrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a section name and price",
        variant: "destructive",
      });
      return;
    }

    const section: SeatSection = {
      tempId: `temp-section-${Date.now()}-${Math.random()}`,
      name: newSection.name,
      color: newSection.color,
      basePrice: newSection.basePrice,
      description: newSection.description || undefined,
    };

    setSections([...sections, section]);
    setSelectedSection(section.tempId);
    setNewSection({ name: "", color: PRESET_COLORS[0].color, basePrice: 0, description: "" });
    setShowSectionDialog(false);

    toast({
      title: "Section Added",
      description: `${section.name} has been added`,
    });
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter(s => s.tempId !== sectionId));
    setSeats(seats.filter(s => s.sectionId !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(sections[0]?.tempId || "");
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tool === "select" || !selectedSection) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / zoom / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / zoom / GRID_SIZE);

    if (tool === "add") {
      const existingSeat = seats.find(s => s.x === x && s.y === y);
      if (existingSeat) {
        toast({
          title: "Seat Already Exists",
          description: "There's already a seat at this position",
          variant: "destructive",
        });
        return;
      }

      const seatsInRow = seats.filter(s => s.sectionId === selectedSection && s.row === String.fromCharCode(65 + y));
      const seatNumber = seatsInRow.length + 1;
      const row = String.fromCharCode(65 + y);

      const seat: Seat = {
        tempId: `temp-seat-${Date.now()}-${Math.random()}`,
        sectionId: selectedSection,
        row,
        number: seatNumber,
        seatLabel: `${row}${seatNumber}`,
        x,
        y,
        isAccessible: false,
      };

      setSeats([...seats, seat]);
    } else if (tool === "remove") {
      setSeats(seats.filter(s => !(s.x === x && s.y === y)));
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || tool !== "add" || !selectedSection) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.floor((e.clientX - rect.left) / zoom / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / zoom / GRID_SIZE);

    const existingSeat = seats.find(s => s.x === x && s.y === y);
    if (existingSeat) return;

    const seatsInRow = seats.filter(s => s.sectionId === selectedSection && s.row === String.fromCharCode(65 + y));
    const seatNumber = seatsInRow.length + 1;
    const row = String.fromCharCode(65 + y);

    const seat: Seat = {
      tempId: `temp-seat-${Date.now()}-${Math.random()}`,
      sectionId: selectedSection,
      row,
      number: seatNumber,
      seatLabel: `${row}${seatNumber}`,
      x,
      y,
      isAccessible: false,
    };

    setSeats([...seats, seat]);
  };

  const autoArrangeSeats = () => {
    if (!selectedSection) {
      toast({
        title: "No Section Selected",
        description: "Please select a section first",
        variant: "destructive",
      });
      return;
    }

    const rows = parseInt(prompt("How many rows?") || "0");
    const seatsPerRow = parseInt(prompt("How many seats per row?") || "0");

    if (!rows || !seatsPerRow) return;

    const newSeats: Seat[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < seatsPerRow; col++) {
        const rowLetter = String.fromCharCode(65 + row);
        const seatNumber = col + 1;
        newSeats.push({
          tempId: `temp-seat-${Date.now()}-${Math.random()}-${row}-${col}`,
          sectionId: selectedSection,
          row: rowLetter,
          number: seatNumber,
          seatLabel: `${rowLetter}${seatNumber}`,
          x: col * 2,
          y: row * 2 + sections.findIndex(s => s.tempId === selectedSection) * (rows * 2 + 2),
          isAccessible: false,
        });
      }
    }

    setSeats([...seats.filter(s => s.sectionId !== selectedSection), ...newSeats]);

    toast({
      title: "Seats Arranged",
      description: `Added ${rows * seatsPerRow} seats in ${rows} rows`,
    });
  };

  const clearAllSeats = () => {
    if (confirm("Are you sure you want to remove all seats?")) {
      setSeats([]);
    }
  };

  const handleSave = async () => {
    if (sections.length === 0 || seats.length === 0) {
      toast({
        title: "Incomplete Seat Map",
        description: "Please add at least one section and one seat",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(sections, seats);
      toast({
        title: "Seat Map Saved",
        description: `Successfully saved ${seats.length} seats in ${sections.length} sections`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save seat map. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSectionData = sections.find(s => s.tempId === selectedSection);

  return (
    <div className="space-y-6" data-testid="seat-map-builder">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seat Map Builder</h2>
          <p className="text-sm text-muted-foreground">
            Design your venue layout with sections and seats
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || sections.length === 0 || seats.length === 0}
          data-testid="button-save-seat-map"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Seat Map
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Management Panel */}
        <Card className="lg:col-span-1" data-testid="card-section-panel">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Sections
              <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-section">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent data-testid="dialog-add-section">
                  <DialogHeader>
                    <DialogTitle>Add Section</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="section-name">Section Name</Label>
                      <Input
                        id="section-name"
                        value={newSection.name}
                        onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        placeholder="e.g., VIP, General, Balcony"
                        data-testid="input-section-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="section-price">Base Price (KES)</Label>
                      <Input
                        id="section-price"
                        type="number"
                        value={newSection.basePrice || ""}
                        onChange={(e) => setNewSection({ ...newSection, basePrice: parseFloat(e.target.value) })}
                        placeholder="e.g., 1500"
                        data-testid="input-section-price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="section-color">Section Color</Label>
                      <Select
                        value={newSection.color}
                        onValueChange={(color) => setNewSection({ ...newSection, color })}
                      >
                        <SelectTrigger data-testid="select-section-color">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRESET_COLORS.map((preset) => (
                            <SelectItem key={preset.color} value={preset.color}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded border"
                                  style={{ backgroundColor: preset.color }}
                                />
                                {preset.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="section-description">Description (Optional)</Label>
                      <Input
                        id="section-description"
                        value={newSection.description}
                        onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                        placeholder="e.g., Front row seats with premium view"
                        data-testid="input-section-description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={addSection} data-testid="button-confirm-add-section">
                      Add Section
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {sections.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sections yet. Click + to add one.
                  </p>
                ) : (
                  sections.map((section) => (
                    <div
                      key={section.tempId}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedSection === section.tempId
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedSection(section.tempId)}
                      data-testid={`section-item-${section.tempId}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: section.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{section.name}</p>
                            <p className="text-xs text-muted-foreground">
                              KES {section.basePrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.tempId);
                          }}
                          data-testid={`button-remove-section-${section.tempId}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {seats.filter(s => s.sectionId === section.tempId).length} seats
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Canvas Area */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Seat Layout Canvas</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={tool === "add" ? "default" : "outline"}
                  onClick={() => setTool("add")}
                  data-testid="button-tool-add"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
                <Button
                  size="sm"
                  variant={tool === "remove" ? "default" : "outline"}
                  onClick={() => setTool("remove")}
                  data-testid="button-tool-remove"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={autoArrangeSeats}
                  disabled={!selectedSection}
                  data-testid="button-auto-arrange"
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Auto Arrange
                </Button>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllSeats}
                  data-testid="button-clear-all"
                >
                  <Undo className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
            {selectedSectionData && (
              <p className="text-sm text-muted-foreground mt-2">
                Active Section: <span className="font-medium">{selectedSectionData.name}</span> •{" "}
                Tool: <span className="font-medium capitalize">{tool}</span>
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-auto bg-muted/30" style={{ height: "500px" }}>
              <div
                ref={canvasRef}
                className="relative cursor-crosshair"
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
                onClick={handleCanvasClick}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleCanvasMouseMove}
                data-testid="canvas-seat-layout"
              >
                {seats.map((seat) => {
                  const section = sections.find(s => s.tempId === seat.sectionId);
                  return (
                    <div
                      key={seat.tempId}
                      className="absolute flex items-center justify-center rounded border-2 text-xs font-semibold shadow-sm transition-transform hover:scale-110"
                      style={{
                        left: `${seat.x * GRID_SIZE}px`,
                        top: `${seat.y * GRID_SIZE}px`,
                        width: `${SEAT_SIZE}px`,
                        height: `${SEAT_SIZE}px`,
                        backgroundColor: section?.color || "#ccc",
                        borderColor: "white",
                        color: "#000",
                      }}
                      title={`${seat.seatLabel} - ${section?.name}`}
                      data-testid={`seat-${seat.tempId}`}
                    >
                      {seat.seatLabel}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  Total Seats: <strong data-testid="text-total-seats">{seats.length}</strong>
                </span>
                <span className="text-muted-foreground">
                  Sections: <strong data-testid="text-total-sections">{sections.length}</strong>
                </span>
                <span className="text-muted-foreground">
                  Zoom: <strong data-testid="text-zoom-level">{Math.round(zoom * 100)}%</strong>
                </span>
              </div>
              <div className="text-muted-foreground">
                {selectedSection ? "Click or drag on the grid to add seats" : "Select a section to begin"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
