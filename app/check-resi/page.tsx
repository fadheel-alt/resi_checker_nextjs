'use client'

import { useState, useCallback, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import CsvUploader from '@/components/CsvUploader'
import ScanInput from '@/components/ScanInput'
import Dashboard from '@/components/Dashboard'
import PendingList from '@/components/PendingList'
import { cleanupOldHistory } from '@/db/database'

export default function CheckResiPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Cleanup old history on mount
  useEffect(() => {
    cleanupOldHistory(7).then(result => {
      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} old history records`)
      }
    })
  }, [])

  const handleDataChange = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} title="Check Resi" />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 w-full max-w-lg mx-auto p-4 space-y-4">
        <CsvUploader onImportComplete={handleDataChange} />
        <ScanInput onScanComplete={handleDataChange} />
        <Dashboard refreshTrigger={refreshTrigger} onDataChange={handleDataChange} />
        <PendingList refreshTrigger={refreshTrigger} />
      </main>

      <Footer />
    </div>
  )
}
