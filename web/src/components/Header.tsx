import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthButton } from '@/components/AuthButton'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(225,46%,11%)] backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <nav className="flex gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/assets/logo.svg" alt="Movie Ladder" className="h-10" />
          </Link>
          <div className="flex gap-4 items-center">
            <Button variant="ghost" asChild className="text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]">
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild className="text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]">
              <Link to="/movies">Movies</Link>
            </Button>
            <Button variant="ghost" asChild className="text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]">
              <Link to="/reviews">Reviews</Link>
            </Button>
          </div>
        </nav>

        <div className="flex gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
