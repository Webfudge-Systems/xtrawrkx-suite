"use client";

import React, { useState, useEffect } from "react";
import {
  Filter,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  CheckSquare,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import taskService from "../../lib/taskService";
import projectService from "../../lib/projectService";
import { transformTask } from "../../lib/dataTransformers";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../../components/ui";

// Error boundary component for charts
// class ChartErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false, error: null };
//   }

//   static getDerivedStateFromError(error) {
//     return { hasError: true, error };
//   }

//   componentDidCatch(error, errorInfo) {
//     console.error("Chart Error:", error, errorInfo);
//   }

//   render() {
//     if (this.state.hasError) {
//       return (
//         <div className="h-80 flex items-center justify-center bg-red-50 rounded-lg">
//           <div className="text-center">
//             <p className="text-red-600 font-semibold">Chart Error</p>
//             <p className="text-red-500 text-sm">{this.state.error?.message}</p>
//           </div>
//         </div>
//       );
//     }

//     return this.props.children;
//   }
// }

// Key Metrics Cards Component
const KeyMetricsCards = ({ stats, previousStats }) => {
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: "+0", isPositive: true };
    const diff = current - previous;
    const sign = diff >= 0 ? "+" : "";
    return {
      value: `${sign}${diff}`,
      isPositive: diff >= 0,
    };
  };

  const metrics = [
    {
      title: "Total Projects",
      value: stats.totalProjects?.toString() || "0",
      trend: calculateTrend(
        stats.totalProjects || 0,
        previousStats?.totalProjects || 0
      ),
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      icon: FolderOpen,
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks?.toString() || "0",
      trend: calculateTrend(
        stats.totalTasks || 0,
        previousStats?.totalTasks || 0
      ),
      color: "bg-gray-50",
      borderColor: "border-gray-200",
      iconColor: "text-gray-600",
      icon: CheckSquare,
    },
    {
      title: "Assigned Tasks",
      value: stats.assignedTasks?.toString() || "0",
      trend: calculateTrend(
        stats.assignedTasks || 0,
        previousStats?.assignedTasks || 0
      ),
      color: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      icon: UserCheck,
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks?.toString() || "0",
      trend: calculateTrend(
        stats.completedTasks || 0,
        previousStats?.completedTasks || 0
      ),
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      title: "Overdue Tasks",
      value: stats.overdueTasks?.toString() || "0",
      trend: calculateTrend(
        stats.overdueTasks || 0,
        previousStats?.overdueTasks || 0
      ),
      color: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      icon: AlertCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <div
            key={index}
            className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1 font-medium">
                  {metric.title}
                </p>
                <p className="text-3xl font-black text-gray-800">
                  {metric.value}
                </p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      metric.color?.replace("-50", "-500") || "bg-gray-500"
                    }`}
                  ></span>
                  <span className="mr-2">
                    {metric.value === "0"
                      ? `No ${metric.title.toLowerCase()}`
                      : `${metric.value} ${
                          metric.value === "1"
                            ? metric.title.slice(0, -1).toLowerCase()
                            : metric.title.toLowerCase()
                        }`}
                  </span>
                  {metric.trend.value !== "+0" && (
                    <div
                      className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs ${
                        metric.trend.isPositive
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {metric.trend.isPositive ? (
                        <ArrowUp className="h-2.5 w-2.5" />
                      ) : (
                        <ArrowDown className="h-2.5 w-2.5" />
                      )}
                      <span className="font-semibold">
                        {metric.trend.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`w-16 h-16 ${
                  metric.color || "bg-gray-50"
                } backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${
                  metric.borderColor || "border-gray-200"
                }`}
              >
                <IconComponent
                  className={`w-8 h-8 ${metric.iconColor || "text-gray-600"}`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Upcoming Tasks by Status Chart
const UpcomingTasksByStatus = ({ tasks }) => {
  // Calculate tasks by status
  const statusCounts = {
    "To Do": 0,
    "In Progress": 0,
    "Internal Review": 0,
    Done: 0,
    Cancelled: 0,
  };

  tasks.forEach((task) => {
    const status = task.status?.toLowerCase().replace(/\s+/g, "-") || "";
    if (status === "to-do" || status === "todo") statusCounts["To Do"]++;
    else if (status === "in-progress") statusCounts["In Progress"]++;
    else if (status === "internal-review" || status === "in-review") statusCounts["Internal Review"]++;
    else if (status === "done" || status === "completed")
      statusCounts["Done"]++;
    else if (status === "cancelled") statusCounts["Cancelled"]++;
  });

  const statusColors = {
    "To Do": "#3B82F6", // blue-500
    "In Progress": "#EAB308", // yellow-500
    "Internal Review": "#A855F7", // purple-500
    Done: "#22C55E", // green-500
    Cancelled: "#EF4444", // red-500
  };

  const statusData = Object.entries(statusCounts)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name,
      value,
      color: statusColors[name] || "#808080",
    }));

  const maxValue =
    statusData.length > 0 ? Math.max(...statusData.map((d) => d.value)) : 1;

  if (statusData.length === 0) {
    return (
      <Card glass={true} className="p-4">
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No task status data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card glass={true} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tasks by Status</h3>
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
            <Filter className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-80 flex items-end justify-between space-x-4 pb-4">
        {statusData.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center space-y-2 flex-1"
          >
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(item.value / maxValue) * 200}px`,
                backgroundColor: item.color,
                minHeight: "20px",
              }}
            />
            <span className="text-xs text-gray-600 text-center">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Tasks by Project Chart
