import { useState } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

export interface SearchFiltersState {
  searchQuery: string
  selectedGenres: string[]
  minRating: number
  yearRange: [number, number]
}

interface SearchFiltersProps {
  filters: SearchFiltersState
  onFiltersChange: (filters: SearchFiltersState) => void
  availableGenres: string[]
  totalResults: number
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableGenres,
  totalResults
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const currentYear = new Date().getFullYear()
  const minYear = 1900

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value })
  }

  const toggleGenre = (genre: string) => {
    const newGenres = filters.selectedGenres.includes(genre)
      ? filters.selectedGenres.filter(g => g !== genre)
      : [...filters.selectedGenres, genre]
    onFiltersChange({ ...filters, selectedGenres: newGenres })
  }

  const handleRatingChange = (value: number[]) => {
    onFiltersChange({ ...filters, minRating: value[0] })
  }

  const handleYearRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, yearRange: [value[0], value[1]] })
  }

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      selectedGenres: [],
      minRating: 0,
      yearRange: [minYear, currentYear]
    })
  }

  const hasActiveFilters =
    filters.searchQuery ||
    filters.selectedGenres.length > 0 ||
    filters.minRating > 0 ||
    filters.yearRange[0] > minYear ||
    filters.yearRange[1] < currentYear

  return (
    <div className="space-y-4">
      {/* Search Bar and Advanced Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search movies by title..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {filters.searchQuery && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showAdvanced ? 'default' : 'outline'}
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Toggle filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {totalResults} {totalResults === 1 ? 'movie' : 'movies'}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-6 p-4 border rounded-lg bg-card">
          {/* Genre Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Genres</Label>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant={filters.selectedGenres.includes(genre) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                  {filters.selectedGenres.includes(genre) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Minimum Rating</Label>
              <span className="text-sm text-muted-foreground">
                {filters.minRating.toFixed(1)}+
              </span>
            </div>
            <Slider
              value={[filters.minRating]}
              onValueChange={handleRatingChange}
              min={0}
              max={10}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0.0</span>
              <span>10.0</span>
            </div>
          </div>

          {/* Year Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Release Year</Label>
              <span className="text-sm text-muted-foreground">
                {filters.yearRange[0]} - {filters.yearRange[1]}
              </span>
            </div>
            <Slider
              value={filters.yearRange}
              onValueChange={handleYearRangeChange}
              min={minYear}
              max={currentYear}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{minYear}</span>
              <span>{currentYear}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
