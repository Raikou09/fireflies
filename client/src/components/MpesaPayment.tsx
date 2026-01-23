import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Smartphone, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
interface MpesaPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingType: "court" | "event";
  amount: number;
  onPaymentComplete: () => void;
  defaultPhone?: string;
}

type PaymentStatus = "idle" | "sending" | "waiting" | "completed" | "failed";

export function MpesaPayment({
  isOpen,
  onClose,
  bookingId,
  bookingType,
  amount,
  onPaymentComplete,
  defaultPhone = "",
}: MpesaPaymentProps) {
  const [phone, setPhone] = useState(defaultPhone);
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [pollCount, setPollCount] = useState(0);
  const { toast } = useToast();

  const MAX_POLL_ATTEMPTS = 24; // 2 minutes timeout (5 sec * 24 = 120 sec)

  useEffect(() => {
    if (defaultPhone) {
      setPhone(defaultPhone);
    }
  }, [defaultPhone]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (status === "waiting" && checkoutRequestId) {
      pollInterval = setInterval(async () => {
        try {
          setPollCount((prev) => prev + 1);

          // Timeout after MAX_POLL_ATTEMPTS
          if (pollCount >= MAX_POLL_ATTEMPTS) {
            setStatus("failed");
            setErrorMessage("Payment timed out. Please check your M-Pesa messages and try again if the payment was not completed.");
            if (pollInterval) clearInterval(pollInterval);
            return;
          }

          const endpoint =
            bookingType === "court"
              ? `/api/mpesa/query/booking/${bookingId}`
              : `/api/mpesa/query/event-booking/${bookingId}`;

          const response = await fetch(endpoint, { credentials: "include" });
          const data = await response.json();

          if (data.status === "completed") {
            setStatus("completed");
            toast({
              title: "Payment Successful!",
              description: "Your M-Pesa payment has been received.",
            });
            if (pollInterval) clearInterval(pollInterval);
            setTimeout(() => {
              onPaymentComplete();
              onClose();
            }, 2000);
          } else if (data.status === "failed" || data.status === "cancelled") {
            setStatus("failed");
            setErrorMessage(data.message || "Payment was cancelled or failed. Please try again.");
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (error) {
          console.error("Error polling payment status:", error);
        }
      }, 5000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [status, checkoutRequestId, bookingId, bookingType, pollCount, onPaymentComplete, onClose, toast]);

  const initiatePayment = async () => {
    if (!phone || phone.length < 9) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const endpoint =
        bookingType === "court"
          ? "/api/mpesa/stkpush/booking"
          : "/api/mpesa/stkpush/event-booking";

      const body =
        bookingType === "court"
          ? { bookingId, phone }
          : { eventBookingId: bookingId, phone };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCheckoutRequestId(data.checkoutRequestId);
        setStatus("waiting");
        toast({
          title: "Payment Prompt Sent",
          description: "Check your phone for the M-Pesa prompt and enter your PIN",
        });
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (error: any) {
      setStatus("failed");
      setErrorMessage(error.message || "Failed to initiate payment");
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate M-Pesa payment",
        variant: "destructive",
      });
    }
  };

  const resetPayment = () => {
    setStatus("idle");
    setCheckoutRequestId(null);
    setErrorMessage("");
    setPollCount(0);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("254")) {
      return cleaned.slice(0, 12);
    } else if (cleaned.startsWith("0")) {
      return cleaned.slice(0, 10);
    } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
      return cleaned.slice(0, 9);
    }
    return cleaned.slice(0, 12);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-green-600" />
            M-Pesa Payment
          </DialogTitle>
          <DialogDescription>
            Pay KES {amount.toLocaleString()} via M-Pesa
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {status === "idle" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678 or 254712345678"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Enter the phone number registered with M-Pesa
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  A payment prompt will be sent to this phone number. Enter your M-Pesa PIN to complete the payment.
                </p>
              </div>
            </div>
          )}

          {status === "sending" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mb-4" />
              <p className="text-center text-muted-foreground">
                Sending payment request to your phone...
              </p>
            </div>
          )}

          {status === "waiting" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative mb-4">
                <Smartphone className="h-16 w-16 text-green-600" />
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Check Your Phone</h3>
              <p className="text-center text-muted-foreground mb-4">
                Enter your M-Pesa PIN on the prompt to complete payment of KES {amount.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Waiting for confirmation...
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">
                Payment Successful!
              </h3>
              <p className="text-center text-muted-foreground">
                Your payment of KES {amount.toLocaleString()} has been received.
              </p>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center justify-center py-8">
              <XCircle className="h-16 w-16 text-red-600 mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                Payment Failed
              </h3>
              <p className="text-center text-muted-foreground mb-4">
                {errorMessage || "The payment could not be processed. Please try again."}
              </p>
              <Button onClick={resetPayment} variant="outline">
                Try Again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={initiatePayment}
                className="bg-green-600 hover:bg-green-700"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Pay with M-Pesa
              </Button>
            </>
          )}
          {status === "waiting" && (
            <Button variant="outline" onClick={resetPayment}>
              Cancel & Try Again
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
