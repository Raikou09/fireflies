import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, ThumbsUp, Flag, Calendar, User, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { ReviewWithDetails } from '@shared/schema';

interface ReviewsListProps {
  courtId: string;
  showAddReviewButton?: boolean;
  onAddReview?: () => void;
}

interface ReviewStatsProps {
  reviews: ReviewWithDetails[];
}

function ReviewStats({ reviews }: ReviewStatsProps) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Star className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">Be the first to review this court!</p>
        </CardContent>
      </Card>
    );
  }

  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );
  
  const avgCleanliness = reviews
    .filter(r => r.courtCleanliness)
    .reduce((sum, r) => sum + (r.courtCleanliness || 0), 0) / 
    reviews.filter(r => r.courtCleanliness).length || 0;
  
  const avgFacilities = reviews
    .filter(r => r.facilitiesQuality)
    .reduce((sum, r) => sum + (r.facilitiesQuality || 0), 0) / 
    reviews.filter(r => r.facilitiesQuality).length || 0;
  
  const avgStaff = reviews
    .filter(r => r.staffService)
    .reduce((sum, r) => sum + (r.staffService || 0), 0) / 
    reviews.filter(r => r.staffService).length || 0;
  
  const avgValue = reviews
    .filter(r => r.valueForMoney)
    .reduce((sum, r) => sum + (r.valueForMoney || 0), 0) / 
    reviews.filter(r => r.valueForMoney).length || 0;

  const recommendationRate = reviews.filter(r => r.wouldRecommend).length / reviews.length * 100;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Rating Overview</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-4xl font-bold">{avgRating.toFixed(1)}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= Math.round(avgRating) 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-600">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>

        <Separator />

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating, index) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-8">{rating}★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ 
                    width: `${reviews.length > 0 ? (ratingCounts[index] / reviews.length) * 100 : 0}%` 
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 w-8">{ratingCounts[index]}</span>
            </div>
          ))}
        </div>

        <Separator />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-2 gap-4">
          {avgCleanliness > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold">{avgCleanliness.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Cleanliness</div>
            </div>
          )}
          {avgFacilities > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold">{avgFacilities.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Facilities</div>
            </div>
          )}
          {avgStaff > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold">{avgStaff.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Staff Service</div>
            </div>
          )}
          {avgValue > 0 && (
            <div className="text-center">
              <div className="text-2xl font-semibold">{avgValue.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Value</div>
            </div>
          )}
        </div>

        {recommendationRate > 0 && (
          <>
            <Separator />
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">{recommendationRate.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Would recommend</div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewCard({ review }: { review: ReviewWithDetails }) {
  const [isHelpful, setIsHelpful] = useState(false);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {review.customer.firstName} {review.customer.lastName}
                  </span>
                  {review.isVerifiedBooking && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>
            
            {/* Overall Rating */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= review.rating 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Title and Comment */}
          {review.title && (
            <h4 className="font-semibold text-lg">{review.title}</h4>
          )}
          
          {review.comment && (
            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
          )}

          {/* Detailed Ratings */}
          {(review.courtCleanliness || review.facilitiesQuality || review.staffService || review.valueForMoney) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {review.courtCleanliness && (
                  <div className="text-center">
                    <div className="font-medium">{review.courtCleanliness}/5</div>
                    <div className="text-gray-600">Cleanliness</div>
                  </div>
                )}
                {review.facilitiesQuality && (
                  <div className="text-center">
                    <div className="font-medium">{review.facilitiesQuality}/5</div>
                    <div className="text-gray-600">Facilities</div>
                  </div>
                )}
                {review.staffService && (
                  <div className="text-center">
                    <div className="font-medium">{review.staffService}/5</div>
                    <div className="text-gray-600">Staff</div>
                  </div>
                )}
                {review.valueForMoney && (
                  <div className="text-center">
                    <div className="font-medium">{review.valueForMoney}/5</div>
                    <div className="text-gray-600">Value</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Recommendation Badge */}
          {review.wouldRecommend && (
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              Recommends this court
            </Badge>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHelpful(!isHelpful)}
              className={isHelpful ? 'text-blue-600' : 'text-gray-600'}
              data-testid={`button-helpful-${review.id}`}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Helpful ({(review.helpfulVotes || 0) + (isHelpful ? 1 : 0)})
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Flag className="h-4 w-4 mr-1" />
              Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReviewsList({ courtId, showAddReviewButton = false, onAddReview }: ReviewsListProps) {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['/api/reviews', courtId],
    queryFn: async () => {
      const response = await fetch(`/api/reviews/${courtId}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Review Button */}
      {showAddReviewButton && onAddReview && (
        <div className="flex justify-center">
          <Button onClick={onAddReview} data-testid="button-add-review">
            <Star className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Stats */}
      <ReviewStats reviews={reviews} />

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          {reviews.map((review: ReviewWithDetails) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}