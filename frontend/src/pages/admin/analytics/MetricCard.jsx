import { TrendingUp } from "lucide-react"
import React from "react"

const MetricCard = ({ title, value, icon: Icon, color = "indigo" }) => {
  const colorClasses = {
    indigo: "from-indigo-500 to-purple-600",
    green: "from-green-500 to-emerald-600",
    blue: "bg-leafGreen ",
    orange: "from-orange-500 to-red-600",
    purple: "bg-leafGreen ",
    teal: "from-teal-500 to-green-600",
  }

  const iconClasses = {
    indigo: "text-indigo-500",
    green: "text-green-500",
    blue: "text-forestGreen",
    orange: "text-orange-500",
    purple: "text-leafGreen",
    teal: "text-teal-500",
  }

  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-6 text-gray-800 shadow-lg border ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs md:text-sm font-medium text-gray-500">{title}</p>
        <div className="p-2 bg-gray-100 rounded-lg">
          <Icon className={`w-5 h-5 ${iconClasses[color]}`} />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
    </div>
  )
}

export default MetricCard
