/**
 * @fileoverview TypeScript-style type definitions for the Client Portal
 * Using JSDoc for type annotations in JavaScript
 */

/**
 * @typedef {string} ID - Unique identifier
 * @typedef {string} ISODate - ISO date string
 */

// Enums as string unions
export const Role = {
    CLIENT: 'CLIENT',
    INTERNAL: 'INTERNAL',
    ADMIN: 'ADMIN'
};

export const ProjectStatus = {
    ACTIVE: 'ACTIVE',
    ON_HOLD: 'ON_HOLD',
    COMPLETED: 'COMPLETED',
    ARCHIVED: 'ARCHIVED'
};

export const TaskStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    BLOCKED: 'BLOCKED',
    DONE: 'DONE',
    CANCELED: 'CANCELED'
};

export const TaskSource = {
    CLIENT_PORTAL: 'CLIENT_PORTAL',
    INTERNAL_PM: 'INTERNAL_PM',
    IMPORT: 'IMPORT',
    API: 'API'
};

export const MembershipStatus = {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    CANCELED: 'CANCELED'
};

export const CommunityTier = {
    X0: 'X0',
    X1: 'X1',
    X2: 'X2',
    X3: 'X3',
    X4: 'X4',
    X5: 'X5'
};

/**
 * @typedef {Object} UserDTO
 * @property {ID} id
 * @property {string} [name]
 * @property {string} email
 * @property {string} role - Role enum value
 * @property {string} [avatarUrl]
 * @property {ISODate} [createdAt]
 */

/**
 * @typedef {Object} CommunityDTO  
 * @property {ID} id
 * @property {string} name
 * @property {string} slug
 * @property {string} [category]
 * @property {number} [membersCount]
 * @property {string[]} [keyFeatures]
 * @property {string} [meetingSchedule]
 * @property {string} [joinProcess]
 * @property {string} [description]
 * @property {string} [icon]
 * @property {string} [color]
 * @property {boolean} [freeTier]
 */

/**
 * @typedef {Object} CommunityMembershipDTO
 * @property {ID} id
 * @property {ID} userId
 * @property {ID} communityId
 * @property {string} communitySlug
 * @property {string} [tier] - CommunityTier enum value
 * @property {ISODate} joinedAt
 * @property {string} status - MembershipStatus enum value
 * @property {boolean} [canUpgrade]
 * @property {string} [nextTier]
 */

/**
 * @typedef {Object} ServiceRecordDTO
 * @property {ID} id
 * @property {ID} userId
 * @property {ID} communityId
 * @property {string} serviceName
 * @property {string} plan
 * @property {ISODate} startedAt
 * @property {ISODate} [endedAt]
 * @property {string} [notes]
 * @property {boolean} [isActive]
 */

/**
 * @typedef {Object} ProjectDTO
 * @property {ID} id
 * @property {ID} communityId
 * @property {string} name
 * @property {string} status - ProjectStatus enum value
 * @property {ISODate} [startDate]
 * @property {ISODate} [targetDate]
 * @property {ID} [createdById]
 * @property {string} [description]
 * @property {number} [progress] - 0-100
 * @property {string} [risk] - HIGH|MEDIUM|LOW
 * @property {ISODate} [createdAt]
 */

/**
 * @typedef {Object} TaskDTO
 * @property {ID} id
 * @property {ID} projectId
 * @property {string} title
 * @property {string} [description]
 * @property {string} status - TaskStatus enum value
 * @property {string} source - TaskSource enum value
 * @property {ID} createdById
 * @property {ID} [assigneeId]
 * @property {ISODate} [dueDate]
 * @property {string} [section]
 * @property {Object} [customFields]
 * @property {ID} [parentTaskId]
 * @property {ID[]} [dependencyIds]
 * @property {string} [priority] - HIGH|MEDIUM|LOW
 * @property {ISODate} createdAt
 * @property {ISODate} [updatedAt]
 */

/**
 * @typedef {Object} TaskVisibilityDTO
 * @property {ID} id
 * @property {ID} taskId
 * @property {ID} userId
 */

/**
 * @typedef {Object} OnboardingDTO
 * @property {ID} id
 * @property {ID} userId
 * @property {string} step
 * @property {Object} data
 * @property {boolean} completed
 * @property {ISODate} [completedAt]
 * @property {ISODate} createdAt
 * @property {ISODate} updatedAt
 */

/**
 * @typedef {Object} SessionUser
 * @property {ID} id
 * @property {string} email
 * @property {string} [name]
 * @property {string} role
 * @property {string} [avatarUrl]
 * @property {CommunityMembershipDTO[]} memberships
 */

/**
 * @typedef {Object} ApiResponse<T>
 * @template T
 * @property {T} data
 * @property {boolean} success
 * @property {string} [error]
 * @property {Object} [meta]
 */

/**
 * @typedef {Object} PaginatedResponse<T>
 * @template T
 * @property {T[]} data
 * @property {boolean} success
 * @property {Object} pagination
 * @property {number} pagination.page
 * @property {number} pagination.pageSize
 * @property {number} pagination.total
 * @property {number} pagination.totalPages
 */

