"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Building2,
  Briefcase,
  User,
  Users,
  Loader2,
  ArrowRight,
  FileText,
} from "lucide-react";
import BaseModal from "./ui/BaseModal";
import globalSearchService from "../lib/api/globalSearchService";

export default function GlobalSearchModal({ isOpen, onClose, initialQuery = "" }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState({
    leads: { data: [], total: 0 },
    deals: { data: [], total: 0 },
    contacts: { data: [], total: 0 },
    clients: { data: [], total: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const resultsRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Update search query when initialQuery prop changes or modal opens
  useEffect(() => {
    if (isOpen && initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults({
        leads: { data: [], total: 0 },
        deals: { data: [], total: 0 },
        contacts: { data: [], total: 0 },
        clients: { data: [], total: 0 },
      });
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Perform search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults({
        leads: { data: [], total: 0 },
        deals: { data: [], total: 0 },
        contacts: { data: [], total: 0 },
        clients: { data: [], total: 0 },
      });
      setSelectedIndex(-1); // Reset selection when clearing search
      setLoading(false);
      return;
    }

    setLoading(true);
    setSelectedIndex(-1); // Reset selection when new search starts
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await globalSearchService.search(searchQuery, {
          maxResults: 5,
        });
        setSearchResults(results);
      } catch (error) {
        console.error("Error performing global search:", error);
        setSearchResults({
          leads: { data: [], total: 0 },
          deals: { data: [], total: 0 },
          contacts: { data: [], total: 0 },
          clients: { data: [], total: 0 },
        });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const allResults = getAllResults();
        setSelectedIndex((prev) =>
          prev < allResults.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const allResults = getAllResults();
        if (selectedIndex >= 0 && allResults[selectedIndex]) {
          handleResultClick(allResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, searchResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  // Get all results in a flat array for keyboard navigation
  const getAllResults = () => {
    const all = [];
    searchResults.leads.data.forEach((item) => all.push(item));
    searchResults.deals.data.forEach((item) => all.push(item));
    searchResults.contacts.data.forEach((item) => all.push(item));
    searchResults.clients.data.forEach((item) => all.push(item));
    return all;
  };

  // Handle result click
  const handleResultClick = (result) => {
    router.push(result.href);
    onClose();
  };

  // Get icon for result type
  const getIcon = (type) => {
    switch (type) {
      case "lead":
        return Building2;
      case "deal":
        return Briefcase;
      case "contact":
        return User;
      case "client":
        return Users;
      default:
        return FileText;
    }
  };

  // Get label for result type
  const getTypeLabel = (type) => {
    switch (type) {
      case "lead":
        return "Lead";
      case "deal":
        return "Deal";
      case "contact":
        return "Contact";
      case "client":
        return "Client";
      default:
        return "Item";
    }
  };

  const totalResults =
    searchResults.leads.total +
    searchResults.deals.total +
    searchResults.contacts.total +
    searchResults.clients.total;

  const hasResults =
    searchResults.leads.data.length > 0 ||
    searchResults.deals.data.length > 0 ||
    searchResults.contacts.data.length > 0 ||
    searchResults.clients.data.length > 0;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="big" className="max-w-3xl">
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-text-light" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search leads, deals, contacts, clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-white/15 transition-all duration-300 placeholder:text-brand-text-light"
              />
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-brand-text-light" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
              <span className="ml-3 text-brand-text-light">Searching...</span>
            </div>
          ) : !searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-brand-text-light mb-4 opacity-50" />
              <p className="text-brand-text-light">
                Start typing to search across all entities
              </p>
              <p className="text-sm text-brand-text-light mt-2 opacity-75">
                Search for leads, deals, contacts, and clients
              </p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-12 h-12 text-brand-text-light mb-4 opacity-50" />
              <p className="text-brand-text-light">No results found</p>
              <p className="text-sm text-brand-text-light mt-2 opacity-75">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              {/* Leads */}
              {searchResults.leads.data.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-semibold text-brand-foreground">
                      Leads ({searchResults.leads.total})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.leads.data.map((result, idx) => {
                      const globalIndex = idx;
                      const Icon = getIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          data-index={globalIndex}
                          onClick={() => handleResultClick(result)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                            selectedIndex === globalIndex
                              ? "bg-brand-primary/10 border-brand-primary/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-foreground truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-brand-text-light truncate">
                                {result.subtitle}
                              </p>
                            )}
                            {result.description && (
                              <p className="text-xs text-brand-text-light mt-1 truncate">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-brand-text-light flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Deals */}
              {searchResults.deals.data.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-semibold text-brand-foreground">
                      Deals ({searchResults.deals.total})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.deals.data.map((result, idx) => {
                      const globalIndex =
                        searchResults.leads.data.length + idx;
                      const Icon = getIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          data-index={globalIndex}
                          onClick={() => handleResultClick(result)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                            selectedIndex === globalIndex
                              ? "bg-brand-primary/10 border-brand-primary/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-foreground truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-brand-text-light truncate">
                                {result.subtitle}
                              </p>
                            )}
                            {result.metadata?.value && (
                              <p className="text-xs text-brand-text-light mt-1">
                                Value: {result.metadata.value}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-brand-text-light flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacts */}
              {searchResults.contacts.data.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-semibold text-brand-foreground">
                      Contacts ({searchResults.contacts.total})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.contacts.data.map((result, idx) => {
                      const globalIndex =
                        searchResults.leads.data.length +
                        searchResults.deals.data.length +
                        idx;
                      const Icon = getIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          data-index={globalIndex}
                          onClick={() => handleResultClick(result)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                            selectedIndex === globalIndex
                              ? "bg-brand-primary/10 border-brand-primary/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-foreground truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-brand-text-light truncate">
                                {result.subtitle}
                              </p>
                            )}
                            {result.description && (
                              <p className="text-xs text-brand-text-light mt-1 truncate">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-brand-text-light flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clients */}
              {searchResults.clients.data.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-semibold text-brand-foreground">
                      Clients ({searchResults.clients.total})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {searchResults.clients.data.map((result, idx) => {
                      const globalIndex =
                        searchResults.leads.data.length +
                        searchResults.deals.data.length +
                        searchResults.contacts.data.length +
                        idx;
                      const Icon = getIcon(result.type);
                      return (
                        <button
                          key={result.id}
                          data-index={globalIndex}
                          onClick={() => handleResultClick(result)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                            selectedIndex === globalIndex
                              ? "bg-brand-primary/10 border-brand-primary/30"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-brand-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-foreground truncate">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="text-xs text-brand-text-light truncate">
                                {result.subtitle}
                              </p>
                            )}
                            {result.description && (
                              <p className="text-xs text-brand-text-light mt-1 truncate">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-brand-text-light flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {hasResults && (
          <div className="border-t border-white/20 p-4 flex items-center justify-between text-xs text-brand-text-light">
            <div className="flex items-center gap-4">
              <span>Total: {totalResults} results</span>
            </div>
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>Enter Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