const TasksByProject = ({ tasks, projects }) => {
  // Group tasks by project
  const projectTaskMap = {};

  tasks.forEach((task) => {
    const projectId = task.project?.id || "unassigned";
    const projectName = task.project?.name || "Unassigned";

    if (!projectTaskMap[projectId]) {
      projectTaskMap[projectId] = {
        id: projectId,
        name: projectName,
        completed: 0,
        incomplete: 0,
      };
    }

    const status = task.status?.toLowerCase().replace(/\s+/g, "-") || "";
    if (status === "done" || status === "completed") {
      projectTaskMap[projectId].completed++;
    } else {
      projectTaskMap[projectId].incomplete++;
    }
  });

  // Get project icons/colors
  const projectIcons = ["⚪", "🟡", "🔵", "🟣", "🟢", "🟠", "⚫", "🔴", "🟤"];
  const projectData = Object.values(projectTaskMap)
    .slice(0, 9) // Limit to 9 projects for display
    .map((project, index) => ({
      ...project,
      icon: projectIcons[index % projectIcons.length],
    }));

  const maxTotal =
    projectData.length > 0
      ? Math.max(...projectData.map((p) => p.completed + p.incomplete))
      : 1;

  if (projectData.length === 0) {
    return (
      <Card glass={true} className="p-4">
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No project data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card glass={true} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Tasks by Project
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Incomplete</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <Filter className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 flex items-end justify-between space-x-2 pb-4">
        {projectData.map((project, index) => {
          const completedHeight = (project.completed / maxTotal) * 200;
          const incompleteHeight = (project.incomplete / maxTotal) * 200;

          return (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 flex-1"
            >
              <div className="flex flex-col items-center w-full">
                <div
                  className="w-full bg-yellow-500 rounded-t-md"
                  style={{
                    height: `${incompleteHeight}px`,
                    minHeight: project.incomplete > 0 ? "10px" : "0px",
                  }}
                />
                <div
                  className="w-full bg-green-500"
                  style={{
                    height: `${completedHeight}px`,
                    minHeight: project.completed > 0 ? "10px" : "0px",
                  }}
                />
              </div>
              <div className="text-lg" title={project.name}>
                {project.icon}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Task by Assignee Chart
const TaskByAssignee = ({ tasks }) => {
  // Group tasks by assignee
  const assigneeMap = {};

  tasks.forEach((task) => {
    const assignee = task.assignee;
    if (!assignee) return;

    const assigneeId = assignee.id || assignee._id || "unknown";
    const assigneeName =
      assignee.name ||
      (assignee.firstName && assignee.lastName
        ? `${assignee.firstName} ${assignee.lastName}`
        : assignee.firstName || assignee.email || "Unknown");

    const initials = assigneeName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    if (!assigneeMap[assigneeId]) {
      assigneeMap[assigneeId] = {
        id: assigneeId,
        name: assigneeName,
        initials,
        value: 0,
      };
    }

    assigneeMap[assigneeId].value++;
  });

  const assigneeData = Object.values(assigneeMap)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7); // Top 7 assignees

  const maxValue =
    assigneeData.length > 0 ? Math.max(...assigneeData.map((d) => d.value)) : 1;

  if (assigneeData.length === 0) {
    return (
      <Card glass={true} className="p-4">
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No assignee data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card glass={true} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Tasks by Assignee
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
            <Filter className="h-4 w-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-80 flex items-end justify-between space-x-2 pb-8">
        {assigneeData.map((assignee, index) => {
          const barHeight = (assignee.value / maxValue) * 180;

          return (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 flex-1"
            >
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mb-1" />
                <div
                  className="w-1 bg-blue-500 rounded"
                  style={{
                    height: `${barHeight}px`,
                    minHeight: "20px",
                  }}
                />
              </div>
              <div
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
                title={assignee.name}
              >
                {assignee.initials}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Task Completion Over Time Chart
const TaskCompletionOverTime = ({ tasks }) => {
  // Group tasks by status
  const statusCounts = {
    "To Do": { completed: 0, incomplete: 0 },
    "In Progress": { completed: 0, incomplete: 0 },
    "In Review": { completed: 0, incomplete: 0 },
    Done: { completed: 0, incomplete: 0 },
  };

  tasks.forEach((task) => {
    const status = task.status?.toLowerCase().replace(/\s+/g, "-") || "";
    const isCompleted = status === "done" || status === "completed";

    if (status === "to-do" || status === "todo") {
      if (isCompleted) statusCounts["To Do"].completed++;
      else statusCounts["To Do"].incomplete++;
    } else if (status === "in-progress") {
      if (isCompleted) statusCounts["In Progress"].completed++;
      else statusCounts["In Progress"].incomplete++;
    } else if (status === "internal-review" || status === "in-review") {
      if (isCompleted) statusCounts["Internal Review"].completed++;
      else statusCounts["Internal Review"].incomplete++;
    } else if (status === "done" || status === "completed") {
      statusCounts["Done"].completed++;
    }
  });

  const timeData = Object.entries(statusCounts).map(([name, counts]) => ({
    name,
    completed: counts.completed,
    incomplete: counts.incomplete,
  }));

  const maxValue = Math.max(
    ...timeData.map((d) => d.completed + d.incomplete),
    1
  );

  if (timeData.length === 0) {
    return (
      <Card glass={true} className="p-4">
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500">No completion data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card glass={true} className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Task Completion Over Time
        </h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">Incomplete</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <Filter className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-80 relative">
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="ml-8 h-full relative">
          <svg className="w-full h-full" viewBox="0 0 400 300">
            {/* Grid lines */}
            <defs>
              <pattern
                id="grid"
                width={400 / timeData.length}
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${400 / timeData.length} 0 L 0 0 0 60`}
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Calculate path for incomplete tasks */}
            {timeData.length > 0 && (
              <>
                <path
                  d={`M 0,${
                    300 - (timeData[0].incomplete / maxValue) * 250
                  } ${timeData
                    .map(
                      (item, index) =>
                        `L ${(index * 400) / timeData.length},${
                          300 - (item.incomplete / maxValue) * 250
                        }`
                    )
                    .join(" ")} L ${400},${
                    300 -
                    (timeData[timeData.length - 1].incomplete / maxValue) * 250
                  } L 400,300 L 0,300 Z`}
                  fill="#EAB308"
                  opacity="0.4"
                />

                {/* Area chart for completed tasks */}
                <path
                  d={`M 0,${
                    300 - (timeData[0].completed / maxValue) * 250
                  } ${timeData
                    .map(
                      (item, index) =>
                        `L ${(index * 400) / timeData.length},${
                          300 - (item.completed / maxValue) * 250
                        }`
                    )
                    .join(" ")} L ${400},${
                    300 -
                    (timeData[timeData.length - 1].completed / maxValue) * 250
                  } L 400,300 L 0,300 Z`}
                  fill="#22C55E"
                  opacity="0.6"
                />
              </>
            )}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {timeData.map((item, index) => (
              <span key={index} className="text-center">
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Main Analytics Page Component
export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    assignedTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  });
  const [previousStats, setPreviousStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load analytics data
  useEffect(() => {
    if (authLoading) return;

    const loadAnalyticsData = async () => {
      try {
        setLoading(true);

        // Store previous stats for trend calculation
        setPreviousStats({ ...stats });

        // Fetch tasks and projects in parallel
        const [tasksResponse, projectsResponse] = await Promise.all([
          taskService
            .getAllTasks({
              pageSize: 1000,
              populate: ["project", "assignee", "createdBy"],
            })
            .catch((err) => {
              console.error("Error fetching tasks:", err);
              return { data: [] };
            }),
          projectService
            .getAllProjects({
              pageSize: 100,
            })
            .catch((err) => {
              console.error("Error fetching projects:", err);
              return { data: [] };
            }),
        ]);

        // Transform tasks
        const transformedTasks = (tasksResponse.data || [])
          .map(transformTask)
          .filter((task) => {
            // Filter out CRM tasks - only PM tasks
            const hasCRMRelation = !!(
              task.leadCompany ||
              task.clientAccount ||
              task.contact ||
              task.deal
            );
            return !hasCRMRelation;
          });

        setTasks(transformedTasks);
        setProjects(projectsResponse.data || []);

        // Calculate statistics
        const now = new Date();
        const assignedTasks = transformedTasks.filter((t) => t.assignee).length;
        const completedTasks = transformedTasks.filter(
          (t) =>
            t.status?.toLowerCase() === "done" ||
            t.status?.toLowerCase() === "completed"
        ).length;
        const overdueTasks = transformedTasks.filter(
          (t) =>
            t.scheduledDate &&
            new Date(t.scheduledDate) < now &&
            t.status?.toLowerCase() !== "done" &&
            t.status?.toLowerCase() !== "completed"
        ).length;

        setStats({
          totalProjects: projectsResponse.data?.length || 0,
          totalTasks: transformedTasks.length,
          assignedTasks,
          completedTasks,
          overdueTasks,
        });
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [authLoading]);

  // Real-time updates: Poll for new data every 10 seconds
  useEffect(() => {
    if (authLoading || loading) return;

    const pollInterval = setInterval(async () => {
      try {
        const [tasksResponse, projectsResponse] = await Promise.all([
          taskService
            .getAllTasks({
              pageSize: 1000,
              populate: ["project", "assignee", "createdBy"],
            })
            .catch(() => ({ data: [] })),
          projectService
            .getAllProjects({
              pageSize: 100,
            })
            .catch(() => ({ data: [] })),
        ]);

        const transformedTasks = (tasksResponse.data || [])
          .map(transformTask)
          .filter((task) => {
            const hasCRMRelation = !!(
              task.leadCompany ||
              task.clientAccount ||
              task.contact ||
              task.deal
            );
            return !hasCRMRelation;
          });

        // Only update if data changed
        setTasks((prev) => {
          if (prev.length !== transformedTasks.length) {
            return transformedTasks;
          }
          return prev;
        });

        setProjects((prev) => {
          if (prev.length !== (projectsResponse.data?.length || 0)) {
            return projectsResponse.data || [];
          }
          return prev;
        });

        // Update stats
        const now = new Date();
        const assignedTasks = transformedTasks.filter((t) => t.assignee).length;
        const completedTasks = transformedTasks.filter(
          (t) =>
            t.status?.toLowerCase() === "done" ||
            t.status?.toLowerCase() === "completed"
        ).length;
        const overdueTasks = transformedTasks.filter(
          (t) =>
            t.scheduledDate &&
            new Date(t.scheduledDate) < now &&
            t.status?.toLowerCase() !== "done" &&
            t.status?.toLowerCase() !== "completed"
        ).length;

        setStats((prev) => {
          const newStats = {
            totalProjects: projectsResponse.data?.length || 0,
            totalTasks: transformedTasks.length,
            assignedTasks,
            completedTasks,
            overdueTasks,
          };

          // Only update previous stats if current stats changed
          if (
            prev.totalTasks !== newStats.totalTasks ||
            prev.completedTasks !== newStats.completedTasks
          ) {
            setPreviousStats({ ...prev });
          }

          return newStats;
        });
      } catch (error) {
        console.error("Error polling analytics data:", error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [authLoading, loading]);

  if (authLoading || loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <PageHeader
            title="Analytics"
            subtitle="Analyze and manage your projects and tasks"
            breadcrumb={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Analytics", href: "/analytics" },
            ]}
            showSearch={false}
            showActions={false}
          />
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="p-4 space-y-4">
        {/* Page Header */}
        <PageHeader
          title="Analytics"
          subtitle="Analyze and manage your projects and tasks"
          breadcrumb={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Analytics", href: "/analytics" },
          ]}
          showSearch={false}
          showActions={false}
        />

        <div className="space-y-4">
          {/* Key Metrics Cards */}
          <KeyMetricsCards stats={stats} previousStats={previousStats} />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Row */}
            <UpcomingTasksByStatus tasks={tasks} />
            <TasksByProject tasks={tasks} projects={projects} />

            {/* Bottom Row */}
            <TaskByAssignee tasks={tasks} />
            <TaskCompletionOverTime tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
