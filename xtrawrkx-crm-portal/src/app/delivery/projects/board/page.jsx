"use client";

import React, { useState } from "react";
import KanbanBoard from "../../../../components/kanban/KanbanBoard";
import { Card, Avatar, Badge } from "../../../../components/ui";
// import { formatDate } from '@xtrawrkx/utils';

// Local utility function to replace @xtrawrkx/utils formatDate
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
import { Calendar, Users, Clock } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import { ProjectFilterModal } from "../../../../components/projects";

export default function ProjectsBoardPage() {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    client: "",
    priority: "",
    health: "",
    minBudget: "",
    maxBudget: "",
  });

  // Projects data in the new format
  const projectsData = {
    planning: [
      {
        id: "p1",
        name: "E-commerce Platform Redesign",
        client: "RetailCorp",
        progress: 15,
        health: "On Track",
        status: "planning",
        priority: "high",
        manager: "Sarah Johnson",
        teamSize: 5,
        dueDate: "2024-03-15",
        estimatedHours: 120,
      },
      {
        id: "p2",
        name: "Mobile App Development",
        client: "StartupXYZ",
        progress: 5,
        health: "At Risk",
        status: "planning",
        priority: "medium",
        manager: "Mike Chen",
        teamSize: 3,
        dueDate: "2024-04-01",
        estimatedHours: 200,
      },
    ],
    "in-progress": [
      {
        id: "p3",
        name: "CRM Integration Project",
        client: "TechCorp",
        progress: 65,
        health: "On Track",
        status: "in-progress",
        priority: "high",
        manager: "John Smith",
        teamSize: 4,
        dueDate: "2024-02-28",
        estimatedHours: 80,
      },
      {
        id: "p4",
        name: "Website Migration",
        client: "Global Solutions",
        progress: 45,
        health: "On Track",
        status: "in-progress",
        priority: "medium",
        manager: "Jane Doe",
        teamSize: 2,
        dueDate: "2024-02-15",
        estimatedHours: 60,
      },
    ],
    review: [
      {
        id: "p5",
        name: "Analytics Dashboard",
        client: "DataCorp",
        progress: 90,
        health: "On Track",
        status: "review",
        priority: "low",
        manager: "Alex Wilson",
        teamSize: 3,
        dueDate: "2024-01-30",
        estimatedHours: 40,
      },
    ],
    completed: [
      {
        id: "p6",
        name: "Brand Identity Package",
        client: "CreativeCo",
        progress: 100,
        health: "On Track",
        status: "completed",
        priority: "medium",
        manager: "Lisa Brown",
        teamSize: 2,
        dueDate: "2024-01-15",
        estimatedHours: 30,
      },
    ],
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle drag end - update project status
  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Find the dragged project
    const sourceProjects = projectsData[source.droppableId];
    const draggedProject = sourceProjects.find(
      (project) => project.id.toString() === draggableId
    );

    if (draggedProject) {
    }
  };

  const handleProjectClick = (project) => {
    // Navigate to project detail page
  };

  // Render individual project card
  const renderProjectCard = (project) => {
    const getStatusColor = (status) => {
      switch (status) {
        case "planning":
          return "bg-gray-100 text-gray-800";
        case "in-progress":
          return "bg-blue-100 text-blue-800";
        case "review":
          return "bg-yellow-100 text-yellow-800";
        case "completed":
          return "bg-green-100 text-green-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getPriorityColor = (priority) => {
      switch (priority) {
        case "high":
          return "bg-red-100 text-red-800";
        case "medium":
          return "bg-yellow-100 text-yellow-800";
        case "low":
          return "bg-green-100 text-green-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <Card
        className="p-4 cursor-move bg-white border border-gray-200 hover:shadow-md transition-all"
        onClick={() => handleProjectClick(project)}
      >
        {/* Project Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate mb-1">
              {project?.name || "Unknown"}
            </h4>
            <p className="text-sm text-gray-600 truncate">
              {project?.client || "N/A"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {project?.progress || 0}%
            </div>
            <div className="text-xs text-gray-500">
              {project?.health || "N/A"}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project?.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Manager:</span>
            <span className="font-medium text-gray-900">
              {project?.manager || "N/A"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Team:</span>
            <span className="font-medium text-gray-900">
              {project?.teamSize || 0} members
            </span>
          </div>

          {project?.dueDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Due:</span>
              <span className="font-medium text-gray-900">
                {formatDate(project.dueDate)}
              </span>
            </div>
          )}
        </div>

        {/* Status and Tags */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                project?.status
              )}`}
            >
              {project?.status || "N/A"}
            </span>
            {project?.priority && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                  project.priority
                )}`}
              >
                {project.priority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{project?.estimatedHours || 0}h</span>
          </div>
        </div>
      </Card>
    );
  };

  // Render column headers
  const renderColumnHeader = (columnId, cardsCount) => {
    const columnConfig = {
      planning: {
        title: "Planning",
        color: "border-yellow-500",
        bg: "bg-yellow-50",
      },
      "in-progress": {
        title: "In Progress",
        color: "border-blue-500",
        bg: "bg-blue-50",
      },
      review: {
        title: "Review",
        color: "border-purple-500",
        bg: "bg-purple-50",
      },
      completed: {
        title: "Completed",
        color: "border-green-500",
        bg: "bg-green-50",
      },
    };

    const config = columnConfig[columnId] || {
      title: columnId,
      color: "border-gray-500",
      bg: "bg-gray-50",
    };

    return (
      <div
        className={`${config.bg} rounded-lg p-4 mb-4 border-l-4 ${config.color}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">
            {config.title}
          </h3>
          <span className="bg-white text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
            {cardsCount}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects Board"
        subtitle="Visualize and manage your project workflows"
        breadcrumbs={["Dashboard", "Delivery", "Projects", "Board"]}
        actions={["filter"]}
        searchPlaceholder="Search projects..."
        onFilter={() => setIsFilterModalOpen(true)}
      />

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Active Projects</div>
          <div className="text-2xl font-bold text-gray-900">6</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Team Members</div>
          <div className="text-2xl font-bold text-gray-900">19</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Progress</div>
          <div className="text-2xl font-bold text-gray-900">53%</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">On Track</div>
          <div className="text-2xl font-bold text-gray-900">5/6</div>
        </div>
      </div>

      {/* Projects Board */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-hidden">
        <div className="w-full overflow-x-auto">
          <KanbanBoard
            columns={projectsData}
            onDragEnd={handleDragEnd}
            renderCard={renderProjectCard}
            renderColumnHeader={renderColumnHeader}
            className="min-w-[1600px]"
          />
        </div>
      </div>

      {/* Filter Modal */}
      <ProjectFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
