import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorOnboardingSchema, type VendorOnboarding } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  Scale,
  FileCheck,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VendorOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  existingData?: any;
  isEditing?: boolean;
}

type OnboardingStep = "basic" | "company" | "legal" | "documents" | "complete";

const STEPS: Array<{
  id: OnboardingStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  number: number;
}> = [
  {
    id: "basic",
    title: "Basic Details",
    subtitle: "Your personal information",
    icon: User,
    number: 1,
  },
  {
    id: "company",
    title: "Company Details",
    subtitle: "Your business information",
    icon: Building,
    number: 2,
  },
  {
    id: "legal",
    title: "Legal Details",
    subtitle: "Compliance and payment info",
    icon: Scale,
    number: 3,
  },
  {
    id: "documents",
    title: "Document Upload",
    subtitle: "Upload verification documents",
    icon: FileCheck,
    number: 4,
  },
];

export default function VendorOnboarding({ isOpen, onClose, existingData, isEditing = false }: VendorOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("basic");
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: string}>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const form = useForm<VendorOnboarding>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      phoneNumber: existingData?.phoneNumber || "",
      alternatePhoneNumber: existingData?.alternatePhoneNumber || "",
      businessName: existingData?.businessName || "",
      businessAddress: existingData?.businessAddress || "",
      businessType: existingData?.businessType || "Individual",
      businessRegistrationNumber: existingData?.businessRegistrationNumber || "",
      yearsInBusiness: existingData?.yearsInBusiness || 0,
      kraPin: existingData?.kraPin || "",
      bankName: existingData?.bankName || "",
      bankAccountNumber: existingData?.bankAccountNumber || "",
      bankAccountName: existingData?.bankAccountName || "",
      mpesaNumber: existingData?.mpesaNumber || "",
      paymentPreference: existingData?.paymentPreference || "mpesa",
      businessLicense: existingData?.businessLicense || "",
      taxCertificate: existingData?.taxCertificate || "",
    },
  });

  // Load existing data if editing
  useEffect(() => {
    if (existingData) {
      Object.keys(existingData).forEach((key) => {
        if (existingData[key] !== undefined && existingData[key] !== null) {
          form.setValue(key as keyof VendorOnboarding, existingData[key]);
        }
      });
      // Set uploaded docs for existing documents
      const docs: {[key: string]: string} = {};
      if (existingData.businessLicense) docs.businessLicense = existingData.businessLicense;
      if (existingData.taxCertificate) docs.taxCertificate = existingData.taxCertificate;
      setUploadedDocs(docs);
      
      // When editing, mark all steps as completed so user can navigate freely
      if (isEditing) {
        setCompletedSteps(["basic", "company", "legal", "documents"]);
      }
    }
  }, [existingData, form, isEditing]);

  const mutation = useMutation({
    mutationFn: async (data: VendorOnboarding) => {
      const endpoint = isEditing ? "/api/vendor/update" : "/api/vendor/onboard";
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete vendor onboarding");
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep("complete");
      toast({
        title: isEditing ? "Application Updated!" : "Application Submitted!",
        description: isEditing 
          ? "Your vendor application has been updated successfully."
          : "Your vendor application is under review. You'll be notified on your registered email once approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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

  // Document upload function
  const uploadDocument = async (file: File, documentType: string) => {
    setUploadingDoc(documentType);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("https://fireflies-production-ba72.up.railway.app/api/vendor/upload-document", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.text();
        console.error('Failed to upload document:', errorData);
        throw new Error("Failed to upload document");
      }

      const { documentUrl } = await uploadResponse.json();

      setUploadedDocs(prev => ({
        ...prev,
        [documentType]: documentUrl
      }));

      form.setValue(documentType as keyof VendorOnboarding, documentUrl);

      toast({
        title: "Document Uploaded",
        description: `${documentType.replace(/([A-Z])/g, ' $1').trim()} uploaded successfully!`,
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: "Upload Failed",
        description: (error as Error).message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  const getCurrentStepIndex = () => {
    if (currentStep === "complete") return STEPS.length; // Handle completion state
    return STEPS.findIndex(step => step.id === currentStep);
  };

  const getProgressPercentage = () => {
    if (currentStep === "complete") return 100; // Full progress on completion
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / STEPS.length) * 100;
  };

  // Strict validation for each step
  const validateStep = async (stepId: OnboardingStep): Promise<boolean> => {
    const values = form.getValues();
    
    switch (stepId) {
      case "basic":
        // Required: phone number
        if (!values.phoneNumber || values.phoneNumber.trim() === "") {
          form.setError("phoneNumber", { message: "Phone number is required" });
          return false;
        }
        // Basic phone validation
        if (!/^(\+254|0)?[17]\d{8}$/.test(values.phoneNumber.replace(/\s/g, ''))) {
          form.setError("phoneNumber", { message: "Enter a valid Kenyan phone number" });
          return false;
        }
        return true;

      case "company":
        // Required: business name, address, type
        if (!values.businessName || values.businessName.trim() === "") {
          form.setError("businessName", { message: "Business name is required" });
          return false;
        }
        if (!values.businessAddress || values.businessAddress.trim() === "") {
          form.setError("businessAddress", { message: "Business address is required" });
          return false;
        }
        if (!values.businessType) {
          form.setError("businessType", { message: "Business type is required" });
          return false;
        }
        return true;

      case "legal":
        // Required: KRA PIN or M-Pesa/Bank details based on preference
        if (!values.kraPin || values.kraPin.trim() === "") {
          form.setError("kraPin", { message: "KRA PIN is required for tax compliance" });
          return false;
        }
        if (!values.paymentPreference) {
          toast({
            title: "Payment Preference Required",
            description: "Please select how you'd like to receive payments",
            variant: "destructive",
          });
          return false;
        }
        if (values.paymentPreference === "mpesa" || values.paymentPreference === "both") {
          if (!values.mpesaNumber || values.mpesaNumber.trim() === "") {
            form.setError("mpesaNumber", { message: "M-Pesa number is required" });
            return false;
          }
        }
        if (values.paymentPreference === "bank" || values.paymentPreference === "both") {
          if (!values.bankName || values.bankName.trim() === "") {
            form.setError("bankName", { message: "Bank name is required" });
            return false;
          }
          if (!values.bankAccountNumber || values.bankAccountNumber.trim() === "") {
            form.setError("bankAccountNumber", { message: "Account number is required" });
            return false;
          }
          if (!values.bankAccountName || values.bankAccountName.trim() === "") {
            form.setError("bankAccountName", { message: "Account name is required" });
            return false;
          }
        }
        return true;

      case "documents":
        // At least one document required
        if (Object.keys(uploadedDocs).length === 0) {
          toast({
            title: "Document Required",
            description: "Please upload at least one verification document",
            variant: "destructive",
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = async () => {
    // Clear previous errors
    form.clearErrors();
    
    const currentIndex = getCurrentStepIndex();
    const currentStepId = STEPS[currentIndex].id;
    
    // Validate current step strictly
    const isValid = await validateStep(currentStepId);
    
    if (!isValid) {
      toast({
        title: "Please Complete All Required Fields",
        description: "Fill in all required information before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    // Mark as completed and move to next
    setCompletedSteps(prev => [...prev.filter(s => s !== currentStepId), currentStepId]);
    
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleDocumentUpload = (documentType: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await uploadDocument(file, documentType);
      }
    };
    input.click();
  };

  const onSubmit = async (data: VendorOnboarding) => {

    const formDataWithDocs = {
      ...data,
      ...uploadedDocs
    };
    
    mutation.mutate(formDataWithDocs);
  };

  const renderStepIndicators = () => (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const Icon = step.icon;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isCompleted 
                  ? "bg-green-500 text-white" 
                  : isCurrent 
                  ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : step.number}
              </div>
              <span className={`text-xs mt-2 text-center max-w-[80px] ${
                isCurrent ? "text-blue-600 font-medium" : "text-gray-500"
              }`}>
                {step.title}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`w-16 h-1 mx-2 ${
                completedSteps.includes(step.id) ? "bg-green-500" : "bg-gray-200"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case "basic":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Step 1: Basic Details</h2>
                <p className="text-gray-600 text-sm">Your personal contact information</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  All fields marked with <span className="text-red-500">*</span> are required. You cannot proceed until all required fields are filled.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="+254 712 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="alternatePhoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+254 712 345 678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </motion.div>
        );

      case "company":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Step 2: Company Details</h2>
                <p className="text-gray-600 text-sm">Your business information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Your sports facility name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual">Individual/Sole Proprietor</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Company">Limited Company</SelectItem>
                        <SelectItem value="LLC">LLC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="businessAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Full address of your business location" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessRegistrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Company registration number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsInBusiness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Business</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>
        );

      case "legal":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Scale className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Step 3: Legal & Payment Details</h2>
                <p className="text-gray-600 text-sm">Compliance and payment information</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="kraPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA PIN <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your KRA PIN" {...field} />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">Kenya Revenue Authority PIN for tax compliance</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Payment Preferences <span className="text-red-500">*</span></h3>
              
              <FormField
                control={form.control}
                name="paymentPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How would you like to receive payments?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa Only</SelectItem>
                        <SelectItem value="bank">Bank Transfer Only</SelectItem>
                        <SelectItem value="both">Both M-Pesa and Bank</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(paymentPreference === "mpesa" || paymentPreference === "both") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 bg-green-50 p-4 rounded-lg"
              >
                <h4 className="font-medium text-green-800">M-Pesa Details</h4>
                <FormField
                  control={form.control}
                  name="mpesaNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M-Pesa Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="+254 712 345 678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}

            {(paymentPreference === "bank" || paymentPreference === "both") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4 bg-blue-50 p-4 rounded-lg"
              >
                <h4 className="font-medium text-blue-800">Bank Details</h4>
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., KCB, Equity Bank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Bank account number" {...field} />
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
                        <FormLabel>Account Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Account holder name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </motion.div>
        );

      case "documents":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Step 4: Document Upload</h2>
                <p className="text-gray-600 text-sm">Upload verification documents</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  Please upload at least one document. Accepted formats: PDF, JPG, PNG
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "businessLicense", label: "Business License", required: false },
                { key: "taxCertificate", label: "Tax Certificate (KRA)", required: false },
              ].map((doc) => (
                <div 
                  key={doc.key}
                  className={`border-2 border-dashed rounded-lg p-4 transition-all ${
                    uploadedDocs[doc.key] 
                      ? "border-green-400 bg-green-50" 
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {doc.label} {doc.required && <span className="text-red-500">*</span>}
                    </span>
                    {uploadedDocs[doc.key] && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  
                  {uploadedDocs[doc.key] ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-700">Document uploaded</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentUpload(doc.key)}
                      >
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDocumentUpload(doc.key)}
                      disabled={uploadingDoc === doc.key}
                    >
                      {uploadingDoc === doc.key ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Uploaded: {Object.keys(uploadedDocs).length}</strong> document(s)</p>
            </div>
          </motion.div>
        );

      case "complete":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {isEditing ? "Application Updated!" : "Thank You!"}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isEditing 
                ? "Your vendor application has been updated. Our team will review the changes."
                : "Your vendor application has been submitted successfully. You will be notified of your vendor status on your registered email soon."}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6">
              <p className="text-sm text-blue-800">
                <strong>What happens next?</strong><br />
                Our admin team will review your application. Once approved, you'll receive an email and can start adding your sports courts to the platform.
              </p>
            </div>
            <Button onClick={onClose} size="lg">
              Close
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEditing ? "Edit Vendor Application" : "Become a Vendor"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {currentStep !== "complete" && (
            <>
              {renderStepIndicators()}
              <Progress value={getProgressPercentage()} className="mb-6" />
            </>
          )}

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                }
              }}
              className="space-y-6"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              {currentStep !== "complete" && (
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === "basic"}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {currentStep === "documents" ? (
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={mutation.isPending}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    
                      {mutation.isPending ? "Submitting..." : (isEditing ? "Update Application" : "Submit Application")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2"
                    >
                      Next
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
