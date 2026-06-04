"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Shield,
  Pencil,
  Trash2,
  Download,
  AlertTriangle,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  deleteCompanyMemberManaged,
  getContactById,
} from "@/lib/api/companyMemberManagementService";

export default function ViewCompanyMemberPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params?.memberId;
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMember = async () => {
      try {
        setLoading(true);
        const response = await getContactById(memberId);
        const data = response?.data || response;
        if (!data?.id) {
          setMember(null);
          return;
        }
        setMember({
          id: data.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "No email",
          phone: data.phone || "No phone",
          location: data.location || "Not specified",
          role: data.role || "MEMBER",
          status: data.status || "ACTIVE",
          portalAccessLevel: data.portalAccessLevel || "READ_ONLY",
        });
      } catch (loadError) {
        setError(loadError.message || "Failed to load member.");
      } finally {
        setLoading(false);
      }
    };
    if (memberId) {
      loadMember();
    }
  }, [memberId]);
  const fullName = member
    ? `${member.firstName} ${member.lastName}`.trim() || "Unknown Member"
    : "Member Not Found";

  return (
    <div className="bg-white min-h-screen">
      <div className="px-4 pt-4">
        <PageHeader
          title={fullName}
          subtitle="Company Member"
          showSearch={false}
          showActions={false}
        />
      </div>

      <div className="px-3 mt-6">
        {loading ? (
          <div className="max-w-3xl rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <p className="text-gray-600">Loading member...</p>
          </div>
        ) : !member ? (
          <div className="max-w-3xl rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <p className="text-gray-600">{error || "Member not found."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <button
                  onClick={() => router.push("/company")}
                  className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Company Members
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/company?edit=${memberId}`)}
                    className="w-10 h-10 rounded-xl border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    className="w-10 h-10 rounded-xl border border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                    title="Export"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="w-10 h-10 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200/80 bg-white/75 p-4">
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {member.role.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200/80 bg-white/75 p-4">
                  <p className="text-sm text-gray-500">Portal Access</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {member.portalAccessLevel.replaceAll("_", " ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200/80 bg-white/75 p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {member.status}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-white/50 shadow-xl p-2">
              <div className="flex items-center gap-2 overflow-x-auto">
                {["Overview", "Details", "Access"].map((tab, index) => (
                  <button
                    key={tab}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap ${
                      index === 0
                        ? "bg-xtrawrkx-500 text-white shadow"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Member Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {member.email}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {member.phone}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  {member.location}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="w-4 h-4 text-gray-500" />
                  {member.portalAccessLevel.replaceAll("_", " ")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {deleteOpen && member && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteOpen(false)}
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
                onClick={() => setDeleteOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-red-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Are you sure you want to delete {fullName}?
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteCompanyMemberManaged(member.id);
                  router.push("/company");
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

