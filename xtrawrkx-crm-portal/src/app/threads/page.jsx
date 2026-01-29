"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageSquare,
  Loader2,
  Search,
  X,
  Building2,
  UserCheck,
  Filter,
  Users,
  DollarSign,
} from "lucide-react";
import ProtectedRoute from "../../components/ProtectedRoute";
import PageHeader from "../../components/PageHeader";
import { useAuth } from "../../contexts/AuthContext";
import chatService from "../../lib/api/chatService";
import commentService from "../../lib/api/commentService";
import strapiClient from "../../lib/strapiClient";
import ThreadView from "../../components/threads/ThreadView";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export default function ThreadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEntity, setFilterEntity] = useState(null); // null = all, 'leadCompany', 'clientAccount', 'contact', or 'deal'

  useEffect(() => {
    fetchThreads();
  }, []);

  // Handle thread selection from URL query parameter
  useEffect(() => {
    const threadId = searchParams.get("thread");
    if (threadId && threads.length > 0) {
      const thread = threads.find(
        (t) =>
          t.id === threadId ||
          t.originalId === parseInt(threadId) ||
          t.id === `chat-${threadId}` ||
          t.id === `comment-${threadId}`,
      );
      if (thread) {
        handleThreadSelect(thread);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, threads]);

  const fetchThreads = async () => {
    try {
      setLoading(true);

      // Fetch comments for lead companies, client accounts, contacts, and deals
      const [
        leadCompanyCommentsResponse,
        clientAccountCommentsResponse,
        contactCommentsResponse,
        dealCommentsResponse,
      ] = await Promise.all([
        commentService
          .getAllComments({
            filters: { commentableType: "LEAD_COMPANY" },
            populate: ["user", "replies", "replies.user", "parentComment"],
            sort: "createdAt:desc",
            pageSize: 1000,
          })
          .catch(() => ({ data: [] })),
        commentService
          .getAllComments({
            filters: { commentableType: "CLIENT_ACCOUNT" },
            populate: ["user", "replies", "replies.user", "parentComment"],
            sort: "createdAt:desc",
            pageSize: 1000,
          })
          .catch(() => ({ data: [] })),
        commentService
          .getAllComments({
            filters: { commentableType: "CONTACT" },
            populate: ["user", "replies", "replies.user", "parentComment"],
            sort: "createdAt:desc",
            pageSize: 1000,
          })
          .catch(() => ({ data: [] })),
        commentService
          .getAllComments({
            filters: { commentableType: "DEAL" },
            populate: ["user", "replies", "replies.user", "parentComment"],
            sort: "createdAt:desc",
            pageSize: 1000,
          })
          .catch(() => ({ data: [] })),
      ]);

      const leadComments = leadCompanyCommentsResponse?.data || [];
      const clientComments = clientAccountCommentsResponse?.data || [];
      const contactComments = contactCommentsResponse?.data || [];
      const dealComments = dealCommentsResponse?.data || [];

      // Group comments by entity and get latest activity
      const entityChats = new Map();

      // Process lead company comments
      leadComments.forEach((comment) => {
        const commentData = comment.attributes || comment;
        const entityId = commentData.commentableId;
        const key = `leadCompany-${entityId}`;

        if (!entityChats.has(key)) {
          entityChats.set(key, {
            entityId,
            entityType: "leadCompany",
            comments: [],
            latestActivity: null,
          });
        }

        const chat = entityChats.get(key);
        chat.comments.push(comment);

        const commentTime = new Date(commentData.createdAt);
        if (!chat.latestActivity || commentTime > chat.latestActivity) {
          chat.latestActivity = commentTime;
        }
      });

      // Process client account comments
      clientComments.forEach((comment) => {
        const commentData = comment.attributes || comment;
        const entityId = commentData.commentableId;
        const key = `clientAccount-${entityId}`;

        if (!entityChats.has(key)) {
          entityChats.set(key, {
            entityId,
            entityType: "clientAccount",
            comments: [],
            latestActivity: null,
          });
        }

        const chat = entityChats.get(key);
        chat.comments.push(comment);

        const commentTime = new Date(commentData.createdAt);
        if (!chat.latestActivity || commentTime > chat.latestActivity) {
          chat.latestActivity = commentTime;
        }
      });

      // Process contact comments
      contactComments.forEach((comment) => {
        const commentData = comment.attributes || comment;
        const entityId = commentData.commentableId;
        const key = `contact-${entityId}`;

        if (!entityChats.has(key)) {
          entityChats.set(key, {
            entityId,
            entityType: "contact",
            comments: [],
            latestActivity: null,
          });
        }

        const chat = entityChats.get(key);
        chat.comments.push(comment);

        const commentTime = new Date(commentData.createdAt);
        if (!chat.latestActivity || commentTime > chat.latestActivity) {
          chat.latestActivity = commentTime;
        }
      });

      // Process deal comments
      dealComments.forEach((comment) => {
        const commentData = comment.attributes || comment;
        const entityId = commentData.commentableId;
        const key = `deal-${entityId}`;

        if (!entityChats.has(key)) {
          entityChats.set(key, {
            entityId,
            entityType: "deal",
            comments: [],
            latestActivity: null,
          });
        }

        const chat = entityChats.get(key);
        chat.comments.push(comment);

        const commentTime = new Date(commentData.createdAt);
        if (!chat.latestActivity || commentTime > chat.latestActivity) {
          chat.latestActivity = commentTime;
        }
      });

      // Fetch entity names for all entities with chats
      const entityPromises = Array.from(entityChats.keys()).map(async (key) => {
        const chat = entityChats.get(key);
        try {
          if (chat.entityType === "leadCompany") {
            const leadCompany = await strapiClient
              .getLeadCompany(chat.entityId)
              .catch(() => null);
            if (leadCompany) {
              // Normalize the data structure
              const entityData =
                leadCompany.data?.attributes ||
                leadCompany.data ||
                leadCompany.attributes ||
                leadCompany;
              chat.entity = entityData;
            }
          } else if (chat.entityType === "clientAccount") {
            const clientAccount = await strapiClient
              .getClientAccount(chat.entityId)
              .catch(() => null);
            if (clientAccount) {
              // Normalize the data structure
              const entityData =
                clientAccount.data?.attributes ||
                clientAccount.data ||
                clientAccount.attributes ||
                clientAccount;
              chat.entity = entityData;
            }
          } else if (chat.entityType === "contact") {
            const contact = await strapiClient
              .getContact(chat.entityId)
              .catch(() => null);
            if (contact) {
              // Normalize the data structure
              const entityData =
                contact.data?.attributes ||
                contact.data ||
                contact.attributes ||
                contact;
              chat.entity = entityData;
            }
          } else if (chat.entityType === "deal") {
            const deal = await strapiClient
              .getDeal(chat.entityId)
              .catch(() => null);
            if (deal) {
              // Normalize the data structure
              const entityData =
                deal.data?.attributes || deal.data || deal.attributes || deal;
              chat.entity = entityData;
            }
          }
        } catch (error) {
          console.error(`Error fetching entity ${chat.entityId}:`, error);
        }
      });
      await Promise.all(entityPromises);

      // Transform entity chats into thread format
      const entityThreads = Array.from(entityChats.values())
        .filter((chat) => chat.comments.length > 0) // Only entities with comments
        .map((chat) => {
          // Sort comments by date (newest first) to get latest
          const sortedComments = chat.comments.sort((a, b) => {
            const aTime = new Date(a.attributes?.createdAt || a.createdAt);
            const bTime = new Date(b.attributes?.createdAt || b.createdAt);
            return bTime - aTime;
          });

          const latestComment = sortedComments[0];
          const latestCommentData = latestComment.attributes || latestComment;
          const latestUser =
            latestCommentData.user?.data?.attributes || latestCommentData.user;

          // Get all participants from all comments
          const participants = new Set();
          chat.comments.forEach((comment) => {
            const commentData = comment.attributes || comment;
            const user = commentData.user?.data?.attributes || commentData.user;
            if (user) {
              participants.add(
                `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  user.email ||
                  "Unknown",
              );
            }
          });

          return {
            id: `${chat.entityType}-${chat.entityId}`,
            type: "entityChat",
            entityType: chat.entityType,
            entityId: chat.entityId,
            entity: chat.entity,
            leadCompany: chat.entityType === "leadCompany" ? chat.entity : null,
            clientAccount:
              chat.entityType === "clientAccount" ? chat.entity : null,
            contact: chat.entityType === "contact" ? chat.entity : null,
            deal: chat.entityType === "deal" ? chat.entity : null,
            latestComment: latestCommentData.content,
            latestCommentId: latestComment.id,
            createdAt: latestCommentData.createdAt,
            latestActivity: chat.latestActivity,
            createdBy: latestUser,
            commentsCount: chat.comments.length,
            allComments: chat.comments, // Store all comments for the chat view
            participants: Array.from(participants),
          };
        });

      // Sort by latest activity (most recent first)
      const allThreads = entityThreads.sort(
        (a, b) =>
          new Date(b.latestActivity || b.createdAt) -
          new Date(a.latestActivity || a.createdAt),
      );

      setThreads(allThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const getCommentParticipants = (commentData, replies) => {
    const participants = new Set();

    // Add comment author
    if (commentData.user) {
      const user = commentData.user.data?.attributes || commentData.user;
      if (user) {
        participants.add(
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email ||
            "Unknown",
        );
      }
    }

    // Add reply authors
    replies.forEach((reply) => {
      const replyData = reply.attributes || reply;
      if (replyData.user) {
        const user = replyData.user.data?.attributes || replyData.user;
        if (user) {
          participants.add(
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
              user.email ||
              "Unknown",
          );
        }
      }
    });

    return Array.from(participants);
  };

  const getParticipants = (threadData, replies) => {
    const participants = new Set();

    // Add thread starter
    if (threadData.createdBy) {
      const creator =
        threadData.createdBy.data?.attributes || threadData.createdBy;
      if (creator) {
        participants.add(
          `${creator.firstName || ""} ${creator.lastName || ""}`.trim() ||
            creator.email ||
            "Unknown",
        );
      }
    }

    // Add reply authors
    replies.forEach((reply) => {
      const replyData = reply.attributes || reply;
      if (replyData.createdBy) {
        const creator =
          replyData.createdBy.data?.attributes || replyData.createdBy;
        if (creator) {
          participants.add(
            `${creator.firstName || ""} ${creator.lastName || ""}`.trim() ||
              creator.email ||
              "Unknown",
          );
        }
      }
    });

    return Array.from(participants);
  };

  const handleThreadSelect = async (thread) => {
    try {
      // For entity chats, we already have all comments loaded
      if (thread.type === "entityChat" && thread.allComments) {
        // Build thread structure from all comments
        // Sort comments chronologically
        const sortedComments = thread.allComments.sort((a, b) => {
          const aTime = new Date(a.attributes?.createdAt || a.createdAt);
          const bTime = new Date(b.attributes?.createdAt || b.createdAt);
          return aTime - bTime;
        });

        // Build thread data structure
        const threadData = {
          id: thread.id,
          type: "entityChat",
          entityType: thread.entityType,
          entityId: thread.entityId,
          attributes: {
            message: thread.latestComment,
            content: thread.latestComment,
            createdAt: thread.createdAt,
            createdBy: thread.createdBy,
            leadCompany: thread.leadCompany,
            clientAccount: thread.clientAccount,
            contact: thread.contact,
            deal: thread.deal,
            comments: sortedComments, // All comments in chronological order
          },
          allComments: sortedComments,
        };
        setSelectedThread(threadData);
        // Sync URL so sidebar can highlight the open chat
        router.replace(`/threads?thread=${encodeURIComponent(thread.id)}`, {
          scroll: false,
        });
      }
    } catch (error) {
      console.error("Error fetching thread details:", error);
    }
  };

  const handleThreadUpdate = () => {
    fetchThreads();
    if (selectedThread) {
      const thread = threads.find((t) => t.id === selectedThread.id);
      if (thread) {
        handleThreadSelect(thread);
      }
    }
  };

  // Get unique entities (companies/accounts) from threads
  const entities = useMemo(() => {
    const entityMap = new Map();

    // Helper to get company name from entity
    const getCompanyName = (entity) => {
      if (!entity) return null;
      return (
        entity.companyName ||
        entity.attributes?.companyName ||
        entity.data?.attributes?.companyName ||
        entity.data?.companyName ||
        null
      );
    };

    threads.forEach((thread) => {
      if (thread.leadCompany) {
        const companyName = getCompanyName(thread.leadCompany);
        if (companyName) {
          const entityId =
            thread.leadCompany.id ||
            thread.leadCompany.attributes?.id ||
            thread.leadCompany.data?.id;
          const key = `leadCompany-${entityId || companyName}`;
          if (!entityMap.has(key)) {
            entityMap.set(key, {
              id: entityId,
              name: companyName,
              type: "leadCompany",
              count: 0,
            });
          }
          entityMap.get(key).count++;
        }
      }
      if (thread.clientAccount) {
        const companyName = getCompanyName(thread.clientAccount);
        if (companyName) {
          const entityId =
            thread.clientAccount.id ||
            thread.clientAccount.attributes?.id ||
            thread.clientAccount.data?.id;
          const key = `clientAccount-${entityId || companyName}`;
          if (!entityMap.has(key)) {
            entityMap.set(key, {
              id: entityId,
              name: companyName,
              type: "clientAccount",
              count: 0,
            });
          }
          entityMap.get(key).count++;
        }
      }
    });
    return Array.from(entityMap.values()).sort((a, b) => b.count - a.count);
  }, [threads]);

  // Filter threads by search query and entity filter
  const filteredThreads = useMemo(() => {
    // Helper to get company name from entity
    const getCompanyName = (entity) => {
      if (!entity) return null;
      return (
        entity.companyName ||
        entity.attributes?.companyName ||
        entity.data?.attributes?.companyName ||
        entity.data?.companyName ||
        null
      );
    };

    // Helper to get entity name
    const getEntityName = (entity, entityType) => {
      if (!entity) return null;
      if (entityType === "contact") {
        const firstName =
          entity.firstName || entity.attributes?.firstName || "";
        const lastName = entity.lastName || entity.attributes?.lastName || "";
        return (
          `${firstName} ${lastName}`.trim() ||
          entity.email ||
          entity.attributes?.email ||
          null
        );
      } else if (entityType === "deal") {
        return (
          entity.name ||
          entity.attributes?.name ||
          entity.data?.attributes?.name ||
          null
        );
      }
      return getCompanyName(entity);
    };

    return threads.filter((thread) => {
      // Entity filter
      if (filterEntity === "leadCompany" && !thread.leadCompany) return false;
      if (filterEntity === "clientAccount" && !thread.clientAccount)
        return false;
      if (filterEntity === "contact" && !thread.contact) return false;
      if (filterEntity === "deal" && !thread.deal) return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const messageText = (
        thread.message ||
        thread.content ||
        thread.latestComment ||
        ""
      ).toLowerCase();
      const entityName = (
        getCompanyName(thread.leadCompany) ||
        getCompanyName(thread.clientAccount) ||
        getEntityName(thread.contact, "contact") ||
        getEntityName(thread.deal, "deal") ||
        ""
      ).toLowerCase();
      const participants = (thread.participants || []).join(" ").toLowerCase();

      return (
        messageText.includes(query) ||
        entityName.includes(query) ||
        participants.includes(query)
      );
    });
  }, [threads, searchQuery, filterEntity]);

  // Group threads by entity (always grouped now)
  const groupedThreads = useMemo(() => {
    // Helper to get company name from entity
    const getCompanyName = (entity) => {
      if (!entity) return null;
      return (
        entity.companyName ||
        entity.attributes?.companyName ||
        entity.data?.attributes?.companyName ||
        entity.data?.companyName ||
        null
      );
    };

    // Helper to get entity name
    const getEntityName = (entity, entityType) => {
      if (!entity) return null;
      if (entityType === "contact") {
        const firstName =
          entity.firstName || entity.attributes?.firstName || "";
        const lastName = entity.lastName || entity.attributes?.lastName || "";
        return (
          `${firstName} ${lastName}`.trim() ||
          entity.email ||
          entity.attributes?.email ||
          null
        );
      } else if (entityType === "deal") {
        return (
          entity.name ||
          entity.attributes?.name ||
          entity.data?.attributes?.name ||
          null
        );
      }
      return getCompanyName(entity);
    };

    const groups = {};
    filteredThreads.forEach((thread) => {
      const entity =
        thread.leadCompany ||
        thread.clientAccount ||
        thread.contact ||
        thread.deal;
      const entityId = entity?.id || entity?.attributes?.id || entity?.data?.id;
      let entityType = "unknown";
      let entityName = null;

      if (thread.leadCompany) {
        entityType = "leadCompany";
        entityName = getCompanyName(thread.leadCompany);
      } else if (thread.clientAccount) {
        entityType = "clientAccount";
        entityName = getCompanyName(thread.clientAccount);
      } else if (thread.contact) {
        entityType = "contact";
        entityName = getEntityName(thread.contact, "contact");
      } else if (thread.deal) {
        entityType = "deal";
        entityName = getEntityName(thread.deal, "deal");
      }

      const entityKey = entity
        ? `${entityType}-${entityId || entityName || "unknown"}`
        : "unknown";

      if (!groups[entityKey]) {
        groups[entityKey] = {
          entity: entity,
          type: entityType,
          threads: [],
        };
      }
      groups[entityKey].threads.push(thread);
    });

    return groups;
  }, [filteredThreads]);

  const getThreadContext = (thread) => {
    // Helper to get company name from entity (handles different data structures)
    const getCompanyName = (entity) => {
      if (!entity) return null;
      return (
        entity.companyName ||
        entity.attributes?.companyName ||
        entity.data?.attributes?.companyName ||
        entity.data?.companyName ||
        null
      );
    };

    // Helper to get entity name
    const getEntityName = (entity, entityType) => {
      if (!entity) return null;
      if (entityType === "contact") {
        const firstName =
          entity.firstName || entity.attributes?.firstName || "";
        const lastName = entity.lastName || entity.attributes?.lastName || "";
        return (
          `${firstName} ${lastName}`.trim() ||
          entity.email ||
          entity.attributes?.email ||
          null
        );
      } else if (entityType === "deal") {
        return (
          entity.name ||
          entity.attributes?.name ||
          entity.data?.attributes?.name ||
          null
        );
      }
      return getCompanyName(entity);
    };

    if (thread.leadCompany) {
      return getCompanyName(thread.leadCompany);
    }
    if (thread.clientAccount) {
      return getCompanyName(thread.clientAccount);
    }
    if (thread.contact) {
      return getEntityName(thread.contact, "contact");
    }
    if (thread.deal) {
      return getEntityName(thread.deal, "deal");
    }
    return null;
  };

  const getEntityTypeLabel = (thread) => {
    if (thread.leadCompany) return "Lead Company";
    if (thread.clientAccount) return "Client Account";
    if (thread.contact) return "Contact";
    if (thread.deal) return "Deal";
    return null;
  };

  const getEntityType = (thread) => {
    if (thread.leadCompany) return "leadCompany";
    if (thread.clientAccount) return "clientAccount";
    return null;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-4 space-y-4 bg-white min-h-screen">
          <PageHeader
            title="Threads"
            subtitle="Conversations with lead companies, client accounts, contacts, and deals"
            breadcrumb={[{ label: "Threads", href: "/threads" }]}
            showSearch={false}
            showActions={false}
          />
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-gray-600">Loading threads...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Threads List Sidebar */}
        <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Threads</h1>
            </div>

            {/* Filter buttons - horizontal scroll, standard icon size */}
            <div className="flex gap-2 overflow-x-auto overflow-y-hidden flex-nowrap pb-1 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <button
                onClick={() => setFilterEntity(null)}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterEntity === null
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterEntity("leadCompany")}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  filterEntity === "leadCompany"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                Lead Companies
              </button>
              <button
                onClick={() => setFilterEntity("clientAccount")}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  filterEntity === "clientAccount"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                Client Accounts
              </button>
              <button
                onClick={() => setFilterEntity("contact")}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  filterEntity === "contact"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                Contacts
              </button>
              <button
                onClick={() => setFilterEntity("deal")}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  filterEntity === "deal"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <DollarSign className="w-4 h-4 shrink-0" />
                Deals
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Entities summary */}
            {entities.length > 0 && (
              <div className="text-xs text-gray-500">
                {entities.length}{" "}
                {entities.length === 1
                  ? "company/account"
                  : "companies/accounts"}{" "}
                with active threads
              </div>
            )}
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {searchQuery || filterEntity
                    ? "No threads found"
                    : "No threads yet"}
                </p>
                <p className="text-xs text-gray-500">
                  {searchQuery || filterEntity
                    ? "Try adjusting your search or filters"
                    : "Start a conversation by creating a thread"}
                </p>
              </div>
            ) : (
              // Always show grouped by entity with all comments combined
              <div>
                {(() => {
                  // Group by entity type first
                  const byType = {
                    leadCompany: [],
                    clientAccount: [],
                    contact: [],
                    deal: [],
                  };

                  Object.entries(groupedThreads).forEach(
                    ([entityKey, group]) => {
                      byType[group.type].push({ entityKey, group });
                    },
                  );

                  return (
                    <>
                      {/* Lead Companies Section */}
                      {byType.leadCompany.length > 0 && (
                        <div className="mb-4">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                Lead Company
                              </span>
                              <span className="text-xs text-gray-500">
                                ({byType.leadCompany.length})
                              </span>
                            </div>
                          </div>
                          {byType.leadCompany.map(({ entityKey, group }) => {
                            const entity = group.entity;
                            const isLeadCompany = true;

                            // Get company name (handles different data structures)
                            const getCompanyName = (entity) => {
                              if (!entity) return null;
                              return (
                                entity.companyName ||
                                entity.attributes?.companyName ||
                                entity.data?.attributes?.companyName ||
                                entity.data?.companyName ||
                                null
                              );
                            };

                            const companyName = getCompanyName(entity);

                            // Combine all comments from all threads for this entity
                            const allComments = [];
                            group.threads.forEach((thread) => {
                              if (thread.allComments) {
                                allComments.push(...thread.allComments);
                              }
                            });

                            // Sort all comments by date (newest first)
                            const sortedComments = allComments.sort((a, b) => {
                              const aTime = new Date(
                                a.attributes?.createdAt || a.createdAt,
                              );
                              const bTime = new Date(
                                b.attributes?.createdAt || b.createdAt,
                              );
                              return bTime - aTime;
                            });

                            // Get last message for preview
                            const previewComments = sortedComments.slice(0, 1);
                            const latestComment = sortedComments[0];
                            const latestCommentData =
                              latestComment?.attributes || latestComment;
                            const latestUser =
                              latestCommentData?.user?.data?.attributes ||
                              latestCommentData?.user;
                            const latestTime = latestCommentData?.createdAt;

                            // Get all participants
                            const participants = new Set();
                            sortedComments.forEach((comment) => {
                              const commentData = comment.attributes || comment;
                              const user =
                                commentData.user?.data?.attributes ||
                                commentData.user;
                              if (user) {
                                participants.add(
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                    user.email ||
                                    "Unknown",
                                );
                              }
                            });

                            // Create a combined thread for this entity
                            const combinedThread = {
                              id: entityKey,
                              type: "entityChat",
                              entityType: group.type,
                              entityId:
                                entity?.id ||
                                entity?.attributes?.id ||
                                entity?.data?.id,
                              entity: entity,
                              leadCompany: isLeadCompany ? entity : null,
                              clientAccount: !isLeadCompany ? entity : null,
                              latestComment: latestCommentData?.content || "",
                              createdAt: latestTime,
                              latestActivity: latestTime,
                              createdBy: latestUser,
                              commentsCount: sortedComments.length,
                              allComments: sortedComments,
                              participants: Array.from(participants),
                            };

                            const isSelected =
                              selectedThread?.id === combinedThread.id;

                            return (
                              <button
                                key={entityKey}
                                onClick={() =>
                                  handleThreadSelect(combinedThread)
                                }
                                className={`w-full text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                  isSelected
                                    ? "bg-orange-50 border-l-4 border-orange-500"
                                    : ""
                                }`}
                              >
                                <div className="px-4 py-3">
                                  {/* Company Name */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <Building2 className="w-4 h-4 text-orange-500" />
                                    {companyName ? (
                                      <span className="text-sm font-semibold text-gray-900">
                                        {companyName}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">
                                        No company name
                                      </span>
                                    )}
                                  </div>

                                  {/* Latest Messages Preview in One Box */}
                                  {previewComments.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                      <div className="space-y-2.5">
                                        {previewComments.map(
                                          (comment, index) => {
                                            const commentData =
                                              comment.attributes || comment;
                                            const user =
                                              commentData.user?.data
                                                ?.attributes ||
                                              commentData.user;
                                            const commentTime =
                                              commentData.createdAt
                                                ? formatDistanceToNow(
                                                    new Date(
                                                      commentData.createdAt,
                                                    ),
                                                    { addSuffix: true },
                                                  )
                                                : "";

                                            return (
                                              <div
                                                key={comment.id || index}
                                                className={
                                                  index > 0
                                                    ? "pt-2.5 border-t border-gray-100"
                                                    : ""
                                                }
                                              >
                                                <div className="flex items-start gap-2.5">
                                                  {user && (
                                                    <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                      <span className="text-white text-xs font-semibold">
                                                        {user.firstName?.[0] ||
                                                          user.email?.[0] ||
                                                          "?"}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-xs font-semibold text-gray-900">
                                                        {user
                                                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                            user.email
                                                          : "Unknown"}
                                                      </span>
                                                      {commentTime && (
                                                        <span className="text-[10px] text-gray-500">
                                                          {commentTime}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 leading-relaxed">
                                                      {commentData.content}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                      {sortedComments.length > 1 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                                          <span className="text-[10px] text-gray-500">
                                            +{sortedComments.length - 1} more{" "}
                                            {sortedComments.length - 1 === 1
                                              ? "message"
                                              : "messages"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Client Accounts Section */}
                      {byType.clientAccount.length > 0 && (
                        <div className="mb-4">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                Client Account
                              </span>
                              <span className="text-xs text-gray-500">
                                ({byType.clientAccount.length})
                              </span>
                            </div>
                          </div>
                          {byType.clientAccount.map(({ entityKey, group }) => {
                            const entity = group.entity;
                            const isLeadCompany = false;

                            // Get company name (handles different data structures)
                            const getCompanyName = (entity) => {
                              if (!entity) return null;
                              return (
                                entity.companyName ||
                                entity.attributes?.companyName ||
                                entity.data?.attributes?.companyName ||
                                entity.data?.companyName ||
                                null
                              );
                            };

                            const companyName = getCompanyName(entity);

                            // Combine all comments from all threads for this entity
                            const allComments = [];
                            group.threads.forEach((thread) => {
                              if (thread.allComments) {
                                allComments.push(...thread.allComments);
                              }
                            });

                            // Sort all comments by date (newest first)
                            const sortedComments = allComments.sort((a, b) => {
                              const aTime = new Date(
                                a.attributes?.createdAt || a.createdAt,
                              );
                              const bTime = new Date(
                                b.attributes?.createdAt || b.createdAt,
                              );
                              return bTime - aTime;
                            });

                            // Get last message for preview
                            const previewComments = sortedComments.slice(0, 1);
                            const latestComment = sortedComments[0];
                            const latestCommentData =
                              latestComment?.attributes || latestComment;
                            const latestUser =
                              latestCommentData?.user?.data?.attributes ||
                              latestCommentData?.user;
                            const latestTime = latestCommentData?.createdAt;

                            // Get all participants
                            const participants = new Set();
                            sortedComments.forEach((comment) => {
                              const commentData = comment.attributes || comment;
                              const user =
                                commentData.user?.data?.attributes ||
                                commentData.user;
                              if (user) {
                                participants.add(
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                    user.email ||
                                    "Unknown",
                                );
                              }
                            });

                            // Create a combined thread for this entity
                            const combinedThread = {
                              id: entityKey,
                              type: "entityChat",
                              entityType: group.type,
                              entityId:
                                entity?.id ||
                                entity?.attributes?.id ||
                                entity?.data?.id,
                              entity: entity,
                              leadCompany: isLeadCompany ? entity : null,
                              clientAccount: !isLeadCompany ? entity : null,
                              latestComment: latestCommentData?.content || "",
                              createdAt: latestTime,
                              latestActivity: latestTime,
                              createdBy: latestUser,
                              commentsCount: sortedComments.length,
                              allComments: sortedComments,
                              participants: Array.from(participants),
                            };

                            const isSelected =
                              selectedThread?.id === combinedThread.id;
                            const lastReplyTime = latestTime
                              ? formatDistanceToNow(new Date(latestTime), {
                                  addSuffix: true,
                                })
                              : "";

                            return (
                              <button
                                key={entityKey}
                                onClick={() =>
                                  handleThreadSelect(combinedThread)
                                }
                                className={`w-full text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                  isSelected
                                    ? "bg-orange-50 border-l-4 border-orange-500"
                                    : ""
                                }`}
                              >
                                <div className="px-4 py-3">
                                  {/* Company Name */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <UserCheck className="w-4 h-4 text-blue-500" />
                                    {companyName ? (
                                      <span className="text-sm font-semibold text-gray-900">
                                        {companyName}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">
                                        No company name
                                      </span>
                                    )}
                                  </div>

                                  {/* Latest Messages Preview in One Box */}
                                  {previewComments.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                      <div className="space-y-2.5">
                                        {previewComments.map(
                                          (comment, index) => {
                                            const commentData =
                                              comment.attributes || comment;
                                            const user =
                                              commentData.user?.data
                                                ?.attributes ||
                                              commentData.user;
                                            const commentTime =
                                              commentData.createdAt
                                                ? formatDistanceToNow(
                                                    new Date(
                                                      commentData.createdAt,
                                                    ),
                                                    { addSuffix: true },
                                                  )
                                                : "";

                                            return (
                                              <div
                                                key={comment.id || index}
                                                className={
                                                  index > 0
                                                    ? "pt-2.5 border-t border-gray-100"
                                                    : ""
                                                }
                                              >
                                                <div className="flex items-start gap-2.5">
                                                  {user && (
                                                    <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                      <span className="text-white text-xs font-semibold">
                                                        {user.firstName?.[0] ||
                                                          user.email?.[0] ||
                                                          "?"}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-xs font-semibold text-gray-900">
                                                        {user
                                                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                            user.email
                                                          : "Unknown"}
                                                      </span>
                                                      {commentTime && (
                                                        <span className="text-[10px] text-gray-500">
                                                          {commentTime}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 leading-relaxed">
                                                      {commentData.content}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                      {sortedComments.length > 1 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                                          <span className="text-[10px] text-gray-500">
                                            +{sortedComments.length - 1} more{" "}
                                            {sortedComments.length - 1 === 1
                                              ? "message"
                                              : "messages"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Contacts Section */}
                      {byType.contact.length > 0 && (
                        <div className="mb-4">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                Contact
                              </span>
                              <span className="text-xs text-gray-500">
                                ({byType.contact.length})
                              </span>
                            </div>
                          </div>
                          {byType.contact.map(({ entityKey, group }) => {
                            const entity = group.entity;

                            // Get contact name
                            const getContactName = (entity) => {
                              if (!entity) return null;
                              const firstName =
                                entity.firstName ||
                                entity.attributes?.firstName ||
                                "";
                              const lastName =
                                entity.lastName ||
                                entity.attributes?.lastName ||
                                "";
                              return (
                                `${firstName} ${lastName}`.trim() ||
                                entity.email ||
                                entity.attributes?.email ||
                                null
                              );
                            };

                            const contactName = getContactName(entity);

                            // Combine all comments from all threads for this entity
                            const allComments = [];
                            group.threads.forEach((thread) => {
                              if (thread.allComments) {
                                allComments.push(...thread.allComments);
                              }
                            });

                            // Sort all comments by date (newest first)
                            const sortedComments = allComments.sort((a, b) => {
                              const aTime = new Date(
                                a.attributes?.createdAt || a.createdAt,
                              );
                              const bTime = new Date(
                                b.attributes?.createdAt || b.createdAt,
                              );
                              return bTime - aTime;
                            });

                            // Get last message for preview
                            const previewComments = sortedComments.slice(0, 1);
                            const latestComment = sortedComments[0];
                            const latestCommentData =
                              latestComment?.attributes || latestComment;
                            const latestUser =
                              latestCommentData?.user?.data?.attributes ||
                              latestCommentData?.user;
                            const latestTime = latestCommentData?.createdAt;

                            // Get all participants
                            const participants = new Set();
                            sortedComments.forEach((comment) => {
                              const commentData = comment.attributes || comment;
                              const user =
                                commentData.user?.data?.attributes ||
                                commentData.user;
                              if (user) {
                                participants.add(
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                    user.email ||
                                    "Unknown",
                                );
                              }
                            });

                            // Create a combined thread for this entity
                            const combinedThread = {
                              id: entityKey,
                              type: "entityChat",
                              entityType: group.type,
                              entityId:
                                entity?.id ||
                                entity?.attributes?.id ||
                                entity?.data?.id,
                              entity: entity,
                              contact: entity,
                              latestComment: latestCommentData?.content || "",
                              createdAt: latestTime,
                              latestActivity: latestTime,
                              createdBy: latestUser,
                              commentsCount: sortedComments.length,
                              allComments: sortedComments,
                              participants: Array.from(participants),
                            };

                            const isSelected =
                              selectedThread?.id === combinedThread.id;

                            return (
                              <button
                                key={entityKey}
                                onClick={() =>
                                  handleThreadSelect(combinedThread)
                                }
                                className={`w-full text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                  isSelected
                                    ? "bg-orange-50 border-l-4 border-orange-500"
                                    : ""
                                }`}
                              >
                                <div className="px-4 py-3">
                                  {/* Contact Name */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-purple-500" />
                                    {contactName ? (
                                      <span className="text-sm font-semibold text-gray-900">
                                        {contactName}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">
                                        No contact name
                                      </span>
                                    )}
                                  </div>

                                  {/* Latest Messages Preview in One Box */}
                                  {previewComments.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                      <div className="space-y-2.5">
                                        {previewComments.map(
                                          (comment, index) => {
                                            const commentData =
                                              comment.attributes || comment;
                                            const user =
                                              commentData.user?.data
                                                ?.attributes ||
                                              commentData.user;
                                            const commentTime =
                                              commentData.createdAt
                                                ? formatDistanceToNow(
                                                    new Date(
                                                      commentData.createdAt,
                                                    ),
                                                    { addSuffix: true },
                                                  )
                                                : "";

                                            return (
                                              <div
                                                key={comment.id || index}
                                                className={
                                                  index > 0
                                                    ? "pt-2.5 border-t border-gray-100"
                                                    : ""
                                                }
                                              >
                                                <div className="flex items-start gap-2.5">
                                                  {user && (
                                                    <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                      <span className="text-white text-xs font-semibold">
                                                        {user.firstName?.[0] ||
                                                          user.email?.[0] ||
                                                          "?"}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-xs font-semibold text-gray-900">
                                                        {user
                                                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                            user.email
                                                          : "Unknown"}
                                                      </span>
                                                      {commentTime && (
                                                        <span className="text-[10px] text-gray-500">
                                                          {commentTime}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 leading-relaxed">
                                                      {commentData.content}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                      {sortedComments.length > 1 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                                          <span className="text-[10px] text-gray-500">
                                            +{sortedComments.length - 1} more{" "}
                                            {sortedComments.length - 1 === 1
                                              ? "message"
                                              : "messages"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Deals Section */}
                      {byType.deal.length > 0 && (
                        <div className="mb-4">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-semibold text-gray-900">
                                Deal
                              </span>
                              <span className="text-xs text-gray-500">
                                ({byType.deal.length})
                              </span>
                            </div>
                          </div>
                          {byType.deal.map(({ entityKey, group }) => {
                            const entity = group.entity;

                            // Get deal name
                            const getDealName = (entity) => {
                              if (!entity) return null;
                              return (
                                entity.name ||
                                entity.attributes?.name ||
                                entity.data?.attributes?.name ||
                                null
                              );
                            };

                            const dealName = getDealName(entity);

                            // Combine all comments from all threads for this entity
                            const allComments = [];
                            group.threads.forEach((thread) => {
                              if (thread.allComments) {
                                allComments.push(...thread.allComments);
                              }
                            });

                            // Sort all comments by date (newest first)
                            const sortedComments = allComments.sort((a, b) => {
                              const aTime = new Date(
                                a.attributes?.createdAt || a.createdAt,
                              );
                              const bTime = new Date(
                                b.attributes?.createdAt || b.createdAt,
                              );
                              return bTime - aTime;
                            });

                            // Get last message for preview
                            const previewComments = sortedComments.slice(0, 1);
                            const latestComment = sortedComments[0];
                            const latestCommentData =
                              latestComment?.attributes || latestComment;
                            const latestUser =
                              latestCommentData?.user?.data?.attributes ||
                              latestCommentData?.user;
                            const latestTime = latestCommentData?.createdAt;

                            // Get all participants
                            const participants = new Set();
                            sortedComments.forEach((comment) => {
                              const commentData = comment.attributes || comment;
                              const user =
                                commentData.user?.data?.attributes ||
                                commentData.user;
                              if (user) {
                                participants.add(
                                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                    user.email ||
                                    "Unknown",
                                );
                              }
                            });

                            // Create a combined thread for this entity
                            const combinedThread = {
                              id: entityKey,
                              type: "entityChat",
                              entityType: group.type,
                              entityId:
                                entity?.id ||
                                entity?.attributes?.id ||
                                entity?.data?.id,
                              entity: entity,
                              deal: entity,
                              latestComment: latestCommentData?.content || "",
                              createdAt: latestTime,
                              latestActivity: latestTime,
                              createdBy: latestUser,
                              commentsCount: sortedComments.length,
                              allComments: sortedComments,
                              participants: Array.from(participants),
                            };

                            const isSelected =
                              selectedThread?.id === combinedThread.id;

                            return (
                              <button
                                key={entityKey}
                                onClick={() =>
                                  handleThreadSelect(combinedThread)
                                }
                                className={`w-full text-left border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                                  isSelected
                                    ? "bg-orange-50 border-l-4 border-orange-500"
                                    : ""
                                }`}
                              >
                                <div className="px-4 py-3">
                                  {/* Deal Name */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <DollarSign className="w-4 h-4 text-green-500" />
                                    {dealName ? (
                                      <span className="text-sm font-semibold text-gray-900">
                                        {dealName}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">
                                        No deal name
                                      </span>
                                    )}
                                  </div>

                                  {/* Latest Messages Preview in One Box */}
                                  {previewComments.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                      <div className="space-y-2.5">
                                        {previewComments.map(
                                          (comment, index) => {
                                            const commentData =
                                              comment.attributes || comment;
                                            const user =
                                              commentData.user?.data
                                                ?.attributes ||
                                              commentData.user;
                                            const commentTime =
                                              commentData.createdAt
                                                ? formatDistanceToNow(
                                                    new Date(
                                                      commentData.createdAt,
                                                    ),
                                                    { addSuffix: true },
                                                  )
                                                : "";

                                            return (
                                              <div
                                                key={comment.id || index}
                                                className={
                                                  index > 0
                                                    ? "pt-2.5 border-t border-gray-100"
                                                    : ""
                                                }
                                              >
                                                <div className="flex items-start gap-2.5">
                                                  {user && (
                                                    <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                      <span className="text-white text-xs font-semibold">
                                                        {user.firstName?.[0] ||
                                                          user.email?.[0] ||
                                                          "?"}
                                                      </span>
                                                    </div>
                                                  )}
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-xs font-semibold text-gray-900">
                                                        {user
                                                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                            user.email
                                                          : "Unknown"}
                                                      </span>
                                                      {commentTime && (
                                                        <span className="text-[10px] text-gray-500">
                                                          {commentTime}
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 leading-relaxed">
                                                      {commentData.content}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                      {sortedComments.length > 1 && (
                                        <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                                          <span className="text-[10px] text-gray-500">
                                            +{sortedComments.length - 1} more{" "}
                                            {sortedComments.length - 1 === 1
                                              ? "message"
                                              : "messages"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Thread View */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedThread ? (
            <ThreadView
              thread={selectedThread}
              onThreadUpdate={handleThreadUpdate}
              onBack={() => {
                setSelectedThread(null);
                router.replace("/threads", { scroll: false });
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-600 mb-2">
                  Select a thread
                </p>
                <p className="text-sm text-gray-500">
                  Choose a thread from the list to view the conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
