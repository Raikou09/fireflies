import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorOnboardingSchema, type VendorOnboarding } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Upload, FileText, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VendorOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VendorOnboardingModal({ isOpen, onClose }: VendorOnboardingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: string}>({});

  const form = useForm<VendorOnboarding>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      phoneNumber: "",
      businessName: "",
      businessAddress: "",
      kraPin: "",
      nationalId: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      mpesaNumber: "",
      paymentPreference: "bank",
      nationalIdDocument: "",
      bankStatement: "",
      businessLicense: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: VendorOnboarding) => {
      const response = await fetch("/api/vendor/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Include cookies for authentication
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete vendor onboarding");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vendor Application Submitted",
        description: "Your vendor application is under review. You'll be notified once approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit vendor application",
        variant: "destructive",
      });
    },
  });

  const paymentPreference = form.watch("paymentPreference");

  // Document upload function using new vendor endpoint
  const uploadDocument = async (file: File, documentType: string) => {
    try {
      console.log('Starting document upload for:', documentType, 'File:', file.name);
      
      // Get upload parameters from the vendor-specific endpoint
      const uploadResponse = await fetch("/api/vendor/upload-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }),
        credentials: "include",
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error('Failed to get upload URL:', errorData);
        throw new Error("Failed to get upload URL");
      }
      
      const { uploadURL, documentUrl } = await uploadResponse.json();
      console.log('Got upload URL:', uploadURL);
      console.log('Document will be served at:', documentUrl);
      
      // Upload the file directly to cloud storage
      const fileUploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!fileUploadResponse.ok) {
        throw new Error("Failed to upload file to storage");
      }
      
      console.log('Document uploaded successfully, URL:', documentUrl);
      
      // Update form and state
      form.setValue(documentType as keyof VendorOnboarding, documentUrl);
      setUploadedDocs(prev => ({ ...prev, [documentType]: file.name }));
      
      toast({
        title: "Document Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const DocumentUpload = ({ 
    documentType, 
    label, 
    required = false,
    description 
  }: { 
    documentType: string; 
    label: string; 
    required?: boolean;
    description: string;
  }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </FormLabel>
          {uploadedDocs[documentType] && (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Uploaded
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500">{description}</p>
        
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => {
            console.log('Upload area clicked for:', documentType);
            fileInputRef.current?.click();
          }}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          ) : uploadedDocs[documentType] ? (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{uploadedDocs[documentType]}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Upload className="h-4 w-4" />
              <span className="text-sm">Click to upload {label.toLowerCase()}</span>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                  title: "File Too Large",
                  description: "Please select a file smaller than 5MB.",
                  variant: "destructive",
                });
                return;
              }
              setIsUploading(true);
              await uploadDocument(file, documentType);
              setIsUploading(false);
            }
          }}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vendor Registration</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+254 712 345 678" 
                          {...field} 
                          data-testid="input-phone-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="12345678" 
                          {...field} 
                          data-testid="input-national-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kraPin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>KRA PIN</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="A012345678Z" 
                          {...field} 
                          data-testid="input-kra-pin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Sports Arena Ltd" 
                          {...field} 
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Full business address including city" 
                          {...field} 
                          data-testid="textarea-business-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-payment-preference">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="both">Both Bank & M-Pesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(paymentPreference === "bank" || paymentPreference === "both") && (
                  <>
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., KCB Bank" 
                              {...field} 
                              data-testid="input-bank-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1234567890" 
                              {...field} 
                              data-testid="input-bank-account-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Name as appears on bank account" 
                              {...field} 
                              data-testid="input-bank-account-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {(paymentPreference === "mpesa" || paymentPreference === "both") && (
                  <FormField
                    control={form.control}
                    name="mpesaNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>M-Pesa Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+254 712 345 678" 
                            {...field} 
                            data-testid="input-mpesa-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Document Verification Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Document Verification</CardTitle>
                <p className="text-sm text-gray-600">Upload the required documents for verification. All documents must be clear and readable.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <DocumentUpload
                  documentType="nationalIdDocument"
                  label="National ID"
                  required={true}
                  description="Upload a clear photo or scan of your National ID (both sides if needed). Accepted formats: PDF, JPG, PNG (Max 5MB)"
                />
                
                {(paymentPreference === "bank" || paymentPreference === "both") && (
                  <DocumentUpload
                    documentType="bankStatement"
                    label="Bank Statement"
                    required={true}
                    description="Upload a recent bank statement (not older than 3 months) showing your account details. Required after completing bank details above. Accepted formats: PDF, JPG, PNG (Max 5MB)"
                  />
                )}
                
                <DocumentUpload
                  documentType="businessLicense"
                  label="Business License"
                  required={false}
                  description="Upload your business registration certificate or trading license (optional but recommended). Accepted formats: PDF, JPG, PNG (Max 5MB)"
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                data-testid="button-submit-vendor-application"
              >
                {mutation.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}