import { Table, EmptyState, Button } from "../../../../components/ui";
import { Plus, FileText } from "lucide-react";

export default function PortalDocumentsListView({
  filteredDocuments,
  documentColumnsTable,
  selectedDocuments,
  setSelectedDocuments,
  searchQuery,
  setSearchQuery,
  onAddClick,
  onRowClick,
}) {
  return (
    <div className="rounded-3xl overflow-hidden">
      {filteredDocuments.length > 0 ? (
        <Table
          columns={documentColumnsTable}
          data={filteredDocuments}
          selectable
          selectedRows={selectedDocuments}
          onSelectRow={(id, selected) => {
            if (selected) {
              setSelectedDocuments([...selectedDocuments, id]);
            } else {
              setSelectedDocuments(
                selectedDocuments.filter((item) => item !== id),
              );
            }
          }}
          onSelectAll={(selected) => {
            if (selected) {
              setSelectedDocuments(
                filteredDocuments.map((doc) => doc.id),
              );
            } else {
              setSelectedDocuments([]);
            }
          }}
          onRowClick={onRowClick}
          className="min-w-[1200px]"
        />
      ) : (
        <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-12 text-center">
          <EmptyState
            icon={FileText}
            title="No documents found"
            description={
              searchQuery.trim()
                ? `No documents match your search "${searchQuery}"`
                : "No documents found for the selected status"
            }
            action={
              searchQuery.trim() ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              ) : (
                <Button
                  onClick={onAddClick}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-xl text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              )
            }
          />
        </div>
      )}
    </div>
  );
}
