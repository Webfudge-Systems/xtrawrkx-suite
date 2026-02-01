"use client";

import { useState } from "react";
import { Card, Badge, Avatar } from "../../components/ui";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Calendar, Users, DollarSign, Target, Clock, Plus } from "lucide-react";
import KanbanBoard from "../kanban/KanbanBoard";

// Custom Project Card Component
function ProjectCard({ item, onClick, draggableProps = {} }) {
  const project = item;

  const getHealthColor = (health) => {
    switch (health) {
      case "Excellent": return "text-green-600 bg-green-100";
      case "Good": return "text-blue-600 bg-blue-100";
      case "At Risk": return "text-yellow-600 bg-yellow-100";
      case "Critical": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical": return "text-red-600 bg-red-100";
      case "High": return "text-orange-600 bg-orange-100";
      case "Medium": return "text-yellow-600 bg-yellow-100";
      case "Low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card
      className="p-4 cursor-move hover:shadow-md transition-all duration-200"
      {...draggableProps}
      onClick={() => onClick?.(project)}
    >
      {/* Project Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate mb-1">
            {project.name}
          </h4>
          <p className="text-sm text-gray-600 truncate">
            {project.client}
          </p>
        </div>
        <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
          {project.priority}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* Project Details */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-4 h-4" />
          <span>{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(project.endDate)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Target className="w-4 h-4" />
          <span>{project.tasks.completed}/{project.tasks.total} tasks</span>
        </div>
      </div>

      {/* Health Status */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Badge className={`text-xs ${getHealthColor(project.health)}`}>
            {project.health}
          </Badge>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-600">{project.team.length}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ProjectKanbanView({ projects, onProjectMove, onAddProject }) {
  // Transform projects into kanban columns
  const getKanbanColumns = () => {
    const stages = [
      { id: "planning", name: "Planning", color: "#3b82f6" },
      { id: "development", name: "Development", color: "#eab308" },
      { id: "testing", name: "Testing", color: "#8b5cf6" },
      { id: "deployment", name: "Deployment", color: "#f97316" },
      { id: "completed", name: "Completed", color: "#22c55e" }
    ];

    return stages.map(stage => ({
      id: stage.id,
      title: stage.name,
      color: stage.color,
      items: projects.filter(project => project.stage === stage.id).map(project => ({
        ...project,
        id: project.id.toString(),
        title: project.name,
        description: project.client,
      }))
    }));
  };

  const handleItemDrop = (draggedItem, destinationColumnId, destinationIndex, sourceColumnId, sourceIndex) => {
    if (onProjectMove) {
      onProjectMove(draggedItem, destinationColumnId);
    }
  };

  const handleItemClick = (item) => {
  };

  const handleColumnClick = (column) => {
    if (onAddProject) {
      onAddProject(column.id);
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-4 -ml-6 pl-6">
        <KanbanBoard
          initialColumns={getKanbanColumns()}
          onItemDrop={handleItemDrop}
          onItemClick={handleItemClick}
          onColumnClick={handleColumnClick}
          cardComponent={ProjectCard}
          showColumnStats={true}
          className="min-w-max gap-4"
        />
      </div>
    </div>
  );
}