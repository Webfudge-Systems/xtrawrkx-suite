"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Search } from "lucide-react";
import apiClient from "../../lib/apiClient";
import projectService from "../../lib/projectService";

export default function InviteMemberModal({ isOpen, onClose, projectId, existingTeam = [], onMemberAdded }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    if (isOpen) loadUsers();
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get("/api/xtrawrkx-users", {
        "pagination[pageSize]": 200,
        populate: "primaryRole,userRoles,department",
        "filters[isActive][$eq]": "true",
      });
      let usersData = [];
      if (resp?.data && Array.isArray(resp.data)) usersData = resp.data;
      else if (Array.isArray(resp)) usersData = resp;

      const transformed = usersData.map((u) => {
        const attrs = u.attributes || u;
        return {
          id: u.id,
          name: `${attrs.firstName || ""} ${attrs.lastName || ""}`.trim() || attrs.name || attrs.email,
          email: attrs.email || "",
        };
      });
      setUsers(transformed);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const handleInvite = async (user) => {
    if (!projectId || !user) return;
    setSavingUserId(user.id);
    try {
      await projectService.addTeamMember(projectId, user.id);
      // mark as added locally
      setAddedIds((prev) => new Set(prev).add(user.id));
      if (onMemberAdded) onMemberAdded(user);
    } catch (err) {
      console.error("Error inviting user:", err);
      setError(err.message || "Failed to invite user");
    } finally {
      setSavingUserId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[95] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Invite Members</h3>
            <p className="text-sm text-gray-500">Add people to this project team</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((user) => (
                <div key={user.id} className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-medium text-sm">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div>
                    {(() => {
                      const alreadyInTeam =
                        existingTeam &&
                        Array.isArray(existingTeam) &&
                        existingTeam.some((m) => String(m?.id) === String(user.id));
                      const justAdded = addedIds.has(user.id);
                      if (alreadyInTeam || justAdded) {
                        return (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100 text-gray-600 text-sm">
                            Added
                          </span>
                        );
                      }
                      return (
                        <button
                          onClick={() => handleInvite(user)}
                          disabled={savingUserId === user.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span className="text-sm">Add</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
}

