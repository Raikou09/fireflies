import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Package } from "lucide-react";
import type { Equipment } from "@shared/schema";

interface EquipmentRentalModalProps {
  isOpen: boolean;
  onClose: () => void;
  courtId: string;
  onEquipmentSelected: (selectedEquipment: Array<{equipmentId: string, quantity: number, pricePerHour: number, name: string}>) => void;
}

export default function EquipmentRentalModal({ 
  isOpen, 
  onClose, 
  courtId,
  onEquipmentSelected 
}: EquipmentRentalModalProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({});

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: [`/api/courts/${courtId}/equipment/available`],
    enabled: isOpen && !!courtId,
    refetchInterval: false,
  });

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

  const updateQuantity = (equipmentId: string, change: number) => {
    setSelectedEquipment(prev => {
      const current = prev[equipmentId] || 0;
      const newQuantity = Math.max(0, current + change);
      
      if (newQuantity === 0) {
        const { [equipmentId]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [equipmentId]: newQuantity };
    });
  };

  const handleConfirm = () => {
    const selectedItems = Object.entries(selectedEquipment).map(([equipmentId, quantity]) => {
      const item = equipment.find(e => e.id === equipmentId);
      return {
        equipmentId,
        quantity,
        pricePerHour: parseFloat(item?.pricePerHour || "0"),
        name: item?.name || ""
      };
    });
    
    onEquipmentSelected(selectedItems);
    onClose();
  };

  const getTotalCost = () => {
    return Object.entries(selectedEquipment).reduce((total, [equipmentId, quantity]) => {
      const item = equipment.find(e => e.id === equipmentId);
      return total + (parseFloat(item?.pricePerHour || "0") * quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(selectedEquipment).reduce((sum, qty) => sum + qty, 0);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Available Equipment</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading equipment...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Rent Equipment</DialogTitle>
          <p className="text-sm text-gray-600">
            Select equipment to include with your court booking
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {equipment.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No equipment available</h3>
              <p className="text-gray-600">
                This court doesn't have any equipment available for rental.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map((item) => (
                <Card key={item.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getCategoryIcon(item.category)}</span>
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {item.category.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1 ml-4">
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-primary">
                              KES {item.pricePerHour}/hour
                            </span>
                            {item.pricePerDay && (
                              <span className="text-gray-600">
                                KES {item.pricePerDay}/day
                              </span>
                            )}
                            <span className="text-gray-500">
                              {item.quantityAvailable} available
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, -1)}
                          disabled={!selectedEquipment[item.id]}
                          data-testid={`decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                          {selectedEquipment[item.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, 1)}
                          disabled={(selectedEquipment[item.id] || 0) >= (item.quantityAvailable || 1)}
                          data-testid={`increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        {getTotalItems() > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} selected
                </p>
                <p className="text-lg font-semibold text-primary">
                  Total: KES {getTotalCost().toFixed(2)}/hour
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1"
            data-testid="button-cancel-equipment"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-green-700"
            disabled={getTotalItems() === 0}
            data-testid="button-confirm-equipment"
          >
            Add to Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}