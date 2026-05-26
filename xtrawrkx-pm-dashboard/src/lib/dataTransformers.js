// Data transformation layer for mapping Strapi responses to frontend format
// Handles status enum differences, date formatting, and data structure mapping

import { getStatusLabel, getStrapiStatus } from './taskStatusConstants';

/**
 * Transform Strapi status to frontend status label
 * @param {string} strapiStatus - Strapi status enum
 * @returns {string} - Frontend status label
 */
export const transformStatus = (strapiStatus) => {
    if (!strapiStatus) return 'Assigned';

    const projectStatusMap = {
        'PLANNING': 'Planning',
        'ACTIVE': 'Active',
        'ON_HOLD': 'On Hold',
    };

    const upperStatus = String(strapiStatus).toUpperCase().replace(/\s+/g, '_');
    if (projectStatusMap[upperStatus]) {
        return projectStatusMap[upperStatus];
    }

    return getStatusLabel(strapiStatus);
};

/**
 * Transform Strapi project status to frontend status
 * @param {string} strapiStatus - Strapi project status enum
 * @returns {string} - Frontend project status
 */
export const transformProjectStatus = (strapiStatus) => {
    const statusMap = {
        'PLANNING': 'Planning',
        'ACTIVE': 'Active',
        'IN_PROGRESS': 'In Progress',
        'COMPLETED': 'Completed',
        'ON_HOLD': 'On Hold',
        'CANCELLED': 'Cancelled'
    };

    return statusMap[strapiStatus] || strapiStatus || 'Planning';
};

/**
 * Transform frontend status to Strapi status
 * @param {string} frontendStatus - Frontend status
 * @returns {string} - Strapi status enum
 */
export const transformStatusToStrapi = (frontendStatus) => {
    if (!frontendStatus) return 'ASSIGNED';

    const projectStatusMap = {
        'Planning': 'PLANNING',
        'Active': 'ACTIVE',
        'On Hold': 'ON_HOLD',
    };

    if (projectStatusMap[frontendStatus]) {
        return projectStatusMap[frontendStatus];
    }

    return getStrapiStatus(frontendStatus);
};

/**
 * Transform Strapi priority to frontend priority
 * @param {string} strapiPriority - Strapi priority enum
 * @returns {string} - Frontend priority
 */
export const transformPriority = (strapiPriority) => {
    const priorityMap = {
        'LOW': 'low',
        'MEDIUM': 'medium',
        'HIGH': 'high'
    };

    return priorityMap[strapiPriority] || strapiPriority?.toLowerCase();
};

/**
 * Transform frontend priority to Strapi priority
 * @param {string} frontendPriority - Frontend priority
 * @returns {string} - Strapi priority enum
 */
export const transformPriorityToStrapi = (frontendPriority) => {
    if (!frontendPriority) return 'MEDIUM';

    // Normalize to lowercase first for consistent matching
    const normalized = String(frontendPriority).toLowerCase().trim();

    const priorityMap = {
        'low': 'LOW',
        'medium': 'MEDIUM',
        'high': 'HIGH'
    };

    // Check map with normalized value first
    if (priorityMap[normalized]) {
        return priorityMap[normalized];
    }

    // Fallback: try original value (for capitalized versions)
    const original = String(frontendPriority).trim();
    if (priorityMap[original.toLowerCase()]) {
        return priorityMap[original.toLowerCase()];
    }

    // Final fallback: uppercase the normalized value or default to MEDIUM
    return normalized.toUpperCase() || 'MEDIUM';
};

/**
 * Format date for frontend display
 * @param {string} dateString - ISO date string
 * @param {Object} options - Formatting options
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const {
        format = 'short', // 'short', 'long', 'relative'
        includeTime = false
    } = options;

    if (format === 'relative') {
        return formatRelativeDate(date);
    }

    const dateOptions = {
        year: format === 'long' ? 'numeric' : '2-digit',
        month: format === 'long' ? 'long' : 'short',
        day: 'numeric'
    };

    if (includeTime) {
        dateOptions.hour = '2-digit';
        dateOptions.minute = '2-digit';
    }

    return date.toLocaleDateString('en-US', dateOptions);
};

/**
 * Format relative date (e.g., "2 days ago", "in 3 hours")
 * @param {Date} date - Date object
 * @returns {string} - Relative date string
 */
