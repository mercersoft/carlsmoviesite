import { Timestamp } from 'firebase/firestore'

export type ReviewSource = 'letterboxd' | 'manual'

export interface Review {
  // === Identifiers ===
  // Document ID format: {userId}_{movieId}
  userId: string                // Firebase Auth UID
  movieId: string               // Our Firestore movie document ID (same as TMDB ID)

  // === Review Content ===
  rating: number                // 1-10 scale (Letterboxd 0.5-5.0 * 2)
  reviewText: string            // The actual review (HTML stripped)

  // === Viewing Metadata ===
  watchedDate: Timestamp | null // When they watched it
  isRewatch: boolean            // First time vs rewatch

  // === Source Attribution ===
  source: ReviewSource          // Where the review came from
  letterboxdUrl?: string        // Link to original Letterboxd review
  letterboxdReviewId?: string   // Letterboxd guid (prevent duplicate imports)

  // === Timestamps ===
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Data extracted from Letterboxd RSS feed
export interface LetterboxdReviewData {
  tmdbId: number
  filmTitle: string
  filmYear: string
  rating: number                // Already converted to 1-10 scale
  reviewText: string            // HTML stripped
  watchedDate: string | null    // ISO date string
  isRewatch: boolean
  letterboxdUrl: string
  letterboxdReviewId: string
  publishedDate: string         // ISO date string
}
