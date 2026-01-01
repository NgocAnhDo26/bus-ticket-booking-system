import { format } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';

import type { ReviewResponse } from '../api';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: ReviewResponse;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <Card>
      <CardContent>
        <div className="space-y-3">
          {/* Header: User info and rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {review.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{review.user.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(review.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} size="md" />
          </div>

          {/* Route info */}
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">Chuyến đi: </span>
            <span className="font-medium">{review.route.originCity}</span>
            <span className="mx-2">→</span>
            <span className="font-medium">{review.route.destinationCity}</span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
