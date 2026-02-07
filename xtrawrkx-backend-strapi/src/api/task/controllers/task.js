'use strict';

/**
 * task controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::task.task', ({ strapi }) => ({
    /**
     * Get all tasks (for global tasks page)
     */
    async findAll(ctx) {
        try {

            const { query } = ctx;

            // Remove populate from query to avoid Strapi parsing errors - we handle populate ourselves
            delete query.populate;

            // Parse filters from query string if needed
            let filters = {};
            if (query.filters) {
                try {
                    filters = typeof query.filters === 'string'
                        ? JSON.parse(query.filters)
                        : query.filters;
                } catch (e) {
                    filters = {};
                }
            }

            // Parse sort - handle both string and object formats
            let sort = {};
            if (query.sort) {
                if (typeof query.sort === 'string') {
                    // Handle "createdAt:desc" format
                    const [field, order] = query.sort.split(':');
                    sort = { [field]: order || 'desc' };
                } else {
                    sort = query.sort;
                }
            } else {
                sort = { createdAt: 'desc' };
            }

            // Parse pagination
            let pagination = { page: 1, pageSize: 100 };
            if (query.pagination) {
                pagination = typeof query.pagination === 'string'
                    ? JSON.parse(query.pagination)
                    : query.pagination;
            } else {
                if (query['pagination[page]']) {
                    // @ts-ignore
                    pagination.page = parseInt(query['pagination[page]']) || 1;
                }
                if (query['pagination[pageSize]']) {
                    // @ts-ignore
                    pagination.pageSize = parseInt(query['pagination[pageSize]']) || 100;
                }
            }

            // First, let's check if there are any tasks at all without filters
            const allTasksCount = await strapi.db.query('api::task.task').count();

            // Always use our own populate configuration - ignore any populate from query
            const tasks = await strapi.entityService.findPage('api::task.task', {
                filters,
                populate: {
                    creator: true,
                    assignee: true,
                    projects: true,
                    collaborators: true,
                    leadCompany: true,
                    clientAccount: true,
                    contact: true,
                    deal: true
                },
                sort,
                pagination
            });

            // Also try using db.query directly as a fallback
            // @ts-ignore
            if ((!tasks?.data || tasks.data.length === 0) && allTasksCount > 0) {
                const dbTasks = await strapi.db.query('api::task.task').findMany({
                    orderBy: sort,
                    limit: pagination.pageSize,
                    offset: (pagination.page - 1) * pagination.pageSize,
                });

                if (dbTasks.length > 0) {
                    // Populate manually
                    const populatedTasks = await Promise.all(
                        dbTasks.map(async (task) => {
                            const populated = await strapi.entityService.findOne('api::task.task', task.id, {
                                populate: {
                                    creator: true,
                                    assignee: true,
                                    projects: true,
                                    collaborators: true,
                                    leadCompany: true,
                                    clientAccount: true,
                                    contact: true,
                                    deal: true
                                }
                            });
                            return populated;
                        })
                    );

                    return ctx.send({
                        data: populatedTasks,
                        meta: {
                            pagination: {
                                page: pagination.page || 1,
                                pageSize: pagination.pageSize || 100,
                                pageCount: Math.ceil(allTasksCount / pagination.pageSize),
                                total: allTasksCount
                            }
                        }
                    });
                }
            }

            // Ensure we return a proper format even if empty
            // @ts-ignore
            if (!tasks || !tasks.data) {
                return ctx.send({
                    data: [],
                    meta: {
                        pagination: {
                            page: pagination.page || 1,
                            pageSize: pagination.pageSize || 100,
                            pageCount: 0,
                            total: 0
                        }
                    }
                });
            }

            return ctx.send(tasks);
        } catch (error) {
            console.error('Error fetching all tasks:', error);
            return ctx.badRequest(`Failed to fetch tasks: ${error.message}`);
        }
    },

    /**
     * Get tasks by entity
     */
    async findByEntity(ctx) {
        try {
            const { entityType, entityId } = ctx.params;

            if (!entityType || !entityId) {
                return ctx.badRequest('Entity type and ID are required');
            }

            const entityFieldMap = {
                leadCompany: 'leadCompany',
                clientAccount: 'clientAccount',
                contact: 'contact',
                deal: 'deal'
            };

            const entityField = entityFieldMap[entityType];
            if (!entityField) {
                return ctx.badRequest('Invalid entity type');
            }

            const tasks = await strapi.entityService.findMany('api::task.task', {
                filters: {
                    [entityField]: {
                        id: { $eq: entityId }
                    }
                },
                populate: {
                    creator: true,
                    assignee: true,
                    collaborators: true
                },
                sort: {
                    createdAt: 'desc'
                }
            });

            return { data: tasks };
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return ctx.badRequest(`Failed to fetch tasks: ${error.message}`);
        }
    },

    /**
     * Get a single task by ID
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;
            const { query } = ctx;

            // Parse populate from query string - SIMPLIFIED VERSION
            let populate = {};
            if (query.populate) {
                const populateFields = typeof query.populate === 'string'
                    ? query.populate.split(',')
                    : Array.isArray(query.populate)
                        ? query.populate
                        : [];

                // Field name mapping for backward compatibility
                const fieldMapping = {
                    'project': 'projects' // Map singular "project" to plural "projects"
                };

                // Simple approach: only handle top-level fields for now
                // Nested populate will be handled separately if needed
                populateFields.forEach(field => {
                    const trimmedField = field.trim();
                    // Skip nested fields (containing '.') for now
                    if (trimmedField && !trimmedField.includes('.')) {
                        // Map field name if needed
                        const mappedField = fieldMapping[trimmedField] || trimmedField;
                        populate[mappedField] = true;
                    }
                });

            } else {
                // Default populate
                populate = {
                    creator: true,
                    assignee: true,
                    projects: true,
                    subtasks: {
                        assignee: true,
                        childSubtasks: true
                    },
                    leadCompany: true,
                    clientAccount: true,
                    contact: true,
                    deal: true,
                    collaborators: true
                };
            }

            const task = await strapi.entityService.findOne('api::task.task', id, {
                populate
            });

            if (!task) {
                return ctx.notFound('Task not found');
            }

            return { data: task };
        } catch (error) {
            console.error('Error fetching task:', error);
            return ctx.badRequest(`Failed to fetch task: ${error.message}`);
        }
    },

    /**
     * Create a new task
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            if (!data || !data.title) {
                return ctx.badRequest('Title is required');
            }

            // Use creator field instead of createdBy to avoid conflict with Strapi's built-in createdBy field
            let userId = data.creator || data.createdBy || ctx.state?.user?.id;
            if (!userId) {
                return ctx.badRequest('User ID is required to create a task');
            }

            // Verify schema is loaded correctly
            const contentType = strapi.contentTypes['api::task.task'];
            if (!contentType) {
                console.error('Task content type not found in strapi.contentTypes');
                return ctx.badRequest('Task content type is not registered. Please restart Strapi.');
            }

            // @ts-ignore - TypeScript types may not be updated yet, but field exists in schema
            const creatorAttribute = contentType.attributes.creator;
            if (!creatorAttribute) {
                console.error('creator attribute not found in task schema');
                return ctx.badRequest('Task schema is missing creator attribute. Please check schema.json and restart Strapi.');
            }

            // Log schema details for debugging

            // @ts-ignore - TypeScript types may be stale, but runtime check is necessary
            const targetValue = String(creatorAttribute.target || '');
            if (targetValue !== 'api::xtrawrkx-user.xtrawrkx-user') {
                console.error('Creator target mismatch:', targetValue);
                return ctx.badRequest(`Task schema creator target is incorrect. Expected 'api::xtrawrkx-user.xtrawrkx-user', got '${targetValue}'. Please check schema.json and restart Strapi.`);
            }

            // Build validated task data
            const taskData = {
                title: data.title,
                description: data.description || '',
                status: data.status || 'SCHEDULED',
                priority: data.priority || 'MEDIUM',
                scheduledDate: data.scheduledDate || null,
                progress: data.progress || 0,
                tags: data.tags || null,
            };

            // Validate and set creator
            const creatorId = parseInt(userId);
            if (isNaN(creatorId)) {
                return ctx.badRequest('Invalid creator user ID');
            }

            const creatorUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: creatorId }
            });

            if (!creatorUser) {
                return ctx.badRequest(`Creator user with ID ${creatorId} not found`);
            }

            taskData.creator = creatorId;

            // Validate and set assignee if provided
            if (data.assignee) {
                const assigneeId = parseInt(data.assignee);
                if (!isNaN(assigneeId)) {
                    const assigneeUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                        where: { id: assigneeId }
                    });

                    if (assigneeUser) {
                        taskData.assignee = assigneeId;
                    } else {
                        console.warn(`Assignee user with ID ${assigneeId} not found, skipping`);
                    }
                }
            }

            // Validate and set collaborators if provided
            if (data.collaborators && Array.isArray(data.collaborators) && data.collaborators.length > 0) {
                const collaboratorIds = data.collaborators
                    .map(id => parseInt(id))
                    .filter(id => !isNaN(id));

                const validCollaborators = [];
                for (const collabId of collaboratorIds) {
                    const collabUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                        where: { id: collabId }
                    });

                    if (collabUser) {
                        validCollaborators.push(collabId);
                    } else {
                        console.warn(`Collaborator user with ID ${collabId} not found, skipping`);
                    }
                }

                if (validCollaborators.length > 0) {
                    taskData.collaborators = validCollaborators;
                }
            }

            // Validate and set projects if provided
            if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
                const projectIds = data.projects
                    .map(id => parseInt(id))
                    .filter(id => !isNaN(id));

                const validProjects = [];
                for (const projectId of projectIds) {
                    const project = await strapi.db.query('api::project.project').findOne({
                        where: { id: projectId }
                    });

                    if (project) {
                        validProjects.push(projectId);
                    } else {
                        console.warn(`Project with ID ${projectId} not found, skipping`);
                    }
                }

                if (validProjects.length > 0) {
                    taskData.projects = validProjects;
                }
            }

            // Set entity relations if provided
            if (data.leadCompany) {
                taskData.leadCompany = parseInt(data.leadCompany);
            }
            if (data.clientAccount) {
                taskData.clientAccount = parseInt(data.clientAccount);
            }
            if (data.contact) {
                taskData.contact = parseInt(data.contact);
            }
            if (data.deal) {
                taskData.deal = parseInt(data.deal);
            }

            // Create the task with validated data
            const task = await strapi.entityService.create('api::task.task', {
                data: taskData,
                populate: {
                    creator: true,
                    assignee: true,
                    projects: true,
                    collaborators: true,
                    leadCompany: true,
                    clientAccount: true,
                    contact: true,
                    deal: true
                }
            });

            return ctx.send({ data: task }, 201);
        } catch (error) {
            console.error('Error creating task:', error);
            return ctx.badRequest(`Failed to create task: ${error.message}`);
        }
    },

    /**
     * Update a task
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            if (!data) {
                return ctx.badRequest('Task data is required');
            }

            // Get existing task
            const existingTask = await strapi.entityService.findOne('api::task.task', id);

            if (!existingTask) {
                return ctx.notFound('Task not found');
            }

            // Build update data object
            const updateData = { ...data };

            // Handle status changes
            if (data.status !== undefined) {
                if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
                    updateData.completedDate = new Date().toISOString();
                } else if (data.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
                    updateData.completedDate = null;
                }
            }

            // Handle assignee if provided
            if (data.assignee !== undefined) {
                if (data.assignee) {
                    try {
                        const assigneeRecord = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                            where: { id: parseInt(data.assignee) },
                        });
                        if (assigneeRecord) {
                            updateData.assignee = assigneeRecord.id;
                        } else {
                            delete updateData.assignee;
                        }
                    } catch (assigneeError) {
                        console.error('Error finding assignee:', assigneeError);
                        delete updateData.assignee;
                    }
                } else {
                    updateData.assignee = null;
                }
            }

            // Handle projects if provided
            if (data.projects !== undefined) {
                if (Array.isArray(data.projects) && data.projects.length > 0) {
                    try {
                        const projectIdNums = data.projects
                            .map(p => typeof p === 'object' ? p.id : p)
                            .map(id => parseInt(id))
                            .filter(id => !isNaN(id));

                        // Verify all projects exist
                        const validProjectIds = [];
                        for (const projectId of projectIdNums) {
                            const projectRecord = await strapi.db.query('api::project.project').findOne({
                                where: { id: projectId },
                            });
                            if (projectRecord) {
                                validProjectIds.push(projectRecord.id);
                            }
                        }
                        updateData.projects = validProjectIds;
                    } catch (projectError) {
                        console.error('Error finding projects:', projectError);
                        delete updateData.projects;
                    }
                } else {
                    // Empty array means remove all projects
                    updateData.projects = [];
                }
            }

            // Handle collaborators if provided
            if (data.collaborators !== undefined) {
                if (Array.isArray(data.collaborators) && data.collaborators.length > 0) {
                    try {
                        // Convert collaborator IDs to integers and validate they exist
                        const collaboratorIds = data.collaborators
                            .map(collabId => {
                                const id = typeof collabId === 'object' ? collabId.id : collabId;
                                return parseInt(id, 10);
                            })
                            .filter(id => !isNaN(id));

                        // Verify all collaborator IDs exist
                        const validCollaborators = [];
                        for (const collabId of collaboratorIds) {
                            const userRecord = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                                where: { id: collabId },
                            });
                            if (userRecord) {
                                validCollaborators.push(userRecord.id);
                            }
                        }
                        updateData.collaborators = validCollaborators;
                    } catch (collabError) {
                        console.error('Error finding collaborators:', collabError);
                        // Don't update collaborators if there's an error
                        delete updateData.collaborators;
                    }
                } else {
                    // Empty array means remove all collaborators
                    updateData.collaborators = [];
                }
            }

            // Remove any remaining 'project' key (old schema) before sending to entityService
            if (updateData.project !== undefined) {
                delete updateData.project;
            }

            const updatedTask = await strapi.entityService.update('api::task.task', id, {
                data: updateData,
                populate: {
                    creator: true,
                    assignee: true,
                    projects: true,
                    collaborators: true
                }
            });

            // Create notification if assignee changed
            if (data.assignee !== undefined && updatedTask.assignee) {
                const newAssigneeId = typeof updatedTask.assignee === 'object'
                    ? updatedTask.assignee.id
                    : updatedTask.assignee;
                const oldAssigneeId = existingTask.assignee
                    ? (typeof existingTask.assignee === 'object' ? existingTask.assignee.id : existingTask.assignee)
                    : null;

                // Only create notification if assignee actually changed and is different from creator
                if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
                    try {
                        const assignee = await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', newAssigneeId);
                        const creator = updatedTask.creator
                            ? (typeof updatedTask.creator === 'object' ? updatedTask.creator : await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', updatedTask.creator))
                            : null;

                        if (assignee && creator) {
                            const creatorId = typeof creator === 'object' ? creator.id : creator;
                            const creatorRecord = typeof creator === 'object' ? creator : await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', creatorId);

                            // Normalize IDs for comparison (handle both string and number)
                            const newAssigneeIdNum = typeof newAssigneeId === 'string'
                                ? parseInt(newAssigneeId, 10)
                                : newAssigneeId;
                            const creatorIdNum = typeof creatorId === 'string'
                                ? parseInt(creatorId, 10)
                                : creatorId;

                            // Don't notify if assigning to self (compare both as numbers and strings)
                            if (newAssigneeIdNum !== creatorIdNum &&
                                newAssigneeId !== creatorId &&
                                String(newAssigneeId) !== String(creatorId)) {
                                const creatorName = creatorRecord
                                    ? `${creatorRecord.firstName || ''} ${creatorRecord.lastName || ''}`.trim() || creatorRecord.email || 'Someone'
                                    : 'Someone';
                                const taskTitle = updatedTask.title || 'a task';

                                await strapi.entityService.create('api::notification.notification', {
                                    data: {
                                        user: newAssigneeIdNum || newAssigneeId,
                                        type: 'TASK_ASSIGNED',
                                        title: 'Task assigned to you',
                                        message: `${creatorName} assigned you the task: ${taskTitle}`,
                                        isRead: false
                                    }
                                });

                            } else {
                            }
                        }
                    } catch (notificationError) {
                        console.error('Error creating task assignment notification:', notificationError);
                        // Don't fail task update if notification fails
                    }
                }
            }

            return { data: updatedTask };
        } catch (error) {
            console.error('Error updating task:', error);
            return ctx.badRequest(`Failed to update task: ${error.message}`);
        }
    },

    /**
     * Update task status
     */
    async updateStatus(ctx) {
        try {
            const { id } = ctx.params;
            const { status } = ctx.request.body;

            if (!status) {
                return ctx.badRequest('Status is required');
            }

            const existingTask = await strapi.entityService.findOne('api::task.task', id);

            if (!existingTask) {
                return ctx.notFound('Task not found');
            }

            const updateData = { status };

            if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
                updateData.completedDate = new Date().toISOString();
            } else if (status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
                updateData.completedDate = null;
            }

            const updatedTask = await strapi.entityService.update('api::task.task', id, {
                data: updateData,
                populate: {
                    creator: true,
                    assignee: true
                }
            });

            return { data: updatedTask };
        } catch (error) {
            console.error('Error updating task status:', error);
            return ctx.badRequest(`Failed to update task status: ${error.message}`);
        }
    },

    /**
     * Delete a task
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            if (!id) {
                return ctx.badRequest('Task ID is required');
            }


            // Check if task exists
            const existingTask = await strapi.entityService.findOne('api::task.task', id);

            if (!existingTask) {
                return ctx.notFound('Task not found');
            }

            // Delete the task
            const deletedTask = await strapi.entityService.delete('api::task.task', id);


            return ctx.send({ data: deletedTask });
        } catch (error) {
            console.error('Error deleting task:', error);
            return ctx.badRequest(`Failed to delete task: ${error.message}`);
        }
    },
}));
