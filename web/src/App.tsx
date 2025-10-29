import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'
import { AuthButton } from '@/components/AuthButton'
import { Button } from '@/components/ui/button'
import Home from '@/pages/Home'
import Movies from '@/pages/Movies'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background p-8">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <AuthButton />
          <ThemeToggle />
        </div>

        <nav className="max-w-6xl mx-auto mb-8">
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/movies">Movies</Link>
            </Button>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
