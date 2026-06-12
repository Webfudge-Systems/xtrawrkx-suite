'use strict';

const { uniqueUsernameFromEmail } = require('../../../utils/user-username');

/**
 * invitation service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const crypto = require('crypto');
const { ORG_ROLE_UID, resolveOrganizationRoleIdForOrg } = require('../../../utils/organization-role');
const { logAccountsActivity, actorDisplayName } = require('../../../utils/crm-activity-log');
const { applyMembershipDepartments } = require('../../../utils/department-membership');

module.exports = createCoreService('api::invitation.invitation', ({ strapi }) => ({
  async sendEmailSafe({ to, subject, text, html }) {
    try {
      const emailService = strapi.plugin('email')?.service('email');
      if (!emailService || typeof emailService.send !== 'function') {
        console.warn(`Email plugin not configured. Skipping email to ${to}. Subject: ${subject}`);
        return;
      }
      await emailService.send({
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  },

  async sendInvitationEmail({ email, token, organizationName, roleLabel }) {
    const appUrl = process.env.APP_URL || process.env.LANDING_APP_URL || 'http://localhost:3000';
    const inviteLink = `${appUrl}/invite/${token}`;
    const subject = `You're invited to join ${organizationName}`;
    const text = [
      `You have been invited to join ${organizationName} as ${roleLabel}.`,
      '',
      `Accept invitation: ${inviteLink}`,
      '',
      'This invitation expires in 7 days.',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">You're invited to join ${organizationName}</h2>
        <p style="margin-top: 0;">Role: <strong>${roleLabel}</strong></p>
        <p>Click the button below to accept your invitation:</p>
        <p style="margin: 20px 0;">
          <a href="${inviteLink}" style="background:#f97316;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Accept Invitation
          </a>
        </p>
        <p>If the button does not work, use this link:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p style="color:#6b7280;">This invitation expires in 7 days.</p>
      </div>
    `;

    await this.sendEmailSafe({ to: email, subject, text, html });
  },

  async addUserDirectly({
    organizationId,
    email,
    addedById,
    role = 'Member',
    customPermissions = {},
    password,
    sendWelcomeEmail = true,
    departmentIds = [],
    primaryDepartmentId = null,
  }) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    const roleId = await resolveOrganizationRoleIdForOrg(strapi, role || 'Member', organizationId);
    const generatedPassword = password || crypto.randomBytes(8).toString('hex');

    let user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: normalizedEmail },
    });

    let createdUser = false;
    if (!user) {
      user = await strapi.plugins['users-permissions'].services.user.add({
        username: await uniqueUsernameFromEmail(strapi, normalizedEmail),
        email: normalizedEmail,
        password: generatedPassword,
        confirmed: true,
        blocked: false,
      });
      createdUser = true;
    }

    const existingMembership = await strapi.entityService.findMany('api::organization-user.organization-user', {
      filters: {
        user: user.id,
        organization: organizationId,
      },
      limit: 1,
    });

    let membership;
    if (existingMembership.length > 0) {
      membership = await strapi.entityService.update(
        'api::organization-user.organization-user',
        existingMembership[0].id,
        {
          data: {
            role: roleId,
            customPermissions: customPermissions || {},
            isActive: true,
          },
        }
      );
    } else {
      membership = await strapi.entityService.create('api::organization-user.organization-user', {
        data: {
          user: user.id,
          organization: organizationId,
          role: roleId,
          customPermissions: customPermissions || {},
          isActive: true,
          joinedAt: new Date(),
          publishedAt: new Date(),
        },
      });
    }

    if (departmentIds?.length) {
      membership = await applyMembershipDepartments(strapi, membership.id, organizationId, {
        departmentIds,
        primaryDepartmentId,
      });
    }

    /** @type {any} */
    const roleDoc = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, { fields: ['name'] });
    const roleLabel = roleDoc?.name || String(role || 'Member');

    try {
      const actorName = await actorDisplayName(strapi, addedById);
      const reactivated = existingMembership.length > 0;
      const summary = createdUser
        ? `${actorName} added ${normalizedEmail} to the organization as ${roleLabel} (new account)`
        : reactivated
          ? `${actorName} reactivated ${normalizedEmail} in the organization as ${roleLabel}`
          : `${actorName} added ${normalizedEmail} to the organization as ${roleLabel}`;
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId: addedById,
        action: reactivated ? 'update' : 'create',
        subjectType: 'organization_user',
        subjectId: membership.id,
        summary,
        meta: {
          email: normalizedEmail,
          role: roleLabel,
          createdUser,
          module: 'accounts',
        },
      });
    } catch (_) {
      /* logging is best-effort */
    }

    if (sendWelcomeEmail) {
      const organization = await strapi.entityService.findOne('api::organization.organization', organizationId, {
        fields: ['name'],
      });
      const subject = `You've been added to ${organization?.name || 'an organization'}`;
      const text = createdUser
        ? [
            `You were added directly to ${organization?.name || 'an organization'} as ${roleLabel}.`,
            `Login email: ${normalizedEmail}`,
            `Temporary password: ${generatedPassword}`,
            '',
            'Please login and change your password.',
          ].join('\n')
        : `You were added directly to ${organization?.name || 'an organization'} as ${roleLabel}.`;

      await this.sendEmailSafe({
        to: normalizedEmail,
        subject,
        text,
        html: `<p>${text.replace(/\n/g, '<br/>')}</p>`,
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      membership,
      createdUser,
    };
  },

  async createInvitations(organizationId, emails, invitedById, role = 'Member', permissions = {}) {
    const invitations = [];
    const organization = await strapi.entityService.findOne('api::organization.organization', organizationId, {
      fields: ['name'],
    });
    const organizationName = organization?.name || 'your organization';

    const roleId = await resolveOrganizationRoleIdForOrg(strapi, role || 'Member', organizationId);
    /** @type {any} */
    const roleDoc = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, { fields: ['name', 'code'] });
    const roleLabel = roleDoc?.name || String(role || 'Member');
    const persistedRoleCode = roleDoc?.code || String(role || 'member');

    for (const email of emails) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await strapi.entityService.create('api::invitation.invitation', {
        data: {
          email,
          organization: organizationId,
          invitedBy: invitedById,
          role: persistedRoleCode,
          permissions,
          token,
          status: 'pending',
          expiresAt,
          publishedAt: new Date()
        }
      });

      invitations.push(invitation);

      await this.sendInvitationEmail({
        email,
        token,
        organizationName,
        roleLabel,
      });

      try {
        const actorName = await actorDisplayName(strapi, invitedById);
        await logAccountsActivity(strapi, {
          organizationId,
          actorUserId: invitedById,
          action: 'create',
          subjectType: 'invitation',
          subjectId: invitation.id,
          summary: `${actorName} invited ${String(email).trim().toLowerCase()} as ${roleLabel}`,
          meta: { email: String(email).trim().toLowerCase(), role: roleLabel, module: 'accounts' },
        });
      } catch (_) {
        /* logging is best-effort */
      }
    }

    return invitations;
  },

  async acceptInvitation(token, password) {
    const invitation = await strapi.entityService.findMany('api::invitation.invitation', {
      filters: { token, status: 'pending' },
      populate: {
        organization: true
      },
      limit: 1
    });

    if (!invitation || invitation.length === 0) {
      throw new Error('Invalid or expired invitation');
    }

    const inv = invitation[0];
    /** @type {any} */
    const invAny = inv;
    const invitationOrg = invAny?.organization;
    const organizationId =
      typeof invitationOrg === 'object' ? invitationOrg?.id : invitationOrg;
    
    // Check if expired
    if (new Date(inv.expiresAt) < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Check if user already exists
    let user = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email: inv.email }
    });

    // If user doesn't exist, create one
    if (!user && password) {
      user = await strapi.plugins['users-permissions'].services.user.add({
        username: await uniqueUsernameFromEmail(strapi, inv.email),
        email: inv.email,
        password,
        confirmed: true,
        blocked: false
      });
    } else if (!user) {
      throw new Error('User not found and no password provided');
    }

    // Add user to organization
    const roleId = await resolveOrganizationRoleIdForOrg(strapi, inv.role || 'Member', organizationId);

    const membership = await strapi.entityService.create('api::organization-user.organization-user', {
      data: {
        user: user.id,
        organization: organizationId,
        role: roleId,
        customPermissions: inv.permissions,
        isActive: true,
        joinedAt: new Date(),
        publishedAt: new Date()
      }
    });

    try {
      const roleDoc = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, { fields: ['name'] });
      const roleLabel = roleDoc?.name || String(inv.role || 'Member');
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId: user.id,
        action: 'create',
        subjectType: 'organization_user',
        subjectId: membership.id,
        summary: `${inv.email} accepted an invitation and joined as ${roleLabel}`,
        meta: { email: inv.email, role: roleLabel, invitationId: inv.id, module: 'accounts' },
      });
      await logAccountsActivity(strapi, {
        organizationId,
        actorUserId: user.id,
        action: 'update',
        subjectType: 'invitation',
        subjectId: inv.id,
        summary: `Invitation for ${inv.email} was accepted`,
        meta: { email: inv.email, status: 'accepted', module: 'accounts' },
      });
    } catch (_) {
      /* logging is best-effort */
    }

    // Update invitation status
    await strapi.entityService.update('api::invitation.invitation', inv.id, {
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    // Generate JWT
    const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      },
      organization: invitationOrg,
      token: jwt
    };
  }
}));
