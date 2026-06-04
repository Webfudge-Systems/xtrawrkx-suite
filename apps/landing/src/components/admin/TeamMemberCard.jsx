import { Icon } from "@iconify/react";

export default function TeamMemberCard({
  member,
  onEdit,
  onDelete,
  onToggleStatus,
  onDuplicate,
  onSelect,
  selected = false,
  disabled = false,
}) {
  const getCategoryColor = (category) => {
    return category === "core" ? "bg-purple-500" : "bg-blue-500";
  };

  const getStatusColor = (isActive) => {
    return isActive ? "bg-green-500" : "bg-red-500";
  };

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-300 ${
        selected ? "border-primary shadow-primary/20" : "border-gray-200"
      }`}
    >
      {/* Selection Checkbox - positioned absolutely in top left */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-20">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(member.id)}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer bg-white shadow-md"
            style={{ accentColor: "#6366f1" }}
          />
        </div>
      )}

      {/* Hero Image */}
      <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
        <img
          src={member.img}
          alt={member.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Category Badge - top left */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(
              member.category
            )}`}
          >
            {member.category === "core" ? "Core Team" : "Employee"}
          </span>
        </div>

        {/* Status Badge - top right */}
        <div className="absolute top-10 right-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
              member.isActive
            )}`}
          >
            {member.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Member Name & Title */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {member.name}
          </h3>
          <p className="text-sm text-gray-600 font-medium">{member.title}</p>
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4">
          {/* Location */}
          {member.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon icon="solar:map-point-bold" width={16} />
              {member.location}
            </div>
          )}

          {/* Join Date */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Icon icon="solar:calendar-bold" width={16} />
            Joined {new Date(member.joinDate).toLocaleDateString()}
          </div>

          {/* Email */}
          {member.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Icon icon="solar:letter-bold" width={16} />
              {member.email}
            </div>
          )}
        </div>

        {/* Bio */}
        {member.bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {member.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(member)}
            disabled={disabled}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Icon icon="solar:pen-bold" width={14} />
            Edit
          </button>

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(member)}
              disabled={disabled}
              className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Duplicate"
            >
              <Icon icon="mdi:content-copy" width={16} />
            </button>
          )}

          <button
            onClick={() => onDelete(member.id)}
            disabled={disabled}
            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="Delete"
          >
            <Icon icon="mdi:delete" width={16} />
          </button>
        </div>

        {/* Social Links */}
        {member.linkedin && member.linkedin !== "#" && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-600 transition-colors"
              title="LinkedIn"
            >
              <Icon icon="solar:linkedin-bold" width={18} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
