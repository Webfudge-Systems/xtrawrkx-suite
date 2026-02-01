"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  XCircle,
  List,
  Grid3X3,
  Eye,
  Check,
  GitBranch,
  ChevronRight,
  ChevronDown,
  User,
  Activity,
  Loader2,
  MessageSquare,
  Paperclip,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useSession } from "@/lib/auth";
import strapiClient from "@/lib/strapiClient";
import { createPortal } from "react-dom";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

export default function TasksPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskModalFullView, setIsTaskModalFullView] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState({});
  const [subtaskDropdownPositions, setSubtaskDropdownPositions] = useState({});
  const subtaskButtonRefs = useRef({});

  // Load tasks from API
  useEffect(() => {
    const loadTasks = async () => {
      if (!session) return;

      try {
        setLoading(true);

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

        // Try to get from getCurrentUser if available
        if (!accountId) {
          try {
            const currentUser = await strapiClient.getCurrentUser();
            if (currentUser?.account) {
              accountId =
                currentUser.account.id || currentUser.account.documentId;
            }
          } catch (error) {
            console.warn("Could not get current user:", error);
          }
        }

        if (!accountId) {
          console.warn("No account ID found");
          setTasks([]);
          setLoading(false);
          return;
        }


        // Step 1: Fetch all projects for this client account
        const projectsQueryParams = strapiClient.buildQueryString({
          populate: ["clientAccount"],
          pagination: {
            pageSize: 100,
          },
        });

        const projectsBaseURL = strapiClient.buildURL("/projects", {});
        const projectsUrl = `${projectsBaseURL}?${projectsQueryParams}`;


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
          setLoading(false);
          return;
        }

        // Step 2: Fetch tasks for these projects
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

            // Check for projects array first, then single project
            const projectsArray = tData.projects?.data || tData.projects || [];
            const singleProject =
              tData.project?.data?.attributes ||
              tData.project?.attributes ||
              tData.project;

            let projectId = null;
            if (Array.isArray(projectsArray) && projectsArray.length > 0) {
              projectId =
                (projectsArray[0].attributes || projectsArray[0]).id ||
                (projectsArray[0].attributes || projectsArray[0]).documentId;
            } else if (singleProject) {
              projectId = singleProject.id || singleProject.documentId;
            }

            return {
              id: t.id || t.documentId,
              name: tData.name || tData.title,
              projectId: projectId,
              hasProjects: !!tData.projects,
              hasProject: !!tData.project,
            };
          })
        );

        // Transform tasks to match UI format
        const transformedTasks = filteredTasks.map((task) => {
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
            // Use first project from array
            const firstProject = projectsArray[0];
            project = firstProject.attributes || firstProject;
          } else if (singleProject) {
            // Use single project
            project = singleProject;
          }

          const assignee =
            taskData.assignee?.data?.attributes ||
            taskData.assignee?.attributes ||
            taskData.assignee;
          const comments = taskData.comments?.data || taskData.comments || [];
          const attachments = taskData.attachments || taskData.files || [];

          // Normalize status
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
            // Return original if no match
            return status;
          };

          // Normalize priority
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
            comments: comments.map((comment) => {
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
            }),
            attachments: attachments.map((attachment) => {
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
            }),
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
        setLoading(false);
      }
    };

    if (session) {
      loadTasks();
    }
  }, [session]);

  // Calculate task statistics with flexible status matching
  const taskStats = {
    all: tasks.length,
    todo: tasks.filter((t) => {
      const status = (t.status || "").toUpperCase();
      return (
        status === "TO DO" ||
        status === "TODO" ||
        status === "PLANNING" ||
        status === "PLANNED"
      );
    }).length,
    inProgress: tasks.filter((t) => {
      const status = (t.status || "").toUpperCase();
      return (
        status === "IN PROGRESS" ||
        status === "IN_PROGRESS" ||
        status === "ACTIVE"
      );
    }).length,
    internalReview: tasks.filter((t) => {
      const status = (t.status || "").toUpperCase();
      return status === "IN REVIEW" || status === "IN_REVIEW";
    }).length,
    done: tasks.filter((t) => {
      const status = (t.status || "").toUpperCase();
      return status === "DONE" || status === "COMPLETED";
    }).length,
    overdue: tasks.filter((t) => {
      const status = (t.status || "").toUpperCase();
      return (
        t.scheduledDate &&
        new Date(t.scheduledDate) < new Date() &&
        status !== "DONE" &&
        status !== "COMPLETED"
      );
    }).length,
  };

  // Status stats for KPI cards
  const statusStats = [
    {
      label: "Total Tasks",
      count: taskStats.all,
      color: "bg-xtrawrkx-50",
      borderColor: "border-xtrawrkx-200",
      iconColor: "text-xtrawrkx-600",
      icon: CheckSquare,
    },
    {
      label: "In Progress",
      count: taskStats.inProgress,
      color: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      icon: Clock,
    },
    {
      label: "Completed",
      count: taskStats.done,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle2,
    },
    {
      label: "Overdue",
      count: taskStats.overdue,
      color: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      icon: AlertCircle,
    },
  ];

  // Tab items
  const tabItems = [
    { key: "all", label: "All Tasks", badge: taskStats.all.toString() },
    { key: "todo", label: "To Do", badge: taskStats.todo.toString() },
    {
      key: "in-progress",
      label: "In Progress",
      badge: taskStats.inProgress.toString(),
    },
    {
      key: "internal-review",
      label: "Internal Review",
      badge: taskStats.internalReview.toString(),
    },
    { key: "done", label: "Done", badge: taskStats.done.toString() },
  ];

  // Filter tasks based on active tab and search
  const getFilteredTasks = () => {
    let filtered = tasks;


    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((task) => {
        const status = (task.status || "").toLowerCase().trim();
        const statusUpper = (task.status || "").toUpperCase().trim();

        let matches = false;
        switch (activeTab) {
          case "todo":
            matches =
              status === "to do" ||
              status === "todo" ||
              statusUpper === "TO_DO" ||
              statusUpper === "TO DO" ||
              statusUpper === "PLANNING" ||
              statusUpper === "PLANNED";
            break;
          case "in-progress":
            matches =
              status === "in progress" ||
              status === "in_progress" ||
              statusUpper === "IN_PROGRESS" ||
              statusUpper === "IN PROGRESS" ||
              statusUpper === "ACTIVE";
            break;
          case "internal-review":
            matches =
              status === "internal review" ||
              status === "in review" ||
              status === "in_review" ||
              statusUpper === "IN_REVIEW" ||
              statusUpper === "IN REVIEW";
            break;
          case "done":
            matches =
              status === "done" ||
              status === "completed" ||
              statusUpper === "DONE" ||
              statusUpper === "COMPLETED";
            break;
          default:
            matches = true;
        }

        if (!matches) {
        }

        return matches;
      });

    }

    // Filter by search query
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name?.toLowerCase().includes(queryLower) ||
          task.description?.toLowerCase().includes(queryLower) ||
          task.project?.name?.toLowerCase().includes(queryLower) ||
          task.assignee?.name?.toLowerCase().includes(queryLower)
      );

    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Handle task click - open modal
  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Handle approve task
  const handleApprove = async (taskId) => {
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
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  clientApproval: "approved",
                  approvedAt: new Date().toISOString(),
                  status: "Approved", // Update status to Approved
                }
              : t
          )
        );
        if (selectedTask?.id === taskId) {
          setSelectedTask({
            ...selectedTask,
            clientApproval: "approved",
            approvedAt: new Date().toISOString(),
            status: "Approved", // Update status to Approved
          });
        }
      }
    } catch (error) {
      console.error("Error approving task:", error);
    }
  };

  // Handle reject task
  const handleReject = async (taskId) => {
    try {
      // TODO: Update task rejection via API
      const response = await fetch(
        strapiClient.buildURL(`/tasks/${taskId}`, {}),
        {
          method: "PUT",
          headers: strapiClient.getHeaders(),
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
        if (selectedTask?.id === taskId) {
          setSelectedTask({
            ...selectedTask,
            clientApproval: "rejected",
            approvedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error rejecting task:", error);
    }
  };

  // Handle add comment
  const handleComment = async (taskId, comment) => {
    try {
      // TODO: Add comment via API
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
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Get status badge colors
  const getStatusColor = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "DONE":
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-400";
      case "IN PROGRESS":
      case "IN_PROGRESS":
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

  // Task table columns - client-friendly version
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
      key: "subtasks",
      label: "SUBTASKS",
      render: (_, task) => {
        const taskId = task.id;
        const isExpanded = expandedSubtasks[taskId] || false;

        const taskSubtasks = task.subtasks || [];
        const rootSubtasks = taskSubtasks.filter((st) => {
          return (
            !st.parentSubtask ||
            st.parentSubtask === null ||
            (typeof st.parentSubtask === "object" && !st.parentSubtask.id)
          );
        });
        const subtaskCount = rootSubtasks.length;

        const handleToggleExpand = (e) => {
          e.stopPropagation();

          const newExpandedState = !isExpanded;

          if (newExpandedState && subtaskButtonRefs.current[taskId]) {
            const rect =
              subtaskButtonRefs.current[taskId].getBoundingClientRect();
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

        const hasSubtasks = subtaskCount > 0;
        const dropdownPosition = subtaskDropdownPositions[taskId];
        const dropdownContent =
          isExpanded && rootSubtasks.length > 0 && dropdownPosition ? (
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
                    subtask.status?.toLowerCase() === "done" ||
                    subtask.status?.toLowerCase() === "completed";
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
                            {subtask.name || subtask.title}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null;

        return (
          <>
            <div className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
              {hasSubtasks ? (
                <div className="relative">
                  <button
                    ref={(el) => {
                      if (el) subtaskButtonRefs.current[taskId] = el;
                    }}
                    onClick={handleToggleExpand}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 w-full"
                  >
                    <GitBranch className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">
                      {subtaskCount}{" "}
                      {subtaskCount === 1 ? "subtask" : "subtasks"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-500">No subtasks</span>
              )}
            </div>
            {typeof window !== "undefined" &&
              isExpanded &&
              rootSubtasks.length > 0 &&
              dropdownPosition &&
              createPortal(dropdownContent, document.body)}
          </>
        );
      },
    },
    {
      key: "project",
      label: "PROJECT",
      render: (_, task) => (
        <div className="min-w-[150px]">
          {task.project ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (task.project?.id) {
                  router.push(`/projects/${task.project.id}`);
                }
              }}
              className="text-sm text-gray-700 hover:text-xtrawrkx-600 hover:underline truncate"
            >
              {task.project.name}
            </button>
          ) : (
            <span className="text-sm text-gray-500">No project</span>
          )}
        </div>
      ),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="px-4 pt-4">
          <PageHeader
            title="Tasks"
            subtitle="Manage and track all your tasks"
            showSearch={false}
            showActions={false}
          />
        </div>
        <div className="p-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
              <span className="text-gray-600">Loading tasks...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="px-4 pt-4">
        <PageHeader
          title="Tasks"
          subtitle="Manage and track all your tasks"
          showActions={true}
          onFilterClick={() =>
            setFilterStatus(filterStatus === "all" ? "todo" : "all")
          }
          hasActiveFilters={filterStatus !== "all" || searchQuery.length > 0}
        />
      </div>

      <div className="px-3 mt-6">
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statusStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-black text-gray-800">
                        {stat.count}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            stat.label === "Total Tasks"
                              ? "bg-xtrawrkx-500"
                              : stat.label === "In Progress"
                              ? "bg-yellow-500"
                              : stat.label === "Completed"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        {stat.count === 0
                          ? "No tasks"
                          : `${stat.count} ${
                              stat.count === 1 ? "task" : "tasks"
                            }`}
                      </div>
                    </div>
                    <div
                      className={`w-16 h-16 ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${stat.borderColor}`}
                    >
                      <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs and View Toggle */}
          <div className="flex items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-3">
            {/* Left: Tabs */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-xtrawrkx-500 text-white shadow-lg"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === tab.key
                        ? "bg-white/30 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Center: Search Bar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/90 transition-all duration-300 placeholder:text-gray-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: View Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setActiveView("list")}
                className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                  activeView === "list"
                    ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                    : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView("grid")}
                className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                  activeView === "grid"
                    ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                    : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tasks Table */}
          {activeView === "list" ? (
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
                  {filteredTasks.length === 0 ? (
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
                            {searchQuery || activeTab !== "all"
                              ? "Try adjusting your filters"
                              : "Get started by creating your first task"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isActionRequired =
                        task.requiresApproval &&
                        task.status === "Client Review" &&
                        !task.clientApproval;

                      return (
                        <tr
                          key={task.id}
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
                              {column.render(task, task)}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-12 text-center">
                  <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No tasks found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery || activeTab !== "all"
                      ? "Try adjusting your filters"
                      : "Get started by creating your first task"}
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">
                          {task.name}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {task.project && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{task.project.name}</span>
                        </div>
                      )}
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{task.assignee.name}</span>
                        </div>
                      )}
                      {task.scheduledDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(task.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {task.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-xtrawrkx-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
        onApprove={handleApprove}
        onReject={handleReject}
        onComment={handleComment}
      />
    </div>
  );
}
