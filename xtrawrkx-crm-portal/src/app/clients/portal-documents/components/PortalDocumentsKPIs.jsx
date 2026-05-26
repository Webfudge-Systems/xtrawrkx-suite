export default function PortalDocumentsKPIs({ statusStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statusStats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-gray-800">
                  {stat.count}
                </p>
              </div>
              <div
                className={`w-16 h-16 ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${stat.borderColor}`}
              >
                <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
