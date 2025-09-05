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
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Trophy,
  Star,
  Zap,
  Target,
  Gift,
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

interface GamifiedVendorOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

type OnboardingStep = "welcome" | "personal" | "business" | "payment" | "documents" | "celebration";

const STEPS: Array<{
  id: OnboardingStep;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  points: number;
  badge: string;
}> = [
  {
    id: "welcome",
    title: "Welcome to SportsBox!",
    subtitle: "Let's get you started on your vendor journey",
    icon: Rocket,
    points: 0,
    badge: "Getting Started"
  },
  {
    id: "personal",
    title: "Personal Information",
    subtitle: "Tell us about yourself",
    icon: User,
    points: 100,
    badge: "Personal Champion"
  },
  {
    id: "business",
    title: "Business Details",
    subtitle: "Share your business information",
    icon: Building,
    points: 150,
    badge: "Business Builder"
  },
  {
    id: "payment",
    title: "Payment Setup",
    subtitle: "Configure your payment preferences",
    icon: CreditCard,
    points: 125,
    badge: "Payment Pro"
  },
  {
    id: "documents",
    title: "Document Upload",
    subtitle: "Upload your verification documents",
    icon: FileCheck,
    points: 175,
    badge: "Document Master"
  },
  {
    id: "celebration",
    title: "Congratulations!",
    subtitle: "Your vendor application is complete",
    icon: Trophy,
    points: 250,
    badge: "Vendor Hero"
  }
];

