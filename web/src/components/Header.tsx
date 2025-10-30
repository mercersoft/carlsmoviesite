import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthButton } from '@/components/AuthButton'
import { ThemeToggle } from '@/components/theme-toggle'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[hsl(225,46%,11%)] backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Left side: Hamburger (mobile) + Logo */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* Hamburger Menu - Visible only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-[hsl(240,67%,94%)] hover:bg-[hsl(225,35%,15%)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/assets/logo.svg" alt="Movie Ladder" className="h-10" />
          </Link>
        </div>

        {/* Desktop Navigation - Hidden on mobile */}
        <nav className="hidden md:flex gap-4 items-center">
          <Button variant="ghost" asChild className="text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]">
            <Link to="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild className="text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]">
            <Link to="/movies">Movies</Link>
          </Button>
          <Button variant="ghost" asChild className="text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]">
            <Link to="/reviews">Reviews</Link>
          </Button>
        </nav>

        {/* Right side buttons */}
        <div className="flex gap-1 md:gap-2 items-center flex-shrink-0">
          <AuthButton />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu - Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[hsl(225,30%,20%)] bg-[hsl(225,46%,11%)]">
          <nav className="container py-4 flex flex-col gap-2">
            <Button
              variant="ghost"
              asChild
              className="justify-start text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link to="/">Home</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="justify-start text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link to="/movies">Movies</Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              className="justify-start text-[hsl(240,67%,94%)] hover:text-white hover:bg-[hsl(225,35%,15%)]"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link to="/reviews">Reviews</Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
