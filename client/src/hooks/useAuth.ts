import { useQuery } from "@tanstack/react-query";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  userType: "customer" | "vendor" | "admin";
  phoneNumber: string | null;
  businessName: string | null;
  businessAddress: string | null;
  kraPin: string | null;
  nationalId: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  mpesaNumber: string | null;
  paymentPreference: "bank" | "mpesa" | "both" | null;
  vendorVerificationStatus: "pending" | "verified" | "rejected" | null;
  hasUsedFirstDiscount: boolean | null;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
