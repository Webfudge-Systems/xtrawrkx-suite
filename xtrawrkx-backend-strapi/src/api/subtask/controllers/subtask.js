'use strict';

/**
 * subtask controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::subtask.subtask', ({ strapi }) => ({
    /**
     * Create a new subtask
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            if (!data) {
                return ctx.badRequest('Data is required');
            }

            // Validate required fields
            if (!data.title) {
                return ctx.badRequest('Title is required');
            }

            if (!data.task) {
                return ctx.badRequest('Task is required');
            }

            // Ensure task ID is an integer
            const taskId = typeof data.task === 'string' ? parseInt(data.task, 10) : data.task;

            if (!taskId || isNaN(taskId)) {
                return ctx.badRequest('Invalid task ID');
            }

            // Verify task exists
            const task = await strapi.entityService.findOne('api::task.task', taskId);
            if (!task) {
                return ctx.badRequest('Task not found');
            }

            // Build subtask data
            const subtaskData = {
                title: data.title,
                description: data.description || null,
                status: data.status || 'SCHEDULED',
                priority: data.priority || 'MEDIUM',
                progress: data.progress || 0,
                depth: data.depth || 0,
                order: data.order || 0,
                dueDate: data.dueDate || null,
                task: taskId,
            };

            // Add parent subtask if provided
            if (data.parentSubtask) {
                const parentId = typeof data.parentSubtask === 'string'
                    ? parseInt(data.parentSubtask, 10)
                    : data.parentSubtask;
                const parent = await strapi.entityService.findOne('api::subtask.subtask', parentId);
                if (parent) {
                    subtaskData.parentSubtask = parentId;
                }
            }

            // Add assignee if provided
            if (data.assignee) {
                const assigneeId = typeof data.assignee === 'string'
                    ? parseInt(data.assignee, 10)
                    : data.assignee;
                const assignee = await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', assigneeId);
                if (assignee) {
                    subtaskData.assignee = assigneeId;
                }
            }

            // Add collaborators if provided (array of user IDs)
            if (data.collaborators && Array.isArray(data.collaborators)) {
                const collaboratorIds = data.collaborators
                    .map(collab => typeof collab === 'string' ? parseInt(collab, 10) : collab)
                    .filter(id => id && !isNaN(id));
                
                if (collaboratorIds.length > 0) {
                    // Verify all collaborators exist
                    const validCollaborators = [];
                    for (const collabId of collaboratorIds) {
                        const collaborator = await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', collabId);
                        if (collaborator) {
                            validCollaborators.push(collabId);
                        }
                    }
                    if (validCollaborators.length > 0) {
                        subtaskData.collaborators = validCollaborators;
                    }
                }
            }

            // Create subtask
            // IMPORTANT: Only create the subtask, do NOT modify the parent task
            const subtask = await strapi.entityService.create('api::subtask.subtask', {
                data: subtaskData
            });

            // Verify the parent task was NOT modified (safety check)
            const parentTaskAfter = await strapi.entityService.findOne('api::task.task', taskId, {
                populate: ['collaborators']
            });
            
            // Log warning if parent task collaborators were unexpectedly modified
            if (parentTaskAfter && parentTaskAfter.collaborators) {
                const originalCollaboratorIds = (task.collaborators || []).map(c => c?.id || c);
                const newCollaboratorIds = (parentTaskAfter.collaborators || []).map(c => c?.id || c);
                if (JSON.stringify(originalCollaboratorIds.sort()) !== JSON.stringify(newCollaboratorIds.sort())) {
                    console.warn('WARNING: Parent task collaborators were modified during subtask creation. This should not happen.');
                }
            }

            // Fetch with populated relations
            const populatedSubtask = await strapi.entityService.findOne('api::subtask.subtask', subtask.id, {
                populate: {
                    task: true,
                    assignee: true,
                    collaborators: true,
                    parentSubtask: true,
                    childSubtasks: true
                }
            });

            return { data: populatedSubtask };
        } catch (error) {
            console.error('Error creating subtask:', error);
            return ctx.internalServerError('Failed to create subtask');
        }
    },

    /**
     * Get a single subtask by ID
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;
            const { query } = ctx;

            // Parse populate from query string
            let populate = {
                task: true,
                assignee: true,
                collaborators: true,
                parentSubtask: true,
                childSubtasks: true
            };

            if (query.populate) {
                const populateFields = typeof query.populate === 'string'
                    ? query.populate.split(',')
                    : Array.isArray(query.populate)
                        ? query.populate
                        : [];

                // Build populate object - simplified for TypeScript
                const customPopulate = {};
                populateFields.forEach(field => {
                    const trimmedField = field.trim();
                    if (trimmedField && !trimmedField.includes('.')) {
                        customPopulate[trimmedField] = true;
                    }
                });

                // Merge with default if custom populate has fields
                if (Object.keys(customPopulate).length > 0) {
                    populate = { ...populate, ...customPopulate };
                }
            }

            const subtask = await strapi.entityService.findOne('api::subtask.subtask', id, {
                populate
            });

            if (!subtask) {
                return ctx.notFound('Subtask not found');
            }

            return { data: subtask };
        } catch (error) {
            console.error('Error fetching subtask:', error);
            return ctx.badRequest(`Failed to fetch subtask: ${error.message}`);
        }
    },

    /**
     * Get all subtasks
     */
    async find(ctx) {
        try {
            const { query } = ctx;

            // Parse populate from query string
            let populate = {
                task: true,
                assignee: true,
                collaborators: true,
                parentSubtask: true,
                childSubtasks: true
            };

            if (query.populate) {
                const populateFields = typeof query.populate === 'string'
                    ? query.populate.split(',')
                    : Array.isArray(query.populate)
                        ? query.populate
                        : [];

                // Build populate object - simplified for TypeScript
                const customPopulate = {};
                populateFields.forEach(field => {
                    const trimmedField = field.trim();
                    if (trimmedField && !trimmedField.includes('.')) {
                        customPopulate[trimmedField] = true;
                    }
                });

                // Merge with default if custom populate has fields
                if (Object.keys(customPopulate).length > 0) {
                    populate = { ...populate, ...customPopulate };
                }
            }

            // Use default find with custom populate
            const { results, pagination } = await strapi.entityService.findPage('api::subtask.subtask', {
                ...query,
                populate
            });

            return { data: results, meta: { pagination } };
        } catch (error) {
            console.error('Error fetching subtasks:', error);
            return ctx.badRequest(`Failed to fetch subtasks: ${error.message}`);
        }
    },

    /**
     * Update a subtask
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            if (!data) {
                return ctx.badRequest('Data is required');
            }

            // Get existing subtask
            const existingSubtask = await strapi.entityService.findOne('api::subtask.subtask', id);
            if (!existingSubtask) {
                return ctx.notFound('Subtask not found');
            }

            const updateData = { ...data };

            // Map frontend status values to backend enum values
            if (data.status !== undefined && data.status !== null) {
                const statusMap = {
                    'To Do': 'SCHEDULED',
                    'In Progress': 'IN_PROGRESS',
                    'In Review': 'IN_REVIEW',
                    'Done': 'COMPLETED',
                    'Completed': 'COMPLETED',
                    'Cancelled': 'CANCELLED',
                    'SCHEDULED': 'SCHEDULED',
                    'IN_PROGRESS': 'IN_PROGRESS',
                    'IN_REVIEW': 'IN_REVIEW',
                    'COMPLETED': 'COMPLETED',
                    'CANCELLED': 'CANCELLED'
                };
                updateData.status = statusMap[data.status] || data.status;
            }

            // Map frontend priority values to backend enum values
            if (data.priority !== undefined && data.priority !== null) {
                const priorityMap = {
                    'Low': 'LOW',
                    'Medium': 'MEDIUM',
                    'High': 'HIGH',
                    'LOW': 'LOW',
                    'MEDIUM': 'MEDIUM',
                    'HIGH': 'HIGH'
                };
                updateData.priority = priorityMap[data.priority] || data.priority;
            }

            // Handle assignee if provided
            if (data.assignee !== undefined) {
                if (data.assignee) {
                    const assigneeId = typeof data.assignee === 'string'
                        ? parseInt(data.assignee, 10)
                        : data.assignee;
                    const assignee = await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', assigneeId);
                    if (assignee) {
                        updateData.assignee = assigneeId;
                    } else {
                        delete updateData.assignee;
                    }
                } else {
                    updateData.assignee = null;
                }
            }

            // Handle collaborators if provided
            if (data.collaborators !== undefined) {
                if (data.collaborators && Array.isArray(data.collaborators)) {
                    const collaboratorIds = data.collaborators
                        .map(collab => typeof collab === 'string' ? parseInt(collab, 10) : collab)
                        .filter(id => id && !isNaN(id));
                    
                    if (collaboratorIds.length > 0) {
                        // Verify all collaborators exist
                        const validCollaborators = [];
                        for (const collabId of collaboratorIds) {
                            const collaborator = await strapi.entityService.findOne('api::xtrawrkx-user.xtrawrkx-user', collabId);
                            if (collaborator) {
                                validCollaborators.push(collabId);
                            }
                        }
                        updateData.collaborators = validCollaborators;
                    } else {
                        updateData.collaborators = [];
                    }
                } else {
                    updateData.collaborators = [];
                }
            }

            // Handle parent subtask if provided
            if (data.parentSubtask !== undefined) {
                if (data.parentSubtask) {
                    const parentId = typeof data.parentSubtask === 'string'
                        ? parseInt(data.parentSubtask, 10)
                        : data.parentSubtask;
                    const parent = await strapi.entityService.findOne('api::subtask.subtask', parentId);
                    if (parent) {
                        updateData.parentSubtask = parentId;
                        // Update depth based on parent
                        updateData.depth = (parent.depth || 0) + 1;
                    } else {
                        delete updateData.parentSubtask;
                    }
                } else {
                    updateData.parentSubtask = null;
                    updateData.depth = 0;
                }
            }

            // Update subtask
            // IMPORTANT: Only update THIS specific subtask, do NOT modify parent task or other subtasks
            const taskId = existingSubtask.task?.id || existingSubtask.task;
            
            // Get parent task before update for safety check
            let parentTaskBefore = null;
            if (taskId) {
                parentTaskBefore = await strapi.entityService.findOne('api::task.task', taskId, {
                    populate: ['collaborators']
                });
            }
            
            const updatedSubtask = await strapi.entityService.update('api::subtask.subtask', id, {
                data: updateData,
                populate: {
                    task: true,
                    assignee: true,
                    collaborators: true,
                    parentSubtask: true,
                    childSubtasks: true
                }
            });

            // Verify the parent task was NOT modified (safety check)
            if (parentTaskBefore && taskId) {
                const parentTaskAfter = await strapi.entityService.findOne('api::task.task', taskId, {
                    populate: ['collaborators']
                });
                
                if (parentTaskAfter && parentTaskAfter.collaborators) {
                    const originalCollaboratorIds = (parentTaskBefore.collaborators || []).map(c => c?.id || c).sort();
                    const newCollaboratorIds = (parentTaskAfter.collaborators || []).map(c => c?.id || c).sort();
                    if (JSON.stringify(originalCollaboratorIds) !== JSON.stringify(newCollaboratorIds)) {
                        console.warn('WARNING: Parent task collaborators were modified during subtask update. This should not happen.');
                    }
                }
            }

            return { data: updatedSubtask };
        } catch (error) {
            console.error('Error updating subtask:', error);
            return ctx.badRequest(`Failed to update subtask: ${error.message}`);
        }
    },

    /**
     * Delete a subtask
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            // Get subtask with children
            const subtask = await strapi.entityService.findOne('api::subtask.subtask', id, {
                populate: {
                    childSubtasks: true
                }
            });

            if (!subtask) {
                return ctx.notFound('Subtask not found');
            }

            // Delete all child subtasks recursively
            // First get all child subtasks
            const childSubtasks = await strapi.entityService.findMany('api::subtask.subtask', {
                filters: {
                    parentSubtask: {
                        id: { $eq: id }
                    }
                }
            });

            // Delete all children first
            for (const child of childSubtasks) {
                await strapi.entityService.delete('api::subtask.subtask', child.id);
            }

            // Delete the subtask itself
            const deletedSubtask = await strapi.entityService.delete('api::subtask.subtask', id);

            return { data: deletedSubtask };
        } catch (error) {
            console.error('Error deleting subtask:', error);
            return ctx.badRequest(`Failed to delete subtask: ${error.message}`);
        }
    },
}));