export const formatRelativeDate = (date) => {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (Math.abs(diffMinutes) < 60) {
        if (diffMinutes === 0) return 'now';
        return diffMinutes > 0 ? `in ${diffMinutes} min` : `${Math.abs(diffMinutes)} min ago`;
    } else if (Math.abs(diffHours) < 24) {
        return diffHours > 0 ? `in ${diffHours} hours` : `${Math.abs(diffHours)} hours ago`;
    } else if (Math.abs(diffDays) < 7) {
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'tomorrow';
        if (diffDays === -1) return 'yesterday';
        return diffDays > 0 ? `in ${diffDays} days` : `${Math.abs(diffDays)} days ago`;
    } else {
        const weeks = Math.ceil(Math.abs(diffDays) / 7);
        return diffDays > 0 ? `in ${weeks} weeks` : `${weeks} weeks ago`;
    }
};

/**
 * Transform Strapi user to frontend format
 * @param {Object} strapiUser - Strapi user object
 * @returns {Object} - Frontend user object
 */
export const transformUser = (strapiUser) => {
    if (!strapiUser) return null;

    // Handle case where strapiUser might be just an ID
    if (typeof strapiUser === 'number' || typeof strapiUser === 'string') {
        return null; // Can't transform just an ID without full user data
    }

    // Handle Strapi v4 attributes format
    const userData = strapiUser.attributes || strapiUser;

    // Extract ID - handle both documentId and id
    const userId = strapiUser.id || strapiUser.documentId || userData.id || userData.documentId;

    if (!userId) {
        console.warn('transformUser: No ID found for user:', strapiUser);
        return null;
    }

    // Handle case where user data might be minimal
    const firstName = userData.firstName || '';
    const lastName = userData.lastName || '';
    const name = userData.name ||
        `${firstName} ${lastName}`.trim() ||
        userData.username ||
        userData.email ||
        'Unknown User';

    return {
        id: userId,
        _id: userId, // For backward compatibility
        name: name,
        firstName: firstName,
        lastName: lastName,
        email: userData.email,
        avatar: userData.avatar?.url || userData.avatar || null,
        initials: getInitials(firstName, lastName) || name.charAt(0).toUpperCase(),
        color: getUserColor(userId),
        role: userData.primaryRole?.name || userData.role?.name || userData.role || 'User',
        isActive: userData.isActive !== undefined ? userData.isActive : true
    };
};

/**
 * Get user initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} - User initials
 */
export const getInitials = (firstName, lastName) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '??';
};

/**
 * Get consistent color for user based on ID
 * @param {number} userId - User ID
 * @returns {string} - CSS color class
 */
export const getUserColor = (userId) => {
    const colors = [
        'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
        'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-teal-500',
        'bg-orange-500', 'bg-cyan-500'
    ];

    return colors[userId % colors.length];
};

/**
 * Transform Strapi project to frontend format
 * @param {Object} strapiProject - Strapi project object
 * @returns {Object} - Frontend project object
 */
