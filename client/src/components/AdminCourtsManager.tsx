import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, DollarSign, Users, Calendar, Percent, Edit3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CourtData {
  id: string;
  name: string;
  city: string;
  area: string;
  description?: string;
  hourlyRate: string;
  peakHourRate?: string;
  availableSports: string[];
  approvalStatus: "pending" | "approved" | "rejected";
  commissionRate: string;
  totalBookings: number;
  rating: string;
  isActive: boolean;
  vendorId: string;
  vendor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminCourtsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionValues, setCommissionValues] = useState<{ [key: string]: string }>({});
  
  const { data: courts, isLoading } = useQuery<CourtData[]>({
    queryKey: ["/api/admin/courts/all"],
    retry: false,
  });

  const commissionMutation = useMutation({
    mutationFn: async ({ courtId, commissionRate }: { courtId: string; commissionRate: number }) => {
      return apiRequest(`/api/admin/courts/${courtId}/commission`, "PUT", { commissionRate });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Commission rate updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courts/all"] });
      setEditingCommission(null);
      setCommissionValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission rate",
        variant: "destructive",
      });
    },
  });

  const handleCommissionUpdate = (courtId: string) => {
    const rate = parseFloat(commissionValues[courtId] || "0");
    if (rate < 0 || rate > 100) {
      toast({
        title: "Invalid Rate",
        description: "Commission rate must be between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    commissionMutation.mutate({ courtId, commissionRate: rate });
  };

  const handleEditCommission = (courtId: string, currentRate: string) => {
    setEditingCommission(courtId);
    setCommissionValues({ ...commissionValues, [courtId]: currentRate });
  };

  const handleCancelEdit = () => {
    setEditingCommission(null);
    setCommissionValues({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading court data...</p>
        </div>
      </div>
    );
  }

  if (!courts || courts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CardContent>
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Courts Found</h3>
          <p className="text-gray-600">No court data is available in the system.</p>
        </CardContent>
      </Card>
    );
  }

  const approvedCourts = courts.filter(court => court.approvalStatus === "approved");
  const pendingCourts = courts.filter(court => court.approvalStatus === "pending");
  const rejectedCourts = courts.filter(court => court.approvalStatus === "rejected");

  const formatCurrency = (amount: string) => `KES ${parseFloat(amount).toLocaleString()}`;
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderCourtCard = (court: CourtData) => (
    <Card key={court.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold">{court.name}</CardTitle>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <MapPin className="h-4 w-4" />
              <span>{court.city}, {court.area}</span>
            </div>
          </div>
          <Badge className={getStatusColor(court.approvalStatus)}>
            {court.approvalStatus.charAt(0).toUpperCase() + court.approvalStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              <strong>Rate:</strong> {formatCurrency(court.hourlyRate)}/hr
              {court.peakHourRate && (
                <span className="text-gray-500"> (Peak: {formatCurrency(court.peakHourRate)})</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm"><strong>Bookings:</strong> {court.totalBookings}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm">
              <strong>Vendor:</strong> {court.vendor?.firstName || court.vendor?.email || 'Unknown'}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Sports:</strong> {court.availableSports.join(", ")}
          </div>
          {court.description && (
            <div className="text-sm text-gray-600">
              <strong>Description:</strong> {court.description}
            </div>
          )}
        </div>

        {/* Commission Rate Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold">Commission Rate:</span>
            </div>
            
            {editingCommission === court.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={commissionValues[court.id] || ""}
                  onChange={(e) => setCommissionValues({ 
                    ...commissionValues, 
                    [court.id]: e.target.value 
                  })}
                  className="w-20 h-8"
                  placeholder="0.00"
                  data-testid={`input-commission-${court.id}`}
                />
                <span className="text-sm">%</span>
                <Button
                  size="sm"
                  onClick={() => handleCommissionUpdate(court.id)}
                  disabled={commissionMutation.isPending}
                  data-testid={`button-save-commission-${court.id}`}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  data-testid={`button-cancel-commission-${court.id}`}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-600">
                  {parseFloat(court.commissionRate || "0").toFixed(2)}%
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditCommission(court.id, court.commissionRate || "0")}
                  data-testid={`button-edit-commission-${court.id}`}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4 grid grid-cols-2 gap-4">
          <span><strong>Court ID:</strong> {court.id}</span>
          <span><strong>Created:</strong> {new Date(court.createdAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Court Management</h2>
        <div className="flex gap-2">
          <Badge variant="outline">{courts.length} Total Courts</Badge>
          <Badge className="bg-green-100 text-green-800">{approvedCourts.length} Approved</Badge>
          <Badge className="bg-yellow-100 text-yellow-800">{pendingCourts.length} Pending</Badge>
          <Badge className="bg-red-100 text-red-800">{rejectedCourts.length} Rejected</Badge>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Courts ({courts.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCourts.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCourts.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCourts.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {courts.map(renderCourtCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-6">
          <div className="space-y-4">
            {approvedCourts.map(renderCourtCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {pendingCourts.map(renderCourtCard)}
          </div>
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-6">
          <div className="space-y-4">
            {rejectedCourts.map(renderCourtCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}