import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  User, Lock, Monitor, Settings as SettingsIcon,
  Bell, Trash2, Download, RefreshCcw
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
]

export default function Settings() {
  const { user } = useAuth()
  const { settings, loading, deviceType, updateSettings, resetSettings } = useSettings()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>(deviceType)

  // Local form state
  const [formData, setFormData] = useState(settings)

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  if (!user) {
    navigate('/')
    return null
  }

  if (loading || !formData) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="text-center">Loading settings...</div>
      </div>
    )
  }

  const handleSave = async () => {
    if (!formData) return

    setSaving(true)
    try {
      await updateSettings(formData)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setSaving(true)
    try {
      await resetSettings()
    } catch (error) {
      console.error('Error resetting settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(formData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `movie-ladder-settings-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      // Delete user settings document
      await deleteDoc(doc(db, 'users', user.uid))

      // Delete Firebase Auth account
      await auth.currentUser?.delete()

      navigate('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting account. You may need to re-authenticate first.')
      setDeleting(false)
    }
  }

  const toggleGenre = (genre: string) => {
    if (!formData) return

    const currentGenres = formData.favoriteGenres || []
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre]

    setFormData({ ...formData, favoriteGenres: newGenres })
  }

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" disabled={saving}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Lock className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="display">
            <Monitor className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Display</span>
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {user?.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-20 w-20 rounded-full"
                  />
                )}
                <div className="text-sm text-muted-foreground">
                  Photo from Google Account
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter a unique username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Your unique handle on Movie Ladder
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="How you'd like to be called"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Favorite Genres</Label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <Badge
                      key={genre}
                      variant={formData.favoriteGenres?.includes(genre) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Make your profile visible to others
                  </p>
                </div>
                <Select
                  value={formData.profileVisibility}
                  onValueChange={(value: 'public' | 'private') =>
                    setFormData({ ...formData, profileVisibility: value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Review Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see your movie reviews
                  </p>
                </div>
                <Select
                  value={formData.reviewVisibility}
                  onValueChange={(value: 'public' | 'friends' | 'private') =>
                    setFormData({ ...formData, reviewVisibility: value })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showEmail">Show Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your profile
                  </p>
                </div>
                <Switch
                  id="showEmail"
                  checked={formData.showEmail}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showEmail: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="activityVisible">Activity Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Show your ratings and reviews to others
                  </p>
                </div>
                <Switch
                  id="activityVisible"
                  checked={formData.activityVisible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, activityVisible: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={activeDevice === 'desktop' ? 'default' : 'outline'}
              onClick={() => setActiveDevice('desktop')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
              {deviceType === 'desktop' && (
                <Badge variant="secondary" className="ml-2">Current</Badge>
              )}
            </Button>
            <Button
              variant={activeDevice === 'mobile' ? 'default' : 'outline'}
              onClick={() => setActiveDevice('mobile')}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Mobile
              {deviceType === 'mobile' && (
                <Badge variant="secondary" className="ml-2">Current</Badge>
              )}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{activeDevice === 'desktop' ? 'Desktop' : 'Mobile'} Display Settings</CardTitle>
              <CardDescription>
                Customize your viewing experience on {activeDevice} devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Movies Per Page: {formData.display[activeDevice].moviesPerPage}</Label>
                <Slider
                  value={[formData.display[activeDevice].moviesPerPage]}
                  onValueChange={([value]) =>
                    setFormData({
                      ...formData,
                      display: {
                        ...formData.display,
                        [activeDevice]: {
                          ...formData.display[activeDevice],
                          moviesPerPage: value
                        }
                      }
                    })
                  }
                  min={6}
                  max={activeDevice === 'desktop' ? 100 : 50}
                  step={6}
                />
                <p className="text-sm text-muted-foreground">
                  Number of movies to load at a time
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Grid Density</Label>
                  <p className="text-sm text-muted-foreground">
                    Spacing between movie cards
                  </p>
                </div>
                <Select
                  value={formData.display[activeDevice].density}
                  onValueChange={(value: 'compact' | 'comfortable' | 'cozy') =>
                    setFormData({
                      ...formData,
                      display: {
                        ...formData.display,
                        [activeDevice]: {
                          ...formData.display[activeDevice],
                          density: value
                        }
                      }
                    })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="cozy">Cozy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor={`showRatings-${activeDevice}`}>Show Ratings on Cards</Label>
                  <p className="text-sm text-muted-foreground">
                    Display ratings badges on movie posters
                  </p>
                </div>
                <Switch
                  id={`showRatings-${activeDevice}`}
                  checked={formData.display[activeDevice].showRatingsOnCards}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      display: {
                        ...formData.display,
                        [activeDevice]: {
                          ...formData.display[activeDevice],
                          showRatingsOnCards: checked
                        }
                      }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Poster Hover Behavior</Label>
                  <p className="text-sm text-muted-foreground">
                    {activeDevice === 'mobile' ? 'Not applicable on mobile' : 'Show description on hover'}
                  </p>
                </div>
                <Select
                  value={formData.display[activeDevice].posterHoverBehavior}
                  onValueChange={(value: 'description' | 'none') =>
                    setFormData({
                      ...formData,
                      display: {
                        ...formData.display,
                        [activeDevice]: {
                          ...formData.display[activeDevice],
                          posterHoverBehavior: value
                        }
                      }
                    })
                  }
                  disabled={activeDevice === 'mobile'}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="description">Show Description</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Preferences</CardTitle>
              <CardDescription>
                Customize what movies you see
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Sort Order</Label>
                  <p className="text-sm text-muted-foreground">
                    How movies are sorted by default
                  </p>
                </div>
                <Select
                  value={formData.preferences.defaultSort}
                  onValueChange={(value: 'popularity' | 'rating' | 'releaseDate' | 'alphabetical') =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        defaultSort: value
                      }
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="releaseDate">Release Date</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Minimum Rating: {formData.preferences.contentFilters.minRating.toFixed(1)}
                </Label>
                <Slider
                  value={[formData.preferences.contentFilters.minRating]}
                  onValueChange={([value]) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        contentFilters: {
                          ...formData.preferences.contentFilters,
                          minRating: value
                        }
                      }
                    })
                  }
                  min={0}
                  max={10}
                  step={0.5}
                />
                <p className="text-sm text-muted-foreground">
                  Hide movies below this rating
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showMature">Show Mature Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Include R-rated and mature content
                  </p>
                </div>
                <Switch
                  id="showMature"
                  checked={formData.preferences.contentFilters.showMatureContent}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        contentFilters: {
                          ...formData.preferences.contentFilters,
                          showMatureContent: checked
                        }
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what updates you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newMovies">New Movies</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when movies in your favorite genres are added
                  </p>
                </div>
                <Switch
                  id="newMovies"
                  checked={formData.emailPreferences.newMovies}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailPreferences: {
                        ...formData.emailPreferences,
                        newMovies: checked
                      }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reviewResponses">Review Responses</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when someone responds to your reviews
                  </p>
                </div>
                <Switch
                  id="reviewResponses"
                  checked={formData.emailPreferences.reviewResponses}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailPreferences: {
                        ...formData.emailPreferences,
                        reviewResponses: checked
                      }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly summary of new movies and reviews
                  </p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={formData.emailPreferences.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      emailPreferences: {
                        ...formData.emailPreferences,
                        weeklyDigest: checked
                      }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
              </div>

              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input
                  value={formData.createdAt?.toDate().toLocaleDateString()}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input
                  value={formData.updatedAt?.toDate().toLocaleDateString()}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your data and account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleExportData} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export My Data
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove all your data from our servers.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete my account'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