export const transformProject = (strapiProject) => {
    if (!strapiProject) return null;

    // Handle both Strapi v4 attributes format and direct format
    const projectData = strapiProject.attributes || strapiProject;

    // Extract clientAccount - handle different possible structures
    let clientAccount = null;
    if (projectData.clientAccount) {
        const clientAccountData = projectData.clientAccount.attributes || projectData.clientAccount;
        clientAccount = {
            id: clientAccountData?.id || projectData.clientAccount.id || projectData.clientAccount.documentId,
            companyName: clientAccountData?.companyName || clientAccountData?.name,
            industry: clientAccountData?.industry,
            website: clientAccountData?.website,
            email: clientAccountData?.email,
            phone: clientAccountData?.phone,
            companyType: clientAccountData?.companyType,
            subType: clientAccountData?.subType,
            ...clientAccountData
        };
    }

    return {
        id: strapiProject.id,
        documentId: strapiProject.documentId || projectData.documentId,
        name: projectData.name || strapiProject.name,
        slug: projectData.slug || strapiProject.slug,
        description: projectData.description || strapiProject.description,
        status: transformProjectStatus(projectData.status || strapiProject.status),
        startDate: formatDate(projectData.startDate || strapiProject.startDate),
        endDate: formatDate(projectData.endDate || strapiProject.endDate),
        budget: projectData.budget || strapiProject.budget,
        spent: projectData.spent || strapiProject.spent,
        color: projectData.color || strapiProject.color || 'from-blue-400 to-blue-600',
        icon: projectData.icon || strapiProject.icon || projectData.name?.charAt(0)?.toUpperCase() || 'P',
        progress: calculateProjectProgress(strapiProject),
        projectManager: transformUser(projectData.projectManager || strapiProject.projectManager),
        teamMembers: (projectData.teamMembers || strapiProject.teamMembers)?.map(transformUser) || [],
        tasks: (projectData.tasks || strapiProject.tasks)?.map(transformTask) || [],
        clientAccount: clientAccount,
        account: projectData.account || strapiProject.account,
        deal: projectData.deal || strapiProject.deal,
        // Additional computed fields
        tasksCount: (projectData.tasks || strapiProject.tasks)?.length || 0,
        bgColor: getProjectBgColor(projectData.name || strapiProject.name),
        textColor: getProjectTextColor(projectData.name || strapiProject.name)
    };
};

/**
 * Calculate project progress from tasks
 * @param {Object} strapiProject - Strapi project object
 * @returns {number} - Progress percentage
 */
export const calculateProjectProgress = (strapiProject) => {
    const tasks = strapiProject.tasks || [];
    if (tasks.length === 0) return 0;

    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress || 0), 0);
    return Math.round(totalProgress / tasks.length);
};

/**
 * Get project background color based on name
 * @param {string} projectName - Project name
 * @returns {string} - CSS background color class
 */
export const getProjectBgColor = (projectName) => {
    const colorMap = {
        'Yellow Branding': 'bg-blue-100',
        'Mogo Web Design': 'bg-yellow-100',
        'Futurework': 'bg-blue-100',
        'Resto Dashboard': 'bg-pink-100',
        'Hajime Illustration': 'bg-green-100',
        'Carl UI/UX': 'bg-orange-100',
        'Fitness App Design': 'bg-purple-100'
    };

    return colorMap[projectName] || 'bg-gray-100';
};

/**
 * Get project text color based on name
 * @param {string} projectName - Project name
 * @returns {string} - CSS text color class
 */
export const getProjectTextColor = (projectName) => {
    const colorMap = {
        'Yellow Branding': 'text-blue-800',
        'Mogo Web Design': 'text-yellow-800',
        'Futurework': 'text-blue-800',
        'Resto Dashboard': 'text-pink-800',
        'Hajime Illustration': 'text-green-800',
        'Carl UI/UX': 'text-orange-800',
        'Fitness App Design': 'text-purple-800'
    };

    return colorMap[projectName] || 'text-gray-800';
};

/**
 * Transform Strapi task to frontend format
 * @param {Object} strapiTask - Strapi task object
 * @returns {Object} - Frontend task object
 */
