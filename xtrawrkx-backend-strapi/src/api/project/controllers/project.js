'use strict';

/**
 * project controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::project.project', ({ strapi }) => {
    /**
     * Resolve a Strapi entity identifier to its numeric database id.
     * Accepts numeric ids or Strapi v5 documentId strings.
     */
    const resolveNumericId = async (rawId, contentType) => {
        if (rawId === undefined || rawId === null || rawId === '') {
            return null;
        }

        const idStr = String(rawId).trim();
        if (!idStr) {
            return null;
        }

        if (/^\d+$/.test(idStr)) {
            return Number(idStr);
        }

        const row = await strapi.db.query(contentType).findOne({
            where: { documentId: idStr },
            select: ['id'],
        });

        return row?.id ?? null;
    };

    /**
     * Helper function to find or create account from client account
     */
    const findOrCreateAccountFromClientAccount = async (clientAccountId) => {
        try {
            const resolvedClientAccountId = await resolveNumericId(
                clientAccountId,
                'api::client-account.client-account'
            );

            if (!resolvedClientAccountId) {
                return null;
            }

            // First, get the client account
            const clientAccount = await strapi.entityService.findOne(
                'api::client-account.client-account',
                resolvedClientAccountId
            );

            if (!clientAccount) {
                return null;
            }

            // Try to find an existing account with the same company name
            const existingAccounts = await strapi.entityService.findMany('api::account.account', {
                filters: {
                    companyName: {
                        $eq: clientAccount.companyName
                    }
                },
                limit: 1
            });

            if (existingAccounts && existingAccounts.length > 0) {
                return existingAccounts[0].id;
            }

            // Create a new account from the client account data
            const newAccount = await strapi.entityService.create('api::account.account', {
                data: {
                    companyName: clientAccount.companyName,
                    industry: clientAccount.industry || '',
                    website: clientAccount.website || null,
                    phone: clientAccount.phone || null,
                    email: clientAccount.email || null,
                    address: clientAccount.address || null,
                    city: clientAccount.city || null,
                    state: clientAccount.state || null,
                    country: clientAccount.country || null,
                    zipCode: clientAccount.zipCode || null,
                    employees: clientAccount.employees || null,
                    type: 'CUSTOMER'
                }
            });

            return newAccount.id;
        } catch (error) {
            console.error('Error finding/creating account from client account:', error);
            return null;
        }
    };

    return {
        /**
         * Get all projects
         */
        async find(ctx) {
            try {

                const { query } = ctx;

                // Parse populate from query string
                let populate = {};
                if (query.populate) {
                    const populateFields = typeof query.populate === 'string'
                        ? query.populate.split(',')
                        : Array.isArray(query.populate)
                            ? query.populate
                            : [];

                    // Build populate object
                    populateFields.forEach(field => {
                        const trimmedField = field.trim();
                        if (trimmedField) {
                            populate[trimmedField] = true;
                        }
                    });
                } else {
                    // Default populate
                    populate = {
                        projectManager: true,
                        account: true,
                        deal: true,
                        clientAccount: true
                    };
                }

                // Always ensure clientAccount is populated
                populate.clientAccount = true;


                // Parse filters from query string
                let filters = {};
                if (query.filters) {
                    try {
                        filters = typeof query.filters === 'string'
                            ? JSON.parse(query.filters)
                            : query.filters;
                    } catch (e) {
                        console.warn('Error parsing filters:', e);
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
                let pagination = { page: 1, pageSize: 25 };
                if (query.pagination) {
                    pagination = typeof query.pagination === 'string'
                        ? JSON.parse(query.pagination)
                        : query.pagination;
                } else {
                    if (query['pagination[page]']) {
                        pagination.page = parseInt(String(query['pagination[page]'])) || 1;
                    }
                    if (query['pagination[pageSize]']) {
                        pagination.pageSize = parseInt(String(query['pagination[pageSize]'])) || 25;
                    }
                }


                // Fetch projects using entityService
                const projects = await strapi.entityService.findPage('api::project.project', {
                    filters,
                    populate,
                    sort,
                    pagination
                });


                // Handle both 'data' and 'results' properties (Strapi might use either)
                let projectsData = [];
                let projectsMeta = null;

                if (projects) {
                    // Check for 'data' property
                    if ('data' in projects && Array.isArray(projects.data)) {
                        projectsData = projects.data;
                        projectsMeta = ('meta' in projects) ? projects.meta : null;
                    }
                    // Check for 'results' property (some Strapi versions use this)
                    else if ('results' in projects && Array.isArray(projects.results)) {
                        projectsData = projects.results;
                        projectsMeta = ('meta' in projects) ? projects.meta :
                            ('pagination' in projects) ? projects.pagination : null;
                    }
                    // Fallback: if projects is directly an array
                    else if (Array.isArray(projects)) {
                        projectsData = projects;
                    }
                }


                // Debug: Log first project's clientAccount
                if (projectsData.length > 0) {
                    const firstProject = projectsData[0];
                    const projectData = firstProject.attributes || firstProject;
                }

                // Ensure we return a proper format even if empty
                if (!projectsData || projectsData.length === 0) {
                    return ctx.send({
                        data: [],
                        meta: {
                            pagination: {
                                page: pagination.page || 1,
                                pageSize: pagination.pageSize || 25,
                                pageCount: 0,
                                total: 0
                            }
                        }
                    });
                }

                // Return in the standard Strapi format that frontend expects
                return ctx.send({
                    data: projectsData,
                    meta: projectsMeta || {
                        pagination: {
                            page: pagination.page || 1,
                            pageSize: pagination.pageSize || 25,
                            pageCount: Math.ceil(projectsData.length / (pagination.pageSize || 25)),
                            total: projectsData.length
                        }
                    }
                });
            } catch (error) {
                console.error('Error fetching projects:', error);
                return ctx.badRequest(`Failed to fetch projects: ${error.message}`);
            }
        },

        /**
         * Get a single project by ID
         */
        async findOne(ctx) {
            try {
                const projectId = await resolveNumericId(ctx.params.id, 'api::project.project');

                if (!projectId) {
                    return ctx.notFound('Project not found');
                }

                const { query } = ctx;

                // Parse populate from query string
                let populate = {};
                if (query.populate) {
                    const populateFields = typeof query.populate === 'string'
                        ? query.populate.split(',')
                        : Array.isArray(query.populate)
                            ? query.populate
                            : [];

                    // Build populate object with support for nested fields (e.g., "tasks.assignee")
                    populateFields.forEach(field => {
                        const trimmedField = field.trim();
                        if (trimmedField) {
                            // Handle nested populate (e.g., "tasks.assignee", "tasks.collaborators")
                            if (trimmedField.includes('.')) {
                                const parts = trimmedField.split('.');
                                const parentField = parts[0];
                                const childField = parts.slice(1).join('.'); // Handle multiple levels

                                // Initialize parent field if needed
                                if (!populate[parentField]) {
                                    populate[parentField] = { populate: {} };
                                }

                                // Convert boolean true to object with populate
                                if (populate[parentField] === true) {
                                    populate[parentField] = { populate: {} };
                                }

                                // Ensure populate object exists
                                if (typeof populate[parentField] === 'object' && !populate[parentField].populate) {
                                    populate[parentField] = { populate: {} };
                                }

                                // Set nested field using Strapi v4 syntax
                                if (populate[parentField].populate) {
                                    populate[parentField].populate[childField] = true;
                                }
                            } else {
                                // Top-level field - only set if not already an object
                                if (!populate[trimmedField] || populate[trimmedField] === true) {
                                    populate[trimmedField] = true;
                                }
                            }
                        }
                    });
                } else {
                    // Default populate with nested relations
                    populate = {
                        projectManager: true,
                        account: true,
                        deal: true,
                        tasks: {
                            populate: {
                                assignee: true,
                                collaborators: true
                            }
                        }
                    };
                }

                const project = await strapi.entityService.findOne('api::project.project', projectId, {
                    populate
                });

                if (!project) {
                    return ctx.notFound('Project not found');
                }

                return { data: project };
            } catch (error) {
                console.error('Error fetching project:', error);
                return ctx.badRequest(`Failed to fetch project: ${error.message}`);
            }
        },

        /**
         * Create a new project
         */
        async create(ctx) {
            try {
                const { data } = ctx.request.body;

                if (!data) {
                    return ctx.badRequest('No data provided');
                }

                // Handle clientAccount field - set it directly if provided
                if (data.clientAccount) {
                    const resolvedClientAccountId = await resolveNumericId(
                        data.clientAccount,
                        'api::client-account.client-account'
                    );

                    if (resolvedClientAccountId) {
                        try {
                            const clientAccount = await strapi.entityService.findOne(
                                'api::client-account.client-account',
                                resolvedClientAccountId
                            );
                            data.clientAccount = clientAccount ? resolvedClientAccountId : undefined;
                            if (!clientAccount) {
                                delete data.clientAccount;
                            }
                        } catch (error) {
                            delete data.clientAccount;
                        }
                    } else {
                        delete data.clientAccount;
                    }
                }

                // Handle account field - check if it's a client account ID
                if (data.account) {
                    const resolvedClientAccountId = await resolveNumericId(
                        data.account,
                        'api::client-account.client-account'
                    );

                    if (resolvedClientAccountId) {
                        try {
                            const clientAccount = await strapi.entityService.findOne(
                                'api::client-account.client-account',
                                resolvedClientAccountId
                            );
                            if (clientAccount) {
                                const accountId = await findOrCreateAccountFromClientAccount(resolvedClientAccountId);
                                if (accountId) {
                                    data.account = accountId;
                                } else {
                                    delete data.account;
                                }
                            }
                        } catch (error) {
                            // If it's not a client account, it might be a regular account - proceed as normal
                        }
                    } else {
                        const resolvedAccountId = await resolveNumericId(
                            data.account,
                            'api::account.account'
                        );
                        if (resolvedAccountId) {
                            data.account = resolvedAccountId;
                        }
                    }
                }

                const entity = await strapi.entityService.create('api::project.project', {
                    data,
                    populate: {
                        projectManager: true,
                        account: true,
                        deal: true,
                        clientAccount: true
                    }
                });


                return { data: entity };
            } catch (error) {
                console.error('Project creation error:', error);
                console.error('Error details:', error.message);
                return ctx.badRequest(`Failed to create project: ${error.message}`);
            }
        },

        /**
         * Update a project
         */
        async update(ctx) {
            try {
                const projectId = await resolveNumericId(ctx.params.id, 'api::project.project');

                if (!projectId) {
                    return ctx.notFound('Project not found');
                }

                const { data } = ctx.request.body;


                // Ensure teamMembers IDs are integers if present
                if (data.teamMembers !== undefined && Array.isArray(data.teamMembers)) {
                    data.teamMembers = (
                        await Promise.all(
                            data.teamMembers.map((memberId) =>
                                resolveNumericId(memberId, 'plugin::users-permissions.user')
                            )
                        )
                    ).filter((memberId) => memberId !== null);
                }

                // Handle account field - check if it's a client account ID
                if (data.account !== undefined && data.account !== null) {
                    const clientAccountId = await resolveNumericId(
                        data.account,
                        'api::client-account.client-account'
                    );

                    if (clientAccountId) {
                        try {
                            const clientAccount = await strapi.entityService.findOne(
                                'api::client-account.client-account',
                                clientAccountId
                            );
                            if (clientAccount) {
                                const accountId = await findOrCreateAccountFromClientAccount(clientAccountId);
                                data.account = accountId || null;
                            } else {
                                data.account = null;
                            }
                        } catch (clientAccountError) {
                            data.account = null;
                        }
                    } else {
                        const accountId = await resolveNumericId(data.account, 'api::account.account');
                        if (accountId) {
                            try {
                                const regularAccount = await strapi.entityService.findOne(
                                    'api::account.account',
                                    accountId
                                );
                                data.account = regularAccount ? accountId : null;
                            } catch (accountError) {
                                data.account = accountId;
                            }
                        } else {
                            data.account = null;
                        }
                    }
                } else if (data.account !== undefined) {
                    data.account = null;
                }

                // Handle clientAccount field - set it directly if provided
                if (data.clientAccount !== undefined) {
                    if (data.clientAccount) {
                        const clientAccountId = await resolveNumericId(
                            data.clientAccount,
                            'api::client-account.client-account'
                        );

                        if (clientAccountId) {
                            try {
                                const clientAccount = await strapi.entityService.findOne(
                                    'api::client-account.client-account',
                                    clientAccountId
                                );
                                data.clientAccount = clientAccount ? clientAccountId : null;
                            } catch (error) {
                                data.clientAccount = null;
                            }
                        } else {
                            data.clientAccount = null;
                        }
                    } else {
                        data.clientAccount = null;
                    }
                }


                // Update the project using entityService
                const entity = await strapi.entityService.update('api::project.project', projectId, {
                    data,
                    populate: {
                        projectManager: true,
                        account: true,
                        deal: true,
                        teamMembers: true,
                        clientAccount: true
                    }
                });



                return { data: entity };
            } catch (error) {
                console.error(`Project update error for ID ${ctx.params.id}:`, error);
                console.error('Error details:', error.message);
                console.error('Error stack:', error.stack);
                return ctx.badRequest(`Failed to update project: ${error.message}`);
            }
        },

        /**
         * Delete a project with cascade deletion of related data
         */
        async delete(ctx) {
            try {
                const projectId = await resolveNumericId(ctx.params.id, 'api::project.project');

                if (!projectId) {
                    return ctx.notFound('Project not found');
                }

                // First, get the project with all relations
                const project = await strapi.entityService.findOne('api::project.project', projectId, {
                    populate: {
                        tasks: true,
                        activities: true,
                        timeEntries: true,
                        files: true,
                        teamMembers: true
                    }
                });

                if (!project) {
                    return ctx.notFound('Project not found');
                }

                // Delete all related tasks (and their subtasks and comments)
                if (project.tasks && project.tasks.length > 0) {
                    for (const task of project.tasks) {
                        try {
                            // Get task with all projects to check if it belongs to other projects
                            const fullTask = await strapi.entityService.findOne('api::task.task', task.id, {
                                populate: {
                                    subtasks: true,
                                    projects: true
                                }
                            });

                            // Check if task belongs to other projects
                            const belongsToOtherProjects = fullTask && fullTask.projects &&
                                fullTask.projects.some(p => p.id !== projectId);

                            if (belongsToOtherProjects) {
                                // Just unlink the task from this project, don't delete it
                                const currentProjects = fullTask.projects
                                    .filter(p => p.id !== projectId)
                                    .map(p => p.id);

                                await strapi.entityService.update('api::task.task', task.id, {
                                    data: {
                                        projects: currentProjects
                                    }
                                });
                                continue; // Skip deletion, move to next task
                            }


                            // Delete all task comments first (comments are linked by commentableId and commentableType)
                            try {
                                const taskComments = await strapi.entityService.findMany('api::task-comment.task-comment', {
                                    filters: {
                                        commentableId: { $eq: String(task.id) },
                                        commentableType: { $eq: 'TASK' }
                                    }
                                });

                                if (taskComments && taskComments.length > 0) {
                                    for (const comment of taskComments) {
                                        try {
                                            // Delete comment replies first (recursive)
                                            const replies = await strapi.entityService.findMany('api::task-comment.task-comment', {
                                                filters: {
                                                    parentComment: { id: { $eq: comment.id } }
                                                }
                                            });

                                            for (const reply of replies) {
                                                try {
                                                    await strapi.entityService.delete('api::task-comment.task-comment', reply.id);
                                                } catch (replyError) {
                                                    console.error(`Error deleting comment reply ${reply.id}:`, replyError.message);
                                                }
                                            }

                                            // Delete the comment itself
                                            await strapi.entityService.delete('api::task-comment.task-comment', comment.id);
                                        } catch (commentError) {
                                            console.error(`Error deleting comment ${comment.id}:`, commentError.message);
                                        }
                                    }
                                }
                            } catch (commentError) {
                                console.error(`Error fetching/deleting comments for task ${task.id}:`, commentError.message);
                            }

                            // Delete all subtasks first (and their comments)
                            if (fullTask && fullTask.subtasks && fullTask.subtasks.length > 0) {
                                for (const subtask of fullTask.subtasks) {
                                    try {
                                        // Delete subtask comments
                                        try {
                                            const subtaskComments = await strapi.entityService.findMany('api::task-comment.task-comment', {
                                                filters: {
                                                    commentableId: { $eq: String(subtask.id) },
                                                    commentableType: { $eq: 'SUBTASK' }
                                                }
                                            });

                                            for (const comment of subtaskComments) {
                                                try {
                                                    // Delete replies first
                                                    const replies = await strapi.entityService.findMany('api::task-comment.task-comment', {
                                                        filters: {
                                                            parentComment: { id: { $eq: comment.id } }
                                                        }
                                                    });

                                                    for (const reply of replies) {
                                                        await strapi.entityService.delete('api::task-comment.task-comment', reply.id);
                                                    }

                                                    await strapi.entityService.delete('api::task-comment.task-comment', comment.id);
                                                } catch (commentError) {
                                                    console.error(`Error deleting subtask comment:`, commentError.message);
                                                }
                                            }
                                        } catch (commentError) {
                                            console.error(`Error fetching subtask comments:`, commentError.message);
                                        }

                                        await strapi.entityService.delete('api::subtask.subtask', subtask.id);
                                    } catch (subtaskError) {
                                        console.error(`Error deleting subtask ${subtask.id}:`, subtaskError.message);
                                    }
                                }
                            }

                            // Delete the task itself
                            await strapi.entityService.delete('api::task.task', task.id);
                        } catch (taskError) {
                            console.error(`Error deleting task ${task.id}:`, taskError.message);
                            // Continue with other deletions even if one fails
                        }
                    }
                }

                // Delete all related activities
                if (project.activities && project.activities.length > 0) {
                    for (const activity of project.activities) {
                        try {
                            await strapi.entityService.delete('api::activity.activity', activity.id);
                        } catch (activityError) {
                            console.error(`Error deleting activity ${activity.id}:`, activityError.message);
                        }
                    }
                }

                // Delete all related time entries
                if (project.timeEntries && project.timeEntries.length > 0) {
                    for (const timeEntry of project.timeEntries) {
                        try {
                            await strapi.entityService.delete('api::time-entry.time-entry', timeEntry.id);
                        } catch (timeEntryError) {
                            console.error(`Error deleting time entry ${timeEntry.id}:`, timeEntryError.message);
                        }
                    }
                }

                // Delete all related files
                if (project.files && project.files.length > 0) {
                    for (const file of project.files) {
                        try {
                            await strapi.entityService.delete('api::file.file', file.id);
                        } catch (fileError) {
                            console.error(`Error deleting file ${file.id}:`, fileError.message);
                        }
                    }
                }

                // Delete the project itself
                const deletedProject = await strapi.entityService.delete('api::project.project', projectId);


                return { data: deletedProject };
            } catch (error) {
                console.error('Error deleting project:', error);
                console.error('Error details:', error.message);
                console.error('Error stack:', error.stack);
                return ctx.badRequest(`Failed to delete project: ${error.message}`);
            }
        },
    };
});

