import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export default function Movies() {
  return (
    <div className="container py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Movies</h1>
        <p className="text-muted-foreground">
          Browse our collection of movies
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movies List</CardTitle>
          <CardDescription>Coming soon...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Movie list will be displayed here once connected to the database.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
