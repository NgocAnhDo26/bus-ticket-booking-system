import { useState } from 'react';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useCreateReview } from '../hooks';
import { StarRating } from './StarRating';

interface ReviewFormProps {
  bookingId: string;
  onSuccess?: () => void;
}

export const ReviewForm = ({ bookingId, onSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const createReviewMutation = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success('Cảm ơn bạn đã đánh giá!');
      setRating(0);
      setComment('');
      onSuccess?.();
    } catch (error) {
      toast.error('Không thể gửi đánh giá. Vui lòng thử lại.');
      console.error('Review submission error:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đánh giá chuyến đi</CardTitle>
        <CardDescription>
          Chia sẻ trải nghiệm của bạn để giúp người khác có quyết định tốt hơn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Đánh giá sao *</Label>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
              className="justify-start"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Nhận xét (tùy chọn)</Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createReviewMutation.isPending || rating === 0}
          >
            {createReviewMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
