import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PosterHoverBehavior } from '@/types/settings'

interface MovieCardProps {
  id: string
  title: string
  imageUrl: string
  rating?: number | null
  description?: string | null
  showRating?: boolean
  hoverBehavior?: PosterHoverBehavior
}

export function MovieCard({
  id,
  title,
  imageUrl,
  rating,
  description,
  showRating = true,
  hoverBehavior = 'description'
}: MovieCardProps) {
  const [showDescription, setShowDescription] = useState(false)

  const shouldShowHover = hoverBehavior === 'description' && description

  return (
    <Link to={`/movies/${id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg">
        <div
          className="relative aspect-[2/3] overflow-hidden bg-muted"
          onMouseEnter={() => shouldShowHover && setShowDescription(true)}
          onMouseLeave={() => shouldShowHover && setShowDescription(false)}
        >
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />

          {/* Hover overlay with description */}
          {shouldShowHover && showDescription && (
            <div className="absolute inset-0 bg-black/90 p-4 flex items-center justify-center transition-opacity">
              <p className="text-sm text-white text-center line-clamp-6">
                {description}
              </p>
            </div>
          )}

          {/* Rating badge */}
          {showRating && rating !== null && rating !== undefined && rating > 0 && (
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
