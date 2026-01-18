'use client'

import { useEffect, useRef, useState } from 'react'

interface CameraScannerProps {
  onScanSuccess?: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function CameraScanner({ onScanSuccess, onError }: CameraScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      // Only run in browser environment
      if (typeof window === 'undefined') return

      try {
        setScanning(true)
        setError(null)

        // Dynamically import html5-qrcode only in browser
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!mounted) return

        html5QrCodeRef.current = new Html5Qrcode("camera-reader")

        await html5QrCodeRef.current.start(
          { facingMode: "environment" }, // Back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 150 }
          },
          (decodedText: string) => {
            // Barcode detected
            stopScanner()
            onScanSuccess?.(decodedText)
          },
          (errorMessage: string) => {
            // Scan error (ignore, too noisy)
          }
        )
      } catch (err: any) {
        if (mounted) {
          setError(err.message)
          setScanning(false)
          onError?.(err.message)
        }
      }
    }

    const stopScanner = async () => {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop()
          html5QrCodeRef.current.clear()
        } catch (err) {
          console.error('Error stopping scanner:', err)
        }
      }
      setScanning(false)
    }

    startScanner()

    return () => {
      mounted = false
      stopScanner()
    }
  }, [onScanSuccess, onError])

  return (
    <div className="space-y-2">
      <div id="camera-reader" className="w-full rounded-lg overflow-hidden border-2 border-blue-500"></div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {error}
        </div>
      )}
      {scanning && (
        <p className="text-xs text-gray-500 text-center">
          Arahkan camera ke barcode...
        </p>
      )}
    </div>
  )
}
