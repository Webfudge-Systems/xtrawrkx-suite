import {
  List,
  Grid3X3,
  Search,
  Plus,
  Download,
} from "lucide-react";

export default function PortalDocumentsTabs({
  tabItems,
  activeTab,
  setActiveTab,
  activeView,
  setActiveView,
  onAddClick,
  onExportClick,
  searchQuery,
  setSearchQuery,
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-3">
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-orange-500 text-white shadow-lg"
                : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                activeTab === tab.key
                  ? "bg-white/30 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="hidden lg:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-white/40 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 focus:bg-white/90 transition-all duration-300 shadow-md placeholder:text-gray-400"
            />
          </div>
        </div>

        {onAddClick && (
          <button
            onClick={onAddClick}
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 text-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center"
            title="Add New Document"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setActiveView("list")}
          className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
            activeView === "list"
              ? "bg-orange-500 text-white border-orange-500/50"
              : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
          }`}
          title="List View"
        >
          <List className="w-5 h-5" />
        </button>
        <button
          onClick={() => setActiveView("board")}
          className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
            activeView === "board"
              ? "bg-orange-500 text-white border-orange-500/50"
              : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
          }`}
          title="Board View"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
        {onExportClick && (
          <button
            onClick={onExportClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-white/40 text-gray-700 font-medium text-sm hover:bg-white/90 transition-all duration-300 shadow-md whitespace-nowrap"
            title="Export"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Export</span>
          </button>
        )}
      </div>
    </div>
  );
}
