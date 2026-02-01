import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAccountAccount extends Struct.CollectionTypeSchema {
  collectionName: 'accounts';
  info: {
    description: 'Client companies and business accounts';
    displayName: 'Account';
    pluralName: 'accounts';
    singularName: 'account';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    address: Schema.Attribute.Text;
    city: Schema.Attribute.String;
    companyName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    contacts: Schema.Attribute.Relation<'oneToMany', 'api::contact.contact'>;
    contracts: Schema.Attribute.Relation<'oneToMany', 'api::contract.contract'>;
    convertedLeads: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'>;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    email: Schema.Attribute.Email;
    emailVerificationToken: Schema.Attribute.String;
    emailVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    employees: Schema.Attribute.String;
    files: Schema.Attribute.Relation<'oneToMany', 'api::file.file'>;
    founded: Schema.Attribute.String;
    healthScore: Schema.Attribute.Integer;
    industry: Schema.Attribute.String & Schema.Attribute.Required;
    invoices: Schema.Attribute.Relation<'oneToMany', 'api::invoice.invoice'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastActivity: Schema.Attribute.DateTime;
    lastLoginAt: Schema.Attribute.DateTime;
    linkedIn: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::account.account'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    password: Schema.Attribute.Password & Schema.Attribute.Required;
    passwordResetExpires: Schema.Attribute.DateTime;
    passwordResetToken: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    portalAccess: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-portal-access.client-portal-access'
    >;
    projects: Schema.Attribute.Relation<'oneToMany', 'api::project.project'>;
    proposals: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'>;
    publishedAt: Schema.Attribute.DateTime;
    revenue: Schema.Attribute.Decimal;
    source: Schema.Attribute.Enumeration<
      ['ONBOARDING', 'LEAD_CONVERSION', 'MANUAL', 'IMPORT']
    > &
      Schema.Attribute.DefaultTo<'MANUAL'>;
    state: Schema.Attribute.String;
    twitter: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<
      ['CUSTOMER', 'PROSPECT', 'PARTNER', 'VENDOR']
    > &
      Schema.Attribute.DefaultTo<'CUSTOMER'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
    zipCode: Schema.Attribute.String;
  };
}

