'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Sidebar from '@/components/Sidebar'
import LandingCard from '@/components/LandingCard'
import { Package, History } from 'lucide-react'

export default function LandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} title="Resi Checker" />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 w-full max-w-2xl mx-auto p-6 flex items-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <LandingCard
            title="Check Resi"
            description="Scan dan cocokkan resi pesanan"
            icon={<Package className="w-12 h-12" />}
            href="/check-resi"
            color="blue"
          />
          <LandingCard
            title="Data Pesanan"
            description="Lihat history data yang sudah disimpan"
            icon={<History className="w-12 h-12" />}
            href="/data-pesanan"
            color="green"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
