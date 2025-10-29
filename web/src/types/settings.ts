import { Timestamp } from 'firebase/firestore'

export type DeviceType = 'mobile' | 'desktop'

export type ProfileVisibility = 'public' | 'private'
export type ReviewVisibility = 'public' | 'friends' | 'private'
export type SortOption = 'popularity' | 'rating' | 'releaseDate' | 'alphabetical'
export type DensityOption = 'compact' | 'comfortable' | 'cozy'
export type PosterHoverBehavior = 'description' | 'none'
export type ThemeMode = 'light' | 'dark' | 'system'

export interface EmailPreferences {
  newMovies: boolean
  reviewResponses: boolean
  weeklyDigest: boolean
}

export interface ContentFilters {
  minRating: number
  yearRange: {
    min: number
    max: number
  } | null
  showMatureContent: boolean
}

export interface ThemeSettings {
  mode: ThemeMode
  accentColor?: string
}

export interface DisplaySettings {
  moviesPerPage: number
  density: DensityOption
  showRatingsOnCards: boolean
  posterHoverBehavior: PosterHoverBehavior
}

export interface UserPreferences {
  defaultSort: SortOption
  contentFilters: ContentFilters
}

export interface LetterboxdIntegration {
  username: string              // Letterboxd username
  lastImportDate: Timestamp | null
  totalReviewsImported: number
}

export interface UserSettings {
  // Profile
  username: string
  displayName: string
  bio: string
  favoriteGenres: string[]
  profileVisibility: ProfileVisibility

  // Privacy
  reviewVisibility: ReviewVisibility
  showEmail: boolean
  activityVisible: boolean

  // Letterboxd Integration
  letterboxd: LetterboxdIntegration

  // Notifications
  emailPreferences: EmailPreferences

  // Preferences
  preferences: UserPreferences

  // Theme
  theme: ThemeSettings

  // Device-Specific Display Settings
  display: {
    desktop: DisplaySettings
    mobile: DisplaySettings
  }

  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Default settings generator
export function getDefaultSettings(_deviceType: DeviceType = 'desktop'): UserSettings {
  return {
    // Profile
    username: '',
    displayName: '',
    bio: '',
    favoriteGenres: [],
    profileVisibility: 'public',

    // Privacy
    reviewVisibility: 'public',
    showEmail: false,
    activityVisible: true,

    // Letterboxd Integration
    letterboxd: {
      username: '',
      lastImportDate: null,
      totalReviewsImported: 0,
    },

    // Notifications
    emailPreferences: {
      newMovies: false,
      reviewResponses: true,
      weeklyDigest: false,
    },

    // Preferences
    preferences: {
      defaultSort: 'popularity',
      contentFilters: {
        minRating: 0,
        yearRange: null,
        showMatureContent: true,
      },
    },

    // Theme
    theme: {
      mode: 'system',
    },

    // Device-Specific Display Settings
    display: {
      desktop: {
        moviesPerPage: 24,
        density: 'comfortable',
        showRatingsOnCards: true,
        posterHoverBehavior: 'description',
      },
      mobile: {
        moviesPerPage: 12,
        density: 'comfortable',
        showRatingsOnCards: true,
        posterHoverBehavior: 'none',
      },
    },

    // Metadata
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
}
