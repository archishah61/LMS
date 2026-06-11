const Section = ({ title, children, icon: Icon, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100 ${className}`}>
    <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
      {Icon && <Icon className="w-6 h-6 text-indigo-600" />} {title}
    </h2>

    <p className="text-gray-600 text-sm sm:text-md">{children}</p>
  </div>
)

export default Section
