'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react'

interface ScanToastProps {
  type: 'success' | 'error' | 'warning'
  trackingNumber: string
  message: string
  onClose: () => void
}

export default function ScanToast({ type, trackingNumber, message, onClose }: ScanToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    // Wait for animation to complete before calling onClose
    setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    // Auto-dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 2500)

    return () => clearTimeout(timer)
  }, [handleClose])

  // Color schemes based on type
  const styles = {
    success: {
      bg: 'bg-green-500',
      border: 'border-green-600',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-red-500',
      border: 'border-red-600',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-yellow-500',
      border: 'border-yellow-600',
      icon: AlertTriangle,
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div
      className={`fixed z-[60] ${isExiting ? 'animate-slide-out-down' : 'animate-slide-in-down'}
        top-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0
        w-[calc(100%-2rem)] max-w-sm`}
      role="alert"
      aria-live="polite"
      onClick={handleClose}
    >
      <div
        className={`${style.bg} ${style.border} border-2 rounded-lg shadow-lg
          text-white p-4 cursor-pointer hover:shadow-xl transition-shadow
          flex flex-col gap-2`}
      >
        {/* Header with icon and close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6 flex-shrink-0" />
            <span className="font-bold text-lg">{message}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClose()
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracking number */}
        <div className="pl-8">
          <div className="text-2xl font-mono font-bold tracking-wide">
            {trackingNumber}
          </div>
        </div>
      </div>
    </div>
  )
}
