import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { doc, onSnapshot, setDoc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { UserSettings, getDefaultSettings, DeviceType } from '@/types/settings'
import { getDeviceType } from '@/lib/device'

interface SettingsContextType {
  settings: UserSettings | null
  loading: boolean
  deviceType: DeviceType
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>
  resetSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

const SETTINGS_CACHE_KEY = 'userSettings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceType] = useState<DeviceType>(getDeviceType())

  useEffect(() => {
    if (!user) {
      // Clear settings when user logs out
      setSettings(null)
      setLoading(false)
      localStorage.removeItem(SETTINGS_CACHE_KEY)
      return
    }

    // Load from cache immediately for instant UI
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY)
    if (cached) {
      try {
        const parsedSettings = JSON.parse(cached)
        // Convert timestamp strings back to Timestamp objects
        if (parsedSettings.createdAt) {
          parsedSettings.createdAt = new Timestamp(
            parsedSettings.createdAt.seconds,
            parsedSettings.createdAt.nanoseconds
          )
        }
        if (parsedSettings.updatedAt) {
          parsedSettings.updatedAt = new Timestamp(
            parsedSettings.updatedAt.seconds,
            parsedSettings.updatedAt.nanoseconds
          )
        }
        setSettings(parsedSettings)
        setLoading(false)
      } catch (error) {
        console.error('Error parsing cached settings:', error)
      }
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserSettings
          setSettings(data)
          // Cache for fast startup next time
          localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data))
        } else {
          // Document doesn't exist, create it with defaults
          const defaultSettings = getDefaultSettings(deviceType)
          // Set display name from Google account if available
          if (user.displayName) {
            defaultSettings.displayName = user.displayName
          }
          setDoc(doc(db, 'users', user.uid), defaultSettings)
            .then(() => {
              setSettings(defaultSettings)
              localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(defaultSettings))
            })
            .catch((error) => {
              console.error('Error creating user settings:', error)
            })
        }
        setLoading(false)
      },
      (error) => {
        console.error('Settings listener error:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user, deviceType])

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return

    try {
      const updatedSettings = {
        ...updates,
        updatedAt: Timestamp.now(),
      }

      await updateDoc(doc(db, 'users', user.uid), updatedSettings)
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  const resetSettings = async () => {
    if (!user) return

    try {
      const defaultSettings = getDefaultSettings(deviceType)
      // Keep display name from current settings if available
      if (settings?.displayName) {
        defaultSettings.displayName = settings.displayName
      } else if (user.displayName) {
        defaultSettings.displayName = user.displayName
      }

      await setDoc(doc(db, 'users', user.uid), defaultSettings)
      // The real-time listener will update the state automatically
    } catch (error) {
      console.error('Error resetting settings:', error)
      throw error
    }
  }

  const value = {
    settings,
    loading,
    deviceType,
    updateSettings,
    resetSettings,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
