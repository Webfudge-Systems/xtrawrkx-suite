"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckSquare,
  Plus,
  Trash2,
  User,
  CheckCircle,
  Calendar,
  Clock,
  Edit,
  Filter,
  X,
  AlertCircle,
  Search,
  MoreHorizontal,
  List,
  Columns,
} from "lucide-react";
import { Button, Avatar, Badge, StatCard } from "../../../components/ui";
import PageHeader from "../../../components/PageHeader";
import TasksKPIs from "./components/TasksKPIs";
import TasksTabs from "./components/TasksTabs";
import TasksListView from "./components/TasksListView";
import taskService from "../../../lib/api/taskService";
import { useAuth } from "../../../contexts/AuthContext";
import {
  format,
  isPast,
  isToday,
  isTomorrow,
  differenceInDays,
} from "date-fns";
import strapiClient from "../../../lib/strapiClient";

export default function TasksPage() {
  const { user } = useAuth();
  const [tasksList, setTasksList] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    scheduledDate: "",
    assignee: "",
    priority: "MEDIUM",
    entityType: "",
    entityId: "",
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("DATE_DESC");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState("list");
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });

  // Fetch all tasks
  useEffect(() => {
    fetchAllTasks();
  }, []);

  // Fetch all tasks
  const fetchAllTasks = async () => {
    try {
      setLoadingTasks(true);
      const response = await strapiClient.get("/tasks", {
        sort: "createdAt:desc",
        "pagination[pageSize]": 1000, // Get all tasks for now
      });


      // Handle Strapi v5 response format
      // Response can be: { data: [...], meta: {...} } or directly an array
      let tasksData = [];

      if (Array.isArray(response)) {
        tasksData = response;
      } else if (response?.data) {
        // Check if data is an array or has nested data array
        if (Array.isArray(response.data)) {
          tasksData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          tasksData = response.data.data;
        } else {
          tasksData = [];
        }
      } else {
        tasksData = [];
      }


      const transformed = tasksData
        .map((task) => {
          // Handle Strapi response format
          const taskData = task.attributes || task;
          const taskId = task.id || task.documentId;

          // Extract nested relations properly
          const leadCompany =
            taskData.leadCompany?.data?.attributes || taskData.leadCompany;
          const clientAccount =
            taskData.clientAccount?.data?.attributes || taskData.clientAccount;
          const contact =
            taskData.contact?.data?.attributes || taskData.contact;
          const deal = taskData.deal?.data?.attributes || taskData.deal;

          return {
            id: taskId,
            ...taskData,
            createdBy:
              taskData.createdBy?.data?.attributes || taskData.createdBy || {},
            assignee:
              taskData.assignee?.data?.attributes || taskData.assignee || null,
            priority: taskData.priority || "MEDIUM",
            status: taskData.status || "SCHEDULED",
            scheduledDate: taskData.scheduledDate || null,
            description: taskData.description || "",
            createdAt: taskData.createdAt || new Date().toISOString(),
            // Get entity info for display
            entity: leadCompany
              ? {
                  type: "Lead Company",
                  name: leadCompany.companyName || "Unknown",
                }
              : clientAccount
              ? {
                  type: "Client Account",
                  name: clientAccount.companyName || "Unknown",
                }
              : contact
              ? {
                  type: "Contact",
                  name:
                    `${contact.firstName || ""} ${
                      contact.lastName || ""
                    }`.trim() || "Unknown",
                }
              : deal
              ? { type: "Deal", name: deal.title || "Unknown" }
              : null,
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


      setTasksList(transformed);

      // Calculate stats
      const newStats = {
        total: transformed.length,
        pending: transformed.filter((t) => t.status === "SCHEDULED").length,
        inProgress: transformed.filter((t) => t.status === "IN_PROGRESS")
          .length,
        completed: transformed.filter((t) => t.status === "COMPLETED").length,
        overdue: transformed.filter(
          (t) =>
            t.scheduledDate &&
            isPast(new Date(t.scheduledDate)) &&
            t.status !== "COMPLETED"
        ).length,
      };

      setStats(newStats);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      setTasksList([]);
      setStats({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
      });
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users?pagination[pageSize]=100", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showNewTask || editingTask) {
      fetchUsers();
    }
  }, [showNewTask, editingTask]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      alert("Please enter task title");
      return;
    }

    if (!newTask.entityType || !newTask.entityId) {
      alert("Please select an entity for this task");
      return;
    }

    try {
      const userId = user?.documentId || user?.id || user?.data?.id;

      if (!userId) {
        alert(
          "Unable to identify user. Please refresh the page and try again."
        );
        return;
      }

      const taskData = {
        title: newTask.title,
        description: newTask.description || null,
        status: "SCHEDULED",
        scheduledDate: newTask.scheduledDate || null,
        priority: newTask.priority || "MEDIUM",
        assignee: newTask.assignee || null,
      };

      await taskService.createTask(
        newTask.entityType,
        newTask.entityId,
        taskData,
        userId
      );

      setNewTask({
        title: "",
        description: "",
        scheduledDate: "",
        assignee: "",
        priority: "MEDIUM",
        entityType: "",
        entityId: "",
      });
      setShowNewTask(false);
      setTimeout(() => {
        fetchAllTasks();
      }, 500);
    } catch (error) {
      console.error("Error creating task:", error);
      alert(`Failed to create task: ${error.message}`);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask.title.trim()) {
      alert("Please enter task title");
      return;
    }

    try {
      const taskData = {
        title: editingTask.title,
        description: editingTask.description || null,
        scheduledDate: editingTask.scheduledDate || null,
        priority: editingTask.priority || "MEDIUM",
        assignee: editingTask.assignee || null,
      };

      await taskService.updateTask(editingTask.id, taskData);
      setEditingTask(null);
      setTimeout(() => {
        fetchAllTasks();
      }, 500);
    } catch (error) {
      console.error("Error updating task:", error);
      alert(`Failed to update task: ${error.message}`);
    }
  };

  const handleCompleteActivity = async (taskId) => {
    try {
      const task = tasksList.find((t) => t.id === taskId);
      const newStatus = task.status === "COMPLETED" ? "SCHEDULED" : "COMPLETED";
      await taskService.updateStatus(taskId, newStatus);
      fetchAllTasks();
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  };

  const handleDeleteActivity = async () => {
    if (!taskToDelete) return;

    const taskId = taskToDelete.id || taskToDelete.documentId;

    try {
      setIsDeleting(true);
      await taskService.deleteTask(taskId);

      // Close modal and reset state
      setShowDeleteModal(false);
      setTaskToDelete(null);

      // Refresh the task list
      await fetchAllTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      alert(`Failed to delete task: ${error.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask({
      id: task.id,
      title: task.title || "",
      description: task.description || "",
      scheduledDate: task.scheduledDate
        ? format(new Date(task.scheduledDate), "yyyy-MM-dd")
        : "",
      assignee: task.assignee?.id || task.assignee || "",
      priority: task.priority || "MEDIUM",
    });
  };

  // Format date for display
  const formatTaskDate = (date) => {
    if (!date) return null;
    const taskDate = new Date(date);

    if (isToday(taskDate)) {
      return "Today";
    } else if (isTomorrow(taskDate)) {
      return "Tomorrow";
    } else if (isPast(taskDate)) {
      const daysPast = differenceInDays(new Date(), taskDate);
      return `${daysPast} day${daysPast > 1 ? "s" : ""} ago`;
    } else {
      return format(taskDate, "MMM d, yyyy");
    }
  };

  // Get date urgency status
  const getDateStatus = (date) => {
    if (!date) return null;
    const taskDate = new Date(date);

    if (isPast(taskDate)) {
      return "OVERDUE";
    } else if (isToday(taskDate)) {
      return "DUE_TODAY";
    } else if (differenceInDays(taskDate, new Date()) <= 3) {
      return "DUE_SOON";
    }
    return "UPCOMING";
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "LOW":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Task columns configuration
  const taskColumnsTable = [
    {
      key: "task",
      label: "TASK",
      render: (_, task) => {
        const dateStatus = getDateStatus(task.scheduledDate);
        const isOverdue =
          dateStatus === "OVERDUE" && task.status !== "COMPLETED";

        return (
          <div className="flex items-center gap-3 min-w-[250px]">
            <input
              type="checkbox"
              checked={task.status === "COMPLETED"}
              onChange={(e) => {
                e.stopPropagation();
                handleCompleteActivity(task.id);
              }}
              className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500 focus:ring-1 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <p
                  className={`font-semibold text-sm truncate transition-all duration-200 ${
                    task.status === "COMPLETED"
                      ? "text-gray-500 line-through"
                      : "text-gray-900"
                  }`}
                >
                  {task.title}
                </p>
                {isOverdue && (
                  <Badge className="text-xs px-1.5 py-0.5 border bg-red-100 text-red-700 border-red-200 flex-shrink-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Overdue
                  </Badge>
                )}
              </div>
              {task.description && (
                <p
                  className={`text-xs truncate transition-all duration-200 ${
                    task.status === "COMPLETED"
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "entity",
      label: "ENTITY",
      render: (_, task) =>
        task.entity ? (
          <div className="min-w-[180px]">
            <div className="text-xs text-gray-500 mb-0.5">
              {task.entity.type}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {task.entity.name}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400 min-w-[180px]">-</span>
        ),
    },
    {
      key: "assignee",
      label: "ASSIGNEE",
      render: (_, task) =>
        task.assignee ? (
          <div className="flex items-center space-x-2 min-w-[180px]">
            <Avatar
              fallback={
                (
                  (task.assignee.firstName?.[0] || "") +
                  (task.assignee.lastName?.[0] || "")
                ).toUpperCase() || "U"
              }
              size="sm"
              className="w-7 h-7 border border-gray-200 flex-shrink-0"
            />
            <span className="text-sm text-gray-900 truncate">
              {task.assignee.firstName} {task.assignee.lastName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 min-w-[180px]">
            Unassigned
          </span>
        ),
    },
    {
      key: "dueDate",
      label: "DUE DATE",
      render: (_, task) => {
        const dateStatus = getDateStatus(task.scheduledDate);
        const isOverdue =
          dateStatus === "OVERDUE" && task.status !== "COMPLETED";

        return task.scheduledDate ? (
          <div className="flex items-center space-x-1 min-w-[120px]">
            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <div
                className={`text-sm font-medium ${
                  isOverdue
                    ? "text-red-600"
                    : dateStatus === "DUE_TODAY"
                    ? "text-yellow-600"
                    : "text-gray-900"
                }`}
              >
                {formatTaskDate(task.scheduledDate)}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400 min-w-[120px]">
            No due date
          </span>
        );
      },
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, task) => {
        const status = task.status?.toLowerCase() || "scheduled";
        const statusColors = {
          completed: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
            shadow: "shadow-green-200",
          },
          in_progress: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
            shadow: "shadow-blue-200",
          },
          scheduled: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
            shadow: "shadow-yellow-200",
          },
          cancelled: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
            shadow: "shadow-red-200",
          },
        };

        const colors = statusColors[status] || statusColors.scheduled;
        const displayStatus = task.status?.replace("_", " ") || "Scheduled";

        return (
          <div className="min-w-[120px]">
            <div
              className={`${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md ${colors.shadow} transition-all duration-200 hover:scale-105 hover:shadow-lg inline-block`}
            >
              {displayStatus.toUpperCase()}
            </div>
          </div>
        );
      },
    },
    {
      key: "priority",
      label: "PRIORITY",
      render: (_, task) => (
        <div className="min-w-[100px]">
          <Badge
            className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(
              task.priority
            )}`}
          >
            {task.priority || "MEDIUM"}
          </Badge>
        </div>
      ),
    },
    {
      key: "createdBy",
      label: "CREATED BY",
      render: (_, task) =>
        task.createdBy ? (
          <div className="flex items-center space-x-2 min-w-[150px]">
            <span className="text-sm text-gray-700">
              {task.createdBy.firstName} {task.createdBy.lastName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-400 min-w-[150px]">-</span>
        ),
    },
    {
      key: "createdAt",
      label: "CREATED",
      render: (_, task) => (
        <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[120px]">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {formatDate(task.createdAt)}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, task) => (
        <div
          className="flex items-center gap-1 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          {task.status !== "COMPLETED" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEditTask(task);
              }}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2 rounded-lg transition-all duration-200"
              title="Edit Task"
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setTaskToDelete(task);
              setShowDeleteModal(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Filter and sort tasks
  const filteredAndSortedTasks = tasksList
    .filter((task) => {
      // Status filter
      if (filterStatus === "PENDING") {
        if (task.status === "COMPLETED") return false;
      } else if (filterStatus === "COMPLETED") {
        if (task.status !== "COMPLETED") return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDescription = task.description
          ?.toLowerCase()
          .includes(query);
        const matchesAssignee = `${task.assignee?.firstName || ""} ${
          task.assignee?.lastName || ""
        }`
          .toLowerCase()
          .includes(query);
        const matchesEntity = task.entity?.name?.toLowerCase().includes(query);

        if (
          !matchesTitle &&
          !matchesDescription &&
          !matchesAssignee &&
          !matchesEntity
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "DATE_ASC") {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date(0);
        const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date(0);
        return dateA - dateB;
      } else if (sortBy === "DATE_DESC") {
        const dateA = a.scheduledDate ? new Date(a.scheduledDate) : new Date(0);
        const dateB = b.scheduledDate ? new Date(b.scheduledDate) : new Date(0);
        return dateB - dateA;
      } else if (sortBy === "PRIORITY") {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (
          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
      }
      return 0;
    });

  return (
    <React.Fragment>
      <div className="p-4 space-y-4 bg-white min-h-screen">
        {/* Page Header */}
        <PageHeader
          title="Tasks"
          subtitle="Manage and track all your tasks across all entities"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Delivery", href: "/delivery" },
            { label: "Tasks", href: "/delivery/tasks" },
          ]}
          showActions={true}
          onAddClick={() => setShowNewTask(true)}
          // Note: Import functionality is not available for PM/Tasks
        />

        <div className="space-y-4">
          {/* Stats Overview */}
          <TasksKPIs stats={stats} />

          {/* View Toggle */}
          <TasksTabs
            tabItems={[
              {
                key: "ALL",
                label: "All Tasks",
                badge: stats.total.toString(),
              },
              {
                key: "PENDING",
                label: "Pending",
                badge: (stats.pending + stats.inProgress).toString(),
              },
              {
                key: "COMPLETED",
                label: "Completed",
                badge: stats.completed.toString(),
              },
            ]}
            activeTab={filterStatus}
            setActiveTab={setFilterStatus}
            activeView={activeView}
            setActiveView={setActiveView}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddClick={() => setShowNewTask(true)}
          />

          {/* Single Horizontal Scroll Container */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Tasks Table */}
            {loadingTasks ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-gray-600">Loading tasks...</span>
              </div>
            ) : activeView === "list" ? (
              <TasksListView
                filteredTasks={filteredAndSortedTasks}
                taskColumnsTable={taskColumnsTable}
                selectedTasks={selectedTasks}
                setSelectedTasks={setSelectedTasks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddClick={() => setShowNewTask(true)}
                onRowClick={(row) => {
                  // Navigate to task detail if needed
                }}
              />
            ) : (
              // Board view placeholder
              <div className="rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-12 text-center">
                <p className="text-gray-600 font-medium">
                  Board view coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {typeof window !== "undefined" &&
        showNewTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Add Task
                  </h2>
                  <button
                    onClick={() => {
                      setShowNewTask(false);
                      setNewTask({
                        title: "",
                        description: "",
                        scheduledDate: "",
                        assignee: "",
                        priority: "MEDIUM",
                        entityType: "",
                        entityId: "",
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleCreateTask();
                  }}
                  className="space-y-5"
                >
                  {/* Task Title - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                      placeholder="Enter task title..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors"
                      required
                    />
                  </div>

                  {/* Description - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                      placeholder="Task description..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white transition-colors"
                      rows={3}
                    />
                  </div>

                  {/* Entity Type and Entity - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Entity Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newTask.entityType}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            entityType: e.target.value,
                            entityId: "",
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors appearance-none cursor-pointer"
                        required
                      >
                        <option value="">Select entity type...</option>
                        <option value="leadCompany">Lead Company</option>
                        <option value="clientAccount">Client Account</option>
                        <option value="contact">Contact</option>
                        <option value="deal">Deal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Entity <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={newTask.entityId}
                        onChange={(e) =>
                          setNewTask({ ...newTask, entityId: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                        required
                        disabled={!newTask.entityType}
                      >
                        <option value="">Select entity...</option>
                        {/* Entity options will be populated based on entityType */}
                      </select>
                    </div>
                  </div>

                  {/* Due Date and Priority - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={newTask.scheduledDate}
                        onChange={(e) =>
                          setNewTask({
                            ...newTask,
                            scheduledDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Priority
                      </label>
                      <select
                        value={newTask.priority}
                        onChange={(e) =>
                          setNewTask({ ...newTask, priority: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors appearance-none cursor-pointer"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Assign To - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Assign To
                    </label>
                    <select
                      value={newTask.assignee}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assignee: e.target.value })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Select assignee...</option>
                      <option value={user?.id}>Assign to me</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.attributes?.firstName} {u.attributes?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowNewTask(false);
                        setNewTask({
                          title: "",
                          description: "",
                          scheduledDate: "",
                          assignee: "",
                          priority: "MEDIUM",
                          entityType: "",
                          entityId: "",
                        });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        !newTask.title.trim() ||
                        !newTask.entityType ||
                        !newTask.entityId
                      }
                      className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Task
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Task Modal */}
      {typeof window !== "undefined" &&
        editingTask &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Edit Task
                  </h2>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateTask();
                  }}
                  className="space-y-5"
                >
                  {/* Task Title - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      }
                      placeholder="Enter task title..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors"
                      required
                    />
                  </div>

                  {/* Description - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={editingTask.description}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          description: e.target.value,
                        })
                      }
                      placeholder="Task description..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none bg-white transition-colors"
                      rows={3}
                    />
                  </div>

                  {/* Due Date and Priority - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={editingTask.scheduledDate}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            scheduledDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Priority
                      </label>
                      <select
                        value={editingTask.priority}
                        onChange={(e) =>
                          setEditingTask({
                            ...editingTask,
                            priority: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors appearance-none cursor-pointer"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Assign To - Full Width */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Assign To
                    </label>
                    <select
                      value={editingTask.assignee}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          assignee: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">Select assignee...</option>
                      <option value={user?.id}>Assign to me</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.attributes?.firstName} {u.attributes?.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      onClick={() => setEditingTask(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!editingTask.title.trim()}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Task
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Task
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete the task{" "}
                <strong>"{taskToDelete.title}"</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Task information and details</li>
                  <li>• Task description and notes</li>
                  <li>• Task assignments and status</li>
                  <li>• All associated data</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                disabled={isDeleting}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteActivity}
                disabled={isDeleting}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </div>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
