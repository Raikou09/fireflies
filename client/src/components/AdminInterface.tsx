import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, XCircle, MapPin, Clock, Calendar, Star } from "lucide-react";

interface PendingCourt {
  id: string;
  name: string;
  sport: string;
  city: string;
  area: string;
  description?: string;
  hourlyRate: string;
  peakHourRate?: string;
  openingTime: string;
  closingTime: string;
  availableDays: string[];
  imageUrl?: string;
  rules?: string;
  vendor: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
}

export default function AdminInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourt, setSelectedCourt] = useState<PendingCourt | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);

  const { data: pendingCourts, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-courts"],
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ courtId, adminNotes }: { courtId: string; adminNotes?: string }) => {
      await apiRequest("PUT", `/api/admin/courts/${courtId}/approve`, { adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "Court Approved",
        description: "The court has been approved and is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-courts"] });
      setShowApprovalModal(false);
      setSelectedCourt(null);
      setAdminNotes("");
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
        description: "Failed to approve court. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ courtId, adminNotes }: { courtId: string; adminNotes?: string }) => {
      await apiRequest("PUT", `/api/admin/courts/${courtId}/reject`, { adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "Court Rejected",
        description: "The court submission has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-courts"] });
      setShowApprovalModal(false);
      setSelectedCourt(null);
      setAdminNotes("");
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
        description: "Failed to reject court. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApproval = (court: PendingCourt, action: "approve" | "reject") => {
    setSelectedCourt(court);
    setApprovalAction(action);
    setShowApprovalModal(true);
  };

  const confirmAction = () => {
    if (!selectedCourt || !approvalAction) return;

    if (approvalAction === "approve") {
      approveMutation.mutate({ courtId: selectedCourt.id, adminNotes });
    } else {
      rejectMutation.mutate({ courtId: selectedCourt.id, adminNotes });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Court Approval Dashboard</h2>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading pending courts...</p>
          </div>
        </div>
      </div>
    );
  }

  const courts = (pendingCourts as PendingCourt[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Court Approval Dashboard</h2>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {courts.length} Pending
        </Badge>
      </div>

      {courts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600">No court submissions pending approval.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {courts.map((court) => (
            <Card key={court.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{court.name}</CardTitle>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Pending Review
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{court.sport}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <span>{court.city}, {court.area}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-500" />
                    <span>{court.openingTime} - {court.closingTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span>{court.availableDays.length} days/week</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Pricing</h4>
                    <p className="text-sm text-gray-600">
                      Regular: KES {court.hourlyRate}/hour
                      {court.peakHourRate && ` • Peak: KES ${court.peakHourRate}/hour`}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Vendor</h4>
                    <p className="text-sm text-gray-600">
                      {court.vendor.firstName} {court.vendor.lastName}
                      <br />
                      {court.vendor.email}
                    </p>
                  </div>
                </div>

                {court.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{court.description}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Available Days</h4>
                  <div className="flex flex-wrap gap-2">
                    {court.availableDays.map((day) => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {day}
                      </Badge>
                    ))}
                  </div>
                </div>

                {court.rules && (
                  <div>
                    <h4 className="font-medium mb-2">Court Rules</h4>
                    <p className="text-sm text-gray-600">{court.rules}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApproval(court, "approve")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleApproval(court, "reject")}
                    variant="destructive"
                    className="flex items-center gap-2"
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval/Rejection Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve" : "Reject"} Court
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {approvalAction === "approve" 
                ? "This court will be approved and made available for booking." 
                : "This court submission will be rejected and the vendor will be notified."
              }
            </p>
            <div>
              <Label>Admin Notes (Optional)</Label>
              <Textarea
                placeholder={
                  approvalAction === "approve"
                    ? "Add any notes for the vendor about the approval..."
                    : "Explain why the court is being rejected..."
                }
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={confirmAction}
                variant={approvalAction === "approve" ? "default" : "destructive"}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {(approveMutation.isPending || rejectMutation.isPending) ? "Processing..." : "Confirm"}
              </Button>
              <Button
                onClick={() => setShowApprovalModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}