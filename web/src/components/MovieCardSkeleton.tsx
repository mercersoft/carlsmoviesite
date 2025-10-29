import { Card, CardContent } from '@/components/ui/card'

export function MovieCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[2/3] bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="h-5 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  )
}
