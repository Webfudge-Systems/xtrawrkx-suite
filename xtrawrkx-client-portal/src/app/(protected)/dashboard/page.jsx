"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Search,
  CheckSquare,
  Calendar,
  Star,
  Folder,
  DollarSign,
  Target,
  Award,
  Crown,
  Clock,
  FileText,
  MapPin,
  Plus,
  CheckCircle,
  Circle,
  AlertTriangle,
  Eye,
  Edit,
  User,
  Users,
  Phone,
  Bell,
  ChevronRight,
  Loader2,
  AlertCircle,
  GitBranch,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/lib/auth";
import strapiClient from "@/lib/strapiClient";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

// Dashboard Stats
const dashboardStats = [
  {
    title: "Active Projects",
    value: "12",
    change: "+15%",
    changeType: "increase",
    icon: Folder,
    color: "from-xtrawrkx-500 to-xtrawrkx-600",
    bgColor: "from-xtrawrkx-50 to-xtrawrkx-100",
  },
  {
    title: "Total Earnings",
    value: "$45,850",
    change: "+8.2%",
    changeType: "increase",
    icon: DollarSign,
    color: "from-green-500 to-green-600",
    bgColor: "from-green-50 to-green-100",
  },
  {
    title: "Community Rank",
    value: "Elite",
    change: "+2 positions",
    changeType: "increase",
    icon: Award,
    color: "from-yellow-500 to-orange-500",
    bgColor: "from-yellow-50 to-orange-100",
  },
  {
    title: "Task Completion",
    value: "89%",
    change: "+12%",
    changeType: "increase",
    icon: Target,
    color: "from-purple-500 to-purple-600",
    bgColor: "from-purple-50 to-purple-100",
  },
];

// Communities data - major section
const communitiesData = [
  {
    id: 1,
    name: "XEN",
    fullName: "XEN Entrepreneurs Network",
    category: "Business Division",
    description:
      "Early-stage startup community focused on innovation and growth",
    members: 1247,
    tier: "Premium",
    status: "Active",
    tags: ["Startup Support", "Networking"],
    logo: "/images/logos/xen-logo.png",
    color: "blue-500",
    isMember: true,
    userTier: "x3",
    userTierName: "Growth Member",
    canUpgrade: true,
    nextTier: "x4",
    nextTierName: "Scale Member",
  },
  {
    id: 2,
    name: "XEV.FiN",
    fullName: "XEV Financial Network",
    category: "Investment Division",
    description: "Investment & funding network for entrepreneurs and investors",
    members: 523,
    tier: "Elite",
    status: "Active",
    tags: ["Investment", "Funding"],
    logo: "/images/logos/xevfin-logo.png",
    color: "green-500",
    isMember: false,
    userTier: null,
    userTierName: null,
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
  },
  {
    id: 3,
    name: "XEVTG",
    fullName: "XEV Tech Talent Group",
    category: "Technology Division",
    description: "Technology professionals network for skill development",
    members: 2156,
    tier: "Standard",
    status: "Active",
    tags: ["Tech Skills", "Career Growth"],
    logo: "/images/logos/xevtg-logo.png",
    color: "purple-500",
    isMember: true,
    userTier: "x1",
    userTierName: "Starter Member",
    canUpgrade: false,
    nextTier: null,
    nextTierName: null,
  },
];

// Tasks data for dashboard
const dashboardTasksData = [
  {
    id: "t1",
    title: "Design new landing page",
    description:
      "Create wireframes and mockups for the new landing page design",
    status: "todo",
    priority: "high",
    project: "Event Organization Website",
    assignee: "Gabrial Matula",
    dueDate: "2024-02-15",
    estimatedHours: 8,
    tags: ["design", "frontend"],
    progress: 60,
    createdBy: "me",
  },
  {
    id: "t2",
    title: "Implement user authentication",
    description: "Set up OAuth2 and JWT token management",
    status: "in-progress",
    priority: "urgent",
    project: "Event Organization Website",
    assignee: "Gabrial Matula",
    dueDate: "2024-02-10",
    estimatedHours: 12,
    tags: ["backend", "security"],
    progress: 75,
    createdBy: "me",
  },
  {
    id: "t3",
    title: "Database optimization",
    description: "Optimize queries and add proper indexing",
    status: "in-progress",
    priority: "high",
    project: "Health Mobile App Design",
    assignee: "Layla Amora",
    dueDate: "2024-02-18",
    estimatedHours: 6,
    tags: ["database", "optimization"],
    progress: 40,
    createdBy: "shared",
  },
  {
    id: "t4",
    title: "Code review for payment module",
    description:
      "Review the implementation of the new payment processing module",
    status: "review",
    priority: "high",
    project: "Advance SEO Service",
    assignee: "Ansel Finn",
    dueDate: "2024-02-12",
    estimatedHours: 2,
    tags: ["code-review", "payments"],
    progress: 90,
    createdBy: "shared",
  },
];

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
};

