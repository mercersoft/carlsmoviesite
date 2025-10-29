import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { Review } from '@/types/review'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface Movie {
  id: string
  title: string
  posterPath: string
  releaseDate: string
}

interface ReviewWithMovie extends Review {
  movie: Movie
}

export default function Reviews() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<ReviewWithMovie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        console.log('Fetching reviews for user:', user.uid)

        // Query reviews for this user
        // Note: We'll sort client-side to avoid needing a composite index
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', user.uid)
        )

        const querySnapshot = await getDocs(reviewsQuery)
        console.log('Found reviews:', querySnapshot.size)

        // Fetch movie data for each review
        const reviewsWithMovies: ReviewWithMovie[] = []

        for (const reviewDoc of querySnapshot.docs) {
          const reviewData = reviewDoc.data() as Review
          console.log('Review data:', {
            id: reviewDoc.id,
            userId: reviewData.userId,
            movieId: reviewData.movieId,
            rating: reviewData.rating
          })

          // Fetch the movie data
          const movieDoc = await getDoc(doc(db, 'movies', reviewData.movieId))

          if (movieDoc.exists()) {
            const movieData = movieDoc.data()
            reviewsWithMovies.push({
              ...reviewData,
              movie: {
                id: movieDoc.id,
                title: movieData.title || 'Untitled',
                posterPath: movieData.posterPath || '',
                releaseDate: movieData.releaseDate || ''
              }
            })
          }
        }

        // Sort by creation date (most recent first) client-side
        reviewsWithMovies.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0
          const bTime = b.createdAt?.toMillis?.() || 0
          return bTime - aTime
        })

        setReviews(reviewsWithMovies)
        console.log('Total reviews with movies:', reviewsWithMovies.length)
      } catch (error) {
        console.error('Error fetching reviews:', error)
        // If it's an index error, log more details
        if (error instanceof Error) {
          console.error('Error details:', error.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [user])

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Extract year from release date
  const getYear = (releaseDate: string) => {
    if (!releaseDate) return ''
    return releaseDate.split('-')[0]
  }

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">My Reviews</h1>
          <p className="text-muted-foreground">
            Please sign in to view your reviews
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">My Reviews</h1>
          <p className="text-muted-foreground">Loading your reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground">
          {reviews.length === 0
            ? 'You haven\'t written any reviews yet'
            : `${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Start reviewing movies to see them here!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <Card key={`${review.userId}_${review.movieId}`} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Movie Poster */}
                <div
                  className="md:w-48 flex-shrink-0 cursor-pointer"
                  onClick={() => navigate(`/movies/${review.movie.id}`)}
                >
                  <img
                    src={review.movie.posterPath ? `${TMDB_IMAGE_BASE}${review.movie.posterPath}` : '/placeholder-movie.jpg'}
                    alt={review.movie.title}
                    className="w-full h-64 md:h-full object-cover hover:opacity-80 transition-opacity"
                  />
                </div>

                {/* Review Content */}
                <div className="flex-1 p-6 space-y-4">
                  {/* Movie Title and Rating */}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">
                      {review.movie.title}
                      {review.movie.releaseDate && (
                        <span className="text-muted-foreground font-normal ml-2">
                          ({getYear(review.movie.releaseDate)})
                        </span>
                      )}
                    </h2>

                    <div className="flex items-center gap-4 text-sm">
                      {/* User's Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{review.rating}/10</span>
                      </div>

                      {/* Watched Date */}
                      {review.watchedDate && (
                        <span className="text-muted-foreground">
                          Watched {formatDate(review.watchedDate)}
                        </span>
                      )}

                      {/* Rewatch Badge */}
                      {review.isRewatch && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          Rewatch
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.reviewText && (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">{review.reviewText}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                    <span>Reviewed {formatDate(review.createdAt)}</span>
                    {review.source === 'letterboxd' && review.letterboxdUrl && (
                      <a
                        href={review.letterboxdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        View on Letterboxd ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
