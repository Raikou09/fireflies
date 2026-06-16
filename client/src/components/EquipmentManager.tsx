import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Equipment } from "@shared/schema";

interface EquipmentManagerProps {
  courtId: string;
  courtName: string;
}

export default function EquipmentManager({ courtId, courtName }: EquipmentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: "",
    description: "",
    category: "",
    pricePerHour: "",
    pricePerDay: "",
    quantityAvailable: 1,
    imageUrl: "",
  });

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: [`/api/courts/${courtId}/equipment`],
    refetchInterval: false,
    refetchOnMount: true,
    staleTime: 0,
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/equipment", "POST", {
        ...data,
        courtId,
        pricePerHour: parseFloat(data.pricePerHour),
        pricePerDay: data.pricePerDay ? parseFloat(data.pricePerDay) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courts/${courtId}/equipment`] });
      setIsAddModalOpen(false);
      resetForm();
      toast({ title: "Equipment Added", description: "New equipment has been added successfully." });
    },
    onError: (error: any) => {
      console.error('Equipment add error:', error);
      toast({ title: "Error", description: error.message || "Failed to add equipment.", variant: "destructive" });
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/equipment/${editingEquipment?.id}`, "PUT", {
        ...data,
        courtId,
        pricePerHour: parseFloat(data.pricePerHour),
        pricePerDay: data.pricePerDay ? parseFloat(data.pricePerDay) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courts/${courtId}/equipment`] });
      setEditingEquipment(null);
      resetForm();
      toast({ title: "Equipment Updated", description: "Equipment has been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update equipment.", variant: "destructive" });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      return apiRequest(`/api/equipment/${equipmentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courts/${courtId}/equipment`] });
      toast({ title: "Equipment Deleted", description: "Equipment has been deleted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete equipment.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setEquipmentForm({
      name: "",
      description: "",
      category: "",
      pricePerHour: "",
      pricePerDay: "",
      quantityAvailable: 1,
      imageUrl: "",
    });
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setEquipmentForm({
      name: item.name,
      description: item.description || "",
      category: item.category,
      pricePerHour: item.pricePerHour.toString(),
      pricePerDay: item.pricePerDay?.toString() || "",
      quantityAvailable: item.quantityAvailable || 1,
      imageUrl: item.imageUrl || "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquipment) {
      updateEquipmentMutation.mutate(equipmentForm);
    } else {
      createEquipmentMutation.mutate(equipmentForm);
    }
  };

  const equipmentCategories = [
    "balls",
    "rackets",
    "protective_gear",
    "nets",
    "shoes",
    "clothing",
    "accessories",
    "other"
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "balls": return "🏀";
      case "rackets": return "🏸";
      case "protective_gear": return "🦺";
      case "nets": return "🥅";
      case "shoes": return "👟";
      case "clothing": return "👕";
      default: return "📦";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-500 mt-2">Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Equipment for {courtName}</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-green-700" data-testid="add-equipment-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Equipment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Equipment Name</Label>
                <Input
                  id="name"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  placeholder="e.g., Basketball, Tennis Racket"
                  required
                  data-testid="input-equipment-name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={equipmentForm.category}
                  onValueChange={(value) => setEquipmentForm({ ...equipmentForm, category: value })}
                >
                  <SelectTrigger data-testid="select-equipment-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryIcon(cat)} {cat.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={equipmentForm.description}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                  placeholder="Optional description"
                  data-testid="input-equipment-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pricePerHour">Price per Hour (KES)</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    step="0.01"
                    value={equipmentForm.pricePerHour}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, pricePerHour: e.target.value })}
                    required
                    data-testid="input-price-hour"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerDay">Price per Day (KES)</Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    step="0.01"
                    value={equipmentForm.pricePerDay}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, pricePerDay: e.target.value })}
                    placeholder="Optional"
                    data-testid="input-price-day"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity Available</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={equipmentForm.quantityAvailable}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, quantityAvailable: parseInt(e.target.value) })}
                  required
                  data-testid="input-quantity"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={equipmentForm.imageUrl}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-image-url"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createEquipmentMutation.isPending}
                  data-testid="button-submit-equipment"
                >
                  {createEquipmentMutation.isPending ? "Adding..." : "Add Equipment"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                  data-testid="button-cancel-equipment"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {equipment.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment yet</h3>
            <p className="text-gray-600 mb-6">
              Add sports equipment that customers can rent with their court bookings.
            </p>
            <Button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary hover:bg-green-700"
              data-testid="add-first-equipment"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <Card key={item.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(item.category)}</span>
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {item.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Badge className={item.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Per Hour:</span>
                    <span className="font-medium">KES {item.pricePerHour}</span>
                  </div>
                  {item.pricePerDay && (
                    <div className="flex justify-between text-sm">
                      <span>Per Day:</span>
                      <span className="font-medium">KES {item.pricePerDay}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Quantity:</span>
                    <span className="font-medium">{item.quantityAvailable}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(item)}
                    data-testid={`edit-equipment-${item.id}`}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deleteEquipmentMutation.mutate(item.id)}
                    disabled={deleteEquipmentMutation.isPending}
                    data-testid={`delete-equipment-${item.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Equipment Dialog */}
      <Dialog open={!!editingEquipment} onOpenChange={() => setEditingEquipment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Equipment Name</Label>
              <Input
                id="edit-name"
                value={equipmentForm.name}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                required
                data-testid="edit-input-name"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={equipmentForm.category}
                onValueChange={(value) => setEquipmentForm({ ...equipmentForm, category: value })}
              >
                <SelectTrigger data-testid="edit-select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {equipmentCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {getCategoryIcon(cat)} {cat.replace('_', ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={equipmentForm.description}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                data-testid="edit-input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-pricePerHour">Price per Hour (KES)</Label>
                <Input
                  id="edit-pricePerHour"
                  type="number"
                  step="0.01"
                  value={equipmentForm.pricePerHour}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, pricePerHour: e.target.value })}
                  required
                  data-testid="edit-input-price-hour"
                />
              </div>
              <div>
                <Label htmlFor="edit-pricePerDay">Price per Day (KES)</Label>
                <Input
                  id="edit-pricePerDay"
                  type="number"
                  step="0.01"
                  value={equipmentForm.pricePerDay}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, pricePerDay: e.target.value })}
                  data-testid="edit-input-price-day"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-quantity">Quantity Available</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={equipmentForm.quantityAvailable}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, quantityAvailable: parseInt(e.target.value) })}
                required
                data-testid="edit-input-quantity"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={updateEquipmentMutation.isPending}
                data-testid="button-update-equipment"
              >
                {updateEquipmentMutation.isPending ? "Updating..." : "Update Equipment"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditingEquipment(null)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}