const ChartContainer = ({ children, height = "400px" }) => (
  <div className=" bg-white rounded-xl p-4 border border-gray-100" style={{ height }}>
    {children}
  </div>
)

export default ChartContainer