export const transformTask = (strapiTask) => {
    if (!strapiTask) return null;

    // Handle Strapi v4 attributes format
    const taskData = strapiTask.attributes || strapiTask;
    
    // Extract createdAt and updatedAt from both possible locations
    const createdAt = strapiTask.createdAt || taskData.createdAt || strapiTask.created_at || taskData.created_at;
    const updatedAt = strapiTask.updatedAt || taskData.updatedAt || strapiTask.updated_at || taskData.updated_at;

    return {
        id: strapiTask.id,
        name: taskData.title || strapiTask.title, // Map title to name for frontend compatibility
        title: taskData.title || strapiTask.title,
        description: taskData.description || strapiTask.description,
        status: transformStatus(taskData.status || strapiTask.status),
        priority: transformPriority(taskData.priority || strapiTask.priority),
        dueDate: formatDate(taskData.scheduledDate || strapiTask.scheduledDate),
        scheduledDate: taskData.scheduledDate || strapiTask.scheduledDate,
        completedDate: taskData.completedDate || strapiTask.completedDate,
        progress: taskData.progress || strapiTask.progress || 0,
        tags: taskData.tags || strapiTask.tags || [],
        isSharedWithClient: !!(taskData.isSharedWithClient ?? strapiTask.isSharedWithClient),
        sharePreferenceSetAtCreation: !!(taskData.sharePreferenceSetAtCreation ?? strapiTask.sharePreferenceSetAtCreation),
        timeAllotted: taskData.timeAllotted ?? strapiTask.timeAllotted ?? null,
        autoAccept: taskData.autoAccept ?? strapiTask.autoAccept ?? false,
        clientId: taskData.clientId || strapiTask.clientId || null,
        createdBySource: taskData.createdBySource || strapiTask.createdBySource || 'internal',
        createdAt: createdAt,
        updatedAt: updatedAt,
        // Relations
        projects: (taskData.projects || strapiTask.projects || (taskData.project || strapiTask.project ? [taskData.project || strapiTask.project] : [])).map(transformProject).filter(Boolean),
        // Backward compatibility: keep project as first project for components that still reference it
        project: transformProject(taskData.projects?.[0] || strapiTask.projects?.[0] || taskData.project || strapiTask.project),
        assignee: transformUser(taskData.assignee || strapiTask.assignee),
        assigneeId: (taskData.assignee || strapiTask.assignee)?.id,
        createdBy: transformUser(taskData.createdBy || strapiTask.createdBy),
        collaborators: (taskData.collaborators || strapiTask.collaborators || [])?.map(transformUser) || [],
        subtasks: (taskData.subtasks || strapiTask.subtasks || [])?.map(transformSubtask) || [],
        // Additional computed fields
        time: (taskData.scheduledDate || strapiTask.scheduledDate) ? formatDate(taskData.scheduledDate || strapiTask.scheduledDate, { includeTime: true }) : null,
        hasMultipleAssignees: ((taskData.collaborators || strapiTask.collaborators)?.length || 0) > 1 || false,
        borderColor: getTaskBorderColor((taskData.projects?.[0] || strapiTask.projects?.[0] || taskData.project || strapiTask.project)?.name)
    };
};

/**
 * Transform Strapi subtask to frontend format
 * @param {Object} strapiSubtask - Strapi subtask object
 * @returns {Object} - Frontend subtask object
 */
