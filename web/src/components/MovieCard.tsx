import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface MovieCardProps {
  id: string
  title: string
  imageUrl: string
  rating?: number | null
  description?: string | null
}

export function MovieCard({ id, title, imageUrl, rating, description }: MovieCardProps) {
  const [showDescription, setShowDescription] = useState(false)

  return (
    <Link to={`/movies/${id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <div
          className="relative aspect-[2/3] overflow-hidden bg-muted"
          onMouseEnter={() => setShowDescription(true)}
          onMouseLeave={() => setShowDescription(false)}
        >
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />

          {/* Hover overlay with description */}
          {description && showDescription && (
            <div className="absolute inset-0 bg-black/90 p-4 flex items-center justify-center transition-opacity">
              <p className="text-sm text-white text-center line-clamp-6">
                {description}
              </p>
            </div>
          )}

          {/* Rating badge */}
          {rating !== null && rating !== undefined && rating > 0 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-black/70 text-white">
                ⭐ {rating.toFixed(1)}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
        </CardContent>
      </Card>
    </Link>
  )
}
