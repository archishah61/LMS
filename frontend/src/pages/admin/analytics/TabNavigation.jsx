import { BarChart3, Target, TrendingUp, Users } from "lucide-react"

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "performance", label: "Performance", icon: Target },
    { id: "insights", label: "Insights", icon: TrendingUp },
    { id: "users", label: "Users", icon: Users },
  ]

  return (
    <div
      className="
        flex border-b border-gray-200 space-x-1 bg-gray-100 p-1 sm:pl-6 
        sticky top-0 z-10 
        overflow-x-auto whitespace-nowrap custom-scrollbar
      "
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`sm:px-4 p-2 flex font-medium text-sm transition-colors ${activeTab === tab.id
            ? "text-indigo-600 border-b-2 border-indigo-600"
            : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <tab.icon className="w-4 h-4 mr-1" />
          {tab.label}
        </button>
      ))}
      <style global>{`
          .custom-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none; /* Safari and Chrome */
          }
        `}</style>
    </div>
  )
}

export default TabNavigation
