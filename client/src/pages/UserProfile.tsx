import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Calendar, Star, Edit, Save, X, MapPin } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { BookingWithDetails, ReviewWithDetails } from "@shared/schema";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  userType: string;
  totalBookings: number;
  totalReviews: number;
  recentBookings: BookingWithDetails[];
  memberSince: string;
  createdAt: string;
}

export default function UserProfile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    profileImageUrl: ""
  });

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/customer/profile"],
    enabled: isAuthenticated,
    refetchInterval: false,
  });

  const { data: reviews = [] } = useQuery<ReviewWithDetails[]>({
    queryKey: ["/api/customer/reviews"],
    enabled: isAuthenticated,
    refetchInterval: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return apiRequest("PUT", "/api/customer/profile", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/profile"] });
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isLoading && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in with Google to view your profile.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-green-700"
            size="lg"
          >
            Sign In with Google
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  const handleEditStart = () => {
    setEditForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      profileImageUrl: profile.profileImageUrl || ""
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({ firstName: "", lastName: "", profileImageUrl: "" });
  };

  const handleEditSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and view your activity</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {profile.profileImageUrl ? (
                    <img 
                      src={profile.profileImageUrl} 
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
                      {getInitials(profile.firstName, profile.lastName)}
                    </div>
                  )}
                </div>
                <CardTitle className="text-xl">
                  {profile.firstName} {profile.lastName}
                </CardTitle>
                <p className="text-gray-600">{profile.email}</p>
                <Badge variant="secondary" className="mt-2">
                  {profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1)}
                </Badge>
              </CardHeader>
              <CardContent>
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Member since</p>
                      <p className="font-medium">{formatDate(profile.memberSince || profile.createdAt)}</p>
                    </div>
                    <Button 
                      onClick={handleEditStart}
                      className="w-full"
                      variant="outline"
                      data-testid="edit-profile-button"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        data-testid="input-last-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="profileImageUrl">Profile Image URL</Label>
                      <Input
                        id="profileImageUrl"
                        value={editForm.profileImageUrl}
                        onChange={(e) => setEditForm({ ...editForm, profileImageUrl: e.target.value })}
                        placeholder="https://..."
                        data-testid="input-profile-image"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleEditSave}
                        className="flex-1"
                        disabled={updateProfileMutation.isPending}
                        data-testid="save-profile-button"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save"}
                      </Button>
                      <Button 
                        onClick={handleEditCancel}
                        variant="outline"
                        data-testid="cancel-edit-button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Overview */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profile.totalBookings}</p>
                  <p className="text-gray-600">Total Bookings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{profile.totalReviews}</p>
                  <p className="text-gray-600">Reviews Written</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <Link href="/booking-history">
                  <Button variant="outline" size="sm" data-testid="view-all-bookings">
                    View All
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {profile.recentBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent bookings</p>
                ) : (
                  <div className="space-y-4">
                    {profile.recentBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold">{booking.court?.name}</h4>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.court?.area}, {booking.court?.city}
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.bookingDate)} • {booking.startTime} - {booking.endTime}
                          </p>
                        </div>
                        <Badge className={
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews written yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{review.court?.name}</h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && <h5 className="font-medium mb-1">{review.title}</h5>}
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}