// Helper function to calculate days left
const calculateDaysLeft = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Quick actions for the dropdown
const quickActions = [
  {
    id: 1,
    title: "New Project",
    description: "Start a new project",
    icon: Folder,
    color: "text-xtrawrkx-600",
    bgColor: "bg-xtrawrkx-50",
  },
  {
    id: 2,
    title: "New Task",
    description: "Create a new task",
    icon: CheckSquare,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: 3,
    title: "New Event",
    description: "Schedule an event",
    icon: Calendar,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: 4,
    title: "New Message",
    description: "Send a message",
    icon: FileText,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [taskFilter, setTaskFilter] = useState("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Task states
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskModalFullView, setIsTaskModalFullView] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState({});
  const [subtaskDropdownPositions, setSubtaskDropdownPositions] = useState({});
  const subtaskButtonRefs = useRef({});

  // Community states
  const [communities, setCommunities] = useState([]);
  const [communityMemberships, setCommunityMemberships] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  // KPI states
  const [kpiStats, setKpiStats] = useState({
    totalProjects: 0,
    pendingTasks: 0,
    totalTasks: 0,
    taskCompletion: 0,
  });

  // Today's schedule states
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return now.toLocaleDateString("en-US", options);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!session) return "User";
    const account = session.account || session;
    return (
      account?.companyName ||
      account?.name ||
      account?.email?.split("@")[0] ||
      "User"
    );
  };

  // Fetch projects from API
  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);

      // Get client account ID from session or localStorage
      let accountId =
        session?.account?.id ||
        session?.account?.documentId ||
        session?.user?.id ||
        session?.user?.profile?.id ||
        session?.id ||
        session?.documentId;

      // If not in session, try to get from localStorage
      if (!accountId && typeof window !== "undefined") {
        const accountData = localStorage.getItem("client_account");
        if (accountData) {
          try {
            const account = JSON.parse(accountData);
            accountId = account.id || account.documentId;
          } catch (error) {
            console.error("Error parsing client account data:", error);
          }
        }
      }

      // Also try using strapiClient helper
      if (!accountId) {
        accountId = strapiClient.getCurrentAccountId();
      }

      if (!accountId) {
        console.warn("No account ID found in session or localStorage");
        setProjects([]);
        setProjectsLoading(false);
        return;
      }

      // Fetch all projects and filter by clientAccount client-side
      const queryParams = strapiClient.buildQueryString({
        populate: ["clientAccount", "manager", "milestones"],
      });

      const baseURL = strapiClient.buildURL("/projects", {});
      const url = `${baseURL}?${queryParams}`;


      const response = await fetch(url, {
        method: "GET",
        headers: strapiClient.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let projectsData = [];

      if (data.data && Array.isArray(data.data)) {
        projectsData = data.data;
      } else if (Array.isArray(data)) {
        projectsData = data;
      }

      // Filter projects by account ID
      const filteredProjects = projectsData.filter((project) => {
        const projectData = project.attributes || project;
        const projectClientAccount =
          projectData.clientAccount?.data?.attributes ||
          projectData.clientAccount?.data ||
          projectData.clientAccount?.attributes ||
          projectData.clientAccount;

        const projectClientAccountId =
          projectClientAccount?.id || projectClientAccount?.documentId;

        // Normalize IDs for comparison
        const accountIdNum =
          typeof accountId === "string" ? parseInt(accountId, 10) : accountId;
        const projectClientAccountIdNum =
          typeof projectClientAccountId === "string"
            ? parseInt(projectClientAccountId, 10)
            : projectClientAccountId;

        return (
          projectClientAccountIdNum === accountIdNum ||
          projectClientAccountId?.toString() === accountId?.toString() ||
          projectClientAccountId == accountId
        );
      });

      setProjects(filteredProjects.slice(0, 3)); // Show only first 3 projects
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "COMPLETED":
        return {
          label: "Completed",
          className: "bg-green-100 text-green-800 border-green-400",
        };
      case "IN_PROGRESS":
      case "ACTIVE":
      case "IN-PROGRESS":
        return {
          label: "In Progress",
          className: "bg-yellow-100 text-yellow-800 border-yellow-400",
        };
      case "PLANNING":
      case "PLANNED":
        return {
          label: "Planning",
          className: "bg-blue-100 text-blue-800 border-blue-400",
        };
      case "ON_HOLD":
      case "ONHOLD":
        return {
          label: "On Hold",
          className: "bg-yellow-100 text-yellow-800 border-yellow-400",
        };
      case "NOT_STARTED":
      case "NOT_STARTED":
        return {
          label: "Not Started",
          className: "bg-gray-100 text-gray-600 border-gray-400",
        };
      default:
        return {
          label: "Planning",
          className: "bg-blue-100 text-blue-800 border-blue-400",
        };
    }
  };

  // Helper function to format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Transform project data for card display
  const transformProjectForCard = (project) => {
    const projectData = project.attributes || project;
    const manager =
      projectData.manager?.data?.attributes ||
      projectData.manager?.attributes ||
      projectData.manager ||
      {};

    // Project status
    const status = projectData.status || "PLANNING";
    const statusBadge = getStatusBadge(status);

    // Progress
    const progress = projectData.progress || 0;

    // Timeline
    const startDate = projectData.startDate;
    const endDate = projectData.endDate;
    const daysLeft = endDate ? calculateDaysLeft(endDate) : null;
    const isAtRisk = daysLeft !== null && daysLeft < 7 && progress < 80;
    const isDelayed = daysLeft !== null && daysLeft < 0;

    // Activity snapshot
    const tasksTotal = projectData.tasksCount || projectData.totalTasks || 0;
    const tasksCompleted = projectData.tasksCompleted || 0;
    const documentsCount = projectData.documentsCount || 0;
    const messagesUnread = projectData.unreadMessagesCount || 0;

    // Financial summary
    const billingType =
      projectData.billingType || projectData.billing || "Fixed";
    const budget = projectData.budget || 0;
    const spent = projectData.spent || projectData.totalSpend || 0;
    const paid = projectData.paid || spent; // Assume paid equals spent unless specified
    const outstanding = budget > 0 ? budget - paid : 0;

    // Get milestones
    const milestones =
      projectData.milestones?.data || projectData.milestones || [];
    const milestoneArray = Array.isArray(milestones)
      ? milestones.map((m) => m.attributes || m)
      : [];

    // Get current/next milestone
    const now = new Date();
    const upcomingMilestones = milestoneArray
      .filter((m) => {
        const milestoneDate = m.dueDate || m.date;
        return milestoneDate && new Date(milestoneDate) >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate || a.date || 0);
        const dateB = new Date(b.dueDate || b.date || 0);
        return dateA - dateB;
      });
    const nextMilestone = upcomingMilestones[0] || null;

    // Get current phase (from milestones or status)
    const currentPhase = nextMilestone
      ? nextMilestone.name || nextMilestone.title || "Next Milestone"
      : statusBadge.label;

    // Last update time
    const lastUpdate =
      projectData.updatedAt ||
      projectData.updated_at ||
      projectData.lastUpdate ||
      null;

    // Get assigned person (manager)
    const assignedPerson = {
      name:
        manager.firstName && manager.lastName
          ? `${manager.firstName} ${manager.lastName}`
          : manager.name || manager.email?.split("@")[0] || "Unassigned",
      role: manager.role || manager.position || "Project Manager",
      avatar: manager.avatar || manager.profilePicture || null,
    };

    return {
      id: project.id || projectData.id,
      slug: projectData.slug,
      title: projectData.name || "Untitled Project",
      description: projectData.description || "No description available.",
      status,
      statusBadge,
      progress,
      startDate: startDate ? formatDate(startDate) : null,
      endDate: endDate ? formatDate(endDate) : null,
      daysLeft,
      isAtRisk,
      isDelayed,
      tasksTotal,
      tasksCompleted,
      documentsCount,
      messagesUnread,
      billingType,
      budget,
      spent,
      paid,
      outstanding,
      assignedPerson,
      currentPhase,
      nextMilestone,
      lastUpdate,
    };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
    }
  };

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      if (!session) return;

      try {
        setTasksLoading(true);

        // Get client account ID
        let accountId =
          session?.account?.id ||
          session?.account?.documentId ||
          session?.user?.id ||
          session?.user?.profile?.id ||
          session?.id ||
          session?.documentId;

        if (!accountId && typeof window !== "undefined") {
          const accountData = localStorage.getItem("client_account");
          if (accountData) {
            try {
              const account = JSON.parse(accountData);
              accountId = account.id || account.documentId;
            } catch (error) {
              console.error("Error parsing client account data:", error);
            }
          }
        }

        if (!accountId) {
          accountId = strapiClient.getCurrentAccountId();
        }

        if (!accountId) {
          console.warn("No account ID found for tasks");
          setTasks([]);
          setTasksLoading(false);
          return;
        }

        // Fetch projects for this client
        const projectsQueryParams = strapiClient.buildQueryString({
          populate: ["clientAccount"],
          pagination: { pageSize: 100 },
        });
        const projectsUrl = `${strapiClient.buildURL(
          "/projects",
          {}
        )}?${projectsQueryParams}`;
        const projectsResponse = await fetch(projectsUrl, {
          method: "GET",
          headers: strapiClient.getHeaders(),
        });

        if (!projectsResponse.ok) {
          throw new Error(`HTTP error! status: ${projectsResponse.status}`);
        }

        const projectsData = await projectsResponse.json();
        let allProjects = [];
        if (projectsData.data && Array.isArray(projectsData.data)) {
          allProjects = projectsData.data;
        } else if (Array.isArray(projectsData)) {
          allProjects = projectsData;
        }

        // Filter projects by client account
        const clientProjects = allProjects.filter((project) => {
          const projectData = project.attributes || project;
          const projectClientAccount =
            projectData.clientAccount?.data?.attributes ||
            projectData.clientAccount?.data ||
            projectData.clientAccount?.attributes ||
            projectData.clientAccount;

          const projectClientAccountId =
            projectClientAccount?.id || projectClientAccount?.documentId;

          const accountIdNum =
            typeof accountId === "string" ? parseInt(accountId, 10) : accountId;
          const projectClientAccountIdNum =
            typeof projectClientAccountId === "string"
              ? parseInt(projectClientAccountId, 10)
              : projectClientAccountId;

          return (
            projectClientAccountIdNum === accountIdNum ||
            projectClientAccountId?.toString() === accountId?.toString() ||
            projectClientAccountId == accountId
          );
        });


        // Extract project IDs - handle all possible ID locations
        const projectIds = clientProjects
          .map((p) => {
            const projectId =
              p.id ||
              p.documentId ||
              (p.attributes || p).id ||
              (p.attributes || p).documentId;
            return projectId;
          })
          .filter(Boolean)
          .map((id) => {
            // Normalize to both string and number for comparison
            return {
              original: id,
              string: String(id),
              number: typeof id === "string" ? parseInt(id, 10) : id,
            };
          });


        if (projectIds.length === 0) {
          setTasks([]);
          setTasksLoading(false);
          return;
        }

        // Fetch all tasks and filter by project IDs client-side
        // This is more reliable than server-side filtering
        const tasksQueryParams = strapiClient.buildQueryString({
          populate: [
            "projects",
            "projects.clientAccount",
            "project",
            "project.clientAccount",
            "assignee",
            "collaborators",
            "subtasks",
            "comments",
            "comments.author",
            "attachments",
          ],
          pagination: {
            pageSize: 100,
          },
        });

        const tasksBaseURL = strapiClient.buildURL("/tasks", {});
        const tasksUrl = `${tasksBaseURL}?${tasksQueryParams}`;


        const tasksResponse = await fetch(tasksUrl, {
          method: "GET",
          headers: strapiClient.getHeaders(),
        });

        if (!tasksResponse.ok) {
          throw new Error(`HTTP error! status: ${tasksResponse.status}`);
        }

        const tasksData = await tasksResponse.json();

        let allTasks = [];
        if (tasksData.data && Array.isArray(tasksData.data)) {
          allTasks = tasksData.data;
        } else if (Array.isArray(tasksData)) {
          allTasks = tasksData;
        }


        // Filter tasks by project IDs client-side

        const filteredTasks = allTasks.filter((task) => {
          const taskData = task.attributes || task;

          // Handle both single project and projects array (many-to-many)
          let projects = [];

          // Check for projects array (many-to-many relationship)
          const projectsArray =
            taskData.projects?.data || taskData.projects || [];

          // Check for single project (one-to-many relationship)
          const singleProject =
            taskData.project?.data?.attributes ||
            taskData.project?.data ||
            taskData.project?.attributes ||
            taskData.project;

          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            // Handle projects array
            projects = projectsArray.map((p) => {
              return p.attributes || p;
            });
          } else if (singleProject) {
            // Handle single project
            projects = [singleProject];
          }

          if (projects.length === 0) {
            return false;
          }

          // Check if any of the task's projects match our client's projects
          const hasMatchingProject = projects.some((project) => {
            const projectId = project.id || project.documentId;

            if (!projectId) {
              return false;
            }


            const projectIdStr = String(projectId);
            const projectIdNum =
              typeof projectId === "string"
                ? parseInt(projectId, 10)
                : projectId;

            const matches = projectIds.some((pidObj) => {
              const isMatch =
                pidObj.original == projectId ||
                pidObj.string === projectIdStr ||
                pidObj.number === projectIdNum ||
                String(pidObj.original) === String(projectId) ||
                Number(pidObj.original) === Number(projectId);

              if (isMatch) {
              }

              return isMatch;
            });

            return matches;
          });

          if (!hasMatchingProject) {
            const projectIdsList = projects
              .map((p) => p.id || p.documentId)
              .join(", ");
          }

          return hasMatchingProject;
        });


        // Use filtered tasks instead of allTasks
        const allTasksToTransform = filteredTasks;

        // Transform tasks
        const transformedTasks = allTasksToTransform.map((task) => {
          const taskData = task.attributes || task;

          // Handle both single project and projects array (many-to-many)
          let project = null;

          // Check for projects array (many-to-many relationship) - take first project
          const projectsArray =
            taskData.projects?.data || taskData.projects || [];

          // Check for single project (one-to-many relationship)
          const singleProject =
            taskData.project?.data?.attributes ||
            taskData.project?.data ||
            taskData.project?.attributes ||
            taskData.project;

          if (Array.isArray(projectsArray) && projectsArray.length > 0) {
            // Take first project from array
            project = projectsArray[0].attributes || projectsArray[0];
          } else if (singleProject) {
            project = singleProject;
          }

          const assignee =
            taskData.assignee?.data?.attributes ||
            taskData.assignee?.attributes ||
            taskData.assignee;

          const normalizeStatus = (status) => {
            if (!status) return "To Do";
            const statusUpper = status.toUpperCase().trim();
            if (
              statusUpper === "TO DO" ||
              statusUpper === "TODO" ||
              statusUpper === "PLANNING" ||
              statusUpper === "PLANNED" ||
              statusUpper === "SCHEDULED"
            ) {
              return "To Do";
            }
            if (
              statusUpper === "IN PROGRESS" ||
              statusUpper === "IN_PROGRESS" ||
              statusUpper === "ACTIVE"
            ) {
              return "In Progress";
            }
            if (statusUpper === "IN REVIEW" || statusUpper === "IN_REVIEW") {
              return "Internal Review";
            }
            if (
              statusUpper === "CLIENT REVIEW" ||
              statusUpper === "CLIENT_REVIEW"
            ) {
              return "Client Review";
            }
            if (statusUpper === "APPROVED") {
              return "Approved";
            }
            if (statusUpper === "DONE" || statusUpper === "COMPLETED") {
              return "Done";
            }
            if (statusUpper === "CANCELLED" || statusUpper === "CANCELED") {
              return "Cancelled";
            }
            return status;
          };

          const normalizePriority = (priority) => {
            if (!priority) return "Medium";
            const priorityLower = priority.toLowerCase();
            if (priorityLower === "low") return "Low";
            if (priorityLower === "medium") return "Medium";
            if (priorityLower === "high") return "High";
            return priority;
          };

          return {
            id: task.id || task.documentId,
            name: taskData.name || taskData.title || "Untitled Task",
            description: taskData.description || "",
            status: normalizeStatus(taskData.status || "To Do"),
            priority: normalizePriority(taskData.priority || "Medium"),
            project: project
              ? {
                  name: project.name || "Unknown Project",
                  id: project.id || project.documentId,
                }
              : null,
            assignee: assignee
              ? {
                  name:
                    assignee.firstName && assignee.lastName
                      ? `${assignee.firstName} ${assignee.lastName}`
                      : assignee.name ||
                        assignee.email?.split("@")[0] ||
                        "Unknown",
                  id: assignee.id || assignee.documentId,
                }
              : null,
            scheduledDate: taskData.scheduledDate || taskData.dueDate,
            progress: taskData.progress || 0,
            subtasks: taskData.subtasks?.data || taskData.subtasks || [],
            comments: (taskData.comments?.data || taskData.comments || []).map(
              (comment) => {
                const commentData = comment.attributes || comment;
                const author =
                  commentData.author?.data?.attributes ||
                  commentData.author?.attributes ||
                  commentData.author;
                return {
                  id: comment.id || comment.documentId,
                  content: commentData.content || commentData.text || "",
                  author: author
                    ? {
                        name:
                          author.firstName && author.lastName
                            ? `${author.firstName} ${author.lastName}`
                            : author.name ||
                              author.email?.split("@")[0] ||
                              "Unknown",
                        avatar: author.avatar || author.profilePicture || null,
                      }
                    : { name: "Unknown", avatar: null },
                  createdAt: commentData.createdAt || new Date().toISOString(),
                };
              }
            ),
            attachments: (taskData.attachments || taskData.files || []).map(
              (attachment) => {
                const attData = attachment.attributes || attachment;
                return {
                  id: attachment.id || attachment.documentId,
                  name: attData.name || attData.filename || "Unknown",
                  size: attData.size || 0,
                  type:
                    attData.mime || attData.type || "application/octet-stream",
                  url: attData.url || attData.path || "#",
                  uploadedAt: attData.createdAt || new Date().toISOString(),
                };
              }
            ),
            requiresApproval:
              taskData.requiresApproval ||
              (taskData.status || "").toUpperCase() === "CLIENT_REVIEW",
            clientApproval: taskData.clientApproval || null,
            approvedAt: taskData.approvedAt || null,
            createdAt: taskData.createdAt || new Date().toISOString(),
            updatedAt: taskData.updatedAt || new Date().toISOString(),
          };
        });

        setTasks(transformedTasks);
      } catch (error) {
        console.error("Error loading tasks:", error);
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };

    if (session) {
      loadTasks();
    }
  }, [session]);

  // Calculate KPIs from real data
  useEffect(() => {
    // Calculate Total Projects
    const totalProjects = projects.length;

    // Calculate Pending Tasks (tasks requiring client action - client review only)
    const pendingTasks = tasks.filter((task) => {
      const status = (task.status || "").toUpperCase();
      return (
        status === "CLIENT REVIEW" ||
        status === "CLIENT_REVIEW" ||
        (task.requiresApproval && !task.clientApproval)
      );
    }).length;

    // Calculate Total Tasks
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => {
      const status = (task.status || "").toUpperCase();
      return status === "DONE" || status === "COMPLETED";
    }).length;
    const taskCompletion =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    setKpiStats({
      totalProjects,
      pendingTasks,
      totalTasks,
      taskCompletion,
    });
  }, [projects, tasks]);

  // Fetch communities and memberships
  useEffect(() => {
    const loadCommunities = async () => {
      if (!session) return;

      try {
        setCommunitiesLoading(true);

        // Get client account ID
        let accountId =
          session?.account?.id ||
          session?.account?.documentId ||
          session?.user?.id ||
          session?.user?.profile?.id ||
          session?.id ||
          session?.documentId;

        if (!accountId && typeof window !== "undefined") {
          const accountData = localStorage.getItem("client_account");
          if (accountData) {
            try {
              const account = JSON.parse(accountData);
              accountId = account.id || account.documentId;
            } catch (error) {
              console.error("Error parsing client account data:", error);
            }
          }
        }

        if (!accountId) {
          accountId = strapiClient.getCurrentAccountId();
        }

        if (!accountId) {
          console.warn("No account ID found for communities");
          setCommunities([]);
          setCommunityMemberships([]);
          setCommunitiesLoading(false);
          return;
        }

        // Fetch all communities
        const communitiesQueryParams = strapiClient.buildQueryString({
          populate: ["memberships"],
          pagination: { pageSize: 100 },
        });
        const communitiesUrl = `${strapiClient.buildURL(
          "/communities",
          {}
        )}?${communitiesQueryParams}`;
        const communitiesResponse = await fetch(communitiesUrl, {
          method: "GET",
          headers: strapiClient.getHeaders(),
        });

        let allCommunities = [];
        if (communitiesResponse.ok) {
          const communitiesData = await communitiesResponse.json();
          if (communitiesData.data && Array.isArray(communitiesData.data)) {
            allCommunities = communitiesData.data;
          } else if (Array.isArray(communitiesData)) {
            allCommunities = communitiesData;
          }
        }

        // Fetch community memberships for this client
        const membershipParams = strapiClient.buildQueryString({
          filters: {
            clientAccount: {
              id: {
                $eq: accountId,
              },
            },
          },
          populate: ["community", "clientAccount"],
          pagination: { pageSize: 100 },
        });
        const membershipsUrl = `${strapiClient.buildURL(
          "/community-memberships",
          {}
        )}?${membershipParams}`;
        const membershipsResponse = await fetch(membershipsUrl, {
          method: "GET",
          headers: strapiClient.getHeaders(),
        });

        let memberships = [];
        if (membershipsResponse.ok) {
          const membershipsData = await membershipsResponse.json();
          if (membershipsData.data && Array.isArray(membershipsData.data)) {
            memberships = membershipsData.data.map((m) => ({
              id: m.id || m.documentId,
              ...(m.attributes || m),
            }));
          } else if (Array.isArray(membershipsData)) {
            memberships = membershipsData.map((m) => ({
              id: m.id || m.documentId,
              ...(m.attributes || m),
            }));
          }
        }

        // Map communities with membership status
        const communitiesWithMembership = allCommunities.map((community) => {
          const communityData = community.attributes || community;
          const communityName = communityData.name || "";

          // Find matching membership
          const membership = memberships.find((m) => {
            const membershipCommunity =
              m.community?.data?.attributes?.name ||
              m.community?.attributes?.name ||
              m.community ||
              "";
            return (
              membershipCommunity.toUpperCase() ===
                communityName.toUpperCase() ||
              m.community === communityName.toUpperCase()
            );
          });

          const isMember =
            membership && (membership.status || "").toUpperCase() === "ACTIVE";

          return {
            id: community.id || community.documentId,
            name: communityName,
            fullName: communityData.description || communityName,
            category: communityData.category || "Community",
            description: communityData.description || "",
            members: 0, // Could be fetched if available
            tier: membership?.membershipType || "Standard",
            status: isMember ? "Active" : "Available",
            isMember: isMember,
            membership: membership,
            color: communityData.color || "blue-500",
            icon: communityData.icon || null,
          };
        });

        setCommunities(communitiesWithMembership);
        setCommunityMemberships(memberships);
      } catch (error) {
        console.error("Error loading communities:", error);
        setCommunities([]);
        setCommunityMemberships([]);
      } finally {
        setCommunitiesLoading(false);
      }
    };

    if (session) {
      loadCommunities();
    }
  }, [session]);

  // Filter tasks based on selected filter
  const getFilteredTasks = () => {
    let filtered = tasks;
    switch (taskFilter) {
      case "upcoming":
        filtered = tasks.filter((task) => {
          const status = (task.status || "").toUpperCase();
          return (
            status === "TO DO" ||
            status === "TODO" ||
            status === "PLANNING" ||
            status === "PLANNED"
          );
        });
        break;
      case "ongoing":
        filtered = tasks.filter((task) => {
          const status = (task.status || "").toUpperCase();
          return (
            status === "IN PROGRESS" ||
            status === "IN_PROGRESS" ||
            status === "ACTIVE"
          );
        });
        break;
      case "completed":
        filtered = tasks.filter((task) => {
          const status = (task.status || "").toUpperCase();
          return status === "DONE" || status === "COMPLETED";
        });
        break;
      default:
        filtered = tasks;
    }
    return filtered;
  };

  // Helper functions
  const getStatusColor = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "DONE":
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-400";
      case "IN PROGRESS":
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "INTERNAL REVIEW":
      case "IN_REVIEW":
        return "bg-purple-100 text-purple-800 border-purple-400";
      case "CLIENT REVIEW":
      case "CLIENT_REVIEW":
        return "bg-purple-100 text-purple-800 border-purple-400";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "TO DO":
      case "TODO":
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-400";
    }
  };

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

  const formatStatus = (status) => {
    const statusMap = {
      "TO DO": "To Do",
      "IN PROGRESS": "In Progress",
      IN_REVIEW: "Internal Review",
      "CLIENT REVIEW": "Client Review",
      CLIENT_REVIEW: "Client Review",
      APPROVED: "Approved",
      DONE: "Done",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    };
    return (
      statusMap[status?.toUpperCase()] || status?.replace("_", " ") || "To Do"
    );
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
    setIsTaskModalFullView(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 bg-white min-h-screen">
        <PageHeader
          title="Dashboard"
          subtitle={getCurrentDate()}
          breadcrumb={[]}
          showSearch={false}
        />
        <div className="flex justify-center items-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
            <span className="text-gray-600">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen dashboard-content">
      {/* Page Header */}
      <div className="px-4 pt-4">
        <PageHeader
          title="Dashboard"
          subtitle={getCurrentDate()}
          breadcrumb={[]}
          showSearch={true}
          searchPlaceholder="Search anything..."
          onSearchChange={setSearchQuery}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Total Projects",
              value: kpiStats.totalProjects.toString(),
              change: `${projects.length} active`,
              changeType: "increase",
              icon: Folder,
            },
            {
              title: "Pending Tasks",
              value: kpiStats.pendingTasks.toString(),
              change: "Action required",
              changeType: kpiStats.pendingTasks > 0 ? "increase" : "decrease",
              icon: AlertCircle,
            },
            {
              title: "Total Tasks",
              value: kpiStats.totalTasks.toString(),
              change: `${kpiStats.pendingTasks} pending`,
              changeType: "increase",
              icon: CheckSquare,
            },
            {
              title: "Task Completion",
              value: `${kpiStats.taskCompletion}%`,
              change: "+0%",
              changeType: "increase",
              icon: Target,
            },
          ].map((stat, index) => {
            const statConfig = [
              {
                color: "bg-xtrawrkx-50",
                borderColor: "border-xtrawrkx-200",
                iconColor: "text-xtrawrkx-600",
                dotColor: "bg-xtrawrkx-500",
              },
              {
                color: "bg-green-50",
                borderColor: "border-green-200",
                iconColor: "text-green-600",
                dotColor: "bg-green-500",
              },
              {
                color: "bg-purple-50",
                borderColor: "border-purple-200",
                iconColor: "text-purple-600",
                dotColor: "bg-purple-500",
              },
              {
                color: "bg-orange-50",
                borderColor: "border-orange-200",
                iconColor: "text-orange-600",
                dotColor: "bg-orange-500",
              },
            ];

            const config = statConfig[index];
            const IconComponent = stat.icon;

            return (
              <div
                key={index}
                className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-black text-gray-800">
                      {stat.value}
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${config.dotColor}`}
                      ></span>
                      <span
                        className={
                          stat.changeType === "increase"
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {stat.change}
                      </span>
                      {stat.change !== "0" && (
                        <span className="ml-1">this period</span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-16 h-16 ${config.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${config.borderColor}`}
                  >
                    <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Dashboard Sections */}
      <div className="px-4">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          {/* Left Column - Tasks & Projects */}
          <div className="xl:col-span-2 space-y-4">
            {/* Tasks Section */}
            <Card
              outlined={true}
              title="My Tasks"
              subtitle="Track your current tasks and progress"
              actions={
                <button className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 hover:border-white/40 transition-all duration-300 text-sm font-medium text-gray-900 flex items-center gap-2 shadow-lg">
                  <Plus className="w-4 h-4" />
                  New Task
                </button>
              }
            >
              {/* Filter Tabs */}
              <div className="flex items-center space-x-2 mb-4">
                {["all", "upcoming", "ongoing", "completed"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      taskFilter === filter
                        ? "bg-xtrawrkx-500 text-white shadow-md"
                        : "bg-white/20 backdrop-blur-md border border-white/30 text-gray-700 hover:bg-white/30 hover:border-white/40"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() +
                      filter.slice(1).replace(/-/g, " ")}
                  </button>
                ))}
              </div>

              {/* Tasks Table */}
              {tasksLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
                </div>
              ) : getFilteredTasks().length === 0 ? (
                <div className="text-center py-12">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No tasks found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {taskFilter === "all"
                      ? "Get started by creating your first task"
                      : `No ${taskFilter} tasks available`}
                  </p>
                </div>
              ) : (
                <div className="bg-white/40 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/60 border-b border-gray-200/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {/* Action Required */}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            TASK NAME
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            ASSIGNEE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            DUE DATE
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            STATUS
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            PRIORITY
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            SUBTASKS
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            PROJECT
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            PROGRESS
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50">
                        {getFilteredTasks().map((task) => {
                          const isActionRequired =
                            (task.status === "Client Review" ||
                              task.status?.toUpperCase() === "CLIENT_REVIEW") &&
                            !task.clientApproval;

                          const isDone =
                            task.status?.toLowerCase() === "done" ||
                            task.status?.toLowerCase() === "completed";

                          const taskSubtasks = task.subtasks || [];
                          const rootSubtasks = taskSubtasks.filter((st) => {
                            return (
                              !st.parentSubtask ||
                              st.parentSubtask === null ||
                              (typeof st.parentSubtask === "object" &&
                                !st.parentSubtask.id)
                            );
                          });
                          const hasSubtasks = rootSubtasks.length > 0;
                          const taskId = task.id;
                          const isExpanded = expandedSubtasks[taskId] || false;

                          const handleToggleExpand = (e) => {
                            e.stopPropagation();
                            const newExpandedState = !isExpanded;
                            if (
                              newExpandedState &&
                              subtaskButtonRefs.current[taskId]
                            ) {
                              const rect =
                                subtaskButtonRefs.current[
                                  taskId
                                ].getBoundingClientRect();
                              setSubtaskDropdownPositions((prev) => ({
                                ...prev,
                                [taskId]: {
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX,
                                  width: rect.width,
                                },
                              }));
                            }
                            setExpandedSubtasks((prev) => ({
                              ...prev,
                              [taskId]: newExpandedState,
                            }));
                          };

                          const dropdownPosition =
                            subtaskDropdownPositions[taskId];
                          const dropdownContent =
                            isExpanded &&
                            rootSubtasks.length > 0 &&
                            dropdownPosition &&
                            typeof window !== "undefined"
                              ? createPortal(
                                  <div
                                    className="fixed z-[9999] border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto"
                                    style={{
                                      top: `${dropdownPosition.top}px`,
                                      left: `${dropdownPosition.left}px`,
                                      width: `${dropdownPosition.width}px`,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="p-2 space-y-1">
                                      {rootSubtasks.map((subtask) => {
                                        const isSubtaskDone =
                                          subtask.status?.toLowerCase() ===
                                            "done" ||
                                          subtask.status?.toLowerCase() ===
                                            "completed";
                                        return (
                                          <button
                                            key={subtask.id}
                                            className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 ${
                                              isSubtaskDone ? "opacity-60" : ""
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div
                                                  className={`text-sm font-medium truncate ${
                                                    isSubtaskDone
                                                      ? "line-through text-gray-500"
                                                      : "text-gray-900"
                                                  }`}
                                                >
                                                  {subtask.name ||
                                                    subtask.title}
                                                </div>
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>,
                                  document.body
                                )
                              : null;

                          return (
                            <tr
                              key={task.id}
                              className="hover:bg-gray-50/30 transition-colors cursor-pointer"
                              onClick={() => handleTaskClick(task)}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center">
                                  {isActionRequired ? (
                                    <div className="relative">
                                      <AlertCircle className="w-5 h-5 text-xtrawrkx-500 animate-pulse" />
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-xtrawrkx-500 rounded-full border-2 border-white"></div>
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <div className="min-w-0 flex-1 flex items-center gap-2">
                                    <div
                                      className={`font-medium truncate flex-1 min-w-0 ${
                                        isDone
                                          ? "line-through text-gray-500"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {task.name}
                                    </div>
                                    {hasSubtasks && (
                                      <div
                                        className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600"
                                        title={`${rootSubtasks.length} ${
                                          rootSubtasks.length === 1
                                            ? "subtask"
                                            : "subtasks"
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
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 min-w-[140px]">
                                  {task.assignee && task.assignee.name ? (
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 border border-white"
                                        title={task.assignee.name}
                                      >
                                        {task.assignee.name
                                          ?.charAt(0)
                                          ?.toUpperCase() || "U"}
                                      </div>
                                      <span className="text-sm text-gray-600 truncate ml-1">
                                        {task.assignee.name}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      Unassigned
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 min-w-[150px]">
                                  <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500" />
                                  <span className="text-sm text-gray-700">
                                    {task.scheduledDate
                                      ? new Date(
                                          task.scheduledDate
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                        })
                                      : "Not set"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="min-w-[140px]">
                                  <span
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-block ${getStatusColor(
                                      task.status
                                    )}`}
                                  >
                                    {formatStatus(task.status)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="min-w-[120px]">
                                  <span
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-block ${getPriorityColor(
                                      task.priority
                                    )}`}
                                  >
                                    {task.priority || "Medium"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  className="min-w-[180px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {hasSubtasks ? (
                                    <div className="relative">
                                      <button
                                        ref={(el) => {
                                          if (el)
                                            subtaskButtonRefs.current[taskId] =
                                              el;
                                        }}
                                        onClick={handleToggleExpand}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 w-full"
                                      >
                                        <GitBranch className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-700">
                                          {rootSubtasks.length}{" "}
                                          {rootSubtasks.length === 1
                                            ? "subtask"
                                            : "subtasks"}
                                        </span>
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      No subtasks
                                    </span>
                                  )}
                                </div>
                                {typeof window !== "undefined" &&
                                  dropdownContent}
                              </td>
                              <td className="px-4 py-3">
                                <div className="min-w-[150px]">
                                  {task.project ? (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (task.project?.id) {
                                          router.push(
                                            `/projects/${task.project.id}`
                                          );
                                        }
                                      }}
                                      className="text-sm text-gray-700 hover:text-xtrawrkx-600 hover:underline truncate"
                                    >
                                      {task.project.name}
                                    </button>
                                  ) : (
                                    <span className="text-sm text-gray-500">
                                      No project
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-xtrawrkx-500 h-2 rounded-full transition-all"
                                      style={{
                                        width: `${task.progress || 0}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {task.progress || 0}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div
                                  className="flex items-center gap-1 min-w-[120px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
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
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>

            {/* Projects Section */}
            <Card
              outlined={true}
              title="Project Overview"
              subtitle="Track your ongoing projects"
              actions={
                <button
                  onClick={() => router.push("/projects")}
                  className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 hover:border-white/40 transition-all duration-300 text-sm font-medium text-gray-900 flex items-center gap-2 shadow-lg"
                >
                  <Folder className="w-4 h-4" />
                  View All
                </button>
              }
            >
              {projectsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12">
                  <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No projects found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Get started by creating your first project
                  </p>
                </div>
              ) : (
                <div className="space-y-4 -mx-4 px-4">
                  {projects.map((project) => {
                    const projectCard = transformProjectForCard(project);
                    return (
                      <div
                        key={projectCard.id}
                        className="bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 p-6"
                      >
                        <div className="flex items-start justify-between gap-6">
                          {/* Left Section - Main Content */}
                          <div className="flex-1 min-w-0">
                            {/* Project Header - Name and Status */}
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-xl font-bold text-gray-900 truncate flex-1 pr-3">
                                {projectCard.title}
                              </h3>
                              <span
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex-shrink-0 shadow-sm ${projectCard.statusBadge.className}`}
                              >
                                {projectCard.statusBadge.label}
                              </span>
                            </div>

                            {/* High-Value Info Row - Phase/Milestone and Last Update */}
                            <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                              {projectCard.currentPhase && (
                                <div className="flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-xtrawrkx-500" />
                                  <span className="font-medium">
                                    {projectCard.currentPhase}
                                  </span>
                                </div>
                              )}
                              {projectCard.lastUpdate && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                                  <span>
                                    Updated{" "}
                                    {formatRelativeTime(projectCard.lastUpdate)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600 font-medium">
                                  Progress
                                </span>
                                <span className="text-gray-900 font-bold text-base">
                                  {projectCard.progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-xtrawrkx-500 h-2.5 rounded-full transition-all duration-300"
                                  style={{ width: `${projectCard.progress}%` }}
                                />
                              </div>
                            </div>

                            {/* Activity Counts - Tasks and Messages with Indicators */}
                            <div className="flex items-center gap-6 mb-5">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-xtrawrkx-50 to-xtrawrkx-100 rounded-lg flex items-center justify-center border border-xtrawrkx-200 flex-shrink-0">
                                    <CheckSquare className="w-5 h-5 text-xtrawrkx-600" />
                                  </div>
                                  {projectCard.tasksTotal > 0 &&
                                    projectCard.tasksCompleted <
                                      projectCard.tasksTotal && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium mb-0.5">
                                    Tasks
                                  </p>
                                  <p className="text-base font-bold text-gray-900">
                                    {projectCard.tasksTotal}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center border border-purple-200 flex-shrink-0">
                                    <Bell className="w-5 h-5 text-purple-600" />
                                  </div>
                                  {projectCard.messagesUnread > 0 && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-xtrawrkx-500 rounded-full border-2 border-white flex items-center justify-center">
                                      <span className="text-[8px] text-white font-bold">
                                        {projectCard.messagesUnread > 9
                                          ? "9+"
                                          : projectCard.messagesUnread}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 font-medium mb-0.5">
                                    Messages
                                  </p>
                                  <p className="text-base font-bold text-gray-900">
                                    {projectCard.messagesUnread > 0 ? (
                                      <span className="text-xtrawrkx-600">
                                        {projectCard.messagesUnread}
                                      </span>
                                    ) : (
                                      "0"
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* View Project CTA */}
                            <button
                              onClick={() => {
                                if (projectCard.slug || projectCard.id) {
                                  router.push(
                                    `/projects/${
                                      projectCard.slug || projectCard.id
                                    }`
                                  );
                                }
                              }}
                              className="w-auto px-4 py-2 bg-xtrawrkx-500 text-white rounded-lg text-xs font-medium hover:bg-xtrawrkx-600 transition-colors shadow-sm"
                            >
                              View Project
                            </button>
                          </div>

                          {/* Right Section - Project Manager Card */}
                          <div className="flex-shrink-0 w-48">
                            <Card
                              padding={false}
                              className="p-4 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
                            >
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold mb-3 uppercase tracking-wide">
                                    Project Manager
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-xtrawrkx-500 to-xtrawrkx-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                        {projectCard.assignedPerson.avatar ? (
                                          <img
                                            src={
                                              projectCard.assignedPerson.avatar
                                            }
                                            alt={
                                              projectCard.assignedPerson.name
                                            }
                                            className="w-full h-full rounded-xl object-cover"
                                          />
                                        ) : (
                                          <span>
                                            {projectCard.assignedPerson.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold text-gray-900 truncate">
                                        {projectCard.assignedPerson.name}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {projectCard.assignedPerson.role}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle message action
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/80 hover:bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm hover:shadow-md"
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                  Message
                                </button>
                              </div>
                            </Card>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Communities & Quick Access */}
          <div className="space-y-6">
            {/* Communities Section */}
            <Card
              outlined={true}
              title="My Communities"
              subtitle="Your active community memberships"
              actions={
                <button
                  onClick={() => router.push("/communities")}
                  className="px-4 py-2 bg-xtrawrkx-500 text-white rounded-xl text-sm font-medium hover:bg-xtrawrkx-600 transition-colors shadow-lg"
                >
                  Join
                </button>
              }
            >
              {communitiesLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
                </div>
              ) : communities.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    No communities found
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Communities will appear here when available
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communities.map((community) => {
                    return (
                      <div
                        key={community.id}
                        className={`group relative overflow-hidden rounded-xl border border-white/20 transition-all duration-300 hover:shadow-lg ${
                          community.isMember
                            ? "shadow-md bg-white/40 backdrop-blur-sm"
                            : "shadow-md bg-white/30 backdrop-blur-sm"
                        }`}
                      >
                        {/* Content */}
                        <div className="relative z-10 p-4">
                          {/* Header Section */}
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm mb-0.5">
                                {community.name}
                              </h3>
                              <p className="text-xs text-gray-500 font-medium">
                                {community.category}
                              </p>
                            </div>
                            <div
                              className={`text-xs px-2 py-1 rounded-lg font-semibold shadow-sm ${
                                community.isMember
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                            >
                              {community.isMember ? "Member" : community.status}
                            </div>
                          </div>

                          {/* Primary CTA */}
                          {community.isMember ? (
                            <button
                              onClick={() => {
                                router.push(`/communities/${community.id}`);
                              }}
                              className="w-full px-4 py-2 bg-xtrawrkx-500 text-white rounded-lg text-sm font-medium hover:bg-xtrawrkx-600 transition-colors shadow-md"
                            >
                              View Community
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                router.push(
                                  `/communities?join=${community.id}`
                                );
                              }}
                              className="w-full px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-gray-900 rounded-lg text-sm font-medium hover:bg-white/30 hover:border-white/40 transition-all"
                            >
                              Join Community
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Schedule/Calendar */}
            <Card
              glass={true}
              title="Today's Schedule"
              subtitle={new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              actions={
                <button
                  onClick={() => router.push("/tasks")}
                  className="px-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl hover:bg-white/30 hover:border-white/40 transition-all duration-300 text-sm font-medium text-gray-900 flex items-center gap-2 shadow-lg"
                >
                  <Calendar className="w-4 h-4" />
                  View Calendar
                </button>
              }
            >
              {scheduleLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
                </div>
              ) : todaysSchedule.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">
                    No scheduled tasks today
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Tasks scheduled for today will appear here
                  </p>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="space-y-4">
                    {todaysSchedule.map((item) => {
                      const Icon = item.icon;
                      const isInProgress =
                        item.status === "In Progress" ||
                        (item.scheduledDate &&
                          new Date(item.scheduledDate) <= new Date());
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedTask(item.task);
                            setIsTaskModalOpen(true);
                          }}
                          className={`group relative ${item.bgColor} rounded-xl border ${item.borderColor} p-4 hover:shadow-lg transition-all duration-300 cursor-pointer`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div
                                className={`w-4 h-4 ${item.dotColor} rounded-full shadow-sm`}
                              ></div>
                              {isInProgress && (
                                <div
                                  className={`absolute inset-0 w-4 h-4 ${item.dotColor} rounded-full animate-ping opacity-30`}
                                ></div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900 text-base group-hover:text-gray-700 transition-colors">
                                  {item.title}
                                </h4>
                                <span
                                  className={`text-xs ${item.statusColor} px-2 py-1 rounded-full font-medium`}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <p className="text-sm text-gray-600">
                                  {item.time}
                                </p>
                                <span className="text-xs text-gray-500">•</span>
                                <p className="text-xs text-gray-500">
                                  {item.timeInfo}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-8 h-8 ${item.dotColor} rounded-full flex items-center justify-center shadow-sm`}
                              >
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {isTaskModalOpen && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onApprove={async (taskId) => {
            try {
              const response = await fetch(
                `${strapiClient.buildURL("/tasks", {})}/${taskId}`,
                {
                  method: "PUT",
                  headers: {
                    ...strapiClient.getHeaders(),
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    data: {
                      status: "APPROVED",
                      clientApproval: "approved",
                      approvedAt: new Date().toISOString(),
                    },
                  }),
                }
              );

              if (response.ok) {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          status: "Approved",
                          clientApproval: "approved",
                          approvedAt: new Date().toISOString(),
                        }
                      : t
                  )
                );
                setSelectedTask({
                  ...selectedTask,
                  status: "Approved",
                  clientApproval: "approved",
                  approvedAt: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error("Error approving task:", error);
            }
          }}
          onReject={async (taskId) => {
            try {
              const response = await fetch(
                `${strapiClient.buildURL("/tasks", {})}/${taskId}`,
                {
                  method: "PUT",
                  headers: {
                    ...strapiClient.getHeaders(),
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    data: {
                      clientApproval: "rejected",
                      approvedAt: new Date().toISOString(),
                    },
                  }),
                }
              );

              if (response.ok) {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          clientApproval: "rejected",
                          approvedAt: new Date().toISOString(),
                        }
                      : t
                  )
                );
                setSelectedTask({
                  ...selectedTask,
                  clientApproval: "rejected",
                  approvedAt: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error("Error rejecting task:", error);
            }
          }}
          onComment={async (taskId, comment) => {
            // Handle comment addition
            const newComment = {
              id: Date.now().toString(),
              ...comment,
              createdAt: comment.createdAt || new Date().toISOString(),
            };

            setTasks((prev) =>
              prev.map((t) =>
                t.id === taskId
                  ? {
                      ...t,
                      comments: [...(t.comments || []), newComment],
                    }
                  : t
              )
            );

            if (selectedTask?.id === taskId) {
              setSelectedTask({
                ...selectedTask,
                comments: [...(selectedTask.comments || []), newComment],
              });
            }
          }}
        />
      )}
    </div>
  );
}