export default function GamifiedVendorOnboarding({ isOpen, onClose }: GamifiedVendorOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [completedSteps, setCompletedSteps] = useState<OnboardingStep[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<{[key: string]: string}>({});

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
      completeStep("celebration");
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

  const getCurrentStepIndex = () => STEPS.findIndex(step => step.id === currentStep);
  const getProgress = () => ((getCurrentStepIndex() + 1) / STEPS.length) * 100;

  const completeStep = (step: OnboardingStep) => {
    if (!completedSteps.includes(step)) {
      const stepInfo = STEPS.find(s => s.id === step);
      if (stepInfo) {
        setCompletedSteps(prev => [...prev, step]);
        setTotalPoints(prev => prev + stepInfo.points);
        
        toast({
          title: `🎉 Achievement Unlocked!`,
          description: `You earned ${stepInfo.points} points and the "${stepInfo.badge}" badge!`,
        });
      }
    }
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      completeStep(currentStep);
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const isStepValid = (step: OnboardingStep): boolean => {
    const errors = form.formState.errors;
    
    switch (step) {
      case "personal":
        return !errors.phoneNumber && !errors.nationalId && !errors.kraPin;
      case "business":
        return !errors.businessName && !errors.businessAddress && !errors.businessType && 
               !errors.businessRegistrationNumber && !errors.yearsInBusiness;
      case "payment":
        if (paymentPreference === "bank" || paymentPreference === "both") {
          return !errors.bankName && !errors.bankAccountNumber && !errors.bankAccountName && 
                 true;
        }
        return paymentPreference === "mpesa" ? !errors.mpesaNumber : true;
      case "documents":
        return true; // Documents are optional
      default:
        return true;
    }
  };

  // Document upload function
  const uploadDocument = async (file: File, documentType: string) => {
    try {
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
        throw new Error("Failed to get upload URL");
      }
      
      const { uploadURL, documentUrl } = await uploadResponse.json();
      
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
      
      form.setValue(documentType as keyof VendorOnboarding, documentUrl);
      setUploadedDocs(prev => ({ ...prev, [documentType]: file.name }));
      
      // Award bonus points for document upload
      setTotalPoints(prev => prev + 25);
      
      toast({
        title: "🎯 Document Uploaded!",
        description: `${file.name} uploaded successfully. +25 bonus points!`,
      });
    } catch (error) {
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
    description 
  }: { 
    documentType: string; 
    label: string; 
    description: string;
  }) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    return (
      <motion.div 
        className="space-y-2"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">
            {label}
          </FormLabel>
          {uploadedDocs[documentType] && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <CheckCircle className="h-3 w-3 mr-1" />
              +25 pts
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500">{description}</p>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-300 ${
            uploadedDocs[documentType] 
              ? 'border-green-300 bg-green-50 hover:bg-green-100' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          ) : uploadedDocs[documentType] ? (
            <motion.div 
              className="flex items-center justify-center space-x-2 text-green-600"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <CheckCircle className="h-6 w-6" />
              <div>
                <div className="text-sm font-medium">{uploadedDocs[documentType]}</div>
                <div className="text-xs">Click to replace</div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <div className="text-sm font-medium text-gray-600">Upload {label}</div>
              <div className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</div>
              <div className="text-xs text-blue-600 font-medium">+25 bonus points</div>
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
              if (file.size > 5 * 1024 * 1024) {
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
      </motion.div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <motion.div 
            className="text-center space-y-6 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 mx-auto mb-4"
              >
                <Rocket className="w-full h-full text-blue-600" />
              </motion.div>
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Star className="w-8 h-8 text-yellow-500 fill-current" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome to Your Vendor Journey!</h2>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              Get ready to join Kenya's premier sports facility network. Complete your registration 
              to earn points and unlock achievements!
            </p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">800+</div>
                <div className="text-sm text-gray-500">Points to Earn</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">5</div>
                <div className="text-sm text-gray-500">Badges to Unlock</div>
              </div>
            </div>
          </motion.div>
        );

      case "personal":
        return (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Phone Number *</FormLabel>
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
              name="alternatePhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternate Phone Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="+254 712 345 678" 
                      {...field} 
                      data-testid="input-alternate-phone"
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
          </div>
        );

      case "business":
        return (
          <div className="space-y-4">
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
                  <FormLabel>Business Address *</FormLabel>
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
                      <SelectItem value="Individual">Individual/Sole Proprietor</SelectItem>
                      <SelectItem value="Partnership">Partnership</SelectItem>
                      <SelectItem value="Company">Limited Company</SelectItem>
                      <SelectItem value="LLC">Limited Liability Company</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Registration Number *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., CPR/2023/123456 or Certificate Number" 
                      {...field} 
                      data-testid="input-business-registration-number"
                    />
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
                  <FormLabel>Years in Business *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0" 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      data-testid="input-years-in-business"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4">
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
              </motion.div>
            )}

            {(paymentPreference === "mpesa" || paymentPreference === "both") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
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
              </motion.div>
            )}
          </div>
        );

      case "documents":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Target className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Boost Your Score!</h3>
              <p className="text-sm text-gray-600">Upload documents to earn bonus points</p>
            </div>
            
            <div className="grid gap-4">
              <DocumentUpload
                documentType="nationalIdDocument"
                label="National ID"
                description="Upload your National ID for identity verification"
              />
              
              {(paymentPreference === "bank" || paymentPreference === "both") && (
                <DocumentUpload
                  documentType="bankStatement"
                  label="Bank Statement"
                  description="Upload a recent bank statement"
                />
              )}
              
              <DocumentUpload
                documentType="businessLicense"
                label="Business License/Registration Certificate"
                description="Upload your business registration documents"
              />

              <DocumentUpload
                documentType="taxCertificate"
                label="Tax Compliance Certificate"
                description="Upload your KRA Tax Compliance Certificate"
              />
            </div>
          </div>
        );

      case "celebration":
        return (
          <motion.div 
            className="text-center space-y-6 py-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900">Congratulations! 🎉</h2>
            <p className="text-lg text-gray-600">
              You've successfully completed your vendor registration!
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">{totalPoints}</div>
              <div className="text-sm text-gray-600">Total Points Earned</div>
              <div className="flex justify-center mt-4 space-x-2">
                {completedSteps.map((step) => {
                  const stepInfo = STEPS.find(s => s.id === step);
                  return stepInfo ? (
                    <Badge key={step} className="bg-green-100 text-green-800 border-green-200">
                      <Trophy className="w-3 h-3 mr-1" />
                      {stepInfo.badge}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              Your application is now under review. You'll receive notifications about the approval status.
            </p>
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
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {React.createElement(STEPS[getCurrentStepIndex()].icon, { className: "w-6 h-6 text-blue-600" })}
              <span>{STEPS[getCurrentStepIndex()].title}</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-blue-600">{totalPoints} pts</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">{STEPS[getCurrentStepIndex()].subtitle}</p>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="text-blue-600 font-medium">{Math.round(getProgress())}% Complete</span>
          </div>
          <Progress value={getProgress()} className="h-3" />
        </div>

        {/* Step Navigation */}
        <div className="flex justify-center space-x-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                completedSteps.includes(step.id)
                  ? 'bg-green-500 text-white'
                  : step.id === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {completedSteps.includes(step.id) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit((data) => {
              if (currentStep === "documents") {
                mutation.mutate(data);
              }
            })} 
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
            {currentStep !== "celebration" && (
              <div className="flex justify-between space-x-2">
                {currentStep !== "welcome" && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                
                <div className="flex-1" />
                
                {currentStep === "documents" ? (
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="button-submit-vendor-application"
                  >
                    {mutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      <>
                        Complete Registration
                        <Gift className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={nextStep}
                    disabled={currentStep !== "welcome" && !isStepValid(currentStep)}
                  >
                    {currentStep === "welcome" ? "Start Journey" : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {currentStep === "celebration" && (
              <div className="flex justify-center">
                <Button 
                  type="button" 
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Go to Dashboard
                  <Rocket className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}