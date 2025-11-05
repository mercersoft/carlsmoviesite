import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number // 0-10 scale (0.5 increments for half stars)
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

export function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const starSize = sizeClasses[size]
  const displayValue = hoverValue !== null ? hoverValue : value

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (readonly) return
    const newRating = starIndex * 2 + (isHalf ? 1 : 2)
    onChange(newRating)
  }

  const handleMouseEnter = (starIndex: number, isHalf: boolean) => {
    if (readonly) return
    const rating = starIndex * 2 + (isHalf ? 1 : 2)
    setHoverValue(rating)
  }

  const handleMouseLeave = () => {
    if (readonly) return
    setHoverValue(null)
  }

  const renderStar = (starIndex: number) => {
    const starValue = starIndex * 2
    const isFull = displayValue >= starValue + 2
    const isHalf = displayValue === starValue + 1

    return (
      <div
        key={starIndex}
        className="relative inline-block cursor-pointer"
        onMouseLeave={handleMouseLeave}
      >
        {/* Left half (for half star) */}
        <div
          className="absolute inset-0 w-1/2 z-10"
          onClick={() => handleStarClick(starIndex, true)}
          onMouseEnter={() => handleMouseEnter(starIndex, true)}
        />

        {/* Right half (for full star) */}
        <div
          className="absolute inset-0 left-1/2 w-1/2 z-10"
          onClick={() => handleStarClick(starIndex, false)}
          onMouseEnter={() => handleMouseEnter(starIndex, false)}
        />

        {/* Star background */}
        <Star className={`${starSize} text-muted-foreground`} />

        {/* Star fill */}
        {(isFull || isHalf) && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: isFull ? '100%' : '50%' }}
          >
            <Star className={`${starSize} fill-yellow-500 text-yellow-500`} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map(renderStar)}
      <span className="ml-2 text-sm font-medium">
        {displayValue > 0 ? `${(displayValue / 2).toFixed(1)}/5` : 'No rating'}
      </span>
    </div>
  )
}