export const transformSubtask = (strapiSubtask) => {
    if (!strapiSubtask) return null;

    // Handle Strapi v4 attributes format
    const subtaskData = strapiSubtask.attributes || strapiSubtask;
    
    // Extract assignee - handle both direct object and nested formats
    // Check multiple possible locations for assignee data
    let assigneeData = strapiSubtask.assignee || subtaskData.assignee;
    
    // Handle Strapi relation format (data wrapper)
    if (assigneeData?.data) {
      assigneeData = assigneeData.data;
    }
    // Handle array format (sometimes Strapi returns arrays)
    if (Array.isArray(assigneeData) && assigneeData.length > 0) {
      assigneeData = assigneeData[0];
    }
    
    let transformedAssignee = null;
    
    // Handle assignee in different formats
    if (assigneeData) {
      // If it's already an object with id, use transformUser
      if (typeof assigneeData === 'object' && assigneeData !== null && (assigneeData.id || assigneeData.documentId)) {
        transformedAssignee = transformUser(assigneeData);
      } 
      // If it's just an ID, we can't transform it without full data
      else if (typeof assigneeData === 'number' || typeof assigneeData === 'string') {
        // Keep as ID for now - will need to be populated separately
        transformedAssignee = null;
      }
    }

    // Extract assignee ID safely
    let assigneeIdValue = null;
    if (assigneeData) {
      if (typeof assigneeData === 'object' && assigneeData !== null) {
        assigneeIdValue = assigneeData.id || assigneeData.documentId;
      } else if (typeof assigneeData === 'number' || typeof assigneeData === 'string') {
        assigneeIdValue = assigneeData;
      }
    }

    // Extract collaborators - handle both direct object and nested formats
    let collaboratorsData = strapiSubtask.collaborators || subtaskData.collaborators;
    
    // Handle Strapi relation format (data wrapper or array)
    if (collaboratorsData?.data) {
      collaboratorsData = Array.isArray(collaboratorsData.data) ? collaboratorsData.data : [collaboratorsData.data];
    } else if (!Array.isArray(collaboratorsData)) {
      collaboratorsData = collaboratorsData ? [collaboratorsData] : [];
    }
    
    const transformedCollaborators = (collaboratorsData || [])
      .filter(c => c !== null && c !== undefined)
      .map(transformUser)
      .filter(Boolean);

    // Extract createdAt and updatedAt from both possible locations
    const createdAt = strapiSubtask.createdAt || subtaskData.createdAt || strapiSubtask.created_at || subtaskData.created_at;
    const updatedAt = strapiSubtask.updatedAt || subtaskData.updatedAt || strapiSubtask.updated_at || subtaskData.updated_at;

    return {
        id: strapiSubtask.id,
        name: subtaskData.title || strapiSubtask.title,
        title: subtaskData.title || strapiSubtask.title,
        description: subtaskData.description || strapiSubtask.description,
        status: transformStatus(subtaskData.status || strapiSubtask.status),
        priority: transformPriority(subtaskData.priority || strapiSubtask.priority),
        dueDate: formatDate(subtaskData.dueDate || strapiSubtask.dueDate),
        progress: subtaskData.progress || strapiSubtask.progress || 0,
        depth: subtaskData.depth || strapiSubtask.depth || 0,
        order: subtaskData.order || strapiSubtask.order || 0,
        createdAt: createdAt,
        updatedAt: updatedAt,
        // Relations
        task: transformTask(subtaskData.task || strapiSubtask.task),
        assignee: transformedAssignee || transformUser(assigneeData),
        assigneeId: assigneeIdValue,
        collaborators: transformedCollaborators,
        parentSubtask: (subtaskData.parentSubtask || strapiSubtask.parentSubtask) ? transformSubtask(subtaskData.parentSubtask || strapiSubtask.parentSubtask) : null,
        childSubtasks: (subtaskData.childSubtasks || strapiSubtask.childSubtasks || [])?.map(transformSubtask) || [],
        subtasks: (subtaskData.childSubtasks || strapiSubtask.childSubtasks || [])?.map(transformSubtask) || [] // Alias for compatibility
    };
};

/**
 * Transform Strapi comment to frontend format
 * @param {Object} strapiComment - Strapi comment object
 * @returns {Object} - Frontend comment object
 */
export const transformComment = (strapiComment) => {
    if (!strapiComment) return null;

    return {
        id: strapiComment.id,
        content: strapiComment.content,
        commentableType: strapiComment.commentableType,
        commentableId: strapiComment.commentableId,
        mentions: strapiComment.mentions || [],
        // Relations
        user: transformUser(strapiComment.user),
        author: strapiComment.user ? `${strapiComment.user.firstName} ${strapiComment.user.lastName}`.trim() : 'Unknown',
        authorId: strapiComment.user?.id,
        parentComment: strapiComment.parentComment ? transformComment(strapiComment.parentComment) : null,
        replies: strapiComment.replies?.map(transformComment) || [],
        // Additional fields
        timestamp: formatDate(strapiComment.createdAt, { format: 'relative' }),
        hasProfilePic: !!strapiComment.user?.avatar,
        type: strapiComment.parentComment ? 'reply' : 'comment'
    };
};

