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
import { CheckCircle, XCircle, MapPin, Clock, Calendar, Star, Database, BarChart3, Users, Phone, Building, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminCourtsManager from "./AdminCourtsManager";
import AdminAnalytics from "./AdminAnalytics";

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

interface PendingVendor {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  businessName?: string;
  businessAddress?: string;
  businessType?: string;
  businessRegistrationNumber?: string;
  yearsInBusiness?: number;
  kraPin?: string;
  nationalId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  mpesaNumber?: string;
  paymentPreference?: string;
  nationalIdDocument?: string;
  bankStatement?: string;
  businessLicense?: string;
  taxCertificate?: string;
  adminVerificationNotes?: string;
  rejectionReason?: string;
  verificationDate?: string;
  vendorVerificationStatus: string;
  createdAt: string;
}

export default function AdminInterface() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCourt, setSelectedCourt] = useState<PendingCourt | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationStep, setDeleteConfirmationStep] = useState<1 | 2>(1);
  const [courtToDelete, setCourtToDelete] = useState<string | null>(null);

  const { data: pendingCourts, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-courts"],
    retry: false,
  });

  const { data: pendingVendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/admin/pending-vendors"],
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ courtId, adminNotes }: { courtId: string; adminNotes?: string }) => {
      await apiRequest(`/api/admin/courts/${courtId}/approve`, "PUT", { adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "Court Approved",
        description: "The court has been approved and is now live.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
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
      await apiRequest(`/api/admin/courts/${courtId}/reject`, "PUT", { adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "Court Rejected",
        description: "The court submission has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
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

  const deleteMutation = useMutation({
    mutationFn: async (courtId: string) => {
      await apiRequest(`/api/admin/courts/${courtId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "Court Deleted",
        description: "The court has been permanently deleted from the system.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-courts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courts"] });
      setShowDeleteModal(false);
      setCourtToDelete(null);
      setDeleteConfirmationStep(1);
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
        description: "Failed to delete court. Please try again.",
        variant: "destructive",
      });
    },
  });

  const approveVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      await apiRequest(`/api/admin/approve-vendor/${vendorId}`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Vendor Approved",
        description: "The vendor has been approved and can now create courts.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-vendors"] });
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
        description: "Failed to approve vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      await apiRequest(`/api/admin/reject-vendor/${vendorId}`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Vendor Rejected",
        description: "The vendor application has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-vendors"] });
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
        description: "Failed to reject vendor. Please try again.",
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

  const handleDeleteCourt = (courtId: string) => {
    setCourtToDelete(courtId);
    setDeleteConfirmationStep(1);
    setShowDeleteModal(true);
  };

  const proceedToSecondConfirmation = () => {
    setDeleteConfirmationStep(2);
  };

  const confirmDelete = () => {
    if (courtToDelete) {
      deleteMutation.mutate(courtToDelete);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCourtToDelete(null);
    setDeleteConfirmationStep(1);
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">Manage vendor verification, court approvals and commission rates</p>
      </div>

      <Tabs defaultValue="vendor-approvals" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendor-approvals" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendor Approvals ({(pendingVendors as PendingVendor[])?.length || 0} pending)
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Court Approvals ({courts.length} pending)
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            All Courts & Commissions
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendor-approvals" className="mt-6">
          {vendorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading pending vendors...</p>
              </div>
            </div>
          ) : (pendingVendors as PendingVendor[])?.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                <p className="text-gray-600">No vendor applications pending approval.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {(pendingVendors as PendingVendor[])?.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden" data-testid={`card-vendor-${vendor.id}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">
                        {vendor.businessName || `${vendor.firstName} ${vendor.lastName}`}
                      </CardTitle>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Pending Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{vendor.email}</span>
                      </div>
                      {vendor.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-500" />
                          <span>{vendor.phoneNumber}</span>
                        </div>
                      )}
                      {vendor.businessAddress && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-purple-500" />
                          <span>{vendor.businessAddress}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 text-blue-700">Personal Information</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {vendor.nationalId && <p><strong>National ID:</strong> {vendor.nationalId}</p>}
                          {vendor.alternatePhoneNumber && <p><strong>Alt. Phone:</strong> {vendor.alternatePhoneNumber}</p>}
                          {vendor.emergencyContactName && <p><strong>Emergency Contact:</strong> {vendor.emergencyContactName}</p>}
                          {vendor.emergencyContactPhone && <p><strong>Emergency Phone:</strong> {vendor.emergencyContactPhone}</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-green-700">Business Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {vendor.businessType && <p><strong>Business Type:</strong> {vendor.businessType}</p>}
                          {vendor.businessRegistrationNumber && <p><strong>Reg. Number:</strong> {vendor.businessRegistrationNumber}</p>}
                          {vendor.yearsInBusiness !== undefined && <p><strong>Years in Business:</strong> {vendor.yearsInBusiness}</p>}
                          {vendor.kraPin && <p><strong>KRA PIN:</strong> {vendor.kraPin}</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-purple-700">Banking Details</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          {vendor.paymentPreference && <p><strong>Payment Method:</strong> {vendor.paymentPreference.toUpperCase()}</p>}
                          {vendor.bankName && <p><strong>Bank:</strong> {vendor.bankName}</p>}
                          {vendor.bankAccountName && <p><strong>Account Name:</strong> {vendor.bankAccountName}</p>}
                          {vendor.bankAccountNumber && <p><strong>Account Number:</strong> {vendor.bankAccountNumber}</p>}
                          {vendor.mpesaNumber && <p><strong>M-Pesa:</strong> {vendor.mpesaNumber}</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-orange-700">Required Documents</h4>
                        <div className="text-sm space-y-2">
                          {vendor.nationalIdDocument && (
                            <a 
                              href={vendor.nationalIdDocument} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                              data-testid={`link-national-id-${vendor.id}`}
                            >
                              <FileText className="h-4 w-4" />
                              National ID
                            </a>
                          )}
                          {vendor.businessLicense && (
                            <a 
                              href={vendor.businessLicense} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                              data-testid={`link-business-license-${vendor.id}`}
                            >
                              <FileText className="h-4 w-4" />
                              Business License
                            </a>
                          )}
                          {vendor.taxCertificate && (
                            <a 
                              href={vendor.taxCertificate} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                              data-testid={`link-tax-certificate-${vendor.id}`}
                            >
                              <FileText className="h-4 w-4" />
                              Tax Certificate
                            </a>
                          )}
                          {vendor.bankStatement && (
                            <a 
                              href={vendor.bankStatement} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                              data-testid={`link-bank-statement-${vendor.id}`}
                            >
                              <FileText className="h-4 w-4" />
                              Bank Statement
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4 border-t">
                      <Button
                        onClick={() => approveVendorMutation.mutate(vendor.id)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        disabled={approveVendorMutation.isPending || rejectVendorMutation.isPending}
                        data-testid={`button-approve-vendor-${vendor.id}`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Vendor
                      </Button>
                      <Button
                        onClick={() => rejectVendorMutation.mutate(vendor.id)}
                        variant="destructive"
                        className="flex items-center gap-2"
                        disabled={approveVendorMutation.isPending || rejectVendorMutation.isPending}
                        data-testid={`button-reject-vendor-${vendor.id}`}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Vendor
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
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
        </TabsContent>

        <TabsContent value="management" className="mt-6">
          <AdminCourtsManager />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AdminAnalytics />
        </TabsContent>
      </Tabs>

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