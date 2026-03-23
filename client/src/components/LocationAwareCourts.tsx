import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Clock, Star, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { BookingModal } from './BookingModal';
import { ReviewModal } from './ReviewModal';
import { ReviewsList } from './ReviewsList';
import type { CourtWithDetails } from '@shared/schema';

interface LocationAwareCourtsProps {
  city: string;
  sport: string;
  searchQuery?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export function LocationAwareCourts({ city, sport, searchQuery }: LocationAwareCourtsProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermissionRequested, setLocationPermissionRequested] = useState(false);
  const [maxDistance, setMaxDistance] = useState([10]);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<CourtWithDetails | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showCourtDetails, setShowCourtDetails] = useState<string | null>(null);

  // Request user location
  const requestLocation = () => {
    setLocationPermissionRequested(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setUseLocationFilter(true);
          setSortByDistance(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. You can still browse courts without location features.');
        }
      );
    } else {
      alert('Your browser does not support location services.');
    }
  };

  // Fetch courts with location parameters
  const { data: courts, isLoading, error } = useQuery({
    queryKey: ['/api/courts', city, sport, searchQuery || ''],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (useLocationFilter && userLocation) {
        params.append('lat', userLocation.latitude.toString());
        params.append('lng', userLocation.longitude.toString());
        params.append('maxDistance', maxDistance[0].toString());
        params.append('sortByDistance', sortByDistance.toString());
      }
      
      const response = await fetch(`/api/courts/${city}/${sport}?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courts');
      }
      const data = await response.json();
      console.log('Courts API response:', data);
      return data as CourtWithDetails[];
    },
    staleTime: 0,
    refetchOnMount: true
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load courts. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Location Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <MapPin className="h-4 w-4 md:h-5 md:w-5" />
            Find Courts Near You
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 md:space-y-4">
          {!userLocation && !locationPermissionRequested && (
            <div className="text-center">
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Allow location access to find courts closest to you
              </p>
              <Button 
                onClick={requestLocation} 
                data-testid="button-request-location"
                className="w-full sm:w-auto"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use My Location
              </Button>
            </div>
          )}

          {userLocation && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-location"
                  checked={useLocationFilter}
                  onCheckedChange={setUseLocationFilter}
                  data-testid="switch-use-location"
                />
                <Label htmlFor="use-location">Filter by distance</Label>
              </div>

              {useLocationFilter && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm md:text-base">Maximum distance: {maxDistance[0]} km</Label>
                    <Slider
                      value={maxDistance}
                      onValueChange={setMaxDistance}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                      data-testid="slider-max-distance"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sort-distance"
                      checked={sortByDistance}
                      onCheckedChange={setSortByDistance}
                      data-testid="switch-sort-distance"
                    />
                    <Label htmlFor="sort-distance" className="text-sm md:text-base">
                      Sort by distance (nearest first)
                    </Label>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courts List */}
      <div className="space-y-3 md:space-y-4">
        {courts && courts.length > 0 ? (
          courts.map((court) => (
            <Card key={court.id} className="relative hover:shadow-md md:hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
              {/* Stretched link covers the entire card; buttons sit above it via z-10 */}
              <Link
                href={`/court/${court.id}`}
                className="absolute inset-0 z-0"
                aria-label={`View details for ${court.name}`}
              />
              <img
                src={court.imageUrl || court.images?.[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23e8f5e9'/%3E%3Ccircle cx='200' cy='85' r='30' fill='%2366bb6a' opacity='0.5'/%3E%3Cellipse cx='200' cy='130' rx='60' ry='15' fill='%2366bb6a' opacity='0.3'/%3E%3Ctext x='200' y='165' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23388e3c'%3ENo photo yet%3C/text%3E%3C/svg%3E"}
                alt={court.name}
                className="w-full h-40 object-cover hover:opacity-90 transition-opacity"
                data-testid={`court-image-${court.id}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect width='400' height='200' fill='%23e8f5e9'/%3E%3Ccircle cx='200' cy='85' r='30' fill='%2366bb6a' opacity='0.5'/%3E%3Cellipse cx='200' cy='130' rx='60' ry='15' fill='%2366bb6a' opacity='0.3'/%3E%3Ctext x='200' y='165' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23388e3c'%3ENo photo yet%3C/text%3E%3C/svg%3E";
                }}
              />
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-semibold mb-2" data-testid={`text-court-name-${court.id}`}>
                      {court.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-2 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                        <span data-testid={`text-court-location-${court.id}`}>
                          {court.area}, {court.city}
                        </span>
                      </div>
                      {court.distance !== undefined && (
                        <Badge variant="outline" className="text-xs" data-testid={`badge-distance-${court.id}`}>
                          {court.distance} km away
                        </Badge>
                      )}
                    </div>
                    {court.address && (
                      <a
                        href={
                          court.latitude != null && court.longitude != null
                            ? `https://www.google.com/maps/search/?api=1&query=${court.latitude},${court.longitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.address)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 flex items-center gap-1 text-xs md:text-sm text-gray-500 hover:text-primary hover:underline mb-1 transition-colors"
                        data-testid={`text-court-address-${court.id}`}
                      >
                        <MapPin className="h-3 w-3 shrink-0" />
                        {court.address}
                      </a>
                    )}
                    {court.latitude != null && court.longitude != null && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${court.latitude},${court.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="relative z-10 inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
                        data-testid={`link-get-directions-${court.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Get Directions
                      </a>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:text-right gap-2 sm:gap-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500 fill-current" />
                      <span className="font-medium text-sm md:text-base" data-testid={`text-court-rating-${court.id}`}>
                        {court.rating}
                      </span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">
                      <span data-testid={`text-court-bookings-${court.id}`}>
                        {court.totalBookings} bookings
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 md:gap-2 mb-4">
                  {court.availableSports.map((sportName) => (
                    <Badge 
                      key={sportName} 
                      variant="secondary" 
                      className="text-xs"
                      data-testid={`badge-sport-${court.id}-${sportName}`}
                    >
                      {sportName}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-3">
                  {/* Court Info - Mobile Stack Layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        <span data-testid={`text-court-hours-${court.id}`}>
                          {court.openingTime} - {court.closingTime}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-base md:text-lg text-primary" data-testid={`text-court-rate-${court.id}`}>
                          KSh {court.hourlyRate}/hr
                        </span>
                        {court.peakHourRate && court.peakHourRate > court.hourlyRate && (
                          <span className="text-xs md:text-sm text-gray-500 ml-1 block sm:inline">
                            (Peak: KSh {court.peakHourRate})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - sit above the stretched link via z-10 */}
                  <div className="relative z-10 flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={() => {
                        setSelectedCourt(court);
                        setIsBookingModalOpen(true);
                      }}
                      className="flex-1 sm:flex-none"
                      data-testid={`button-book-court-${court.id}`}
                    >
                      Book Now
                    </Button>
                    <Link href={`/court/${court.id}`} className="flex-1 sm:flex-none">
                      <Button
                        variant="outline"
                        className="w-full"
                        data-testid={`button-view-details-${court.id}`}
                      >
                        View Details
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCourtDetails(showCourtDetails === court.id ? null : court.id);
                      }}
                      className="flex-1 sm:flex-none"
                      data-testid={`button-reviews-${court.id}`}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Reviews
                    </Button>
                  </div>
                </div>

                {court.description && (
                  <p className="text-gray-600 text-xs md:text-sm mt-3" data-testid={`text-court-description-${court.id}`}>
                    {court.description}
                  </p>
                )}

                {/* Expanded Court Details with Reviews */}
                {showCourtDetails === court.id && (
                  <div className="relative z-10 mt-4 pt-4 border-t space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <h4 className="font-semibold text-base">Reviews & Ratings</h4>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCourt(court);
                          setIsReviewModalOpen(true);
                        }}
                        className="w-full sm:w-auto"
                        data-testid={`button-write-review-${court.id}`}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Write Review
                      </Button>
                    </div>
                    <ReviewsList 
                      courtId={court.id} 
                      showAddReviewButton={false}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {useLocationFilter 
                ? `No courts found within ${maxDistance[0]} km of your location.`
                : 'No courts found for the selected filters.'
              }
            </p>
            {useLocationFilter && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setMaxDistance([Math.min(maxDistance[0] + 10, 50)])}
                data-testid="button-expand-search"
              >
                Expand search to {Math.min(maxDistance[0] + 10, 50)} km
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCourt && (
        <>
          <BookingModal
            court={selectedCourt}
            isOpen={isBookingModalOpen}
            onClose={() => {
              setIsBookingModalOpen(false);
              setSelectedCourt(null);
            }}
          />
          
          <ReviewModal
            court={selectedCourt}
            isOpen={isReviewModalOpen}
            onClose={() => {
              setIsReviewModalOpen(false);
              setSelectedCourt(null);
            }}
          />
        </>
      )}
    </div>
  );
}