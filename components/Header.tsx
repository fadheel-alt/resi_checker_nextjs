'use client'

import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Menu } from 'lucide-react'
import { successSound } from '@/utils/soundPlayer'

interface HeaderProps {
  onMenuClick?: () => void
  title?: string
}

export default function Header({ onMenuClick, title = 'Resi Checker' }: HeaderProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)

  useEffect(() => {
    // Initialize sound state from soundPlayer
    setSoundEnabled(successSound.isEnabled())
  }, [])

  const toggleSound = () => {
    const newState = successSound.toggle()
    setSoundEnabled(newState)
  }

  return (
    <header className="bg-gray-800 text-white py-4 px-4 sticky top-0 z-10">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {/* Burger Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
            title="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h1 className="text-xl font-bold flex-1 text-center">{title}</h1>

        {/* Sound Toggle Button */}
        <button
          onClick={toggleSound}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
          title={soundEnabled ? 'Matikan suara' : 'Nyalakan suara'}
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  )
}
