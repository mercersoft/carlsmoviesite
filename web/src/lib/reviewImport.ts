import { doc, getDoc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LetterboxdReviewData, Review } from '@/types/review'
import { parseLetterboxdRSS } from '@/lib/letterboxd'
import { fetchMovieFromTMDB, convertTMDBToFirestoreMovie } from '@/lib/tmdb'

export interface ImportProgress {
  total: number
  processed: number
  imported: number
  skipped: number
  failed: number
  currentMovie?: string
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

/**
 * Check if a review already exists for this user and movie
 */
async function reviewExists(userId: string, movieId: string): Promise<boolean> {
  const reviewId = `${userId}_${movieId}`
  const reviewDoc = await getDoc(doc(db, 'reviews', reviewId))
  return reviewDoc.exists()
}

/**
 * Check if a review with this Letterboxd ID already exists for this user
 */
async function letterboxdReviewExists(userId: string, letterboxdReviewId: string): Promise<boolean> {
  const reviewsRef = collection(db, 'reviews')
  const q = query(
    reviewsRef,
    where('userId', '==', userId),
    where('letterboxdReviewId', '==', letterboxdReviewId)
  )
  const querySnapshot = await getDocs(q)
  return !querySnapshot.empty
}

/**
 * Verify that a movie exists in our database, and fetch from TMDB if not
 * Returns true if movie exists or was successfully fetched
 */
async function ensureMovieExists(movieId: string, tmdbId: number, filmTitle: string): Promise<boolean> {
  // Check if movie already exists
  const movieDoc = await getDoc(doc(db, 'movies', movieId))
  if (movieDoc.exists()) {
    return true
  }

  // Movie doesn't exist, try to fetch from TMDB
  console.log(`Fetching movie from TMDB: ${filmTitle} (${tmdbId})`)
  const tmdbMovie = await fetchMovieFromTMDB(tmdbId)

  if (!tmdbMovie) {
    return false // Movie not found on TMDB either
  }

  // Convert and store the movie
  try {
    const firestoreMovie = convertTMDBToFirestoreMovie(tmdbMovie)
    await setDoc(doc(db, 'movies', movieId), firestoreMovie)
    console.log(`Successfully added movie: ${filmTitle}`)
    return true
  } catch (error) {
    console.error(`Error storing movie ${filmTitle}:`, error)
    return false
  }
}

/**
 * Import a single review from Letterboxd data
 */
async function importReview(
  userId: string,
  reviewData: LetterboxdReviewData
): Promise<{ success: boolean; error?: string }> {
  const movieId = reviewData.tmdbId.toString()

  try {
    // Ensure movie exists in our database (fetch from TMDB if needed)
    const movieFound = await ensureMovieExists(movieId, reviewData.tmdbId, reviewData.filmTitle)
    if (!movieFound) {
      return {
        success: false,
        error: `Movie not found on TMDB: ${reviewData.filmTitle} (${reviewData.filmYear})`
      }
    }

    // Check if review already exists (by Letterboxd ID)
    if (reviewData.letterboxdReviewId) {
      const alreadyImported = await letterboxdReviewExists(userId, reviewData.letterboxdReviewId)
      if (alreadyImported) {
        return {
          success: false,
          error: 'Already imported'
        }
      }
    }

    // Check if user already has a review for this movie
    const hasReview = await reviewExists(userId, movieId)
    if (hasReview) {
      return {
        success: false,
        error: 'Review already exists for this movie'
      }
    }

    // Parse watched date
    let watchedDate: Timestamp | null = null
    if (reviewData.watchedDate) {
      try {
        const date = new Date(reviewData.watchedDate)
        watchedDate = Timestamp.fromDate(date)
      } catch (e) {
        console.warn('Failed to parse watched date:', reviewData.watchedDate)
      }
    }

    // Parse published date (when the review was actually written on Letterboxd)
    let createdAt: Timestamp = Timestamp.now()
    if (reviewData.publishedDate) {
      try {
        const date = new Date(reviewData.publishedDate)
        if (!isNaN(date.getTime())) {
          createdAt = Timestamp.fromDate(date)
        }
      } catch (e) {
        console.warn('Failed to parse published date:', reviewData.publishedDate)
      }
    }

    // Create review document
    const reviewId = `${userId}_${movieId}`
    const review: Review = {
      userId,
      movieId,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText,
      watchedDate,
      isRewatch: reviewData.isRewatch,
      source: 'letterboxd',
      letterboxdUrl: reviewData.letterboxdUrl,
      letterboxdReviewId: reviewData.letterboxdReviewId,
      createdAt,
      updatedAt: Timestamp.now()
    }

    await setDoc(doc(db, 'reviews', reviewId), review)

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Import all reviews from a Letterboxd username
 */
export async function importLetterboxdReviews(
  userId: string,
  letterboxdUsername: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    imported: 0,
    skipped: 0,
    failed: 0,
    errors: []
  }

  try {
    // Parse RSS feed
    const reviews = await parseLetterboxdRSS(letterboxdUsername)

    const progress: ImportProgress = {
      total: reviews.length,
      processed: 0,
      imported: 0,
      skipped: 0,
      failed: 0
    }

    // Report initial progress
    if (onProgress) {
      onProgress({ ...progress })
    }

    // Import each review
    for (const reviewData of reviews) {
      progress.currentMovie = `${reviewData.filmTitle} (${reviewData.filmYear})`

      const importResult = await importReview(userId, reviewData)

      if (importResult.success) {
        progress.imported++
        result.imported++
      } else {
        if (importResult.error?.includes('Already imported') ||
            importResult.error?.includes('already exists')) {
          progress.skipped++
          result.skipped++
        } else {
          progress.failed++
          result.failed++
          if (importResult.error) {
            result.errors.push(`${reviewData.filmTitle}: ${importResult.error}`)
          }
        }
      }

      progress.processed++

      // Report progress
      if (onProgress) {
        onProgress({ ...progress })
      }

      // Small delay to avoid overwhelming Firestore and TMDB API (rate limit: 40/10s)
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    result.success = true
    return result
  } catch (error: any) {
    result.errors.push(error.message || 'Failed to fetch or parse RSS feed')
    return result
  }
}
