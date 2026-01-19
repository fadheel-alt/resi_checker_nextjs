'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { markAsScanned } from '@/db/database'
import CameraScanner from './CameraScanner'

const FEEDBACK_DURATION = 2000
const SCAN_DEBOUNCE_MS = 500

interface FeedbackState {
  type: 'success' | 'warning' | 'error'
  message: string
}

interface ScanInputProps {
  onScanComplete?: () => void
}

export default function ScanInput({ onScanComplete }: ScanInputProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual')
  const [inputValue, setInputValue] = useState('')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [processing, setProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const feedbackTimeout = useRef<NodeJS.Timeout | null>(null)
  const lastScanRef = useRef<{ value: string; timestamp: number } | null>(null)

  // Detect device type for default mode
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    setMode(isMobile ? 'camera' : 'manual')
  }, [])

  // Auto-focus on mount dan setiap kali feedback berubah (manual mode only)
  useEffect(() => {
    if (mode === 'manual') {
      inputRef.current?.focus()
    }
  }, [feedback, mode])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current)
      }
    }
  }, [])

  const showFeedback = (type: 'success' | 'warning' | 'error', message: string) => {
    // Clear previous timeout
    if (feedbackTimeout.current) {
      clearTimeout(feedbackTimeout.current)
    }

    setFeedback({ type, message })

    // Auto-hide feedback
    feedbackTimeout.current = setTimeout(() => {
      setFeedback(null)
    }, FEEDBACK_DURATION)
  }

  const processScan = useCallback(async (trackingNumber: string) => {
    // Debounce: ignore if same value scanned within debounce window
    const now = Date.now()
    if (
      lastScanRef.current &&
      lastScanRef.current.value === trackingNumber &&
      now - lastScanRef.current.timestamp < SCAN_DEBOUNCE_MS
    ) {
      console.log('Duplicate scan detected, ignoring...')
      return
    }

    lastScanRef.current = { value: trackingNumber, timestamp: now }
    setProcessing(true)

    try {
      const result = await markAsScanned(trackingNumber)

      if (result.success) {
        showFeedback('success', `${trackingNumber}`)
        onScanComplete?.()
      } else if (result.reason === 'not_found') {
        showFeedback('error', `Tidak ditemukan: ${trackingNumber}`)
      } else if (result.reason === 'already_scanned') {
        showFeedback('warning', `Sudah discan: ${trackingNumber}`)
      }
    } catch (err: any) {
      showFeedback('error', `Error: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }, [onScanComplete])

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return

    const trackingNumber = inputValue.trim()
    if (!trackingNumber) {
      setInputValue('')
      return
    }

    await processScan(trackingNumber)
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleCameraScan = useCallback(async (trackingNumber: string) => {
    await processScan(trackingNumber)
  }, [processScan])

  const getFeedbackStyle = () => {
    if (!feedback) return 'border-gray-300 bg-white'

    switch (feedback.type) {
      case 'success':
        return 'border-green-500 bg-green-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-gray-300 bg-white'
    }
  }

  const getFeedbackTextColor = () => {
    if (!feedback) return ''

    switch (feedback.type) {
      case 'success':
        return 'text-green-700'
      case 'warning':
        return 'text-yellow-700'
      case 'error':
        return 'text-red-700'
      default:
        return ''
    }
  }

  const getFeedbackIcon = () => {
    if (!feedback) return null

    switch (feedback.type) {
      case 'success':
        return '✓'
      case 'warning':
        return '!'
      case 'error':
        return '✕'
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-800 mb-3">Scan Barcode</h2>

      {/* Toggle Button */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 py-2 px-3 rounded font-medium transition-colors ${
            mode === 'camera'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📷 Camera
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 px-3 rounded font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ⌨️ Manual
        </button>
      </div>

      {/* Conditional Render: Camera or Manual */}
      {mode === 'camera' ? (
        <CameraScanner
          onScanSuccess={handleCameraScan}
          onError={(err) => showFeedback('error', err)}
        />
      ) : (
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={processing}
            placeholder="Scan barcode disini..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full p-3 text-lg border-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${getFeedbackStyle()} disabled:opacity-50`}
          />

          {/* Processing indicator */}
          {processing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Message */}
      {feedback && (
        <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${getFeedbackStyle()} ${getFeedbackTextColor()}`}>
          <span className="text-xl font-bold">{getFeedbackIcon()}</span>
          <span className="font-medium break-all">{feedback.message}</span>
        </div>
      )}

      <p className="mt-2 text-xs text-gray-500">
        {mode === 'camera'
          ? 'Arahkan camera ke barcode untuk scan otomatis'
          : 'Arahkan cursor ke input, lalu scan barcode dengan scanner'}
      </p>
    </div>
  )
}
