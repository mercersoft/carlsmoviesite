import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Stats {
  totalMovies: number
  uniqueGenres: number
  averageRating: number
  totalActors: number
  uniqueDirectors: number
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const moviesSnapshot = await getDocs(collection(db, 'movies'))

        const allGenres = new Set<string>()
        const allActors = new Set<number>()
        const allDirectors = new Set<string>()
        let totalRating = 0
        let ratedMoviesCount = 0

        moviesSnapshot.docs.forEach(doc => {
          const data = doc.data()

          // Genres
          if (data.genres && Array.isArray(data.genres)) {
            data.genres.forEach((genre: string) => allGenres.add(genre))
          }

          // Actors
          if (data.cast && Array.isArray(data.cast)) {
            data.cast.forEach((actor: any) => allActors.add(actor.id))
          }

          // Directors
          if (data.director) {
            allDirectors.add(data.director)
          }

          // Ratings
          if (data.voteAverage && data.voteAverage > 0) {
            totalRating += data.voteAverage
            ratedMoviesCount++
          }
        })

        setStats({
          totalMovies: moviesSnapshot.size,
          uniqueGenres: allGenres.size,
          averageRating: ratedMoviesCount > 0 ? totalRating / ratedMoviesCount : 0,
          totalActors: allActors.size,
          uniqueDirectors: allDirectors.size
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="container py-16 space-y-12">
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-6xl font-bold tracking-tight">
          Welcome to Movie Ladder
        </h1>
        <p className="text-xl text-muted-foreground">
          Discover, explore, and climb through thousands of amazing movies
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild size="lg">
            <Link to="/movies">Browse Movies</Link>
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Our Collection</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              {loading ? (
                <div className="text-4xl font-bold text-muted-foreground animate-pulse">...</div>
              ) : (
                <div className="text-4xl font-bold text-primary">{stats?.totalMovies.toLocaleString()}</div>
              )}
              <p className="text-sm text-muted-foreground mt-2">Movies</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              {loading ? (
                <div className="text-4xl font-bold text-muted-foreground animate-pulse">...</div>
              ) : (
                <div className="text-4xl font-bold text-primary">{stats?.uniqueGenres}</div>
              )}
              <p className="text-sm text-muted-foreground mt-2">Genres</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              {loading ? (
                <div className="text-4xl font-bold text-muted-foreground animate-pulse">...</div>
              ) : (
                <div className="text-4xl font-bold text-primary">{stats?.averageRating.toFixed(1)}</div>
              )}
              <p className="text-sm text-muted-foreground mt-2">Avg Rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              {loading ? (
                <div className="text-4xl font-bold text-muted-foreground animate-pulse">...</div>
              ) : (
                <div className="text-4xl font-bold text-primary">{stats?.totalActors.toLocaleString()}</div>
              )}
              <p className="text-sm text-muted-foreground mt-2">Actors</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              {loading ? (
                <div className="text-4xl font-bold text-muted-foreground animate-pulse">...</div>
              ) : (
                <div className="text-4xl font-bold text-primary">{stats?.uniqueDirectors.toLocaleString()}</div>
              )}
              <p className="text-sm text-muted-foreground mt-2">Directors</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="text-4xl mb-2">🎬</div>
            <h3 className="font-semibold text-lg">Extensive Collection</h3>
            <p className="text-sm text-muted-foreground">
              Browse through hundreds of movies from various genres and eras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="text-4xl mb-2">⭐</div>
            <h3 className="font-semibold text-lg">Ratings & Reviews</h3>
            <p className="text-sm text-muted-foreground">
              See ratings, reviews, and detailed information about each movie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <div className="text-4xl mb-2">📱</div>
            <h3 className="font-semibold text-lg">Mobile Friendly</h3>
            <p className="text-sm text-muted-foreground">
              Enjoy a seamless experience across all your devices
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
