import { useState } from 'react'
import { Star, Calendar, RefreshCw, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Review } from '@/types/review'
import { Timestamp } from 'firebase/firestore'

interface ReviewCardProps {
  review: Review
  userName?: string
  isOwnReview?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function ReviewCard({ review, userName, isOwnReview = false }: ReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const maxLength = 300 // Characters to show before "Read more"

  // Format the watched date
  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return null

    const date = timestamp.toDate()
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 >= 1

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <Star className="h-4 w-4 text-yellow-500" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star key={i} className="h-4 w-4 text-muted-foreground" />
        )
      }
    }
    return stars
  }

  const needsExpansion = review.reviewText.length > maxLength
  const displayText = needsExpansion && !isExpanded
    ? review.reviewText.slice(0, maxLength) + '...'
    : review.reviewText

  const watchedDateFormatted = formatDate(review.watchedDate)
  const createdDateFormatted = formatDate(review.createdAt)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header: User and Rating */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {userName ? userName[0].toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    {isOwnReview ? 'You' : (userName || 'Anonymous')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {createdDateFormatted}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {renderStars(review.rating)}
              <span className="ml-2 text-sm font-medium">{(review.rating / 2).toFixed(1)}</span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            {watchedDateFormatted && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Watched {watchedDateFormatted}
              </Badge>
            )}
            {review.isRewatch && (
              <Badge variant="secondary" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Rewatch
              </Badge>
            )}
            {review.source === 'letterboxd' && review.letterboxdUrl && (
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                <a
                  href={review.letterboxdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Letterboxd
                </a>
              </Badge>
            )}
          </div>

          {/* Review Text */}
          {review.reviewText && (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {displayText}
              </p>
              {needsExpansion && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-auto p-0 text-primary hover:bg-transparent"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
