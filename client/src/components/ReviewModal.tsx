import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Star, MapPin, Calendar } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { CourtWithDetails, BookingWithDetails } from '@shared/schema';

interface ReviewModalProps {
  court?: CourtWithDetails;
  booking?: BookingWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  courtCleanliness: number;
  facilitiesQuality: number;
  staffService: number;
  valueForMoney: number;
  wouldRecommend: boolean;
}

export function ReviewModal({ court, booking, isOpen, onClose }: ReviewModalProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
    courtCleanliness: 5,
    facilitiesQuality: 5,
    staffService: 5,
    valueForMoney: 5,
    wouldRecommend: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: ReviewFormData) => {
      const courtId = court?.id || booking?.court.id;
      const bookingId = booking?.id;
      
      return apiRequest('POST', '/api/reviews', {
        ...reviewData,
        courtId,
        bookingId,
        isVerifiedBooking: !!booking,
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review helps other users.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courts'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Review Failed",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      rating: 5,
      title: '',
      comment: '',
      courtCleanliness: 5,
      facilitiesQuality: 5,
      staffService: 5,
      valueForMoney: 5,
      wouldRecommend: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.comment.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and comment for your review.",
        variant: "destructive",
      });
      return;
    }
    
    createReviewMutation.mutate(formData);
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label,
    testId
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
    testId: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition-transform"
            data-testid={`${testId}-star-${star}`}
          >
            <Star
              className={`h-6 w-6 ${
                star <= value 
                  ? 'text-yellow-400 fill-yellow-400' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">({value}/5)</span>
      </div>
    </div>
  );

  const displayCourt = court || booking?.court;
  if (!displayCourt) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Write a Review
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Court Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <h3 className="font-semibold">{displayCourt.name}</h3>
                  <p className="text-sm text-gray-600">{displayCourt.area}, {displayCourt.city}</p>
                  {booking && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Booked on {new Date(booking.bookingDate).toDateString()}</span>
                      {booking.isVerifiedBooking && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Verified Booking
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Rating */}
          <StarRating
            value={formData.rating}
            onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            label="Overall Rating"
            testId="overall-rating"
          />

          {/* Review Title */}
          <div className="space-y-2">
            <Label htmlFor="review-title">Review Title</Label>
            <Input
              id="review-title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience in a few words"
              maxLength={100}
              data-testid="input-review-title"
            />
          </div>

          {/* Review Comment */}
          <div className="space-y-2">
            <Label htmlFor="review-comment">Your Review</Label>
            <Textarea
              id="review-comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience with others. What did you like? What could be improved?"
              className="min-h-[120px]"
              maxLength={1000}
              data-testid="textarea-review-comment"
            />
            <p className="text-xs text-gray-500">{formData.comment.length}/1000 characters</p>
          </div>

          <Separator />

          {/* Detailed Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Rate Specific Aspects</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StarRating
                value={formData.courtCleanliness}
                onChange={(rating) => setFormData(prev => ({ ...prev, courtCleanliness: rating }))}
                label="Court Cleanliness"
                testId="cleanliness-rating"
              />
              
              <StarRating
                value={formData.facilitiesQuality}
                onChange={(rating) => setFormData(prev => ({ ...prev, facilitiesQuality: rating }))}
                label="Facilities Quality"
                testId="facilities-rating"
              />
              
              <StarRating
                value={formData.staffService}
                onChange={(rating) => setFormData(prev => ({ ...prev, staffService: rating }))}
                label="Staff Service"
                testId="staff-rating"
              />
              
              <StarRating
                value={formData.valueForMoney}
                onChange={(rating) => setFormData(prev => ({ ...prev, valueForMoney: rating }))}
                label="Value for Money"
                testId="value-rating"
              />
            </div>
          </div>

          <Separator />

          {/* Recommendation */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="would-recommend">Would you recommend this court?</Label>
              <p className="text-sm text-gray-600">Help other users make informed decisions</p>
            </div>
            <Switch
              id="would-recommend"
              checked={formData.wouldRecommend}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, wouldRecommend: checked }))}
              data-testid="switch-would-recommend"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-review"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createReviewMutation.isPending}
              className="flex-1"
              data-testid="button-submit-review"
            >
              {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}