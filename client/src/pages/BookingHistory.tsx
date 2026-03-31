import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin, Star, Receipt, Eye, XCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import type { BookingWithDetails } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BookingHistory() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: ["/api/customer/bookings"],
    enabled: isAuthenticated,
    refetchInterval: false,
  });

  const cancelMutation = useMutation({
    mutationFn: (bookingId: string) =>
      apiRequest(`/api/bookings/${bookingId}/cancel`, "POST"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/bookings"] });
      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled. A confirmation email has been sent to you.",
      });
    },
    onError: (error: any) => {
      const raw: string = error?.message || "";
      const jsonMatch = raw.match(/\{.*\}/s);
      let message = "Failed to cancel booking";
      if (jsonMatch) {
        try { message = JSON.parse(jsonMatch[0]).message || message; } catch {}
      } else if (raw) {
        message = raw.replace(/^\d+:\s*/, "");
      }
      toast({
        title: "Cannot cancel booking",
        description: message,
        variant: "destructive",
      });
    },
    onSettled: () => setCancellingId(null),
  });

  const isCancellable = (booking: BookingWithDetails) => {
    if (booking.status !== "confirmed") return false;
    if (booking.paymentStatus !== "completed") return false;
    const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
    const hoursUntil = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 2;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const displayHour = hourNum % 12 || 12;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const bookingToCancel = bookings.find((b) => b.id === cancellingId);

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in with Google to view your booking history.
          </p>
          <Button
            onClick={() => (window.location.href = "/api/login")}
            className="bg-primary hover:bg-green-700"
            size="lg"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking History</h1>
          <p className="text-gray-600">View and manage all your court bookings</p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">
                Start exploring courts and make your first booking!
              </p>
              <Link href="/">
                <Button className="bg-primary hover:bg-green-700">Browse Courts</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => {
              const cancellable = isCancellable(booking);
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {booking.court?.name}
                            </h3>
                            <div className="flex items-center text-gray-600 text-sm mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              {booking.court?.area}, {booking.court?.city}
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(booking.bookingDate)}
                              <Clock className="h-4 w-4 ml-4 mr-1" />
                              {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge
                              className={getStatusColor(booking.status)}
                              data-testid={`status-${booking.id}`}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </Badge>
                            <Badge
                              className={getPaymentStatusColor(booking.paymentStatus)}
                              data-testid={`payment-status-${booking.id}`}
                            >
                              Payment: {booking.paymentStatus}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Sport</p>
                            <p className="font-medium">{booking.selectedSport || "General"}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-medium">
                              {booking.duration || 1} hour{(booking.duration || 1) > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Amount</p>
                            <p className="font-medium text-primary">KES {booking.totalAmount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Payment Method</p>
                            <p className="font-medium">
                              {booking.paymentMethod?.toUpperCase() || "M-Pesa"}
                            </p>
                          </div>
                        </div>

                        {booking.status === "confirmed" && !cancellable && booking.paymentStatus === "completed" && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-md px-3 py-2">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            Cancellations are only allowed up to 2 hours before the booking start time.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 lg:ml-6">
                        <Link href={`/court/${booking.courtId}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            data-testid={`view-court-${booking.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Court
                          </Button>
                        </Link>
                        {booking.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            data-testid={`write-review-${booking.id}`}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Write Review
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          data-testid={`view-receipt-${booking.id}`}
                        >
                          <Receipt className="h-4 w-4 mr-2" />
                          Receipt
                        </Button>
                        {cancellable && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                            data-testid={`cancel-booking-${booking.id}`}
                            onClick={() => setCancellingId(booking.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!cancellingId} onOpenChange={(open) => !open && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {bookingToCancel && (
                  <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
                    <p className="font-medium">{bookingToCancel.court?.name}</p>
                    <p>{formatDate(bookingToCancel.bookingDate)} · {formatTime(bookingToCancel.startTime)} – {formatTime(bookingToCancel.endTime)}</p>
                    <p className="font-medium text-primary mt-1">KES {bookingToCancel.totalAmount}</p>
                  </div>
                )}
                <p>This action cannot be undone. Refunds are processed manually within <strong>3–5 business days</strong> via M-Pesa reversal.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={cancelMutation.isPending}
              onClick={() => cancellingId && cancelMutation.mutate(cancellingId)}
            >
              {cancelMutation.isPending ? "Cancelling…" : "Yes, Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