/**
 * Get task border color based on project
 * @param {string} projectName - Project name
 * @returns {string} - CSS border color class
 */
export const getTaskBorderColor = (projectName) => {
    const colorMap = {
        'Yellow Branding': 'border-blue-400',
        'Mogo Web Design': 'border-green-400',
        'Futurework': 'border-purple-400',
        'Resto Dashboard': 'border-pink-400',
        'Hajime Illustration': 'border-green-400',
        'Carl UI/UX': 'border-orange-400',
        'Fitness App Design': 'border-purple-400'
    };

    return colorMap[projectName] || 'border-gray-400';
};

/**
 * Transform array of Strapi items to frontend format
 * @param {Array} items - Array of Strapi items
 * @param {Function} transformer - Transformer function
 * @returns {Array} - Array of transformed items
 */
export const transformArray = (items, transformer) => {
    if (!Array.isArray(items)) return [];
    return items.map(transformer).filter(Boolean);
};

/**
 * Transform Strapi pagination to frontend format
 * @param {Object} strapiPagination - Strapi pagination object
 * @returns {Object} - Frontend pagination object
 */
export const transformPagination = (strapiPagination) => {
    if (!strapiPagination) return null;

    return {
        page: strapiPagination.page,
        pageSize: strapiPagination.pageSize,
        pageCount: strapiPagination.pageCount,
        total: strapiPagination.total,
        hasNextPage: strapiPagination.page < strapiPagination.pageCount,
        hasPrevPage: strapiPagination.page > 1
    };
};

/**
 * Build hierarchical tree from flat array of items with parent-child relationships
 * @param {Array} items - Flat array of items
 * @param {string} parentKey - Key for parent reference (default: 'parentId')
 * @param {string} childrenKey - Key for children array (default: 'children')
 * @returns {Array} - Hierarchical tree structure
 */
export const buildHierarchy = (items, parentKey = 'parentId', childrenKey = 'children') => {
    if (!Array.isArray(items)) return [];

    const itemMap = new Map();
    const rootItems = [];

    // First pass: create map and identify roots
    items.forEach(item => {
        itemMap.set(item.id, { ...item, [childrenKey]: [] });
        if (!item[parentKey]) {
            rootItems.push(item.id);
        }
    });

    // Second pass: build parent-child relationships
    items.forEach(item => {
        if (item[parentKey]) {
            const parent = itemMap.get(item[parentKey]);
            if (parent) {
                parent[childrenKey].push(itemMap.get(item.id));
            }
        }
    });

    // Return root items with their hierarchies
    return rootItems.map(id => itemMap.get(id)).filter(Boolean);
};

/**
 * Flatten hierarchical tree to flat array
 * @param {Array} tree - Hierarchical tree
 * @param {string} childrenKey - Key for children array (default: 'children')
 * @returns {Array} - Flat array of items
 */
export const flattenHierarchy = (tree, childrenKey = 'children') => {
    if (!Array.isArray(tree)) return [];

    const result = [];

    const flatten = (items) => {
        items.forEach(item => {
            const { [childrenKey]: children, ...itemWithoutChildren } = item;
            result.push(itemWithoutChildren);

            if (children && children.length > 0) {
                flatten(children);
            }
        });
    };

    flatten(tree);
    return result;
};

// Export all transformers as default object
export default {
    transformStatus,
    transformProjectStatus,
    transformStatusToStrapi,
    transformPriority,
    transformPriorityToStrapi,
    formatDate,
    formatRelativeDate,
    transformUser,
    transformProject,
    transformTask,
    transformSubtask,
    transformComment,
    transformArray,
    transformPagination,
    buildHierarchy,
    flattenHierarchy,
    calculateProjectProgress,
    getInitials,
    getUserColor,
    getProjectBgColor,
    getProjectTextColor,
    getTaskBorderColor
};
