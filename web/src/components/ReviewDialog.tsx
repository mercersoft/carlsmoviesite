import { useState, useEffect } from 'react'
import { doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Review } from '@/types/review'
import { StarRating } from '@/components/StarRating'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movieId: string
  movieTitle: string
  moviePosterPath?: string
  existingReview?: Review | null
  onReviewSaved?: () => void
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w200'

export function ReviewDialog({
  open,
  onOpenChange,
  movieId,
  movieTitle,
  moviePosterPath,
  existingReview,
  onReviewSaved
}: ReviewDialogProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [watchedDate, setWatchedDate] = useState('')
  const [isRewatch, setIsRewatch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isEditing = !!existingReview

  // Populate form when editing
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating)
      setReviewText(existingReview.reviewText || '')
      setIsRewatch(existingReview.isRewatch || false)

      if (existingReview.watchedDate) {
        const date = existingReview.watchedDate.toDate()
        setWatchedDate(date.toISOString().split('T')[0])
      } else {
        setWatchedDate('')
      }
    } else {
      // Reset for new review
      setRating(0)
      setReviewText('')
      setWatchedDate(new Date().toISOString().split('T')[0]) // Default to today
      setIsRewatch(false)
    }
  }, [existingReview, open])

  const handleSave = async () => {
    if (!user || rating === 0) return

    setSaving(true)
    try {
      const reviewData: Review = {
        userId: user.uid,
        movieId: movieId,
        rating: rating,
        reviewText: reviewText.trim(),
        watchedDate: watchedDate ? Timestamp.fromDate(new Date(watchedDate)) : null,
        isRewatch: isRewatch,
        source: 'manual',
        createdAt: existingReview?.createdAt || Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      // Document ID format: {userId}_{movieId}
      const reviewDocId = `${user.uid}_${movieId}`
      await setDoc(doc(db, 'reviews', reviewDocId), reviewData)

      onOpenChange(false)
      if (onReviewSaved) {
        onReviewSaved()
      }
    } catch (error) {
      console.error('Error saving review:', error)
      alert('Failed to save review. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    const confirmed = window.confirm('Are you sure you want to delete your review? This cannot be undone.')
    if (!confirmed) return

    setDeleting(true)
    try {
      const reviewDocId = `${user.uid}_${movieId}`
      await deleteDoc(doc(db, 'reviews', reviewDocId))

      onOpenChange(false)
      if (onReviewSaved) {
        onReviewSaved()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        {/* 2x2 Grid: Title and Rating on left, Poster on right (spanning 2 rows) */}
        <div className="grid grid-cols-[1fr_auto] gap-4 mb-2">
          {/* Left column - Title and Rating */}
          <div className="space-y-4">
            {/* Title */}
            <DialogHeader className="space-y-1">
              <DialogTitle>
                {isEditing ? 'Edit Your Review' : 'Write a Review'}
              </DialogTitle>
              <DialogDescription>
                {movieTitle}
              </DialogDescription>
            </DialogHeader>

            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating *</Label>
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating === 0 && (
                <p className="text-xs text-muted-foreground">
                  Click on stars to set your rating
                </p>
              )}
            </div>
          </div>

          {/* Right column - Movie Poster (spans 2 rows) */}
          {moviePosterPath && (
            <div className="row-span-2 mt-2">
              <img
                src={`${TMDB_IMAGE_BASE}${moviePosterPath}`}
                alt={movieTitle}
                className="w-24 h-36 object-cover rounded-md border shadow-md"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review-text">Your Review (Optional)</Label>
            <Textarea
              id="review-text"
              placeholder="Share your thoughts about this movie..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {reviewText.length} characters
            </p>
          </div>

          {/* Watched Date */}
          <div className="space-y-2">
            <Label htmlFor="watched-date">When did you watch it?</Label>
            <input
              id="watched-date"
              type="date"
              value={watchedDate}
              onChange={(e) => setWatchedDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Rewatch Checkbox */}
          <div className="flex items-center space-x-2">
            <Switch
              id="rewatch"
              checked={isRewatch}
              onCheckedChange={setIsRewatch}
            />
            <Label htmlFor="rewatch" className="cursor-pointer">
              I've seen this before (rewatch)
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="sm:mr-auto"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Review'
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || deleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={rating === 0 || saving || deleting}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
