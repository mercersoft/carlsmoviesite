import { useEffect, useState, useMemo } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Review } from '@/types/review'
import { ReviewCard } from '@/components/ReviewCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, Plus, Edit, LogIn } from 'lucide-react'

interface ReviewsListProps {
  movieId: string
  onOpenReviewDialog?: () => void
  refreshKey?: number // When this changes, refetch reviews
}

type SortOption = 'recent' | 'highest' | 'lowest'

interface UserProfile {
  displayName?: string
  email?: string
}

export function ReviewsList({ movieId, onOpenReviewDialog, refreshKey }: ReviewsListProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map())
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  useEffect(() => {
    async function fetchReviews() {
      try {
        setLoading(true)

        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('movieId', '==', movieId)
        )

        const querySnapshot = await getDocs(reviewsQuery)
        const fetchedReviews: Review[] = querySnapshot.docs.map(doc => ({
          ...doc.data() as Review
        }))

        setReviews(fetchedReviews)

        // Fetch user profiles for all unique userIds
        const uniqueUserIds = Array.from(new Set(fetchedReviews.map(r => r.userId)))
        const profiles = new Map<string, UserProfile>()

        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', userId))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                console.log(`[ReviewsList] User ${userId} data:`, userData)
                profiles.set(userId, {
                  displayName: userData.displayName,
                  email: userData.email
                })
              } else {
                console.log(`[ReviewsList] User document does not exist for ${userId}`)
              }
            } catch (error) {
              console.error(`[ReviewsList] Error fetching user profile for ${userId}:`, error)
            }
          })
        )

        console.log('[ReviewsList] Fetched user profiles:', Array.from(profiles.entries()))

        setUserProfiles(profiles)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [movieId, refreshKey])

  // Get display name for a user
  const getUserDisplayName = (userId: string): string => {
    const profile = userProfiles.get(userId)
    if (profile?.displayName) return profile.displayName
    if (profile?.email) {
      // Extract name from email (before @)
      const emailName = profile.email.split('@')[0]
      // Capitalize first letter
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    return 'Anonymous'
  }

  // Calculate average rating
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return sum / reviews.length
  }, [reviews])

  // Check if current user has already reviewed this movie
  const userReview = useMemo(() => {
    if (!user) return null
    return reviews.find(review => review.userId === user.uid)
  }, [reviews, user])

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const sorted = [...reviews]

    switch (sortBy) {
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating)
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating)
      case 'recent':
      default:
        return sorted.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })
    }
  }, [reviews, sortBy])

  // Render star rating for average
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating / 2)
    const hasHalfStar = rating % 2 >= 1

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-5 w-5">
            <Star className="h-5 w-5 text-yellow-500" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            </div>
          </div>
        )
      } else {
        stars.push(
          <Star key={i} className="h-5 w-5 text-muted-foreground" />
        )
      }
    }
    return stars
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              Reviews
              {reviews.length > 0 && (
                <span className="text-muted-foreground font-normal text-base">
                  ({reviews.length})
                </span>
              )}
            </CardTitle>

            {/* Average Rating */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {renderStars(averageRating)}
                </div>
                <span className="text-lg font-semibold">
                  {(averageRating / 2).toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  average rating
                </span>
              </div>
            )}
          </div>

          {/* Review Action Button */}
          {!user ? (
            <Button size="sm" variant="outline" disabled>
              <LogIn className="h-4 w-4 mr-2" />
              Log in to write a review
            </Button>
          ) : userReview ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenReviewDialog}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Your Review
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onOpenReviewDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No reviews yet. Be the first to review this movie!
            </p>
            {user ? (
              <Button onClick={onOpenReviewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <LogIn className="h-4 w-4 mr-2" />
                Log in to write a review
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Sort Dropdown */}
            <div className="flex items-center justify-between border-b pb-4">
              <p className="text-sm text-muted-foreground">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="highest">Highest Rated</SelectItem>
                    <SelectItem value="lowest">Lowest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {sortedReviews.map((review) => (
                <ReviewCard
                  key={`${review.userId}_${review.movieId}`}
                  review={review}
                  userName={review.userId === user?.uid ? undefined : getUserDisplayName(review.userId)}
                  isOwnReview={review.userId === user?.uid}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
