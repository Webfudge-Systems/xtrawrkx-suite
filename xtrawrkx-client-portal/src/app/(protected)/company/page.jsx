"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserCircle,
  Search,
  Plus,
  List,
  Grid3X3,
  Mail,
  Phone,
  Shield,
  Users,
  CircleCheck,
  UserCheck,
  Eye,
  Pencil,
  Trash2,
  ChevronRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  deleteCompanyMemberManaged,
  listCompanyMembersManaged,
} from "@/lib/api/companyMemberManagementService";

const roleTabs = [
  { key: "all", label: "All Members" },
  { key: "primary", label: "Primary Contact" },
  { key: "admin", label: "Admin / Finance" },
  { key: "members", label: "Members" },
];

export default function CompanyMembersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionState, setActionState] = useState({ kind: "", message: "" });

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await listCompanyMembersManaged();
      const rows = Array.isArray(response?.data) ? response.data : [];
      setMembers(
        rows.map((member) => {
          const nameParts = String(member.name || "").trim().split(/\s+/);
          return {
            id: member.id,
            firstName: nameParts[0] || "Member",
            lastName: nameParts.slice(1).join(" ") || "",
            email: member.email || "No email",
            phone: member.phone || "No phone",
            role: (member.role || "MEMBER").replaceAll(" ", "_").toUpperCase(),
            portalAccessLevel: member.portalAccessLevel || "FULL_ACCESS",
            status: member.status || "ACTIVE",
            location: member.location || "Not specified",
            lastActive: member.lastActivity
              ? new Date(member.lastActivity).toLocaleString()
              : "No activity",
          };
        })
      );
    } catch (error) {
      setActionState({
        kind: "error",
        message: error.message || "Failed to load members",
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return members.filter((member) => {
      const roleUpper = member.role.toUpperCase();
      const tabMatch =
        activeTab === "all" ||
        (activeTab === "primary" && roleUpper === "PRIMARY_CONTACT") ||
        (activeTab === "admin" &&
          (roleUpper.includes("FINANCE") || roleUpper.includes("ADMIN"))) ||
        (activeTab === "members" &&
          roleUpper !== "PRIMARY_CONTACT" &&
          !roleUpper.includes("ADMIN") &&
          !roleUpper.includes("FINANCE"));

      if (!tabMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        String(member.email || "")
          .toLowerCase()
          .includes(query) ||
        member.role.toLowerCase().includes(query)
      );
    });
  }, [members, searchQuery, activeTab]);

  const getTabCount = (tabKey) => {
    if (tabKey === "all") {
      return members.length;
    }
    return members.filter((member) => {
      const roleUpper = member.role.toUpperCase();
      if (tabKey === "primary") return roleUpper === "PRIMARY_CONTACT";
      if (tabKey === "admin") {
        return roleUpper.includes("FINANCE") || roleUpper.includes("ADMIN");
      }
      if (tabKey === "members") {
        return (
          roleUpper !== "PRIMARY_CONTACT" &&
          !roleUpper.includes("ADMIN") &&
          !roleUpper.includes("FINANCE")
        );
      }
      return true;
    }).length;
  };

  const kpis = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "ACTIVE").length;
    const invited = members.filter((m) => m.status === "INVITED").length;
    const accessOwners = members.filter(
      (m) => m.portalAccessLevel === "FULL_ACCESS"
    ).length;

    return { total, active, invited, accessOwners };
  }, [members]);

  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 pt-4">
        <PageHeader
          title="Company Members"
          subtitle="Manage your company contacts and portal access"
          showSearch={false}
          showActions={false}
        />
      </div>

      <div className="px-3 mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Members",
              count: kpis.total,
              icon: Users,
              color: "bg-xtrawrkx-50",
              border: "border-xtrawrkx-200",
              iconColor: "text-xtrawrkx-600",
            },
            {
              label: "Active Members",
              count: kpis.active,
              icon: UserCheck,
              color: "bg-green-50",
              border: "border-green-200",
              iconColor: "text-green-600",
            },
            {
              label: "Full Access",
              count: kpis.accessOwners,
              icon: Shield,
              color: "bg-yellow-50",
              border: "border-yellow-200",
              iconColor: "text-yellow-600",
            },
            {
              label: "Pending Invites",
              count: kpis.invited,
              icon: CircleCheck,
              color: "bg-purple-50",
              border: "border-purple-200",
              iconColor: "text-purple-600",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{item.label}</p>
                    <p className="text-3xl font-black text-gray-800 mt-1">{item.count}</p>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color} ${item.border} border`}
                  >
                    <Icon className={`w-7 h-7 ${item.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 bg-white/85 backdrop-blur-xl border border-white/50 rounded-2xl shadow-xl p-3">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {roleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-xtrawrkx-500 text-white shadow-lg"
                    : "bg-white/80 text-gray-700 hover:bg-white/90 border border-white/40"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.key
                      ? "bg-white/30 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {getTabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/15 transition-all duration-300 placeholder:text-gray-500 shadow-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/company/add")}
              className="w-10 h-10 rounded-full bg-xtrawrkx-500 text-white border border-xtrawrkx-500/50 flex items-center justify-center hover:bg-xtrawrkx-600 transition-colors"
              title="Add member"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                viewMode === "list"
                  ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                  : "bg-white/80 text-gray-700 border-white/40"
              }`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                viewMode === "grid"
                  ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                  : "bg-white/80 text-gray-700 border-white/40"
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="overflow-x-auto rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-white/90 border-b border-xtrawrkx-200/50">
                <tr>
                  {[
                    "Member",
                    "Role",
                    "Access",
                    "Email",
                    "Phone",
                    "Last Active",
                    "Status",
                    "Actions",
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-4 text-left text-xs font-black text-gray-800 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                  {filteredMembers.map((member) => {
                  const fullName =
                    `${member.firstName} ${member.lastName}`.trim() || "Unknown";
                  const initials =
                    `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}` ||
                    "U";
                  const isActive = member.status === "ACTIVE";
                  return (
                    <tr key={member.id} className="hover:bg-xtrawrkx-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                            {initials.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{fullName}</p>
                            <p className="text-xs text-gray-500">{member.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {member.role.replaceAll("_", " ")}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-md text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
                          <span className="inline-flex whitespace-nowrap">
                            {member.portalAccessLevel.replaceAll("_", " ")}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{member.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {member.phone || "No phone"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{member.lastActive}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-semibold border ${
                            isActive
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-yellow-100 text-yellow-700 border-yellow-200"
                          }`}
                        >
                          {isActive ? "Active" : "Invited"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <button
                            onClick={() => router.push(`/company/${member.id}`)}
                            className="p-1.5 text-gray-600 hover:text-xtrawrkx-600 hover:bg-xtrawrkx-50 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              router.push(`/company/${member.id}/edit`)
                            }
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const fullName =
                `${member.firstName} ${member.lastName}`.trim() || "Unknown";
              return (
                <div
                  key={member.id}
                  className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-xtrawrkx-100 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-xtrawrkx-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{fullName}</p>
                        <p className="text-xs text-gray-500">
                          {member.role.replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{member.phone || "No phone"}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    <button
                      onClick={() => router.push(`/company/${member.id}`)}
                      className="p-1.5 text-gray-600 hover:text-xtrawrkx-600 hover:bg-xtrawrkx-50 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/company/${member.id}/edit`)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(member)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {loadingMembers && (
        <div className="px-3">
          <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm">
            Loading members...
          </div>
        </div>
      )}

      {!loadingMembers && actionState.message && (
        <div className="px-3">
          <div
            className={`rounded-xl px-4 py-3 text-sm border ${
              actionState.kind === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {actionState.message}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
            aria-label="Close delete modal"
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-white/40 shadow-2xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-3xl font-semibold text-gray-900 leading-none">
                    Delete Member
                  </h3>
                  <p className="text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-2xl text-gray-700 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                {`${deleteTarget.firstName} ${deleteTarget.lastName}`.trim()}
              </span>
              ?
            </p>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                This will permanently remove:
              </p>
              <ul className="text-red-600 mt-2 space-y-1">
                <li>- Member profile and contact details</li>
                <li>- Assigned collaboration links</li>
                <li>- Access permissions and invitation history</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteCompanyMemberManaged(deleteTarget.id);
                    setActionState({
                      kind: "success",
                      message: "Member deleted successfully.",
                    });
                    setDeleteTarget(null);
                    await loadMembers();
                  } catch (error) {
                    setActionState({
                      kind: "error",
                      message: error.message || "Failed to delete member.",
                    });
                    setDeleteTarget(null);
                  }
                }}
                className="flex-1 h-12 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