export interface ApiActivityActivity extends Struct.CollectionTypeSchema {
  collectionName: 'activities';
  info: {
    description: 'Activities and interactions across all entities';
    displayName: 'Activity';
    pluralName: 'activities';
    singularName: 'activity';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    activityType: Schema.Attribute.Enumeration<
      ['CALL', 'EMAIL', 'MEETING', 'NOTE', 'TASK', 'DEMO', 'PROPOSAL']
    > &
      Schema.Attribute.Required;
    assignee: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    completedDate: Schema.Attribute.DateTime;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    lead: Schema.Attribute.Relation<'manyToOne', 'api::lead.lead'>;
    leadCompany: Schema.Attribute.Relation<
      'manyToOne',
      'api::lead-company.lead-company'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    scheduledDate: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['SCHEDULED', 'COMPLETED', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'SCHEDULED'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['LEAD', 'CONTACT', 'ACCOUNT', 'DEAL', 'PROJECT', 'TASK']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiAuditLogAuditLog extends Struct.CollectionTypeSchema {
  collectionName: 'audit_logs';
  info: {
    description: 'System audit trail and user actions';
    displayName: 'Audit Log';
    pluralName: 'audit-logs';
    singularName: 'audit-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entityId: Schema.Attribute.String & Schema.Attribute.Required;
    entityType: Schema.Attribute.String & Schema.Attribute.Required;
    ipAddress: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::audit-log.audit-log'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    userAgent: Schema.Attribute.Text;
  };
}

export interface ApiChatMessageChatMessage extends Struct.CollectionTypeSchema {
  collectionName: 'chat_messages';
  info: {
    description: 'Chat messages for entity-specific conversations';
    displayName: 'Chat Message';
    pluralName: 'chat-messages';
    singularName: 'chat-message';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    editedAt: Schema.Attribute.DateTime;
    isDeleted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isEdited: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isThreadStarter: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    leadCompany: Schema.Attribute.Relation<
      'manyToOne',
      'api::lead-company.lead-company'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    parentMessage: Schema.Attribute.Relation<
      'manyToOne',
      'api::chat-message.chat-message'
    >;
    publishedAt: Schema.Attribute.DateTime;
    replies: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiClientAccountClientAccount
  extends Struct.CollectionTypeSchema {
  collectionName: 'client_accounts';
  info: {
    description: 'Converted client companies and business accounts';
    displayName: 'Client Account';
    pluralName: 'client-accounts';
    singularName: 'client-account';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accountManager: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    address: Schema.Attribute.Text;
    chatMessages: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    >;
    city: Schema.Attribute.String;
    communityMemberships: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-membership.community-membership'
    >;
    communitySubmissions: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-submission.community-submission'
    >;
    companyName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    companyType: Schema.Attribute.Enumeration<
      ['startup-corporate', 'investor', 'enablers-academia']
    >;
    contacts: Schema.Attribute.Relation<'oneToMany', 'api::contact.contact'>;
    conversionDate: Schema.Attribute.DateTime;
    convertedFromLead: Schema.Attribute.Relation<
      'oneToOne',
      'api::lead-company.lead-company'
    >;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    email: Schema.Attribute.Email;
    emailVerificationToken: Schema.Attribute.String;
    emailVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    employees: Schema.Attribute.String;
    founded: Schema.Attribute.String;
    healthScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<75>;
    industry: Schema.Attribute.String & Schema.Attribute.Required;
    interests: Schema.Attribute.JSON;
    invoices: Schema.Attribute.Relation<'oneToMany', 'api::invoice.invoice'>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastActivity: Schema.Attribute.String;
    lastActivityDate: Schema.Attribute.DateTime;
    lastLoginAt: Schema.Attribute.DateTime;
    linkedIn: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-account.client-account'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    onboardingCompleted: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    onboardingCompletedAt: Schema.Attribute.DateTime;
    onboardingData: Schema.Attribute.JSON;
    password: Schema.Attribute.Password;
    phone: Schema.Attribute.String;
    projects: Schema.Attribute.Relation<'oneToMany', 'api::project.project'>;
    proposals: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'>;
    publishedAt: Schema.Attribute.DateTime;
    revenue: Schema.Attribute.Decimal;
    selectedCommunities: Schema.Attribute.JSON;
    source: Schema.Attribute.Enumeration<
      ['ONBOARDING', 'MANUAL', 'IMPORT', 'API']
    > &
      Schema.Attribute.DefaultTo<'MANUAL'>;
    state: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['ACTIVE', 'INACTIVE', 'CHURNED', 'ON_HOLD']
    > &
      Schema.Attribute.DefaultTo<'ACTIVE'>;
    subType: Schema.Attribute.String;
    tasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    twitter: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<['CUSTOMER', 'PARTNER', 'VENDOR']> &
      Schema.Attribute.DefaultTo<'CUSTOMER'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
    zipCode: Schema.Attribute.String;
  };
}

export interface ApiClientPortalAccessClientPortalAccess
  extends Struct.CollectionTypeSchema {
  collectionName: 'client_portal_access';
  info: {
    description: 'Client portal access credentials and permissions';
    displayName: 'Client Portal Access';
    pluralName: 'client-portal-accesses';
    singularName: 'client-portal-access';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    accessLevel: Schema.Attribute.Enumeration<['view', 'comment', 'upload']> &
      Schema.Attribute.DefaultTo<'view'>;
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    contact: Schema.Attribute.Relation<'oneToOne', 'api::contact.contact'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastLogin: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-portal-access.client-portal-access'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCommunityMembershipCommunityMembership
  extends Struct.CollectionTypeSchema {
  collectionName: 'community_memberships';
  info: {
    description: 'Active memberships of clients in different communities';
    displayName: 'Community Membership';
    pluralName: 'community-memberships';
    singularName: 'community-membership';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    benefits: Schema.Attribute.JSON;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    community: Schema.Attribute.Enumeration<['XEN', 'XEVFIN', 'XEVTG', 'XDD']> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime;
    joinedAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    lastActivityAt: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-membership.community-membership'
    > &
      Schema.Attribute.Private;
    membershipData: Schema.Attribute.JSON;
    membershipType: Schema.Attribute.Enumeration<
      ['FREE', 'PREMIUM', 'ENTERPRISE']
    > &
      Schema.Attribute.DefaultTo<'FREE'>;
    publishedAt: Schema.Attribute.DateTime;
    restrictions: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<
      ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']
    > &
      Schema.Attribute.DefaultTo<'ACTIVE'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCommunitySubmissionCommunitySubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'community_submissions';
  info: {
    description: 'Client applications to join different communities';
    displayName: 'Community Submission';
    pluralName: 'community-submissions';
    singularName: 'community-submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approvedAt: Schema.Attribute.DateTime;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    community: Schema.Attribute.Enumeration<['XEN', 'XEVFIN', 'XEVTG', 'XDD']> &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-submission.community-submission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    rejectedAt: Schema.Attribute.DateTime;
    rejectionReason: Schema.Attribute.Text;
    reviewedAt: Schema.Attribute.DateTime;
    reviewedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    reviewNotes: Schema.Attribute.Text;
    status: Schema.Attribute.Enumeration<
      ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PENDING_INFO']
    > &
      Schema.Attribute.DefaultTo<'SUBMITTED'>;
    submissionData: Schema.Attribute.JSON & Schema.Attribute.Required;
    submissionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCommunityCommunity extends Struct.CollectionTypeSchema {
  collectionName: 'communities';
  info: {
    description: 'Client communities and groups';
    displayName: 'Community';
    pluralName: 'communities';
    singularName: 'community';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community.community'
    > &
      Schema.Attribute.Private;
    memberships: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-membership.community-membership'
    >;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContactContact extends Struct.CollectionTypeSchema {
  collectionName: 'contacts';
  info: {
    description: 'Contact persons within client companies';
    displayName: 'Contact';
    pluralName: 'contacts';
    singularName: 'contact';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    address: Schema.Attribute.Text;
    assignedTo: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    birthday: Schema.Attribute.Date;
    chatMessages: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    >;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    communityMemberships: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-membership.community-membership'
    >;
    contracts: Schema.Attribute.Relation<'oneToMany', 'api::contract.contract'>;
    contractsSignedBy: Schema.Attribute.Relation<
      'oneToMany',
      'api::contract.contract'
    >;
    convertedLeads: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    department: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    files: Schema.Attribute.Relation<'oneToMany', 'api::file.file'>;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    lastContactDate: Schema.Attribute.DateTime;
    lastName: Schema.Attribute.String & Schema.Attribute.Required;
    leadCompany: Schema.Attribute.Relation<
      'manyToOne',
      'api::lead-company.lead-company'
    >;
    linkedIn: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact.contact'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    portalAccess: Schema.Attribute.Relation<
      'oneToOne',
      'api::client-portal-access.client-portal-access'
    >;
    portalAccessLevel: Schema.Attribute.Enumeration<
      ['FULL_ACCESS', 'PROJECT_VIEW', 'INVOICE_VIEW', 'READ_ONLY', 'NO_ACCESS']
    > &
      Schema.Attribute.DefaultTo<'READ_ONLY'>;
    profileImage: Schema.Attribute.Media<'images'>;
    proposals: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'>;
    proposalsSentTo: Schema.Attribute.Relation<
      'oneToMany',
      'api::proposal.proposal'
    >;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<
      [
        'DECISION_MAKER',
        'INFLUENCER',
        'TECHNICAL_CONTACT',
        'GATEKEEPER',
        'PRIMARY_CONTACT',
      ]
    > &
      Schema.Attribute.DefaultTo<'TECHNICAL_CONTACT'>;
    source: Schema.Attribute.Enumeration<
      ['ONBOARDING', 'LEAD_CONVERSION', 'MANUAL', 'EXTENSION', 'IMPORT']
    > &
      Schema.Attribute.DefaultTo<'MANUAL'>;
    status: Schema.Attribute.Enumeration<
      ['ACTIVE', 'INACTIVE', 'LEFT_COMPANY']
    > &
      Schema.Attribute.DefaultTo<'ACTIVE'>;
    tasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    title: Schema.Attribute.String;
    twitter: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContractContract extends Struct.CollectionTypeSchema {
  collectionName: 'contracts';
  info: {
    description: 'Legal contracts and agreements';
    displayName: 'Contract';
    pluralName: 'contracts';
    singularName: 'contract';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    contractContent: Schema.Attribute.RichText & Schema.Attribute.Required;
    contractValue: Schema.Attribute.Decimal & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    endDate: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contract.contract'
    > &
      Schema.Attribute.Private;
    proposal: Schema.Attribute.Relation<'oneToOne', 'api::proposal.proposal'>;
    publishedAt: Schema.Attribute.DateTime;
    signedAt: Schema.Attribute.DateTime;
    signedByContact: Schema.Attribute.Relation<
      'manyToOne',
      'api::contact.contact'
    >;
    startDate: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['DRAFT', 'SENT', 'SIGNED', 'ACTIVE', 'EXPIRED', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDealGroupDealGroup extends Struct.CollectionTypeSchema {
  collectionName: 'deal_groups';
  info: {
    description: 'Groups or folders to organize deals by department or team';
    displayName: 'Deal Group';
    pluralName: 'deal-groups';
    singularName: 'deal-group';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    department: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::deal-group.deal-group'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    team: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiDealDeal extends Struct.CollectionTypeSchema {
  collectionName: 'deals';
  info: {
    description: 'Sales deals and opportunities';
    displayName: 'Deal';
    pluralName: 'deals';
    singularName: 'deal';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    assignedTo: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    chatMessages: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    >;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    closeDate: Schema.Attribute.DateTime;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    contracts: Schema.Attribute.Relation<'oneToMany', 'api::contract.contract'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dealGroup: Schema.Attribute.Relation<
      'manyToOne',
      'api::deal-group.deal-group'
    >;
    description: Schema.Attribute.Text;
    leadCompany: Schema.Attribute.Relation<
      'manyToOne',
      'api::lead-company.lead-company'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    priority: Schema.Attribute.Enumeration<['LOW', 'MEDIUM', 'HIGH']> &
      Schema.Attribute.DefaultTo<'MEDIUM'>;
    probability: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<50>;
    projects: Schema.Attribute.Relation<'oneToMany', 'api::project.project'>;
    proposals: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'>;
    publishedAt: Schema.Attribute.DateTime;
    source: Schema.Attribute.Enumeration<
      ['FROM_ACCOUNT', 'FROM_LEAD', 'MANUAL']
    > &
      Schema.Attribute.DefaultTo<'FROM_ACCOUNT'>;
    stage: Schema.Attribute.Enumeration<
      ['DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
    > &
      Schema.Attribute.DefaultTo<'DISCOVERY'>;
    tasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    value: Schema.Attribute.Decimal & Schema.Attribute.Required;
    visibility: Schema.Attribute.Enumeration<['PUBLIC', 'PRIVATE']> &
      Schema.Attribute.DefaultTo<'PUBLIC'>;
    visibleTo: Schema.Attribute.Relation<
      'manyToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiDepartmentDepartment extends Struct.CollectionTypeSchema {
  collectionName: 'departments';
  info: {
    description: 'Company departments for user organization';
    displayName: 'Department';
    pluralName: 'departments';
    singularName: 'department';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 20;
      }>;
    color: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 7;
      }> &
      Schema.Attribute.DefaultTo<'#3B82F6'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 500;
      }>;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::department.department'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 100;
      }>;
    publishedAt: Schema.Attribute.DateTime;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiEmailCampaignEmailCampaign
  extends Struct.CollectionTypeSchema {
  collectionName: 'email_campaigns';
  info: {
    description: 'Email marketing campaigns';
    displayName: 'Email Campaign';
    pluralName: 'email-campaigns';
    singularName: 'email-campaign';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    emailLogs: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-log.email-log'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-campaign.email-campaign'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    scheduledDate: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED']
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    subject: Schema.Attribute.String & Schema.Attribute.Required;
    template: Schema.Attribute.Relation<
      'manyToOne',
      'api::email-template.email-template'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmailLogEmailLog extends Struct.CollectionTypeSchema {
  collectionName: 'email_logs';
  info: {
    description: 'Email delivery and engagement tracking';
    displayName: 'Email Log';
    pluralName: 'email-logs';
    singularName: 'email-log';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    campaign: Schema.Attribute.Relation<
      'manyToOne',
      'api::email-campaign.email-campaign'
    >;
    clickedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deliveredAt: Schema.Attribute.DateTime;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    lead: Schema.Attribute.Relation<'manyToOne', 'api::lead.lead'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-log.email-log'
    > &
      Schema.Attribute.Private;
    openedAt: Schema.Attribute.DateTime;
    proposals: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'>;
    publishedAt: Schema.Attribute.DateTime;
    recipientId: Schema.Attribute.String & Schema.Attribute.Required;
    recipientType: Schema.Attribute.Enumeration<
      ['LEAD', 'CONTACT', 'ACCOUNT']
    > &
      Schema.Attribute.Required;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED']
    > &
      Schema.Attribute.DefaultTo<'SENT'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiEmailTemplateEmailTemplate
  extends Struct.CollectionTypeSchema {
  collectionName: 'email_templates';
  info: {
    description: 'Reusable email templates';
    displayName: 'Email Template';
    pluralName: 'email-templates';
    singularName: 'email-template';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    campaigns: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-campaign.email-campaign'
    >;
    category: Schema.Attribute.String;
    content: Schema.Attribute.RichText & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-template.email-template'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    subject: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiFileFile extends Struct.CollectionTypeSchema {
  collectionName: 'custom_files';
  info: {
    description: 'File attachments and documents';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::file.file'> &
      Schema.Attribute.Private;
    mimeType: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    originalName: Schema.Attribute.String & Schema.Attribute.Required;
    path: Schema.Attribute.String & Schema.Attribute.Required;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    relatedId: Schema.Attribute.String & Schema.Attribute.Required;
    relatedType: Schema.Attribute.Enumeration<
      [
        'PROJECT',
        'TASK',
        'DEAL',
        'CONTACT',
        'ACCOUNT',
        'LEAD',
        'PROPOSAL',
        'CONTRACT',
      ]
    > &
      Schema.Attribute.Required;
    size: Schema.Attribute.Integer & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    uploadedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiInvoiceItemInvoiceItem extends Struct.CollectionTypeSchema {
  collectionName: 'invoice_items';
  info: {
    description: 'Individual line items within invoices';
    displayName: 'Invoice Item';
    pluralName: 'invoice-items';
    singularName: 'invoice-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String & Schema.Attribute.Required;
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-item.invoice-item'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Decimal & Schema.Attribute.Required;
    totalPrice: Schema.Attribute.Decimal & Schema.Attribute.Required;
    unitPrice: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiInvoiceInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'invoices';
  info: {
    description: 'Client invoices and billing';
    displayName: 'Invoice';
    pluralName: 'invoices';
    singularName: 'invoice';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    dueDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    files: Schema.Attribute.Relation<'oneToMany', 'api::file.file'>;
    invoiceNumber: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    issueDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    items: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-item.invoice-item'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice.invoice'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    paidDate: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    sentAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    taxAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    totalAmount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLeadCompanyLeadCompany extends Struct.CollectionTypeSchema {
  collectionName: 'lead_companies';
  info: {
    description: 'Potential client companies in the sales pipeline';
    displayName: 'Lead Company';
    pluralName: 'lead-companies';
    singularName: 'lead-company';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    address: Schema.Attribute.Text;
    assignedTo: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    chatMessages: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    >;
    city: Schema.Attribute.String;
    companyName: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    contacts: Schema.Attribute.Relation<'oneToMany', 'api::contact.contact'>;
    convertedAccount: Schema.Attribute.Relation<
      'oneToOne',
      'api::client-account.client-account'
    >;
    convertedAt: Schema.Attribute.DateTime;
    country: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    dealValue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    description: Schema.Attribute.Text;
    email: Schema.Attribute.Email;
    employees: Schema.Attribute.Enumeration<
      [
        'SIZE_1_10',
        'SIZE_11_50',
        'SIZE_51_200',
        'SIZE_201_500',
        'SIZE_501_1000',
        'SIZE_1000_PLUS',
      ]
    >;
    founded: Schema.Attribute.String;
    healthScore: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<50>;
    industry: Schema.Attribute.String & Schema.Attribute.Required;
    lastContactDate: Schema.Attribute.DateTime;
    linkedIn: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lead-company.lead-company'
    > &
      Schema.Attribute.Private;
    nextFollowUpDate: Schema.Attribute.DateTime;
    notes: Schema.Attribute.Text;
    phone: Schema.Attribute.String;
    proposals: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'>;
    publishedAt: Schema.Attribute.DateTime;
    score: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<50>;
    segment: Schema.Attribute.Enumeration<['HOT', 'WARM', 'COLD']> &
      Schema.Attribute.DefaultTo<'WARM'>;
    source: Schema.Attribute.Enumeration<
      [
        'WEBSITE',
        'REFERRAL',
        'COLD_OUTREACH',
        'SOCIAL_MEDIA',
        'EVENT',
        'PARTNER',
        'ADVERTISING',
        'MANUAL',
      ]
    > &
      Schema.Attribute.DefaultTo<'MANUAL'>;
    state: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      [
        'NEW',
        'CONTACTED',
        'QUALIFIED',
        'PROPOSAL_SENT',
        'NEGOTIATION',
        'LOST',
        'CONVERTED',
      ]
    > &
      Schema.Attribute.DefaultTo<'NEW'>;
    subType: Schema.Attribute.String;
    tasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    twitter: Schema.Attribute.String;
    type: Schema.Attribute.Enumeration<
      ['startup-corporate', 'investor', 'enablers-academia']
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
    zipCode: Schema.Attribute.String;
  };
}

export interface ApiLeadImportLeadImport extends Struct.CollectionTypeSchema {
  collectionName: 'lead_imports';
  info: {
    description: 'Lead import operations and tracking';
    displayName: 'Lead Import';
    pluralName: 'lead-imports';
    singularName: 'lead-import';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    completedAt: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    failedRecords: Schema.Attribute.Integer & Schema.Attribute.Required;
    fileName: Schema.Attribute.String & Schema.Attribute.Required;
    importedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    importType: Schema.Attribute.Enumeration<['CSV', 'EXCEL']> &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::lead-import.lead-import'
    > &
      Schema.Attribute.Private;
    processedRecords: Schema.Attribute.Integer & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']
    > &
      Schema.Attribute.DefaultTo<'PENDING'>;
    successfulRecords: Schema.Attribute.Integer & Schema.Attribute.Required;
    totalRecords: Schema.Attribute.Integer & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiLeadLead extends Struct.CollectionTypeSchema {
  collectionName: 'leads';
  info: {
    description: 'Potential customers and prospects';
    displayName: 'Lead';
    pluralName: 'leads';
    singularName: 'lead';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    assignedTo: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    companyName: Schema.Attribute.String & Schema.Attribute.Required;
    convertedAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::account.account'
    >;
    convertedContact: Schema.Attribute.Relation<
      'manyToOne',
      'api::contact.contact'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    emailLogs: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-log.email-log'
    >;
    industry: Schema.Attribute.String;
    lastContactDate: Schema.Attribute.DateTime;
    leadName: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    score: Schema.Attribute.Integer;
    size: Schema.Attribute.String;
    source: Schema.Attribute.Enumeration<
      ['EXTENSION', 'MANUAL', 'IMPORT', 'WEBSITE', 'REFERRAL']
    > &
      Schema.Attribute.DefaultTo<'MANUAL'>;
    status: Schema.Attribute.Enumeration<
      ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'CONVERTED']
    > &
      Schema.Attribute.DefaultTo<'NEW'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    website: Schema.Attribute.String;
  };
}

export interface ApiNotificationNotification
  extends Struct.CollectionTypeSchema {
  collectionName: 'notifications';
  info: {
    description: 'User notifications and alerts';
    displayName: 'Notification';
    pluralName: 'notifications';
    singularName: 'notification';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    isRead: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification.notification'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    readAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      [
        'DEAL_WON',
        'TASK_ASSIGNED',
        'PROJECT_UPDATE',
        'LEAD_ASSIGNED',
        'MENTIONED_IN_COMMENT',
        'SYSTEM',
      ]
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiProjectProject extends Struct.CollectionTypeSchema {
  collectionName: 'projects';
  info: {
    description: 'Client projects and deliverables';
    displayName: 'Project';
    pluralName: 'projects';
    singularName: 'project';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    account: Schema.Attribute.Relation<'manyToOne', 'api::account.account'>;
    activities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    budget: Schema.Attribute.Decimal;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    color: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    endDate: Schema.Attribute.DateTime;
    files: Schema.Attribute.Relation<'oneToMany', 'api::file.file'>;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::project.project'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    projectManager: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    spent: Schema.Attribute.Decimal;
    startDate: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['PLANNING', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'PLANNING'>;
    tasks: Schema.Attribute.Relation<'manyToMany', 'api::task.task'>;
    teamMembers: Schema.Attribute.Relation<
      'manyToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    timeEntries: Schema.Attribute.Relation<
      'oneToMany',
      'api::time-entry.time-entry'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProposalProposal extends Struct.CollectionTypeSchema {
  collectionName: 'proposals';
  info: {
    description: 'Business proposals and quotes';
    displayName: 'Proposal';
    pluralName: 'proposals';
    singularName: 'proposal';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    contract: Schema.Attribute.Relation<'oneToOne', 'api::contract.contract'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    emailLog: Schema.Attribute.Relation<
      'manyToOne',
      'api::email-log.email-log'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::proposal.proposal'
    > &
      Schema.Attribute.Private;
    proposalContent: Schema.Attribute.RichText & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    respondedAt: Schema.Attribute.DateTime;
    sentAt: Schema.Attribute.DateTime;
    sentToContact: Schema.Attribute.Relation<
      'manyToOne',
      'api::contact.contact'
    >;
    status: Schema.Attribute.Enumeration<
      ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    validUntil: Schema.Attribute.DateTime;
  };
}

export interface ApiReportReport extends Struct.CollectionTypeSchema {
  collectionName: 'reports';
  info: {
    description: 'Business reports and analytics';
    displayName: 'Report';
    pluralName: 'reports';
    singularName: 'report';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::report.report'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['DRAFT', 'SCHEDULED', 'GENERATED', 'ERROR']
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    type: Schema.Attribute.Enumeration<
      ['SALES', 'PROJECT', 'TIME', 'REVENUE', 'CUSTOM']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiSubtaskSubtask extends Struct.CollectionTypeSchema {
  collectionName: 'subtasks';
  info: {
    description: 'Sub-tasks within main tasks';
    displayName: 'Subtask';
    pluralName: 'subtasks';
    singularName: 'subtask';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignee: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    childSubtasks: Schema.Attribute.Relation<
      'oneToMany',
      'api::subtask.subtask'
    >;
    collaborators: Schema.Attribute.Relation<
      'manyToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    depth: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    description: Schema.Attribute.Text;
    dueDate: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::subtask.subtask'
    > &
      Schema.Attribute.Private;
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    parentSubtask: Schema.Attribute.Relation<
      'manyToOne',
      'api::subtask.subtask'
    >;
    priority: Schema.Attribute.Enumeration<['LOW', 'MEDIUM', 'HIGH']> &
      Schema.Attribute.DefaultTo<'MEDIUM'>;
    progress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['SCHEDULED', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'CANCELLED']
    > &
      Schema.Attribute.DefaultTo<'SCHEDULED'>;
    task: Schema.Attribute.Relation<'manyToOne', 'api::task.task'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTaskCommentTaskComment extends Struct.CollectionTypeSchema {
  collectionName: 'task_comments';
  info: {
    description: 'Comments and discussions on tasks';
    displayName: 'Task Comment';
    pluralName: 'task-comments';
    singularName: 'task-comment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    commentableId: Schema.Attribute.String & Schema.Attribute.Required;
    commentableType: Schema.Attribute.Enumeration<
      ['TASK', 'SUBTASK', 'LEAD_COMPANY', 'CLIENT_ACCOUNT', 'DEAL', 'CONTACT']
    > &
      Schema.Attribute.Required;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::task-comment.task-comment'
    > &
      Schema.Attribute.Private;
    mentions: Schema.Attribute.JSON;
    parentComment: Schema.Attribute.Relation<
      'manyToOne',
      'api::task-comment.task-comment'
    >;
    publishedAt: Schema.Attribute.DateTime;
    replies: Schema.Attribute.Relation<
      'oneToMany',
      'api::task-comment.task-comment'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiTaskTask extends Struct.CollectionTypeSchema {
  collectionName: 'tasks';
  info: {
    description: 'CRM tasks for entity-specific task management';
    displayName: 'Task';
    pluralName: 'tasks';
    singularName: 'task';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approvedAt: Schema.Attribute.DateTime;
    assignee: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    clientAccount: Schema.Attribute.Relation<
      'manyToOne',
      'api::client-account.client-account'
    >;
    clientApproval: Schema.Attribute.Enumeration<['approved', 'rejected']>;
    collaborators: Schema.Attribute.Relation<
      'manyToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    completedDate: Schema.Attribute.DateTime;
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    creator: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>;
    description: Schema.Attribute.Text;
    leadCompany: Schema.Attribute.Relation<
      'manyToOne',
      'api::lead-company.lead-company'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::task.task'> &
      Schema.Attribute.Private;
    priority: Schema.Attribute.Enumeration<['LOW', 'MEDIUM', 'HIGH']> &
      Schema.Attribute.DefaultTo<'MEDIUM'>;
    progress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    projects: Schema.Attribute.Relation<'manyToMany', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    requiresApproval: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    scheduledDate: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      [
        'SCHEDULED',
        'IN_PROGRESS',
        'IN_REVIEW',
        'CLIENT_REVIEW',
        'APPROVED',
        'COMPLETED',
        'CANCELLED',
      ]
    > &
      Schema.Attribute.DefaultTo<'SCHEDULED'>;
    subtasks: Schema.Attribute.Relation<'oneToMany', 'api::subtask.subtask'>;
    tags: Schema.Attribute.JSON;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTimeEntryTimeEntry extends Struct.CollectionTypeSchema {
  collectionName: 'time_entries';
  info: {
    description: 'Time tracking entries for projects and tasks';
    displayName: 'Time Entry';
    pluralName: 'time-entries';
    singularName: 'time-entry';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    description: Schema.Attribute.String & Schema.Attribute.Required;
    hourlyRate: Schema.Attribute.Decimal;
    hours: Schema.Attribute.Decimal & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::time-entry.time-entry'
    > &
      Schema.Attribute.Private;
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['DRAFT', 'APPROVED', 'BILLED']> &
      Schema.Attribute.DefaultTo<'DRAFT'>;
    taskId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiUserRoleUserRole extends Struct.CollectionTypeSchema {
  collectionName: 'user_roles';
  info: {
    description: 'User roles and permissions';
    displayName: 'User Role';
    pluralName: 'user-roles';
    singularName: 'user-role';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    color: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'from-gray-500 to-gray-600'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Shield'>;
    isSystemRole: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-role.user-role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    permissions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    primaryUsers: Schema.Attribute.Relation<
      'oneToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    publishedAt: Schema.Attribute.DateTime;
    rank: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<10>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'manyToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    visibility: Schema.Attribute.Enumeration<['private', 'team', 'org']> &
      Schema.Attribute.DefaultTo<'private'>;
  };
}

export interface ApiUserSessionUserSession extends Struct.CollectionTypeSchema {
  collectionName: 'user_sessions';
  info: {
    description: 'User authentication sessions';
    displayName: 'User Session';
    pluralName: 'user-sessions';
    singularName: 'user-session';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-session.user-session'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    user: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
  };
}

export interface ApiXtrawrkxUserXtrawrkxUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'xtrawrkx_users';
  info: {
    description: 'Internal company users with roles and departments';
    displayName: 'Xtrawrkx User';
    pluralName: 'xtrawrkx-users';
    singularName: 'xtrawrkx-user';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    assignedActivities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    assignedSubtasks: Schema.Attribute.Relation<
      'oneToMany',
      'api::subtask.subtask'
    >;
    assignedTasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    auditLogs: Schema.Attribute.Relation<
      'oneToMany',
      'api::audit-log.audit-log'
    >;
    authProvider: Schema.Attribute.Enumeration<
      ['PASSWORD', 'FIREBASE', 'HYBRID']
    > &
      Schema.Attribute.DefaultTo<'PASSWORD'>;
    avatar: Schema.Attribute.Media<'images'>;
    bio: Schema.Attribute.Text;
    chatMessages: Schema.Attribute.Relation<
      'oneToMany',
      'api::chat-message.chat-message'
    >;
    communityPreferences: Schema.Attribute.JSON;
    createdActivities: Schema.Attribute.Relation<
      'oneToMany',
      'api::activity.activity'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    createdCampaigns: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-campaign.email-campaign'
    >;
    createdContracts: Schema.Attribute.Relation<
      'oneToMany',
      'api::contract.contract'
    >;
    createdFiles: Schema.Attribute.Relation<'oneToMany', 'api::file.file'>;
    createdInvoices: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice.invoice'
    >;
    createdProjects: Schema.Attribute.Relation<
      'oneToMany',
      'api::project.project'
    >;
    createdProposals: Schema.Attribute.Relation<
      'oneToMany',
      'api::proposal.proposal'
    >;
    createdReports: Schema.Attribute.Relation<
      'oneToMany',
      'api::report.report'
    >;
    createdTasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    createdTemplates: Schema.Attribute.Relation<
      'oneToMany',
      'api::email-template.email-template'
    >;
    department: Schema.Attribute.Relation<
      'manyToOne',
      'api::department.department'
    >;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    emailVerificationToken: Schema.Attribute.String;
    emailVerified: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    firebaseUid: Schema.Attribute.String & Schema.Attribute.Unique;
    firstName: Schema.Attribute.String & Schema.Attribute.Required;
    hiredDate: Schema.Attribute.Date;
    invitationExpires: Schema.Attribute.DateTime;
    invitationToken: Schema.Attribute.String;
    invitedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::xtrawrkx-user.xtrawrkx-user'
    >;
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    lastLoginAt: Schema.Attribute.DateTime;
    lastName: Schema.Attribute.String & Schema.Attribute.Required;
    leadImports: Schema.Attribute.Relation<
      'oneToMany',
      'api::lead-import.lead-import'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::xtrawrkx-user.xtrawrkx-user'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    managedProjects: Schema.Attribute.Relation<
      'oneToMany',
      'api::project.project'
    >;
    notifications: Schema.Attribute.Relation<
      'oneToMany',
      'api::notification.notification'
    >;
    onboardingCompleted: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    onboardingCompletedAt: Schema.Attribute.DateTime;
    onboardingData: Schema.Attribute.JSON;
    ownedAccounts: Schema.Attribute.Relation<
      'oneToMany',
      'api::account.account'
    >;
    ownedContacts: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact.contact'
    >;
    ownedDeals: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'>;
    ownedLeads: Schema.Attribute.Relation<'oneToMany', 'api::lead.lead'>;
    password: Schema.Attribute.Password & Schema.Attribute.Required;
    passwordResetExpires: Schema.Attribute.DateTime;
    passwordResetToken: Schema.Attribute.String;
    phone: Schema.Attribute.String;
    primaryRole: Schema.Attribute.Relation<
      'manyToOne',
      'api::user-role.user-role'
    >;
    projectTeams: Schema.Attribute.Relation<
      'manyToMany',
      'api::project.project'
    >;
    publishedAt: Schema.Attribute.DateTime;
    taskComments: Schema.Attribute.Relation<
      'oneToMany',
      'api::task-comment.task-comment'
    >;
    tasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>;
    timeEntries: Schema.Attribute.Relation<
      'oneToMany',
      'api::time-entry.time-entry'
    >;
    timezone: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'America/New_York'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userRoles: Schema.Attribute.Relation<
      'manyToMany',
      'api::user-role.user-role'
    >;
    userSessions: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-session.user-session'
    >;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.String;
    caption: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.String;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.String & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::account.account': ApiAccountAccount;
      'api::activity.activity': ApiActivityActivity;
      'api::audit-log.audit-log': ApiAuditLogAuditLog;
      'api::chat-message.chat-message': ApiChatMessageChatMessage;
      'api::client-account.client-account': ApiClientAccountClientAccount;
      'api::client-portal-access.client-portal-access': ApiClientPortalAccessClientPortalAccess;
      'api::community-membership.community-membership': ApiCommunityMembershipCommunityMembership;
      'api::community-submission.community-submission': ApiCommunitySubmissionCommunitySubmission;
      'api::community.community': ApiCommunityCommunity;
      'api::contact.contact': ApiContactContact;
      'api::contract.contract': ApiContractContract;
      'api::deal-group.deal-group': ApiDealGroupDealGroup;
      'api::deal.deal': ApiDealDeal;
      'api::department.department': ApiDepartmentDepartment;
      'api::email-campaign.email-campaign': ApiEmailCampaignEmailCampaign;
      'api::email-log.email-log': ApiEmailLogEmailLog;
      'api::email-template.email-template': ApiEmailTemplateEmailTemplate;
      'api::file.file': ApiFileFile;
      'api::invoice-item.invoice-item': ApiInvoiceItemInvoiceItem;
      'api::invoice.invoice': ApiInvoiceInvoice;
      'api::lead-company.lead-company': ApiLeadCompanyLeadCompany;
      'api::lead-import.lead-import': ApiLeadImportLeadImport;
      'api::lead.lead': ApiLeadLead;
      'api::notification.notification': ApiNotificationNotification;
      'api::project.project': ApiProjectProject;
      'api::proposal.proposal': ApiProposalProposal;
      'api::report.report': ApiReportReport;
      'api::subtask.subtask': ApiSubtaskSubtask;
      'api::task-comment.task-comment': ApiTaskCommentTaskComment;
      'api::task.task': ApiTaskTask;
      'api::time-entry.time-entry': ApiTimeEntryTimeEntry;
      'api::user-role.user-role': ApiUserRoleUserRole;
      'api::user-session.user-session': ApiUserSessionUserSession;
      'api::xtrawrkx-user.xtrawrkx-user': ApiXtrawrkxUserXtrawrkxUser;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
    }
  }
}
