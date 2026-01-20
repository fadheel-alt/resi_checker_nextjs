'use client'

import { useEffect, useRef, useState } from 'react'

interface CameraScannerProps {
  onScanSuccess?: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function CameraScanner({ onScanSuccess, onError }: CameraScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const html5QrCodeRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    const startScanner = async () => {
      // Only run in browser environment
      if (typeof window === 'undefined') return

      // Prevent multiple initializations
      if (isInitializing) {
        console.log('Already initializing, skipping...')
        return
      }

      // Wait for any ongoing stop operation
      if (isStopping) {
        console.log('Scanner is stopping, waiting...')
        return
      }

      setIsInitializing(true)

      try {
        setScanning(true)
        setError(null)

        // Dynamically import html5-qrcode only in browser
        const { Html5Qrcode } = await import('html5-qrcode')

        if (!mounted) {
          setIsInitializing(false)
          return
        }

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
      } finally {
        setIsInitializing(false)
      }
    }

    const stopScanner = async () => {
      // Prevent concurrent stops
      if (isStopping) {
        console.log('Already stopping, skipping...')
        return
      }

      if (!html5QrCodeRef.current) {
        setScanning(false)
        return
      }

      setIsStopping(true)

      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('Error stopping scanner:', err)
      } finally {
        setIsStopping(false)
        setScanning(false)
      }
    }

    startScanner()

    return () => {
      mounted = false
      stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
