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
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  User,
  Building,
  CreditCard,
  FileCheck,
  Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface VendorOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

type OnboardingStep = "welcome" | "personal" | "business" | "payment" | "documents" | "complete";

const STEPS: Array<{
  id: OnboardingStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
}> = [
  {
    id: "welcome",
    title: "Welcome to SportsBox!",
    subtitle: "Let's get you started on your vendor journey",
    icon: Rocket,
  },
  {
    id: "personal",
    title: "Personal Information",
    subtitle: "Tell us about yourself",
    icon: User,
  },
  {
    id: "business",
    title: "Business Details",
    subtitle: "Share your business information",
    icon: Building,
  },
  {
    id: "payment",
    title: "Payment Setup",
    subtitle: "Configure your payment preferences",
    icon: CreditCard,
  },
  {
    id: "documents",
    title: "Document Upload",
    subtitle: "Upload your verification documents (optional)",
    icon: FileCheck,
  },
  {
    id: "complete",
    title: "Application Complete!",
    subtitle: "Your vendor application has been submitted",
    icon: CheckCircle,
  }
];

export default function VendorOnboarding({ isOpen, onClose }: VendorOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: string}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<VendorOnboarding>({
    resolver: zodResolver(vendorOnboardingSchema),
    defaultValues: {
      phoneNumber: "",
      alternatePhoneNumber: "",
      nationalId: "",
      businessName: "",
      businessAddress: "",
      businessType: "Individual" as const,
      businessRegistrationNumber: "",
      yearsInBusiness: 0,
      kraPin: "",
      bankName: "",
      bankAccountNumber: "",
      bankAccountName: "",
      mpesaNumber: "",
      paymentPreference: "mpesa" as const,
      nationalIdDocument: "",
      businessLicense: "",
      taxCertificate: "",
      bankStatement: "",
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
      setCompletedSteps([...completedSteps, "documents"]);
      toast({
        title: "Application Submitted Successfully!",
        description: "Your vendor application is under review. You'll be notified once approved.",
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
    try {
      const uploadResponse = await fetch("/api/vendor/upload-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadURL } = await uploadResponse.json();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      const documentUrl = uploadURL.split('?')[0];
      setUploadedDocs(prev => ({
        ...prev,
        [documentType]: documentUrl
      }));
      
      form.setValue(documentType as keyof VendorOnboarding, documentUrl);

      toast({
        title: "Document Uploaded",
        description: `${documentType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} uploaded successfully!`,
      });

      return documentUrl;
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getCurrentStepIndex = () => {
    return STEPS.findIndex(step => step.id === currentStep);
  };

  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / STEPS.length) * 100;
  };

  const isStepValid = (stepId: OnboardingStep): boolean => {
    const { formState: { errors } } = form;
    
    switch (stepId) {
      case "welcome":
        return true;
      case "personal":
        return !errors.phoneNumber && !errors.nationalId;
      case "business":
        return !errors.businessName && !errors.businessAddress && !errors.businessType &&
               !errors.businessRegistrationNumber && !errors.yearsInBusiness;
      case "payment":
        if (paymentPreference === "bank" || paymentPreference === "both") {
          return !errors.bankName && !errors.bankAccountNumber && !errors.bankAccountName;
        }
        return paymentPreference === "mpesa" ? !errors.mpesaNumber : true;
      case "documents":
        return true; // Documents are optional
      case "complete":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      const currentStepId = STEPS[currentIndex].id;
      
      if (isStepValid(currentStepId)) {
        setCompletedSteps(prev => [...prev.filter(s => s !== currentStepId), currentStepId]);
        setCurrentStep(STEPS[currentIndex + 1].id);
      } else {
        toast({
          title: "Please Complete Required Fields",
          description: "Fill in all required information before proceeding.",
          variant: "destructive",
        });
      }
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
    // Add uploaded documents to form data
    const formDataWithDocs = {
      ...data,
      ...uploadedDocs
    };
    
    mutation.mutate(formDataWithDocs);
  };

  const renderStepContent = () => {
    const currentStepData = STEPS.find(step => step.id === currentStep);
    const Icon = currentStepData?.icon || User;

    switch (currentStep) {
      case "welcome":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to SportsBox!</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Join our platform and start connecting with customers looking to book your sports facilities.
            </p>
            <div className="space-y-4 text-left max-w-sm mx-auto">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Create your business profile</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>List your sports courts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Start receiving bookings</span>
              </div>
            </div>
            <Button onClick={nextStep} className="mt-8" size="lg">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        );

      case "personal":
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
                <h2 className="text-2xl font-semibold">Personal Information</h2>
                <p className="text-gray-600">Tell us about yourself</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="+254..." {...field} data-testid="input-phone-number" />
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
                      <Input placeholder="+254..." {...field} data-testid="input-alternate-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your national ID" {...field} data-testid="input-national-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case "business":
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
                <h2 className="text-2xl font-semibold">Business Details</h2>
                <p className="text-gray-600">Share your business information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your business name" {...field} data-testid="input-business-name" />
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
                    <FormLabel>Business Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-business-type">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Partnership">Partnership</SelectItem>
                        <SelectItem value="Corporation">Corporation</SelectItem>
                        <SelectItem value="Cooperative">Cooperative</SelectItem>
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
                  <FormLabel>Business Address *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full business address" {...field} data-testid="textarea-business-address" />
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
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Business registration number" {...field} data-testid="input-registration-number" />
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
                        data-testid="input-years-business"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="kraPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA PIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter KRA PIN" {...field} data-testid="input-kra-pin" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
        );

      case "payment":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Payment Setup</h2>
                <p className="text-gray-600">Configure how you'll receive payments</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="paymentPreference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Preference *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-payment-preference">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa Only</SelectItem>
                      <SelectItem value="bank">Bank Only</SelectItem>
                      <SelectItem value="both">Both M-Pesa & Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(paymentPreference === "mpesa" || paymentPreference === "both") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="mpesaNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M-Pesa Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+254..." {...field} data-testid="input-mpesa-number" />
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
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., KCB, Equity Bank" {...field} data-testid="input-bank-name" />
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
                        <FormLabel>Account Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank account number" {...field} data-testid="input-bank-account-number" />
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
                        <FormLabel>Account Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Account holder name" {...field} data-testid="input-bank-account-name" />
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
                <h2 className="text-2xl font-semibold">Document Upload</h2>
                <p className="text-gray-600">Upload verification documents (optional)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "nationalIdDocument", label: "National ID Document", icon: FileText },
                { key: "businessLicense", label: "Business License", icon: FileText },
                { key: "taxCertificate", label: "Tax Certificate", icon: FileText },
                { key: "bankStatement", label: "Bank Statement", icon: FileText }
              ].map(({ key, label, icon: DocIcon }) => (
                <Card key={key} className="border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
                  <CardContent className="p-6 text-center">
                    <DocIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-900 mb-2">{label}</h3>
                    {uploadedDocs[key] ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Uploaded</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentUpload(key)}
                        data-testid={`button-upload-${key}`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Document uploads are optional but recommended for faster approval. 
                Accepted formats: PDF, JPG, PNG (max 10MB each)
              </p>
            </div>
          </motion.div>
        );

      case "complete":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Your vendor application has been submitted successfully. Our team will review it and get back to you within 2-3 business days.
            </p>
            <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Application received</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Email confirmation sent</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Review in progress</span>
              </div>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-vendor-onboarding">
        <DialogHeader>
          <DialogTitle className="sr-only">Vendor Onboarding</DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          {/* Progress Bar */}
          {currentStep !== "welcome" && currentStep !== "complete" && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {getCurrentStepIndex() + 1} of {STEPS.length}
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgressPercentage())}% Complete
                </span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          )}

          {/* Step Indicators */}
          {currentStep !== "welcome" && currentStep !== "complete" && (
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                {STEPS.slice(1, -1).map((step, index) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isCurrent = currentStep === step.id;
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-100 text-green-600"
                            : isCurrent
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      {index < STEPS.slice(1, -1).length - 1 && (
                        <div
                          className={`w-16 h-1 ml-4 ${
                            isCompleted ? "bg-green-200" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentStep !== 'documents') {
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
              {currentStep !== "welcome" && currentStep !== "complete" && (
                <div className="flex justify-between items-center pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center gap-2"
                    data-testid="button-previous-step"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {currentStep === "documents" ? (
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex items-center gap-2"
                      data-testid="button-submit-application"
                    >
                      {mutation.isPending ? "Submitting..." : "Submit Application"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex items-center gap-2"
                      data-testid="button-next-step"
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