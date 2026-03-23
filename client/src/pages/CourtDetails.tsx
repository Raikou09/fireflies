import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Star, 
  Clock, 
  DollarSign, 
  Phone, 
  Calendar,
  Users,
  Wifi,
  Car,
  ShowerHead,
  Utensils,
  Shield,
  ArrowLeft,
  Heart,
  Share2,
  MessageSquare,
  Package,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EquipmentRentalModal from '@/components/EquipmentRentalModal';
import { BookingModal } from '@/components/BookingModal';
import type { CourtWithDetails } from '@shared/schema';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function CourtDetails() {
  const [match, params] = useRoute('/court/:id');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const courtId = params?.id;

  const { data: court, isLoading } = useQuery<CourtWithDetails>({
    queryKey: ['/api/courts', courtId],
    enabled: !!courtId,
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ['/api/courts', courtId, 'reviews'],
    enabled: !!courtId,
  });

  if (!match || !courtId) {
    return <div>Court not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Court Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The court you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Build gallery: use images array if non-empty, fallback to imageUrl
  const galleryImages: string[] = (court.images && court.images.length > 0)
    ? court.images
    : (court.imageUrl ? [court.imageUrl] : []);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : Number(court.rating) || 0;

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={16} />;
    if (lowerAmenity.includes('parking')) return <Car size={16} />;
    if (lowerAmenity.includes('shower') || lowerAmenity.includes('changing')) return <ShowerHead size={16} />;
    if (lowerAmenity.includes('food') || lowerAmenity.includes('cafe') || lowerAmenity.includes('restaurant')) return <Utensils size={16} />;
    if (lowerAmenity.includes('security') || lowerAmenity.includes('guard')) return <Shield size={16} />;
    return null;
  };

  const DAY_ABBREVIATIONS: Record<string, string> = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
    Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun'
  };

  const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2" data-testid="button-back">
              <ArrowLeft size={16} />
              Back to Courts
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="relative">
                  {galleryImages.length > 0 ? (
                    <>
                      <img
                        src={galleryImages[selectedImage]}
                        alt={court.name}
                        className="w-full h-80 md:h-96 object-cover rounded-t-lg"
                        data-testid="court-main-image"
                      />
                      {galleryImages.length > 1 && (
                        <div className="p-3 flex gap-2 overflow-x-auto bg-white dark:bg-gray-800 rounded-b-lg">
                          {galleryImages.map((image, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImage(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                selectedImage === index 
                                  ? 'border-primary shadow-md' 
                                  : 'border-transparent opacity-60 hover:opacity-90'
                              }`}
                              data-testid={`button-image-${index}`}
                            >
                              <img
                                src={image}
                                alt={`${court.name} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded-t-lg flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <MapPin size={48} className="mx-auto mb-2" />
                        <p>No images available</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Court Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2" data-testid="court-name">
                      {court.name}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        <span data-testid="court-location">{court.area}, {court.city}</span>
                      </div>
                      {court.distance && (
                        <div className="flex items-center gap-1">
                          <span>{court.distance.toFixed(1)} km away</span>
                        </div>
                      )}
                    </div>
                    {court.address && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" data-testid="court-full-address">
                        {court.address}
                      </p>
                    )}
                    {court.latitude != null && court.longitude != null && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-1"
                        data-testid="link-get-directions"
                      >
                        <ExternalLink size={14} />
                        Get Directions
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Heart size={16} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="fill-yellow-400 text-yellow-400" size={20} />
                    <span className="font-semibold" data-testid="court-rating">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <Users size={16} />
                    <span>{court.totalBookings || 0} bookings</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About this court</h3>
                  <p className="text-gray-700 dark:text-gray-300" data-testid="court-description">
                    {court.description || 'No description available.'}
                  </p>
                </div>

                {/* Sports */}
                <div>
                  <h3 className="font-semibold mb-2">Available Sports</h3>
                  <div className="flex flex-wrap gap-2">
                    {court.availableSports?.map((sport, index) => (
                      <Badge key={index} variant="secondary" data-testid={`sport-${sport}`}>
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Available Days */}
                {court.availableDays && court.availableDays.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Available Days</h3>
                    <div className="flex flex-wrap gap-2">
                      {ALL_DAYS.map((day) => {
                        const isOpen = court.availableDays.includes(day);
                        return (
                          <div
                            key={day}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
                              isOpen
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                            }`}
                            data-testid={`day-${day.toLowerCase()}`}
                          >
                            {isOpen && <CheckCircle2 size={12} />}
                            {DAY_ABBREVIATIONS[day]}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Rules */}
                {court.rules && (
                  <div>
                    <h3 className="font-semibold mb-2">Court Rules</h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line" data-testid="court-rules">
                      {court.rules}
                    </p>
                  </div>
                )}

                {/* Equipment */}
                {court.equipment && court.equipment.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Available Equipment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {court.equipment.map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-medium" data-testid={`equipment-name-${item.id}`}>
                              {item.name}
                            </h4>
                            <Badge 
                              variant={item.isAvailable ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Qty: {item.quantityAvailable}
                            {item.pricePerHour && (
                              <span className="ml-2">• KSh {item.pricePerHour}/hr</span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operating Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Operating Hours</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} />
                      <span data-testid="court-hours">
                        {court.openingTime && court.closingTime
                          ? `${court.openingTime} - ${court.closingTime}`
                          : '24 hours'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={20} />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-start gap-3">
                        <img
                          src={review.customer.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32'}
                          alt={`${review.customer.firstName} ${review.customer.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {review.customer.firstName} {review.customer.lastName}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No reviews yet. Be the first to review this court!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Book this court</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Regular hours</span>
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span className="font-semibold" data-testid="regular-rate">
                        KSh {court.hourlyRate}/hour
                      </span>
                    </div>
                  </div>
                  {court.peakHourRate && court.peakHourRate !== court.hourlyRate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Peak hours</span>
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span className="font-semibold" data-testid="peak-rate">
                          KSh {court.peakHourRate}/hour
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Operating Hours & Days Summary */}
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>
                      {court.openingTime && court.closingTime
                        ? `${court.openingTime} – ${court.closingTime}`
                        : 'Hours not specified'
                      }
                    </span>
                  </div>
                  {court.availableDays && court.availableDays.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>
                        {court.availableDays.length === 7
                          ? 'Open every day'
                          : court.availableDays.map((d: string) => DAY_ABBREVIATIONS[d] || d).join(', ')
                        }
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Vendor Info */}
                <div className="flex items-center gap-3">
                  <img
                    src={court.vendor.profileImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32'}
                    alt={`${court.vendor.firstName} ${court.vendor.lastName}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium" data-testid="vendor-name">
                      {court.vendor.firstName} {court.vendor.lastName}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Court Owner</p>
                  </div>
                </div>

                <Separator />

                {/* Equipment Rental Section */}
                {court.equipment && court.equipment.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Available Equipment</h4>
                    <div className="space-y-2">
                      {court.equipment.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span>{item.name}</span>
                          <span className="text-primary font-medium">
                            {item.pricePerHour ? `KSh ${item.pricePerHour}/hr` : 'Included'}
                          </span>
                        </div>
                      ))}
                      {court.equipment.length > 3 && (
                        <p className="text-xs text-gray-500">+{court.equipment.length - 3} more items</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsEquipmentModalOpen(true)}
                      data-testid="button-rent-equipment"
                    >
                      <Package className="mr-2" size={16} />
                      Rent Equipment
                    </Button>
                  </div>
                )}

                {court.equipment && court.equipment.length > 0 && <Separator />}

                {/* Booking Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    size="lg"
                    disabled={!court.isActive || court.approvalStatus !== 'approved'}
                    onClick={() => setIsBookingModalOpen(true)}
                    data-testid="button-book-now"
                  >
                    <Calendar className="mr-2" size={16} />
                    {court.isActive && court.approvalStatus === 'approved' 
                      ? 'Book Now' 
                      : 'Currently Unavailable'
                    }
                  </Button>
                </div>

                {/* Status badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Status:</span>
                    <Badge 
                      variant={court.isActive ? 'default' : 'secondary'}
                      data-testid="court-status"
                    >
                      {court.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Approval:</span>
                    <Badge 
                      variant={court.approvalStatus === 'approved' ? 'default' : 
                                court.approvalStatus === 'pending' ? 'secondary' : 'destructive'}
                      data-testid="approval-status"
                    >
                      {court.approvalStatus}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location card with map + directions */}
            {court.latitude != null && court.longitude != null && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin size={16} />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${court.latitude},${court.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${court.latitude},${court.longitude}&zoom=15&size=400x180&maptype=roadmap&markers=color:red%7C${court.latitude},${court.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                        alt="Court location"
                        className="w-full rounded-lg h-36 object-cover"
                        data-testid="court-map-preview"
                      />
                    </a>
                  ) : null}
                  {court.address && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{court.address}</p>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-md border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                    data-testid="sidebar-link-get-directions"
                  >
                    <ExternalLink size={14} />
                    Get Directions
                  </a>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {/* Equipment Rental Modal */}
      <EquipmentRentalModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        courtId={courtId}
        onEquipmentSelected={() => {}}
      />

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          court={court}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
        />
      )}
    </div>
  );
}
