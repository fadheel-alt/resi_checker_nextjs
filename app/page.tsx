'use client'

import { useState, useCallback } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CsvUploader from '@/components/CsvUploader'
import ScanInput from '@/components/ScanInput'
import Dashboard from '@/components/Dashboard'
import PendingList from '@/components/PendingList'

export default function HomePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleDataChange = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-lg mx-auto p-4 space-y-4">
        <CsvUploader onImportComplete={handleDataChange} />
        <ScanInput onScanComplete={handleDataChange} />
        <Dashboard refreshTrigger={refreshTrigger} />
        <PendingList refreshTrigger={refreshTrigger} />
      </main>

      <Footer />
    </div>
  )
}
