"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CompanyMemberModal from "@/components/company/CompanyMemberModal";
import CompanyMemberDetailsModal from "@/components/company/CompanyMemberDetailsModal";
import {
  Users,
  UserCheck,
  Shield,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  Unlock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PortalPageHeader";
import {
  Avatar,
  Button,
  Card,
  KPICard,
  Table,
  TableCellCreated,
  TableColumnPicker,
  TableSortDropdown,
  TabsWithActions,
  useTableColumnPreferences,
  useTableSort,
} from "@webfudge/ui";
import { PortalPageShell } from "@/components/layout/PortalPageShell";
import {
  deleteCompanyMemberManaged,
  listCompanyMembersManaged,
  suspendCompanyMemberManaged,
} from "@/lib/api/companyMemberManagementService";
import { exportItemsToCSV } from "@/lib/exportUtils";

const ROLE_TABS = [
  { key: "all", label: "All Members" },
  { key: "primary", label: "Primary Contact" },
  { key: "admin", label: "Admin / Finance" },
  { key: "members", label: "Members" },
];

const COLUMN_VISIBILITY_STORAGE_KEY = "portal.companyMembers.tableColumnVisibility";
const COLUMN_ORDER_STORAGE_KEY = "portal.companyMembers.tableColumnOrder";
const COLUMN_WIDTHS_STORAGE_KEY = "portal.companyMembers.tableColumnWidths.v1";
const TABLE_SORT_STORAGE_KEY = "portal.companyMembers.tableSort";

const TOGGLEABLE_COLUMNS = [
  { key: "role", label: "Role" },
  { key: "portalAccessLevel", label: "Access" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "createdAt", label: "Created" },
  { key: "location", label: "Location" },
  { key: "lastActive", label: "Last Active" },
  { key: "status", label: "Status" },
];

const DEFAULT_COLUMN_VISIBILITY = TOGGLEABLE_COLUMNS.reduce((acc, col) => {
  acc[col.key] = true;
  return acc;
}, {});

const DEFAULT_COLUMN_WIDTHS = {
  member: 300,
  role: 180,
  portalAccessLevel: 180,
  email: 240,
  phone: 170,
  createdAt: 170,
  location: 220,
  lastActive: 180,
  status: 120,
  actions: 130,
};

const MIN_COLUMN_WIDTHS = { actions: 120 };
const REORDERABLE_COLUMN_KEYS = TOGGLEABLE_COLUMNS.map((col) => col.key);

const SORT_COLUMN_OPTIONS = [
  { key: "member", label: "Member name" },
  { key: "role", label: "Role" },
  { key: "portalAccessLevel", label: "Access" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "createdAt", label: "Created" },
  { key: "location", label: "Location" },
  { key: "lastActive", label: "Last Active" },
  { key: "status", label: "Status" },
];

const SORTABLE_COLUMN_KEYS = SORT_COLUMN_OPTIONS.map((o) => o.key);

const STATUS_ORDER = {
  ACTIVE: 1,
  INVITED: 2,
  SUSPENDED: 3,
  INACTIVE: 4,
};

export default function CompanyMembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [memberModal, setMemberModal] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsMember, setDetailsMember] = useState(null);
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [actionState, setActionState] = useState({ kind: "", message: "" });
  const isDeleteDisabled = members.length <= 1;

  const {
    columnVisibility,
    columnOrder,
    columnPickerOpen,
    setColumnPickerOpen,
    columnDropIndicator,
    toolbarRef,
    setColumnVisible,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnRowDragOver,
    handleColumnListDragLeave,
    handleColumnDrop,
    resetColumnTablePreferences,
    tableResizeProps,
  } = useTableColumnPreferences({
    visibilityStorageKey: COLUMN_VISIBILITY_STORAGE_KEY,
    orderStorageKey: COLUMN_ORDER_STORAGE_KEY,
    widthsStorageKey: COLUMN_WIDTHS_STORAGE_KEY,
    defaultVisibility: DEFAULT_COLUMN_VISIBILITY,
    reorderableKeys: REORDERABLE_COLUMN_KEYS,
    defaultWidths: DEFAULT_COLUMN_WIDTHS,
    minWidths: MIN_COLUMN_WIDTHS,
  });

  const {
    sortRules,
    sortData,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    maxRules: sortMaxRules,
    hasActiveSort,
    bindSortableColumns,
  } = useTableSort({ storageKey: TABLE_SORT_STORAGE_KEY });

  const openAddModal = () => setMemberModal({ mode: "add" });
  const openEditModal = useCallback(
    (member) => setMemberModal({ mode: "edit", memberId: member.id, member }),
    []
  );
  const closeMemberModal = () => {
    setMemberModal(null);
    if (searchParams?.get("add") || searchParams?.get("edit")) {
      router.replace("/company");
    }
  };

  const openDetailsModal = (member) => {
    setDetailsMember(member);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setDetailsMember(null);
    if (searchParams?.get("details")) {
      router.replace("/company");
    }
  };

  const loadMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      const response = await listCompanyMembersManaged();
      const rows = Array.isArray(response?.data) ? response.data : [];
      setMembers(
        rows.map((member) => {
          const firstName =
            member.firstName ||
            String(member.name || "").trim().split(/\s+/)[0] ||
            "Member";
          const lastName =
            member.lastName ||
            String(member.name || "").trim().split(/\s+/).slice(1).join(" ") ||
            "";
          const role = member.role
            ? String(member.role).replaceAll(" ", "_").toUpperCase()
            : member.isPrimaryContact
              ? "PRIMARY_CONTACT"
              : "MEMBER";
          return {
            id: member.id,
            firstName,
            lastName,
            email: member.email || "No email",
            phone: member.phone || null,
            role,
            roleLabel: member.roleLabel || member.role || role,
            portalAccessLevel: member.portalAccessLevel || "FULL_ACCESS",
            portalAccessLabel: member.portalAccessLabel || member.portalAccessLevel,
            status: member.status || "ACTIVE",
            location: member.location || "Not specified",
            createdAt: member.createdAt || null,
            lastActive: member.lastActivity || null,
            isPrimaryContact: Boolean(member.isPrimaryContact),
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
  }, []);

  const handleSuspendMember = useCallback(
    async (member, suspend) => {
      if (!member?.id) return;
      if (member.isPrimaryContact && suspend) {
        throw new Error("Primary contact cannot be suspended");
      }

      const res = await suspendCompanyMemberManaged(
        member.id,
        Boolean(suspend)
      );
      const updated = res?.member;

      await loadMembers();
      if (updated) setDetailsMember(updated);
    },
    [loadMembers]
  );

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const add = searchParams?.get("add");
    const editId = searchParams?.get("edit");
    const detailsId = searchParams?.get("details");
    if (add === "1" || add === "true") {
      setMemberModal({ mode: "add" });
      return;
    }
    if (editId) {
      setMemberModal({ mode: "edit", memberId: editId, member: null });
      return;
    }
    if (detailsId) {
      setDetailsMember({ id: detailsId });
      setDetailsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!columnPickerOpen && !sortPickerOpen) return;
    const onDocMouseDown = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setColumnPickerOpen(false);
        setSortPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [columnPickerOpen, sortPickerOpen, setColumnPickerOpen, toolbarRef]);

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

  const getTabCount = useCallback(
    (tabKey) => {
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
    },
    [members]
  );

  const kpis = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "ACTIVE").length;
    const invited = members.filter((m) => m.status === "INVITED").length;
    const accessOwners = members.filter(
      (m) => m.portalAccessLevel === "FULL_ACCESS"
    ).length;

    return { total, active, invited, accessOwners };
  }, [members]);

  const sortedMembers = useMemo(
    () =>
      sortData(filteredMembers, (row, key) => {
        if (key === "member") {
          return `${row.firstName || ""} ${row.lastName || ""}`.trim().toLowerCase();
        }
        if (key === "role") return String(row.role || "").toLowerCase();
        if (key === "portalAccessLevel") {
          return String(row.portalAccessLevel || "").toLowerCase();
        }
        if (key === "email") return String(row.email || "").toLowerCase();
        if (key === "phone") return String(row.phone || "").toLowerCase();
        if (key === "location") return String(row.location || "").toLowerCase();
        if (key === "createdAt") {
          if (!row.createdAt) return 0;
          const t = new Date(row.createdAt).getTime();
          return Number.isFinite(t) ? t : 0;
        }
        if (key === "lastActive") {
          if (!row.lastActive) return 0;
          const t = new Date(row.lastActive).getTime();
          return Number.isFinite(t) ? t : 0;
        }
        if (key === "status") return STATUS_ORDER[row.status] ?? 99;
        return "";
      }),
    [filteredMembers, sortData]
  );

  const tableTabs = useMemo(
    () =>
      ROLE_TABS.map((tab) => ({
        ...tab,
        badge: getTabCount(tab.key),
      })),
    [getTabCount]
  );

  const allColumns = useMemo(
    () => [
      {
        key: "member",
        label: "MEMBER",
        className: "align-top",
        render: (_, member) => {
          const fullName =
            `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Unknown";
          const initials =
            `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}` || "U";
          return (
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                fallback={initials.toUpperCase()}
                alt={fullName}
                size="sm"
                className="flex-shrink-0 bg-gray-600 text-white"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{fullName}</p>
                <p className="truncate text-xs text-gray-500">{member.location || "Not specified"}</p>
              </div>
            </div>
          );
        },
      },
      {
        key: "role",
        visibilityKey: "role",
        label: "ROLE",
        className: "align-middle",
        render: (_, member) => (
          <span className="text-xs font-semibold text-gray-900">
            {member.roleLabel || String(member.role || "MEMBER").replaceAll("_", " ")}
          </span>
        ),
      },
      {
        key: "portalAccessLevel",
        visibilityKey: "portalAccessLevel",
        label: "ACCESS",
        className: "align-middle",
        render: (_, member) => (
          <span className="inline-flex whitespace-nowrap rounded-md border border-blue-200 bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
            {member.portalAccessLabel || String(member.portalAccessLevel || "READ_ONLY").replaceAll("_", " ")}
          </span>
        ),
      },
      {
        key: "email",
        visibilityKey: "email",
        label: "EMAIL",
        className: "align-middle",
        render: (_, member) => (
          <span className="text-xs font-medium text-gray-700">{member.email || "No email"}</span>
        ),
      },
      {
        key: "phone",
        visibilityKey: "phone",
        label: "PHONE",
        className: "align-middle",
        render: (_, member) => (
          <span className="text-xs font-medium text-gray-700">{member.phone || "No phone"}</span>
        ),
      },
      {
        key: "createdAt",
        visibilityKey: "createdAt",
        label: "CREATED",
        className: "align-middle",
        render: (_, member) =>
          member.createdAt ? (
            <TableCellCreated dateString={member.createdAt} dateMode="calendar" emptyLabel="—" />
          ) : (
            <span className="text-xs text-gray-400">—</span>
          ),
      },
      {
        key: "location",
        visibilityKey: "location",
        label: "LOCATION",
        className: "align-middle",
        render: (_, member) => (
          <span className="text-xs text-gray-700">{member.location || "Not specified"}</span>
        ),
      },
      {
        key: "lastActive",
        visibilityKey: "lastActive",
        label: "LAST ACTIVE",
        className: "align-middle",
        render: (_, member) =>
          member.lastActive ? (
            <TableCellCreated dateString={member.lastActive} dateMode="calendar" />
          ) : (
            <span className="text-xs text-gray-400">No activity</span>
          ),
      },
      {
        key: "status",
        visibilityKey: "status",
        label: "STATUS",
        className: "align-middle",
        render: (_, member) => {
          const s = String(member.status || "ACTIVE").toUpperCase();
          const isActive = s === "ACTIVE";
          const isSuspended = s === "SUSPENDED";
          const isInactive = s === "INACTIVE";
          const isInvited = s === "INVITED";

          return (
            <span
              className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${
                isActive
                  ? "border-green-200 bg-green-100 text-green-700"
                  : isSuspended
                    ? "border-amber-200 bg-amber-100 text-amber-800"
                    : isInactive
                      ? "border-gray-200 bg-gray-100 text-gray-600"
                      : isInvited
                        ? "border-yellow-200 bg-yellow-100 text-yellow-700"
                        : "border-yellow-200 bg-yellow-100 text-yellow-700"
              }`}
            >
              {isActive ? "Active" : isSuspended ? "Suspended" : isInactive ? "Inactive" : isInvited ? "Invited" : s}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: "ACTIONS",
        resizable: false,
        headerClassName: "whitespace-nowrap",
        className: "align-middle whitespace-nowrap",
        render: (_, member) => (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const statusKey = String(member?.status || "ACTIVE").toUpperCase();
              const shouldActivate = statusKey === "SUSPENDED" || statusKey === "INACTIVE";
              return (
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              title={
                shouldActivate ? "Activate portal access" : "Suspend portal access"
              }
              onClick={() =>
                handleSuspendMember(member, !shouldActivate)
              }
              aria-disabled={member?.isPrimaryContact ? true : false}
              disabled={Boolean(member?.isPrimaryContact)}
            >
              {shouldActivate ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </Button>
              );
            })()}
            <Button
              variant="ghost"
              size="sm"
              className="p-1.5 text-green-600 hover:bg-green-50"
              title="Edit member"
              onClick={() => openEditModal(member)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-1.5 text-red-600 hover:bg-red-50 ${
                isDeleteDisabled ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
              }`}
              title="Delete member"
              onClick={() => {
                if (isDeleteDisabled) return;
                setDeleteTarget(member);
              }}
              aria-disabled={isDeleteDisabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleSuspendMember, openEditModal, isDeleteDisabled]
  );

  const visibleColumns = useMemo(() => {
    const byKey = Object.fromEntries(allColumns.map((c) => [c.key, c]));
    const out = [];
    if (byKey.member) out.push(byKey.member);
    for (const key of columnOrder) {
      const col = byKey[key];
      if (!col?.visibilityKey) continue;
      if (columnVisibility[col.visibilityKey] === false) continue;
      out.push(col);
    }
    if (byKey.actions) out.push(byKey.actions);
    return bindSortableColumns(out, SORTABLE_COLUMN_KEYS);
  }, [allColumns, columnVisibility, columnOrder, bindSortableColumns]);

  return (
    <PortalPageShell>
      <div className="px-1 pt-1">
        <PageHeader
          title="Company Members"
          subtitle="Manage your company contacts and portal access"
          showSearch={false}
          showActions
          onExportClick={() =>
            exportItemsToCSV(sortedMembers, {
              filename: "client-portal-company-members_export.csv",
            })
          }
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Members",
              count: kpis.total,
              icon: Users,
            },
            {
              label: "Active Members",
              count: kpis.active,
              icon: UserCheck,
            },
            {
              label: "Full Access",
              count: kpis.accessOwners,
              icon: Shield,
            },
            {
              label: "Pending Invites",
              count: kpis.invited,
              icon: CheckCircle2,
            },
          ].map((item) => (
            <KPICard
              key={item.label}
              title={item.label}
              value={item.count.toString()}
              subtitle={
                item.count === 0
                  ? "None"
                  : `${item.count} ${item.count === 1 ? "member" : "members"}`
              }
              icon={item.icon}
              colorScheme="orange"
            />
          ))}
        </div>

        <div className="relative" ref={toolbarRef}>
          <TabsWithActions
            variant="glass"
            tabs={tableTabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            showSearch
            searchPlaceholder="Search members..."
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showAdd
            onAddClick={openAddModal}
            addTitle="Add Member"
            showSort
            onSortClick={() => {
              setColumnPickerOpen(false);
              setSortPickerOpen((prev) => !prev);
            }}
            sortActive={hasActiveSort}
            showColumnVisibility
            onColumnVisibilityClick={() => {
              setSortPickerOpen(false);
              setColumnPickerOpen((prev) => !prev);
            }}
            columnVisibilityTitle="Show / hide columns"
          />
          <TableSortDropdown
            open={sortPickerOpen}
            columnOptions={SORT_COLUMN_OPTIONS}
            sortRules={sortRules}
            maxRules={sortMaxRules}
            onAddRule={addSortRule}
            onRemoveRule={removeSortRule}
            onSetDirection={setRuleDirection}
            onMoveRule={moveSortRule}
            onClear={clearSort}
          />
          <TableColumnPicker
            open={columnPickerOpen}
            description="Member and actions columns always stay visible. Drag to reorder."
            reorderableRows={TOGGLEABLE_COLUMNS}
            columnVisibility={columnVisibility}
            columnOrder={columnOrder}
            columnDropIndicator={columnDropIndicator}
            onSetVisible={setColumnVisible}
            onDragStart={handleColumnDragStart}
            onDragEnd={handleColumnDragEnd}
            onRowDragOver={handleColumnRowDragOver}
            onListDragLeave={handleColumnListDragLeave}
            onDrop={handleColumnDrop}
            onReset={resetColumnTablePreferences}
          />
        </div>

        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{sortedMembers.length}</span>{" "}
          result{sortedMembers.length !== 1 ? "s" : ""}
        </p>

        {loadingMembers ? (
          <Card variant="elevated" className="rounded-xl p-12 text-center">
            <p className="text-gray-600">Loading members...</p>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <Table
              columns={visibleColumns}
              data={sortedMembers}
              keyField="id"
              variant="modernEmbedded"
              onRowClick={(row) => openDetailsModal(row)}
              {...tableResizeProps}
            />
            {sortedMembers.length === 0 ? (
              <div className="border-t border-gray-200 p-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-700">No members found</p>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery.trim()
                    ? "Try adjusting your search or tab filter."
                    : "Add your first company contact to get started."}
                </p>
                {!searchQuery.trim() ? (
                  <Button type="button" className="mt-4 gap-2" onClick={openAddModal}>
                    <Plus className="h-4 w-4" />
                    Add Member
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {!loadingMembers && actionState.message && (
        <div>
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

      <CompanyMemberDetailsModal
        isOpen={detailsModalOpen}
        onClose={closeDetailsModal}
        memberId={detailsMember?.id}
        initialMember={detailsMember}
        onEdit={(member) => {
          closeDetailsModal();
          openEditModal(member);
        }}
        onSuspend={handleSuspendMember}
        onDelete={(member) => {
          closeDetailsModal();
          setDeleteTarget(member);
        }}
      />

      <CompanyMemberModal
        isOpen={Boolean(memberModal)}
        onClose={closeMemberModal}
        mode={memberModal?.mode || "add"}
        memberId={memberModal?.memberId}
        initialMember={memberModal?.member}
        onSuccess={async () => {
          await loadMembers();
          setActionState({
            kind: "success",
            message:
              memberModal?.mode === "edit"
                ? "Member updated successfully."
                : "Member added successfully.",
          });
        }}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
            aria-label="Close delete modal"
          />
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-gray-200 shadow-2xl p-6">
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
                  if (isDeleteDisabled) return;
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
                disabled={isDeleteDisabled}
                className={`flex-1 h-12 rounded-xl font-semibold ${
                  isDeleteDisabled
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalPageShell>
  );
}

