"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  CheckSquare,
  Users,
  MessageSquare,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  Globe,
  ExternalLink,
  Search,
  Plus,
  Paperclip,
  Smile,
  MoreVertical,
  ArrowUpDown,
  UserPlus,
  Loader2,
  Eye,
  GitBranch,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/lib/auth";
import strapiClient from "@/lib/strapiClient";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

// Mock messaging data (to be replaced with API integration)
const mockChannels = [
  {
    id: 1,
    name: "General Discussion",
    lastMessage: "Thanks for the update!",
    lastActivity: "2 hours ago",
    unreadCount: 2,
  },
  {
    id: 2,
    name: "Project Updates",
    lastMessage: "New milestone completed",
    lastActivity: "1 day ago",
    unreadCount: 0,
  },
];

const mockMessages = {
  1: [
    {
      id: 1,
      senderId: 1,
      content: "Hello! How is the project progressing?",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2,
      senderId: 2,
      content: "Thanks for the update!",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
  2: [
    {
      id: 3,
      senderId: 1,
      content: "New milestone completed",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

const mockTeamMembers = {
  1: { id: 1, name: "Project Manager", avatar: "PM", color: "bg-xtrawrkx-500" },
  2: { id: 2, name: "You", avatar: "U", color: "bg-blue-500" },
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskModalFullView, setIsTaskModalFullView] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!params?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const projectIdentifier = params.id;

        // Check if it's a numeric ID or a slug
        const isNumericId = /^\d+$/.test(projectIdentifier);

        let url;
        let data;

        if (isNumericId) {
          // Fetch by ID directly
          const queryParams = strapiClient.buildQueryString({
            populate: [
              "manager",
              "teamMembers",
              "tasks",
              "tasks.assignee",
              "clientAccount",
            ],
          });

          const baseURL = strapiClient.buildURL(
            `/projects/${projectIdentifier}`,
            {}
          );
          url = `${baseURL}?${queryParams}`;
        } else {
          // Fetch by slug using filter
          const queryParams = strapiClient.buildQueryString({
            filters: {
              slug: {
                $eq: projectIdentifier,
              },
            },
            populate: [
              "manager",
              "teamMembers",
              "tasks",
              "tasks.assignee",
              "clientAccount",
            ],
          });

          const baseURL = strapiClient.buildURL("/projects", {});
          url = `${baseURL}?${queryParams}`;
        }


        // Use fetch directly with proper error handling
        const response = await fetch(url, {
          method: "GET",
          headers: strapiClient.getHeaders(),
        });

        if (!response.ok) {
          // Check if response is HTML (error page)
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            const errorText = await response.text();
            console.error(
              "Server returned HTML instead of JSON. Status:",
              response.status
            );
            console.error("Response preview:", errorText.substring(0, 500));
            throw new Error(
              `Server error: ${response.status} ${response.statusText}`
            );
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        data = await response.json();

        // Handle different response structures
        let projectResponse;
        if (isNumericId) {
          // Single project response
          projectResponse = data.data;
        } else {
          // Array response from filter query
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            projectResponse = data.data[0];
          } else {
            throw new Error("Project not found");
          }
        }

        if (projectResponse) {
          const projectData = projectResponse.attributes || projectResponse;
          setProject({
            id: projectResponse.id || projectIdentifier,
            name: projectData.name || "Untitled Project",
            description: projectData.description || "",
            status: projectData.status || "PLANNING",
            progress: projectData.progress || 0,
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            budget: projectData.budget || 0,
            spent: projectData.spent || projectData.totalSpend || 0,
            manager:
              projectData.manager?.data?.attributes || projectData.manager,
            team:
              projectData.teamMembers?.data || projectData.teamMembers || [],
            tasks: projectData.tasks?.data || projectData.tasks || [],
            clientAccount:
              projectData.clientAccount?.data?.attributes ||
              projectData.clientAccount,
          });

          // Set first channel as selected
          if (mockChannels.length > 0) {
            setSelectedChannel(mockChannels[0]);
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError(err.message || "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [params]);

  const clientVisibleTasks =
    project?.tasks?.filter((task) => {
      const taskData = task.attributes || task;
      return !!taskData.isSharedWithClient;
    }) || [];

  // Calculate project stats
  const stats = project
    ? [
        {
          title: "Total Tasks",
          value: clientVisibleTasks.length.toString(),
          change: "+0",
          changeType: "neutral",
          icon: CheckSquare,
        },
        {
          title: "In Progress",
          value: (
            clientVisibleTasks.filter(
              (t) =>
                t.status === "IN_PROGRESS" ||
                t.attributes?.status === "IN_PROGRESS"
            ).length
          ).toString(),
          change: "+0",
          changeType: "neutral",
          icon: Clock,
        },
        {
          title: "Completed",
          value: (
            clientVisibleTasks.filter(
              (t) =>
                t.status === "COMPLETED" || t.attributes?.status === "COMPLETED"
            ).length
          ).toString(),
          change: "+0",
          changeType: "neutral",
          icon: CheckCircle2,
        },
        {
          title: "Team Members",
          value: (project.team?.length || 0).toString(),
          change: "+0",
          changeType: "neutral",
          icon: Users,
        },
      ]
    : [];

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "members", label: "Members", icon: Users },
    { id: "discussion", label: "Discussion", icon: MessageSquare },
  ];

  const getStatusColor = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "COMPLETED":
      case "DONE":
        return "bg-green-100 text-green-800 border-green-400";
      case "IN_PROGRESS":
      case "IN PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "ACTIVE":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "IN REVIEW":
      case "INTERNAL REVIEW":
      case "IN_REVIEW":
        return "bg-purple-100 text-purple-800 border-purple-400";
      case "CLIENT REVIEW":
      case "CLIENT_REVIEW":
      case "CLIENT REVIEW":
      case "CLIENT_REVIEW":
        return "bg-purple-100 text-purple-800 border-purple-400";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "TO DO":
      case "TODO":
      case "SCHEDULED":
      case "PLANNING":
      case "PLANNED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-400";
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      PLANNING: "Planning",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      ON_HOLD: "On Hold",
      ACTIVE: "Active",
      "TO DO": "To Do",
      "IN PROGRESS": "In Progress",
      IN_REVIEW: "Internal Review",
      "CLIENT REVIEW": "Client Review",
      CLIENT_REVIEW: "Client Review",
      APPROVED: "Approved",
      DONE: "Done",
      TODO: "To Do",
    };
    return (
      statusMap[status?.toUpperCase()] ||
      status?.replace("_", " ") ||
      "Planning"
    );
  };

  // Normalize status for consistent display
  const normalizeStatus = (status) => {
    if (!status) return "To Do";
    const statusUpper = status.toUpperCase();
    if (statusUpper === "TO DO" || statusUpper === "TODO") return "To Do";
    if (statusUpper === "IN PROGRESS" || statusUpper === "IN_PROGRESS")
      return "In Progress";
    if (statusUpper === "IN REVIEW" || statusUpper === "IN_REVIEW")
      return "Internal Review";
    if (statusUpper === "CLIENT REVIEW" || statusUpper === "CLIENT_REVIEW")
      return "Client Review";
    if (statusUpper === "APPROVED") return "Approved";
    if (statusUpper === "DONE" || statusUpper === "COMPLETED") return "Done";
    if (statusUpper === "CANCELLED") return "Cancelled";
    return status.replace("_", " ");
  };

  // Normalize priority
  const normalizePriority = (priority) => {
    if (!priority) return "Medium";
    const priorityLower = priority.toLowerCase();
    if (priorityLower === "high") return "High";
    if (priorityLower === "medium") return "Medium";
    if (priorityLower === "low") return "Low";
    return priority;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const priorityLower = (priority || "").toLowerCase();
    switch (priorityLower) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Transform task data for display
  const transformTask = (task) => {
    const taskData = task.attributes || task;
    const assigneeData =
      taskData.assignee?.data?.attributes ||
      taskData.assignee?.attributes ||
      taskData.assignee;

    return {
      id: task.id || task.documentId || taskData.id || taskData.documentId,
      name: taskData.name || taskData.title || "Untitled Task",
      description: taskData.description || "",
      status: normalizeStatus(taskData.status),
      priority: normalizePriority(taskData.priority),
      scheduledDate:
        taskData.scheduledDate || taskData.dueDate || taskData.endDate,
      timeAllotted: taskData.timeAllotted ?? null,
      progress: taskData.progress || 0,
      assignee: assigneeData
        ? {
            id: assigneeData.id || assigneeData.documentId,
            name:
              assigneeData.name ||
              assigneeData.firstName ||
              assigneeData.email?.split("@")[0] ||
              "Unknown",
            email: assigneeData.email,
          }
        : null,
      subtasks: taskData.subtasks || [],
      project: project
        ? {
            id: project.id,
            name: project.name,
          }
        : null,
      isSharedWithClient: !!taskData.isSharedWithClient,
      createdBySource: taskData.createdBySource || "internal",
      requiresApproval: taskData.requiresApproval || false,
      clientApproval: taskData.clientApproval || null,
      comments: taskData.comments || [],
      attachments: taskData.attachments || [],
    };
  };

  // Handle task click
  const handleTaskClick = (task) => {
    const transformedTask = transformTask(task);
    setSelectedTask(transformedTask);
    setIsTaskModalOpen(true);
  };

  // Task table columns - matching tasks page
  const taskColumnsTable = [
    {
      key: "actionRequired",
      label: "",
      render: (_, task) => {
        // Check if task requires client approval (status is Client Review only)
        const isActionRequired =
          (task.status === "Client Review" ||
            task.status?.toUpperCase() === "CLIENT_REVIEW") &&
          !task.clientApproval;

        if (isActionRequired) {
          return (
            <div className="flex items-center justify-center">
              <div className="relative">
                <AlertCircle className="w-5 h-5 text-xtrawrkx-500 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-xtrawrkx-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          );
        }

        // Show a subtle indicator for tasks not in review
        return (
          <div className="flex items-center justify-center w-5 h-5">
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
        );
      },
    },
    {
      key: "name",
      label: "TASK NAME",
      render: (_, task) => {
        const isDone =
          task.status?.toLowerCase() === "done" ||
          task.status?.toLowerCase() === "completed";

        const taskSubtasks = task.subtasks || [];
        const rootSubtasks = taskSubtasks.filter((st) => {
          return (
            !st.parentSubtask ||
            st.parentSubtask === null ||
            (typeof st.parentSubtask === "object" && !st.parentSubtask.id)
          );
        });
        const hasSubtasks = rootSubtasks.length > 0;

        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <div
                className={`font-medium truncate flex-1 min-w-0 ${
                  isDone ? "line-through text-gray-500" : "text-gray-900"
                }`}
              >
                {task.name}
              </div>
              {hasSubtasks && (
                <div
                  className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600"
                  title={`${rootSubtasks.length} ${
                    rootSubtasks.length === 1 ? "subtask" : "subtasks"
                  }`}
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    {rootSubtasks.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "assignee",
      label: "ASSIGNEE",
      render: (_, task) => {
        const assignee = task.assignee;
        const hasAssignee = assignee && assignee.name;

        return (
          <div className="flex items-center gap-2 min-w-[140px]">
            {hasAssignee ? (
              <div className="flex items-center gap-1">
                <div
                  className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 border border-white"
                  title={assignee.name}
                >
                  {assignee.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <span className="text-sm text-gray-600 truncate ml-1">
                  {assignee.name}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Unassigned</span>
            )}
          </div>
        );
      },
    },
    {
      key: "dueDate",
      label: "DUE DATE",
      render: (_, task) => {
        const formatDate = (dateString) => {
          if (!dateString) return "Not set";
          try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          } catch {
            return dateString;
          }
        };

        return (
          <div className="flex items-center gap-2 min-w-[150px]">
            <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <span className="text-sm text-gray-700">
              {formatDate(task.scheduledDate)}
            </span>
          </div>
        );
      },
    },
    {
      key: "timeAllotted",
      label: "TIME ALLOTTED",
      render: (_, task) => (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Clock className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span className="text-sm text-gray-700 font-medium">
            {task.timeAllotted != null && task.timeAllotted !== ""
              ? `${task.timeAllotted} hrs`
              : "—"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, task) => {
        return (
          <div className="min-w-[140px]">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-block ${getStatusColor(
                task.status
              )}`}
            >
              {formatStatus(task.status)}
            </span>
          </div>
        );
      },
    },
    {
      key: "priority",
      label: "PRIORITY",
      render: (_, task) => {
        return (
          <div className="min-w-[120px]">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-block ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority || "Medium"}
            </span>
          </div>
        );
      },
    },
    {
      key: "progress",
      label: "PROGRESS",
      render: (_, task) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-xtrawrkx-500 h-2 rounded-full transition-all"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {task.progress || 0}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, task) => {
        // Check if task requires client approval (status is Client Review only)
        const isActionRequired =
          (task.status === "Client Review" ||
            task.status?.toUpperCase() === "CLIENT_REVIEW") &&
          !task.clientApproval;

        return (
          <div className="flex items-center gap-1 min-w-[120px]">
            {isActionRequired && (
              <div className="px-2 py-1 bg-xtrawrkx-100 text-xtrawrkx-800 rounded-lg text-xs font-semibold border border-xtrawrkx-200 mr-2">
                Action Required
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTaskClick(task);
              }}
              className="p-1.5 text-xtrawrkx-600 hover:text-xtrawrkx-700 hover:bg-xtrawrkx-50 rounded transition-colors"
              title="View Task"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChannel) return;
    // TODO: Implement API call to send message
    setNewMessage("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4">
          <PageHeader
            title="Project"
            subtitle="Loading project..."
            breadcrumb={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={false}
            showActions={false}
          />
        </div>
        <div className="flex-1 flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-xtrawrkx-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4">
          <PageHeader
            title="Project"
            subtitle="Error loading project"
            breadcrumb={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={false}
            showActions={false}
          />
        </div>
        <div className="flex-1 flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error || "Project not found"}</p>
            <button
              onClick={() => router.push("/projects")}
              className="mt-4 px-4 py-2 bg-xtrawrkx-500 text-white rounded-lg hover:bg-xtrawrkx-600 transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        <PageHeader
          title={project.name}
          subtitle={`${formatStatus(project.status)} • ${
            project.clientAccount?.name || "No Client"
          }`}
          breadcrumb={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Projects", href: "/projects" },
            {
              label: project.name,
              href: `/projects/${project.id}`,
            },
          ]}
          showProfile={true}
          showSearch={false}
          showActions={false}
        />

        {/* Project Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 font-medium">
                      {stat.title}
                    </p>
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                        stat.changeType === "increase"
                          ? "bg-green-50 text-green-600"
                          : stat.changeType === "decrease"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-2 shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-xtrawrkx-500 text-white shadow-lg"
                      : "bg-transparent text-gray-700 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Project Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Project Details Card */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Project Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Start Date
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.startDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">End Date</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(project.endDate)}
                      </span>
                    </div>
                    {project.budget && project.budget > 0 && (
                      <>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Budget
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ₹{project.budget.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Spent</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ₹{project.spent.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Remaining
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            ₹{(project.budget - project.spent).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-xtrawrkx-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                (project.spent / project.budget) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Card */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Project Progress
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Overall Progress
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-xtrawrkx-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Quick Stats & Team */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-xtrawrkx-100 rounded-lg">
                        <CheckSquare className="w-5 h-5 text-xtrawrkx-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Total Tasks</p>
                        <p className="text-lg font-bold text-gray-900">
                          {clientVisibleTasks.length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-lg font-bold text-gray-900">
                          {clientVisibleTasks.filter(
                            (t) =>
                              t.status === "COMPLETED" ||
                              t.attributes?.status === "COMPLETED"
                          ).length}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">In Progress</p>
                        <p className="text-lg font-bold text-gray-900">
                          {clientVisibleTasks.filter(
                            (t) =>
                              t.status === "IN_PROGRESS" ||
                              t.attributes?.status === "IN_PROGRESS"
                          ).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members Preview */}
                {project.team && project.team.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Team Members
                      </h3>
                      <button
                        onClick={() => setActiveTab("members")}
                        className="text-sm text-xtrawrkx-600 hover:text-xtrawrkx-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {project.team.slice(0, 6).map((member, index) => {
                        const memberData = member.attributes || member;
                        const name =
                          memberData.firstName && memberData.lastName
                            ? `${memberData.firstName} ${memberData.lastName}`
                            : memberData.name ||
                              memberData.email?.split("@")[0] ||
                              "Unknown";
                        const initial = name.charAt(0).toUpperCase();
                        return (
                          <div
                            key={member.id || index}
                            className="flex items-center gap-3 p-2 bg-white/50 rounded-lg"
                          >
                            <div className="w-8 h-8 bg-xtrawrkx-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {initial}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {name}
                            </span>
                          </div>
                        );
                      })}
                      {project.team.length > 6 && (
                        <div className="text-center text-sm text-gray-600">
                          +{project.team.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-6 -mx-4 px-4">
              {/* Tasks Table */}
              <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 transition-shadow duration-300">
                <table className="w-full rounded-3xl overflow-hidden min-w-[1600px]">
                  <thead className="bg-white/90 backdrop-blur-lg border-b border-xtrawrkx-200/50 shadow-sm">
                    <tr>
                      {taskColumnsTable.map((column) => (
                        <th
                          key={column.key}
                          className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-white/20">
                    {clientVisibleTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={taskColumnsTable.length}
                          className="px-6 py-12 text-center"
                        >
                          <div className="flex flex-col items-center">
                            <CheckSquare className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 font-medium">
                              No tasks found
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              This project doesn't have any tasks yet
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      clientVisibleTasks
                        .filter((task) => {
                          const taskData = task.attributes || task;
                          return !!taskData.isSharedWithClient;
                        })
                        .map((task) => {
                        const transformedTask = transformTask(task);
                        const isActionRequired =
                          transformedTask.requiresApproval &&
                          transformedTask.status === "Client Review" &&
                          !transformedTask.clientApproval;

                        return (
                          <tr
                            key={transformedTask.id}
                            onClick={() => handleTaskClick(task)}
                            className={`hover:bg-xtrawrkx-50/50 hover:shadow-lg transition-all duration-300 group bg-white/40 shadow-sm hover:shadow-xtrawrkx-100/50 cursor-pointer ${
                              isActionRequired
                                ? "border-l-4 border-xtrawrkx-500 bg-xtrawrkx-50/30"
                                : ""
                            }`}
                          >
                            {taskColumnsTable.map((column) => (
                              <td
                                key={column.key}
                                className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300"
                              >
                                {column.render(
                                  transformedTask,
                                  transformedTask
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Team Members
                  </h3>
                  {project.team && project.team.length > 0 ? (
                    <div className="space-y-4">
                      {project.team.map((member, index) => {
                        const memberData = member.attributes || member;
                        const name =
                          memberData.firstName && memberData.lastName
                            ? `${memberData.firstName} ${memberData.lastName}`
                            : memberData.name ||
                              memberData.email?.split("@")[0] ||
                              "Unknown";
                        const initial = name.charAt(0).toUpperCase();
                        const role =
                          memberData.role ||
                          memberData.position ||
                          "Team Member";
                        return (
                          <div
                            key={member.id || index}
                            className="flex items-center gap-4 p-4 bg-white/50 rounded-lg border border-white/30"
                          >
                            <div className="w-12 h-12 bg-xtrawrkx-500 rounded-full flex items-center justify-center text-white font-bold">
                              {initial}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {name}
                              </h4>
                              <p className="text-sm text-gray-600">{role}</p>
                              {memberData.email && (
                                <p className="text-xs text-gray-500">
                                  {memberData.email}
                                </p>
                              )}
                            </div>
                            <button className="px-4 py-2 bg-xtrawrkx-500 text-white rounded-lg hover:bg-xtrawrkx-600 transition-colors text-sm font-medium">
                              Contact
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No team members</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Discussion Tab */}
          {activeTab === "discussion" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Channels List */}
              <div className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4">
                <div className="space-y-4 h-full flex flex-col">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Channel
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search channel or message"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {mockChannels
                      .filter((channel) =>
                        channel.name
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      )
                      .map((channel) => (
                        <div
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChannel?.id === channel.id
                              ? "bg-xtrawrkx-50 border border-xtrawrkx-200"
                              : "hover:bg-gray-50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {channel.name}
                              </h4>
                              {channel.unreadCount > 0 && (
                                <div className="w-2 h-2 bg-xtrawrkx-500 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {channel.lastActivity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {channel.lastMessage}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Discussion Area */}
              <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl flex flex-col">
                {selectedChannel ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedChannel.name}
                      </h3>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {mockMessages[selectedChannel.id]?.map((message) => {
                        const sender = mockTeamMembers[message.senderId];
                        const isCurrentUser = message.senderId === 2;
                        const messageDate = new Date(message.timestamp);

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex gap-3 max-w-[70%] ${
                                isCurrentUser ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {!isCurrentUser && (
                                <div
                                  className={`w-8 h-8 ${
                                    sender?.color || "bg-gray-500"
                                  } rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                >
                                  {sender?.avatar || "U"}
                                </div>
                              )}
                              <div
                                className={`flex flex-col ${
                                  isCurrentUser ? "items-end" : "items-start"
                                }`}
                              >
                                <div
                                  className={`px-4 py-2 rounded-lg ${
                                    isCurrentUser
                                      ? "bg-xtrawrkx-500 text-white"
                                      : "bg-gray-100 text-gray-900"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                </div>
                                <div
                                  className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                                    isCurrentUser
                                      ? "flex-row-reverse"
                                      : "flex-row"
                                  }`}
                                >
                                  <span>
                                    {messageDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                  <span>{sender?.name || "Unknown User"}</span>
                                </div>
                              </div>
                              {isCurrentUser && (
                                <div
                                  className={`w-8 h-8 ${
                                    sender?.color || "bg-gray-500"
                                  } rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                >
                                  {sender?.avatar || "U"}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-end gap-3">
                        <div className="w-8 h-8 bg-xtrawrkx-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {session?.user?.profile?.email
                            ?.charAt(0)
                            .toUpperCase() || "U"}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Write a message"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500 focus:border-transparent"
                            rows={3}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3">
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Paperclip className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Smile className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className="px-4 py-2 bg-xtrawrkx-500 text-white rounded-lg hover:bg-xtrawrkx-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Select a channel to start the discussion
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setIsTaskModalFullView(false);
        }}
        task={selectedTask}
        isFullView={isTaskModalFullView}
        onToggleView={() => setIsTaskModalFullView(!isTaskModalFullView)}
        onOpenProject={(projectId) => {
          if (projectId) {
            router.push(`/projects/${projectId}`);
            setIsTaskModalOpen(false);
          }
        }}
        onApprove={async (taskId) => {
          try {
            // Update task approval and status via API
            const response = await fetch(
              strapiClient.buildURL(`/tasks/${taskId}`, {}),
              {
                method: "PUT",
                headers: strapiClient.getHeaders(),
                body: JSON.stringify({
                  data: {
                    clientApproval: "approved",
                    approvedAt: new Date().toISOString(),
                    status: "APPROVED", // Change status to Approved when client approves
                  },
                }),
              }
            );

            if (response.ok) {
              // Reload project to get updated task status
              const loadProject = async () => {
                if (!params?.id) return;
                try {
                  const projectIdentifier = params.id;
                  const isNumericId = /^\d+$/.test(projectIdentifier);
                  let url;

                  if (isNumericId) {
                    const queryParams = strapiClient.buildQueryString({
                      populate: [
                        "manager",
                        "teamMembers",
                        "tasks",
                        "tasks.assignee",
                        "clientAccount",
                      ],
                    });
                    const baseURL = strapiClient.buildURL(
                      `/projects/${projectIdentifier}`,
                      {}
                    );
                    url = `${baseURL}?${queryParams}`;
                  } else {
                    const queryParams = strapiClient.buildQueryString({
                      filters: {
                        slug: {
                          $eq: projectIdentifier,
                        },
                      },
                      populate: [
                        "manager",
                        "teamMembers",
                        "tasks",
                        "tasks.assignee",
                        "clientAccount",
                      ],
                    });
                    const baseURL = strapiClient.buildURL("/projects", {});
                    url = `${baseURL}?${queryParams}`;
                  }

                  const response = await fetch(url, {
                    method: "GET",
                    headers: strapiClient.getHeaders(),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    let projectResponse;
                    if (isNumericId) {
                      projectResponse = data.data;
                    } else {
                      if (
                        data.data &&
                        Array.isArray(data.data) &&
                        data.data.length > 0
                      ) {
                        projectResponse = data.data[0];
                      }
                    }

                    if (projectResponse) {
                      const projectData =
                        projectResponse.attributes || projectResponse;
                      setProject({
                        id: projectResponse.id || projectIdentifier,
                        name: projectData.name || "Untitled Project",
                        description: projectData.description || "",
                        status: projectData.status || "PLANNING",
                        progress: projectData.progress || 0,
                        startDate: projectData.startDate,
                        endDate: projectData.endDate,
                        budget: projectData.budget || 0,
                        spent: projectData.spent || projectData.totalSpend || 0,
                        manager:
                          projectData.manager?.data?.attributes ||
                          projectData.manager,
                        team:
                          projectData.teamMembers?.data ||
                          projectData.teamMembers ||
                          [],
                        tasks:
                          projectData.tasks?.data || projectData.tasks || [],
                        clientAccount:
                          projectData.clientAccount?.data?.attributes ||
                          projectData.clientAccount,
                      });
                    }
                  }
                } catch (err) {
                  console.error("Error reloading project:", err);
                }
              };
              await loadProject();
            }
          } catch (error) {
            console.error("Error approving task:", error);
          }
        }}
        onReject={async (taskId) => {
          // TODO: Implement reject via API
        }}
        onComment={async (taskId, comment) => {
          // TODO: Implement comment via API
        }}
      />
    </div>
  );
}
