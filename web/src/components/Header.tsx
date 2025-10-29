import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthButton } from '@/components/AuthButton'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <nav className="flex gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Movie Ladder</span>
          </Link>
          <div className="flex gap-4 items-center">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/movies">Movies</Link>
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
