import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Sample() {
  const [name, setName] = useState('')

  const movies = [
    { id: 1, title: 'The Shawshank Redemption', year: 1994, rating: 9.3 },
    { id: 2, title: 'The Godfather', year: 1972, rating: 9.2 },
    { id: 3, title: 'The Dark Knight', year: 2008, rating: 9.0 },
    { id: 4, title: 'Pulp Fiction', year: 1994, rating: 8.9 },
  ]

  return (
    <div className="container py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Sample Page</h1>
        <p className="text-muted-foreground">
          A demo showcasing React + TypeScript + Vite + shadcn/ui
        </p>
        <div className="flex gap-2 justify-center">
          <Badge>React</Badge>
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="outline">Vite</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Enter your name to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {name && (
              <p className="text-sm text-muted-foreground">
                Hello, {name}! Welcome to the site.
              </p>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button onClick={() => setName('')} variant="outline">
              Clear
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Learn More</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About This Project</DialogTitle>
                  <DialogDescription>
                    This is a demonstration of shadcn/ui components integrated with
                    Vite, React, and TypeScript. The components are beautifully
                    designed, accessible, and fully customizable.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="default">
              Primary Action
            </Button>
            <Button className="w-full" variant="secondary">
              Secondary Action
            </Button>
            <Button className="w-full" variant="outline">
              Outline Action
            </Button>
            <Button className="w-full" variant="ghost">
              Ghost Action
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Movies</CardTitle>
          <CardDescription>A sample table showcasing movie data</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Classic movies with high ratings</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell className="font-medium">{movie.title}</TableCell>
                  <TableCell>{movie.year}</TableCell>
                  <TableCell className="text-right">{movie.rating}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
