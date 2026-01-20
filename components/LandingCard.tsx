import Link from 'next/link'
import { ReactNode } from 'react'

interface LandingCardProps {
  title: string
  description: string
  icon: ReactNode
  href: string
  color: 'blue' | 'green' | 'purple'
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100'
  },
  green: {
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    text: 'text-green-700',
    iconBg: 'bg-green-100'
  },
  purple: {
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100'
  }
}

export default function LandingCard({ title, description, icon, href, color }: LandingCardProps) {
  const colors = colorClasses[color]

  return (
    <Link href={href}>
      <div
        className={`${colors.bg} ${colors.border} border-2 rounded-xl p-8 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer min-h-[200px] flex flex-col items-center justify-center text-center`}
      >
        <div className={`${colors.iconBg} p-4 rounded-full mb-4`}>
          <div className={colors.text}>{icon}</div>
        </div>
        <h2 className={`text-xl font-bold mb-2 ${colors.text}`}>{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  )
}
