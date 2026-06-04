"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Search,
  FolderOpen,
  Calendar,
  File,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  fetchClientDocuments,
  getAttachments,
  resolveDocumentUrl,
} from "@/lib/api/clientDocumentsService";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fileIcon(mime = "") {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime.includes("pdf")) return "📕";
  if (mime.includes("word") || mime.includes("document")) return "📘";
  return "📄";
}

export default function FilesPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchClientDocuments();
        if (!cancelled) setDocuments(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load documents");
          setDocuments([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(q) ||
      doc.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Files / Documents
            </h1>
            <p className="text-gray-600">
              Documents shared with your organization by the Xtrawrkx team
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-xtrawrkx-500 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-xtrawrkx-500" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center"
        >
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-900 font-medium">No documents yet</p>
          <p className="text-sm text-gray-500 mt-2">
            When your team shares files, they will appear here.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filtered.map((doc, index) => {
            const files = getAttachments(doc);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-xtrawrkx-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {doc.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="gray" className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.issueDate)}
                        </Badge>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {doc.notes ? (
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {doc.notes}
                  </p>
                ) : null}

                {files.length > 0 ? (
                  <ul className="space-y-2 border-t border-gray-100 pt-4">
                    {files.map((file) => {
                      const url = resolveDocumentUrl(file.url);
                      const label =
                        file.name ||
                        file.originalName ||
                        file.hash ||
                        "Download";
                      return (
                        <li
                          key={file.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-lg" aria-hidden>
                              {fileIcon(file.mime)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {label}
                              </p>
                              {file.mime ? (
                                <p className="text-xs text-gray-500">{file.mime}</p>
                              ) : null}
                            </div>
                          </div>
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 border-t border-gray-100 pt-4 flex items-center gap-2">
                    <File className="h-4 w-4" />
                    No files attached
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
