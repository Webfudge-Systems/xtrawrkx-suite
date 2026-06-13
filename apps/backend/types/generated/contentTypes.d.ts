import type { Schema, Struct } from '@strapi/strapi'

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens'
  info: {
    description: ''
    displayName: 'Api Token'
    name: 'Api Token'
    pluralName: 'api-tokens'
    singularName: 'api-token'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }> &
      Schema.Attribute.DefaultTo<''>
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    expiresAt: Schema.Attribute.DateTime
    lastUsedAt: Schema.Attribute.DateTime
    lifespan: Schema.Attribute.BigInteger
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'>
    publishedAt: Schema.Attribute.DateTime
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions'
  info: {
    description: ''
    displayName: 'API Token Permission'
    name: 'API Token Permission'
    pluralName: 'api-token-permissions'
    singularName: 'api-token-permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions'
  info: {
    description: ''
    displayName: 'Permission'
    name: 'Permission'
    pluralName: 'permissions'
    singularName: 'permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles'
  info: {
    description: ''
    displayName: 'Role'
    name: 'Role'
    pluralName: 'roles'
    singularName: 'role'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> & Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>
  }
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions'
  info: {
    description: 'Session Manager storage'
    displayName: 'Session'
    name: 'Session'
    pluralName: 'sessions'
    singularName: 'session'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
    i18n: {
      localized: false
    }
  }
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private
    childId: Schema.Attribute.String & Schema.Attribute.Private
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    deviceId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private
    origin: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique
    status: Schema.Attribute.String & Schema.Attribute.Private
    type: Schema.Attribute.String & Schema.Attribute.Private
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    userId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private
  }
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens'
  info: {
    description: ''
    displayName: 'Transfer Token'
    name: 'Transfer Token'
    pluralName: 'transfer-tokens'
    singularName: 'transfer-token'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }> &
      Schema.Attribute.DefaultTo<''>
    expiresAt: Schema.Attribute.DateTime
    lastUsedAt: Schema.Attribute.DateTime
    lifespan: Schema.Attribute.BigInteger
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminTransferTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions'
  info: {
    description: ''
    displayName: 'Transfer Token Permission'
    name: 'Transfer Token Permission'
    pluralName: 'transfer-token-permissions'
    singularName: 'transfer-token-permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users'
  info: {
    description: ''
    displayName: 'User'
    name: 'User'
    pluralName: 'users'
    singularName: 'user'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.Private & Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> & Schema.Attribute.Private
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    preferedLanguage: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> & Schema.Attribute.Private
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    username: Schema.Attribute.String
  }
}

export interface ApiAppApp extends Struct.CollectionTypeSchema {
  collectionName: 'apps'
  info: {
    description: 'Applications available in the platform'
    displayName: 'App'
    pluralName: 'apps'
    singularName: 'app'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    basePrice: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    category: Schema.Attribute.String
    color: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    features: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    icon: Schema.Attribute.String
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::app.app'> & Schema.Attribute.Private
    modules: Schema.Attribute.Relation<'oneToMany', 'api::module.module'>
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBankAccountBankAccount extends Struct.CollectionTypeSchema {
  collectionName: 'bank_accounts'
  info: {
    description: 'Bank and cash accounts'
    displayName: 'Bank Account'
    pluralName: 'bank-accounts'
    singularName: 'bank-account'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    accountName: Schema.Attribute.String & Schema.Attribute.Required
    accountNumber: Schema.Attribute.String
    accountType: Schema.Attribute.Enumeration<
      ['checking', 'savings', 'cash', 'credit_card', 'payment_clearing']
    > &
      Schema.Attribute.Required
    bankName: Schema.Attribute.String
    connectionStatus: Schema.Attribute.Enumeration<['manual', 'connected', 'disconnected']> &
      Schema.Attribute.DefaultTo<'manual'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    description: Schema.Attribute.String
    ifscCode: Schema.Attribute.String
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    isPrimary: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    lastSyncAt: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::bank-account.bank-account'> &
      Schema.Attribute.Private
    openingBalance: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    openingBalanceDate: Schema.Attribute.Date
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBankTransactionBankTransaction extends Struct.CollectionTypeSchema {
  collectionName: 'bank_transactions'
  info: {
    description: 'Individual bank account transactions'
    displayName: 'Bank Transaction'
    pluralName: 'bank-transactions'
    singularName: 'bank-transaction'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.Required
    bankAccount: Schema.Attribute.Relation<'manyToOne', 'api::bank-account.bank-account'>
    category: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    description: Schema.Attribute.String
    expense: Schema.Attribute.Relation<'manyToOne', 'api::expense.expense'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::bank-transaction.bank-transaction'
    > &
      Schema.Attribute.Private
    notes: Schema.Attribute.String
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentMade: Schema.Attribute.Relation<'manyToOne', 'api::payment-made.payment-made'>
    paymentReceived: Schema.Attribute.Relation<
      'manyToOne',
      'api::payment-received.payment-received'
    >
    publishedAt: Schema.Attribute.DateTime
    referenceNumber: Schema.Attribute.String
    source: Schema.Attribute.Enumeration<['manual', 'import', 'auto_payment', 'auto_receipt']> &
      Schema.Attribute.DefaultTo<'manual'>
    status: Schema.Attribute.Enumeration<
      ['uncategorized', 'categorized', 'excluded', 'reconciled']
    > &
      Schema.Attribute.DefaultTo<'uncategorized'>
    transactionDate: Schema.Attribute.Date & Schema.Attribute.Required
    transactionType: Schema.Attribute.Enumeration<['credit', 'debit']> & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBillLineItemBillLineItem extends Struct.CollectionTypeSchema {
  collectionName: 'bill_line_items'
  info: {
    description: 'Line items for bills, purchase orders, vendor credits'
    displayName: 'Bill Line Item'
    pluralName: 'bill-line-items'
    singularName: 'bill-line-item'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    bill: Schema.Attribute.Relation<'manyToOne', 'api::bill.bill'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    discountPercent: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    item: Schema.Attribute.Relation<'manyToOne', 'api::item.item'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::bill-line-item.bill-line-item'> &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    quantity: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>
    rate: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiBillBill extends Struct.CollectionTypeSchema {
  collectionName: 'bills'
  info: {
    description: 'Vendor bills / supplier invoices'
    displayName: 'Bill'
    pluralName: 'bills'
    singularName: 'bill'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    balanceDue: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    billDate: Schema.Attribute.Date & Schema.Attribute.Required
    billNumber: Schema.Attribute.String
    billType: Schema.Attribute.Enumeration<
      ['regular', 'subcontractor', 'software_saas', 'travel', 'other']
    > &
      Schema.Attribute.DefaultTo<'regular'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    discountAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    dueDate: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::bill.bill'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paidAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    publishedAt: Schema.Attribute.DateTime
    purchaseOrder: Schema.Attribute.Relation<'manyToOne', 'api::purchase-order.purchase-order'>
    status: Schema.Attribute.Enumeration<
      ['draft', 'pending_approval', 'approved', 'partial', 'paid', 'overdue', 'void']
    > &
      Schema.Attribute.DefaultTo<'draft'>
    subtotal: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
    vendorBillNumber: Schema.Attribute.String
  }
}

export interface ApiChartOfAccountChartOfAccount extends Struct.CollectionTypeSchema {
  collectionName: 'chart_of_accounts'
  info: {
    description: 'Double-entry chart of accounts per organization'
    displayName: 'Chart of Account'
    pluralName: 'chart-of-accounts'
    singularName: 'chart-of-account'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    accountCode: Schema.Attribute.String & Schema.Attribute.Required
    accountName: Schema.Attribute.String & Schema.Attribute.Required
    accountSubType: Schema.Attribute.String
    accountType: Schema.Attribute.Enumeration<
      [
        'asset',
        'liability',
        'equity',
        'income',
        'expense',
        'cost_of_goods_sold',
        'other_income',
        'other_expense',
      ]
    > &
      Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    currentBalance: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    description: Schema.Attribute.Text
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    isSystem: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::chart-of-account.chart-of-account'
    > &
      Schema.Attribute.Private
    openingBalance: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    parentAccount: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiClientAccountClientAccount extends Struct.CollectionTypeSchema {
  collectionName: 'client_accounts'
  info: {
    description: 'Converted client companies and business accounts'
    displayName: 'Client Account'
    pluralName: 'client-accounts'
    singularName: 'client-account'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    accountType: Schema.Attribute.String & Schema.Attribute.DefaultTo<'STANDARD'>
    address: Schema.Attribute.String
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    billingCycle: Schema.Attribute.String & Schema.Attribute.DefaultTo<'MONTHLY'>
    city: Schema.Attribute.String
    companyName: Schema.Attribute.String & Schema.Attribute.Required
    contacts: Schema.Attribute.Relation<'oneToMany', 'api::contact.contact'>
    contractEndDate: Schema.Attribute.DateTime
    contractStartDate: Schema.Attribute.DateTime
    conversionDate: Schema.Attribute.DateTime
    convertedFromLead: Schema.Attribute.Relation<'oneToOne', 'api::lead-company.lead-company'>
    country: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    dealValue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    description: Schema.Attribute.Text
    email: Schema.Attribute.Email
    employees: Schema.Attribute.String
    founded: Schema.Attribute.String
    healthScore: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<75>
    industry: Schema.Attribute.String
    linkedIn: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::client-account.client-account'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    onboardingDate: Schema.Attribute.DateTime
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentTerms: Schema.Attribute.String & Schema.Attribute.DefaultTo<'NET_30'>
    phone: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    state: Schema.Attribute.String
    status: Schema.Attribute.String & Schema.Attribute.DefaultTo<'ACTIVE'>
    twitter: Schema.Attribute.String
    type: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    website: Schema.Attribute.String
    zipCode: Schema.Attribute.String
  }
}

export interface ApiClientPortalAccessClientPortalAccess extends Struct.CollectionTypeSchema {
  collectionName: 'client_portal_access'
  info: {
    description: 'Client portal access credentials and permissions'
    displayName: 'Client Portal Access'
    pluralName: 'client-portal-accesses'
    singularName: 'client-portal-access'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    accessLevel: Schema.Attribute.Enumeration<['view', 'comment', 'upload']> &
      Schema.Attribute.DefaultTo<'view'>
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    forcePasswordReset: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    isCustomRole: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    lastLogin: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-portal-access.client-portal-access'
    > &
      Schema.Attribute.Private
    loginId: Schema.Attribute.String
    password: Schema.Attribute.Password & Schema.Attribute.Required
    permissions: Schema.Attribute.JSON
    publishedAt: Schema.Attribute.DateTime
    roleName: Schema.Attribute.String & Schema.Attribute.DefaultTo<'DEVELOPER'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiClientPortalDocumentClientPortalDocument extends Struct.CollectionTypeSchema {
  collectionName: 'client_portal_documents'
  info: {
    description: 'Documents shared with client portal accounts'
    displayName: 'Client Portal Document'
    pluralName: 'client-portal-documents'
    singularName: 'client-portal-document'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    documents: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>
    issueDate: Schema.Attribute.DateTime & Schema.Attribute.Required
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::client-portal-document.client-portal-document'
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['DRAFT', 'ACTIVE', 'ARCHIVED']> &
      Schema.Attribute.DefaultTo<'DRAFT'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    uploadedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiCommunityMembershipCommunityMembership extends Struct.CollectionTypeSchema {
  collectionName: 'community_memberships'
  info: {
    description: 'Active memberships of clients in different communities'
    displayName: 'Community Membership'
    pluralName: 'community-memberships'
    singularName: 'community-membership'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    benefits: Schema.Attribute.JSON
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    community: Schema.Attribute.Enumeration<['XEN', 'XEVFIN', 'XEVTG', 'XDD']> &
      Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    expiresAt: Schema.Attribute.DateTime
    joinedAt: Schema.Attribute.DateTime & Schema.Attribute.Required
    lastActivityAt: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-membership.community-membership'
    > &
      Schema.Attribute.Private
    membershipData: Schema.Attribute.JSON
    membershipType: Schema.Attribute.Enumeration<['FREE', 'PREMIUM', 'ENTERPRISE']> &
      Schema.Attribute.DefaultTo<'FREE'>
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    restrictions: Schema.Attribute.JSON
    status: Schema.Attribute.Enumeration<['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']> &
      Schema.Attribute.DefaultTo<'ACTIVE'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCommunitySubmissionCommunitySubmission extends Struct.CollectionTypeSchema {
  collectionName: 'community_submissions'
  info: {
    description: 'Client applications to join different communities'
    displayName: 'Community Submission'
    pluralName: 'community-submissions'
    singularName: 'community-submission'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    approvedAt: Schema.Attribute.DateTime
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    community: Schema.Attribute.Enumeration<['XEN', 'XEVFIN', 'XEVTG', 'XDD']> &
      Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-submission.community-submission'
    > &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    rejectedAt: Schema.Attribute.DateTime
    rejectionReason: Schema.Attribute.Text
    reviewedAt: Schema.Attribute.DateTime
    reviewedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    reviewNotes: Schema.Attribute.Text
    status: Schema.Attribute.Enumeration<
      ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PENDING_INFO']
    > &
      Schema.Attribute.DefaultTo<'SUBMITTED'>
    submissionData: Schema.Attribute.JSON & Schema.Attribute.Required
    submissionId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCommunityCommunity extends Struct.CollectionTypeSchema {
  collectionName: 'communities'
  info: {
    description: 'Client communities and groups'
    displayName: 'Community'
    pluralName: 'communities'
    singularName: 'community'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    color: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    icon: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::community.community'> &
      Schema.Attribute.Private
    memberships: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-membership.community-membership'
    >
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiContactContact extends Struct.CollectionTypeSchema {
  collectionName: 'contacts'
  info: {
    description: 'CRM contacts (people)'
    displayName: 'Contact'
    pluralName: 'contacts'
    singularName: 'contact'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    address: Schema.Attribute.String
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    billingAddress: Schema.Attribute.JSON
    birthDate: Schema.Attribute.Date
    city: Schema.Attribute.String
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    clientType: Schema.Attribute.Enumeration<
      ['agency_client', 'direct_client', 'partner', 'individual']
    > &
      Schema.Attribute.DefaultTo<'agency_client'>
    companyName: Schema.Attribute.String
    companyWebsite: Schema.Attribute.String
    contactRole: Schema.Attribute.String
    country: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    creditLimit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    department: Schema.Attribute.String
    email: Schema.Attribute.Email
    firstName: Schema.Attribute.String & Schema.Attribute.Required
    isCustomer: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    isPrimaryContact: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    isVendor: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    jobTitle: Schema.Attribute.String
    lastName: Schema.Attribute.String & Schema.Attribute.Required
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    linkedIn: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::contact.contact'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentTerms: Schema.Attribute.Enumeration<
      ['net_15', 'net_30', 'net_45', 'net_60', 'due_on_receipt']
    > &
      Schema.Attribute.DefaultTo<'net_30'>
    phone: Schema.Attribute.String
    portalAccess: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    preferredContactMethod: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    shippingAddress: Schema.Attribute.JSON
    source: Schema.Attribute.String & Schema.Attribute.DefaultTo<'OTHER'>
    state: Schema.Attribute.String
    status: Schema.Attribute.String & Schema.Attribute.DefaultTo<'ACTIVE'>
    taxNumber: Schema.Attribute.String
    timezone: Schema.Attribute.String
    twitter: Schema.Attribute.String
    unusedCredits: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    zipCode: Schema.Attribute.String
  }
}

export interface ApiCreditNoteCreditNote extends Struct.CollectionTypeSchema {
  collectionName: 'credit_notes'
  info: {
    description: 'Customer credit notes'
    displayName: 'Credit Note'
    pluralName: 'credit-notes'
    singularName: 'credit-note'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    balanceAvailable: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    creditNoteDate: Schema.Attribute.Date
    creditNoteNumber: Schema.Attribute.String
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::credit-note.credit-note'> &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    reason: Schema.Attribute.Text
    status: Schema.Attribute.Enumeration<['draft', 'open', 'closed', 'void']> &
      Schema.Attribute.DefaultTo<'draft'>
    subtotal: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiCrmActivityCrmActivity extends Struct.CollectionTypeSchema {
  collectionName: 'crm_activities'
  info: {
    description: 'Audit timeline entries for CRM entities (contacts, lead companies, etc.)'
    displayName: 'CRM Activity'
    pluralName: 'crm-activities'
    singularName: 'crm-activity'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    action: Schema.Attribute.Enumeration<['create', 'update', 'delete', 'comment']> &
      Schema.Attribute.Required
    actor: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::crm-activity.crm-activity'> &
      Schema.Attribute.Private
    meta: Schema.Attribute.JSON
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    subjectId: Schema.Attribute.Integer & Schema.Attribute.Required
    subjectType: Schema.Attribute.String & Schema.Attribute.Required
    summary: Schema.Attribute.Text & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiDealDeal extends Struct.CollectionTypeSchema {
  collectionName: 'deals'
  info: {
    description: 'CRM sales opportunities / pipeline deals'
    displayName: 'Deal'
    pluralName: 'deals'
    singularName: 'deal'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    dealGroup: Schema.Attribute.String
    deliveryProject: Schema.Attribute.Relation<'oneToOne', 'api::project.project'>
    description: Schema.Attribute.Text
    expectedCloseDate: Schema.Attribute.Date
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::deal.deal'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    priority: Schema.Attribute.Enumeration<['low', 'medium', 'high']> &
      Schema.Attribute.DefaultTo<'medium'>
    probability: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100
          min: 0
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>
    publishedAt: Schema.Attribute.DateTime
    source: Schema.Attribute.String & Schema.Attribute.DefaultTo<'OTHER'>
    stage: Schema.Attribute.Enumeration<
      ['discovery', 'prospect', 'proposal', 'negotiation', 'won', 'lost']
    > &
      Schema.Attribute.DefaultTo<'discovery'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    value: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    visibility: Schema.Attribute.Enumeration<['public', 'private', 'team']> &
      Schema.Attribute.DefaultTo<'public'>
  }
}

export interface ApiDeliveryChallanDeliveryChallan extends Struct.CollectionTypeSchema {
  collectionName: 'delivery_challans'
  info: {
    description: 'Delivery challans for dispatched goods'
    displayName: 'Delivery Challan'
    pluralName: 'delivery-challans'
    singularName: 'delivery-challan'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    challanDate: Schema.Attribute.Date
    challanNumber: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    deliveryAddress: Schema.Attribute.JSON
    deliveryDate: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::delivery-challan.delivery-challan'
    > &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    salesOrder: Schema.Attribute.Relation<'manyToOne', 'api::sales-order.sales-order'>
    status: Schema.Attribute.Enumeration<['draft', 'dispatched', 'delivered', 'cancelled']> &
      Schema.Attribute.DefaultTo<'draft'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiDepartmentDepartment extends Struct.CollectionTypeSchema {
  collectionName: 'departments'
  info: {
    description: 'Organization departments'
    displayName: 'Department'
    pluralName: 'departments'
    singularName: 'department'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    lead: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::department.department'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    organizationUsers: Schema.Attribute.Relation<
      'manyToMany',
      'api::organization-user.organization-user'
    >
    parent: Schema.Attribute.Relation<'manyToOne', 'api::department.department'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiDirectMessageDirectMessage extends Struct.CollectionTypeSchema {
  collectionName: 'direct_messages'
  info: {
    description: '1:1 messages between users in an organization'
    displayName: 'Direct Message'
    pluralName: 'direct-messages'
    singularName: 'direct-message'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::direct-message.direct-message'> &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    recipient: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    sender: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiDocumentDocument extends Struct.CollectionTypeSchema {
  collectionName: 'documents'
  info: {
    description: 'Uploaded financial documents'
    displayName: 'Document'
    pluralName: 'documents'
    singularName: 'document'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    documentType: Schema.Attribute.Enumeration<
      ['invoice', 'bill', 'expense', 'bank_statement', 'contract', 'other']
    > &
      Schema.Attribute.DefaultTo<'other'>
    emailSubject: Schema.Attribute.String
    extractedData: Schema.Attribute.JSON
    fileName: Schema.Attribute.String & Schema.Attribute.Required
    fileSize: Schema.Attribute.Integer
    fileType: Schema.Attribute.String
    fileUrl: Schema.Attribute.String & Schema.Attribute.Required
    inboxType: Schema.Attribute.Enumeration<['all_documents', 'bank_statements']> &
      Schema.Attribute.DefaultTo<'all_documents'>
    isLinked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    linkedBill: Schema.Attribute.Relation<'manyToOne', 'api::bill.bill'>
    linkedExpense: Schema.Attribute.Relation<'manyToOne', 'api::expense.expense'>
    linkedInvoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::document.document'> &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['processing', 'processed', 'unreadable']> &
      Schema.Attribute.DefaultTo<'processing'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    uploadedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiEmailCampaignEmailCampaign extends Struct.CollectionTypeSchema {
  collectionName: 'email_campaigns'
  info: {
    description: 'Email marketing campaigns'
    displayName: 'Email Campaign'
    pluralName: 'email-campaigns'
    singularName: 'email-campaign'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    content: Schema.Attribute.RichText & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    emailLogs: Schema.Attribute.Relation<'oneToMany', 'api::email-log.email-log'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::email-campaign.email-campaign'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    scheduledDate: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED']> &
      Schema.Attribute.DefaultTo<'DRAFT'>
    subject: Schema.Attribute.String & Schema.Attribute.Required
    template: Schema.Attribute.Relation<'manyToOne', 'api::email-template.email-template'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiEmailLogEmailLog extends Struct.CollectionTypeSchema {
  collectionName: 'email_logs'
  info: {
    description: 'Email delivery and engagement tracking'
    displayName: 'Email Log'
    pluralName: 'email-logs'
    singularName: 'email-log'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    campaign: Schema.Attribute.Relation<'manyToOne', 'api::email-campaign.email-campaign'>
    clickedAt: Schema.Attribute.DateTime
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    deliveredAt: Schema.Attribute.DateTime
    email: Schema.Attribute.Email & Schema.Attribute.Required
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::email-log.email-log'> &
      Schema.Attribute.Private
    openedAt: Schema.Attribute.DateTime
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    recipientId: Schema.Attribute.String & Schema.Attribute.Required
    recipientType: Schema.Attribute.Enumeration<['LEAD_COMPANY', 'CONTACT', 'CLIENT_ACCOUNT']> &
      Schema.Attribute.Required
    sentAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<
      ['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'UNSUBSCRIBED']
    > &
      Schema.Attribute.DefaultTo<'SENT'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiEmailTemplateEmailTemplate extends Struct.CollectionTypeSchema {
  collectionName: 'email_templates'
  info: {
    description: 'Reusable email templates'
    displayName: 'Email Template'
    pluralName: 'email-templates'
    singularName: 'email-template'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    campaigns: Schema.Attribute.Relation<'oneToMany', 'api::email-campaign.email-campaign'>
    category: Schema.Attribute.String
    content: Schema.Attribute.RichText & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::email-template.email-template'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    subject: Schema.Attribute.String & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiEstimateLineItemEstimateLineItem extends Struct.CollectionTypeSchema {
  collectionName: 'estimate_line_items'
  info: {
    description: 'Line items for estimates'
    displayName: 'Estimate Line Item'
    pluralName: 'estimate-line-items'
    singularName: 'estimate-line-item'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    discountPercent: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    estimate: Schema.Attribute.Relation<'manyToOne', 'api::estimate.estimate'>
    item: Schema.Attribute.Relation<'manyToOne', 'api::item.item'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::estimate-line-item.estimate-line-item'
    > &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    quantity: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>
    rate: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiEstimateEstimate extends Struct.CollectionTypeSchema {
  collectionName: 'estimates'
  info: {
    description: 'Customer estimates / quotes'
    displayName: 'Estimate'
    pluralName: 'estimates'
    singularName: 'estimate'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    acceptedAt: Schema.Attribute.DateTime
    convertedToInvoice: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    declinedAt: Schema.Attribute.DateTime
    discountAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    discountType: Schema.Attribute.Enumeration<['percentage', 'fixed']>
    discountValue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    estimateDate: Schema.Attribute.Date & Schema.Attribute.Required
    estimateNumber: Schema.Attribute.String
    expiryDate: Schema.Attribute.Date
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::estimate.estimate'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>
    publishedAt: Schema.Attribute.DateTime
    sentAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<
      ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'invoiced']
    > &
      Schema.Attribute.DefaultTo<'draft'>
    subtotal: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    termsConditions: Schema.Attribute.Text
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiExpenseExpense extends Struct.CollectionTypeSchema {
  collectionName: 'expenses'
  info: {
    description: 'Business expenses'
    displayName: 'Expense'
    pluralName: 'expenses'
    singularName: 'expense'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.Required
    approvedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    bankAccount: Schema.Attribute.Relation<'manyToOne', 'api::bank-account.bank-account'>
    billable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    category: Schema.Attribute.Enumeration<
      [
        'subcontractor',
        'software_saas',
        'travel',
        'office',
        'meals',
        'training',
        'marketing',
        'utilities',
        'rent',
        'salaries',
        'other',
      ]
    > &
      Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    description: Schema.Attribute.Text
    expenseDate: Schema.Attribute.Date & Schema.Attribute.Required
    expenseNumber: Schema.Attribute.String
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    invoiced: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    invoicedOn: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::expense.expense'> &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentMode: Schema.Attribute.Enumeration<['cash', 'card', 'bank_transfer', 'upi', 'other']> &
      Schema.Attribute.DefaultTo<'card'>
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>
    publishedAt: Schema.Attribute.DateTime
    referenceNumber: Schema.Attribute.String
    reimbursable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    status: Schema.Attribute.Enumeration<
      ['draft', 'submitted', 'approved', 'rejected', 'reimbursed']
    > &
      Schema.Attribute.DefaultTo<'draft'>
    submittedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
  }
}

export interface ApiInvitationInvitation extends Struct.CollectionTypeSchema {
  collectionName: 'invitations'
  info: {
    description: 'User invitations to organizations'
    displayName: 'Invitation'
    pluralName: 'invitations'
    singularName: 'invitation'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    acceptedAt: Schema.Attribute.DateTime
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    email: Schema.Attribute.Email & Schema.Attribute.Required
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required
    invitedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::invitation.invitation'> &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    permissions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.String & Schema.Attribute.DefaultTo<'Member'>
    status: Schema.Attribute.Enumeration<['pending', 'accepted', 'expired']> &
      Schema.Attribute.DefaultTo<'pending'>
    token: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiInvoiceLineItemInvoiceLineItem extends Struct.CollectionTypeSchema {
  collectionName: 'invoice_line_items'
  info: {
    description: 'Line items for invoices'
    displayName: 'Invoice Line Item'
    pluralName: 'invoice-line-items'
    singularName: 'invoice-line-item'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    discountPercent: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    item: Schema.Attribute.Relation<'manyToOne', 'api::item.item'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice-line-item.invoice-line-item'
    > &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    quantity: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>
    rate: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiInvoiceInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'invoices'
  info: {
    description: 'CRM invoices, proforma invoices and receipts'
    displayName: 'Invoice'
    pluralName: 'invoices'
    singularName: 'invoice'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amountPaid: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    balanceDue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    billToAddress: Schema.Attribute.Text
    billToCompany: Schema.Attribute.String
    billToEmail: Schema.Attribute.Email
    billToGstin: Schema.Attribute.String
    billToName: Schema.Attribute.String
    billToPhone: Schema.Attribute.String
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>
    discount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    documentType: Schema.Attribute.Enumeration<
      ['INVOICE', 'PROFORMA_INVOICE', 'CREDIT_NOTE', 'RECEIPT']
    > &
      Schema.Attribute.DefaultTo<'INVOICE'>
    dueDate: Schema.Attribute.Date
    fromOrgAddress: Schema.Attribute.Text
    fromOrgEmail: Schema.Attribute.Email
    fromOrgGstin: Schema.Attribute.String
    fromOrgLogo: Schema.Attribute.String
    fromOrgName: Schema.Attribute.String
    fromOrgPhone: Schema.Attribute.String
    invoiceDate: Schema.Attribute.Date
    invoiceNumber: Schema.Attribute.String & Schema.Attribute.Required
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    lineItems: Schema.Attribute.JSON
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::invoice.invoice'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    sameAsShipTo: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    shipToAddress: Schema.Attribute.Text
    shipToName: Schema.Attribute.String
    showSignature: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    status: Schema.Attribute.Enumeration<
      ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'PARTIAL']
    > &
      Schema.Attribute.DefaultTo<'DRAFT'>
    subtotal: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    taxLabel: Schema.Attribute.String & Schema.Attribute.DefaultTo<'GST'>
    taxRate: Schema.Attribute.Decimal
    terms: Schema.Attribute.String
    termsAndConditions: Schema.Attribute.Text
    total: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiItemItem extends Struct.CollectionTypeSchema {
  collectionName: 'items'
  info: {
    description: 'Products and services catalog'
    displayName: 'Item'
    pluralName: 'items'
    singularName: 'item'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    description: Schema.Attribute.Text
    hsnCode: Schema.Attribute.String
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::item.item'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    purchaseAccount: Schema.Attribute.String
    purchaseRate: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    rate: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>
    reorderPoint: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    salesAccount: Schema.Attribute.String
    sku: Schema.Attribute.String
    stockOnHand: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    taxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    trackInventory: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    type: Schema.Attribute.Enumeration<
      ['service', 'goods', 'digital', 'retainer_package', 'milestone']
    > &
      Schema.Attribute.DefaultTo<'service'>
    unit: Schema.Attribute.String & Schema.Attribute.DefaultTo<'hrs'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiLeadCompanyLeadCompany extends Struct.CollectionTypeSchema {
  collectionName: 'lead_companies'
  info: {
    description: 'CRM lead companies (potential clients)'
    displayName: 'Lead Company'
    pluralName: 'lead-companies'
    singularName: 'lead-company'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    address: Schema.Attribute.String
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    city: Schema.Attribute.String
    companyName: Schema.Attribute.String & Schema.Attribute.Required
    contacts: Schema.Attribute.Relation<'oneToMany', 'api::contact.contact'>
    convertedAccount: Schema.Attribute.Relation<'oneToOne', 'api::client-account.client-account'>
    convertedAt: Schema.Attribute.DateTime
    country: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    dealValue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    description: Schema.Attribute.Text
    email: Schema.Attribute.Email
    employees: Schema.Attribute.String
    founded: Schema.Attribute.String
    healthScore: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    industry: Schema.Attribute.String
    linkedIn: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::lead-company.lead-company'> &
      Schema.Attribute.Private
    nextConnectDate: Schema.Attribute.Date
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    phone: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    score: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    segment: Schema.Attribute.String & Schema.Attribute.DefaultTo<'WARM'>
    source: Schema.Attribute.String & Schema.Attribute.DefaultTo<'WEBSITE'>
    state: Schema.Attribute.String
    status: Schema.Attribute.String & Schema.Attribute.DefaultTo<'NEW'>
    subType: Schema.Attribute.String
    twitter: Schema.Attribute.String
    type: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    website: Schema.Attribute.String
    zipCode: Schema.Attribute.String
  }
}

export interface ApiManualJournalManualJournal extends Struct.CollectionTypeSchema {
  collectionName: 'manual_journals'
  info: {
    description: 'Double-entry journal entries'
    displayName: 'Manual Journal'
    pluralName: 'manual-journals'
    singularName: 'manual-journal'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    isBalanced: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    journalDate: Schema.Attribute.Date & Schema.Attribute.Required
    journalNumber: Schema.Attribute.String
    lines: Schema.Attribute.JSON
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::manual-journal.manual-journal'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    referenceNumber: Schema.Attribute.String
    reversalOf: Schema.Attribute.String
    source: Schema.Attribute.Enumeration<
      [
        'manual',
        'auto_invoice',
        'auto_payment',
        'auto_bill',
        'auto_expense',
        'auto_receipt',
        'auto_payment_received',
        'auto_payment_made',
      ]
    > &
      Schema.Attribute.DefaultTo<'manual'>
    sourceId: Schema.Attribute.String
    sourceType: Schema.Attribute.String
    status: Schema.Attribute.Enumeration<['draft', 'published']> &
      Schema.Attribute.DefaultTo<'draft'>
    totalCredit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    totalDebit: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiMeetingMeeting extends Struct.CollectionTypeSchema {
  collectionName: 'meetings'
  info: {
    description: 'CRM meetings \u2014 scheduled calls, demos, check-ins, and client meetings'
    displayName: 'Meeting'
    pluralName: 'meetings'
    singularName: 'meeting'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    agenda: Schema.Attribute.Text
    aiSummary: Schema.Attribute.Text
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    attendees: Schema.Attribute.Relation<'manyToMany', 'api::contact.contact'>
    attendeesMeta: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    contact: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>
    endTime: Schema.Attribute.DateTime
    externalMeetingId: Schema.Attribute.String
    isVirtual: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::meeting.meeting'> &
      Schema.Attribute.Private
    location: Schema.Attribute.String
    meetingType: Schema.Attribute.Enumeration<
      ['discovery', 'demo', 'follow_up', 'check_in', 'review', 'internal', 'other']
    > &
      Schema.Attribute.DefaultTo<'other'>
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    organizer: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    outcome: Schema.Attribute.Enumeration<['positive', 'neutral', 'negative', 'pending']> &
      Schema.Attribute.DefaultTo<'pending'>
    publishedAt: Schema.Attribute.DateTime
    recordingUrl: Schema.Attribute.String
    recurrenceRule: Schema.Attribute.String
    reminderPreset: Schema.Attribute.Enumeration<
      ['none', 'tenMin', 'thirtyMin', 'oneHour', 'oneDay']
    > &
      Schema.Attribute.DefaultTo<'thirtyMin'>
    startTime: Schema.Attribute.DateTime & Schema.Attribute.Required
    status: Schema.Attribute.Enumeration<['scheduled', 'completed', 'cancelled', 'no_show']> &
      Schema.Attribute.DefaultTo<'scheduled'>
    title: Schema.Attribute.String & Schema.Attribute.Required
    transcriptUrl: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    visibility: Schema.Attribute.Enumeration<['public', 'private', 'team']> &
      Schema.Attribute.DefaultTo<'public'>
  }
}

export interface ApiModuleModule extends Struct.CollectionTypeSchema {
  collectionName: 'modules'
  info: {
    description: 'Modules available for each app'
    displayName: 'Module'
    pluralName: 'modules'
    singularName: 'module'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    app: Schema.Attribute.Relation<'manyToOne', 'api::app.app'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    features: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    icon: Schema.Attribute.String
    isCore: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::module.module'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    order: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    pricePerUser: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiNotificationNotification extends Struct.CollectionTypeSchema {
  collectionName: 'notifications'
  info: {
    description: 'In-app notifications for users within an organization'
    displayName: 'Notification'
    pluralName: 'notifications'
    singularName: 'notification'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    data: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    isRead: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::notification.notification'> &
      Schema.Attribute.Private
    message: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    readAt: Schema.Attribute.DateTime
    title: Schema.Attribute.String & Schema.Attribute.Required
    type: Schema.Attribute.Enumeration<
      [
        'info',
        'success',
        'warning',
        'error',
        'mention',
        'lead_created',
        'lead_updated',
        'lead_assigned',
        'lead_comment',
        'deal_created',
        'deal_updated',
        'deal_comment',
        'contact_updated',
        'contact_comment',
        'client_account_updated',
        'client_account_comment',
        'task_assigned',
        'task_updated',
        'task_comment',
        'project_updated',
        'project_comment',
        'invite_sent',
        'invite_accepted',
        'system',
      ]
    > &
      Schema.Attribute.DefaultTo<'info'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiOrganizationRoleOrganizationRole extends Struct.CollectionTypeSchema {
  collectionName: 'organization_roles'
  info: {
    description: 'Organization membership roles (system-wide templates and org-specific custom roles)'
    displayName: 'Organization Role'
    pluralName: 'organization-roles'
    singularName: 'organization-role'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    accessLevel: Schema.Attribute.Enumeration<['high', 'medium', 'basic']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'basic'>
    code: Schema.Attribute.UID<'name'> & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.Text
    isSystem: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::organization-role.organization-role'
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    permissions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiOrganizationUserOrganizationUser extends Struct.CollectionTypeSchema {
  collectionName: 'organization_users'
  info: {
    description: 'Users belonging to organizations'
    displayName: 'Organization User'
    pluralName: 'organization-users'
    singularName: 'organization-user'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    customPermissions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    departments: Schema.Attribute.Relation<'manyToMany', 'api::department.department'>
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    joinedAt: Schema.Attribute.DateTime
    lastAccessAt: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::organization-user.organization-user'
    > &
      Schema.Attribute.Private
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    primaryDepartment: Schema.Attribute.Relation<'manyToOne', 'api::department.department'>
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<'manyToOne', 'api::organization-role.organization-role'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    user: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
  }
}

export interface ApiOrganizationOrganization extends Struct.CollectionTypeSchema {
  collectionName: 'organizations'
  info: {
    description: 'Organizations/Enterprises in the platform'
    displayName: 'Organization'
    pluralName: 'organizations'
    singularName: 'organization'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    activeModules: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>
    address: Schema.Attribute.JSON
    baseCurrency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    billSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    booksActivated: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    companyEmail: Schema.Attribute.Email
    companyPhone: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    creditNoteSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    defaultTaxRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<18>
    estimatePrefix: Schema.Attribute.String & Schema.Attribute.DefaultTo<'EST'>
    estimateSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    expenseSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    fiscalYearStart: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 12
          min: 1
        },
        number
      > &
      Schema.Attribute.DefaultTo<4>
    industry: Schema.Attribute.Enumeration<
      [
        'technology',
        'finance',
        'healthcare',
        'education',
        'retail',
        'manufacturing',
        'services',
        'other',
      ]
    >
    invoicePrefix: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INV'>
    invoiceSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    journalSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::organization.organization'> &
      Schema.Attribute.Private
    logo: Schema.Attribute.Media<'images'>
    name: Schema.Attribute.String & Schema.Attribute.Required
    onboardingCompleted: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    organizationUsers: Schema.Attribute.Relation<
      'oneToMany',
      'api::organization-user.organization-user'
    >
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    paymentSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    poSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    publishedAt: Schema.Attribute.DateTime
    retainerSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    securitySettings: Schema.Attribute.JSON &
      Schema.Attribute.DefaultTo<{
        allowedEmailDomains: []
        allowPasswordLogin: true
        passwordMinLength: 8
        requireMfa: false
        sessionTimeoutMinutes: 480
      }>
    size: Schema.Attribute.Enumeration<
      ['size_1_10', 'size_11_50', 'size_51_200', 'size_201_500', 'size_500_plus']
    >
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required
    soSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    status: Schema.Attribute.Enumeration<['trial', 'active', 'suspended', 'cancelled']> &
      Schema.Attribute.DefaultTo<'trial'>
    subscriptions: Schema.Attribute.Relation<'oneToMany', 'api::subscription.subscription'>
    taxName: Schema.Attribute.String & Schema.Attribute.DefaultTo<'GST'>
    trialEndsAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendorSequence: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    website: Schema.Attribute.String
  }
}

export interface ApiPaymentMadePaymentMade extends Struct.CollectionTypeSchema {
  collectionName: 'payments_made'
  info: {
    description: 'Payments made to vendors'
    displayName: 'Payment Made'
    pluralName: 'payments-made'
    singularName: 'payment-made'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.Required
    bankAccount: Schema.Attribute.Relation<'manyToOne', 'api::bank-account.bank-account'>
    bill: Schema.Attribute.Relation<'manyToOne', 'api::bill.bill'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::payment-made.payment-made'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentDate: Schema.Attribute.Date & Schema.Attribute.Required
    paymentMode: Schema.Attribute.Enumeration<
      ['bank_transfer', 'cash', 'cheque', 'credit_card', 'upi', 'other']
    > &
      Schema.Attribute.DefaultTo<'bank_transfer'>
    paymentNumber: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    referenceNumber: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
  }
}

export interface ApiPaymentReceivedPaymentReceived extends Struct.CollectionTypeSchema {
  collectionName: 'payments_received'
  info: {
    description: 'Payments received from customers'
    displayName: 'Payment Received'
    pluralName: 'payments-received'
    singularName: 'payment-received'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.Required
    bankAccount: Schema.Attribute.Relation<'manyToOne', 'api::bank-account.bank-account'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    excessAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    exchangeRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<1>
    invoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    isRefund: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::payment-received.payment-received'
    > &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentDate: Schema.Attribute.Date & Schema.Attribute.Required
    paymentMode: Schema.Attribute.Enumeration<
      ['bank_transfer', 'cash', 'cheque', 'credit_card', 'upi', 'razorpay', 'stripe', 'other']
    > &
      Schema.Attribute.DefaultTo<'bank_transfer'>
    paymentNumber: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    referenceNumber: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiPlatformActivityPlatformActivity extends Struct.CollectionTypeSchema {
  collectionName: 'platform_activities'
  info: {
    description: 'Audit timeline entries for platform-managed organizations'
    displayName: 'Platform Activity'
    pluralName: 'platform-activities'
    singularName: 'platform-activity'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    action: Schema.Attribute.Enumeration<['create', 'update', 'delete']> & Schema.Attribute.Required
    actor: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::platform-activity.platform-activity'
    > &
      Schema.Attribute.Private
    meta: Schema.Attribute.JSON
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'> &
      Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    subjectId: Schema.Attribute.Integer & Schema.Attribute.Required
    subjectType: Schema.Attribute.String & Schema.Attribute.Required
    summary: Schema.Attribute.Text & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiProjectProject extends Struct.CollectionTypeSchema {
  collectionName: 'projects'
  info: {
    description: 'PM projects scoped to an organization'
    displayName: 'Project'
    pluralName: 'projects'
    singularName: 'project'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    billableHours: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    billableStatus: Schema.Attribute.Enumeration<['billable', 'non_billable']> &
      Schema.Attribute.DefaultTo<'billable'>
    billingMethod: Schema.Attribute.Enumeration<
      ['hourly', 'daily_rate_per_user', 'fixed_cost', 'based_on_tasks', 'milestone', 'non_billable']
    > &
      Schema.Attribute.DefaultTo<'hourly'>
    booksStatus: Schema.Attribute.Enumeration<['active', 'completed', 'archived']> &
      Schema.Attribute.DefaultTo<'active'>
    budget: Schema.Attribute.Decimal
    budgetAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    budgetType: Schema.Attribute.Enumeration<['hours', 'amount']> &
      Schema.Attribute.DefaultTo<'amount'>
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    description: Schema.Attribute.Text
    endDate: Schema.Attribute.DateTime
    hourlyRate: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    icon: Schema.Attribute.String
    isPrivate: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::project.project'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    projectCode: Schema.Attribute.String
    projectManager: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    publishedAt: Schema.Attribute.DateTime
    slug: Schema.Attribute.UID<'name'>
    sourceDeal: Schema.Attribute.Relation<'oneToOne', 'api::deal.deal'>
    startDate: Schema.Attribute.DateTime
    status: Schema.Attribute.String & Schema.Attribute.DefaultTo<'PLANNING'>
    tasks: Schema.Attribute.Relation<'manyToMany', 'api::task.task'>
    teamMembers: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>
    totalLoggedHours: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    unbilledAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiProposalProposal extends Struct.CollectionTypeSchema {
  collectionName: 'proposals'
  info: {
    description: 'CRM proposals, SOWs and project quotes'
    displayName: 'Proposal'
    pluralName: 'proposals'
    singularName: 'proposal'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    acceptanceNotes: Schema.Attribute.Text
    assignedTo: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    assumptions: Schema.Attribute.JSON
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    clientAddress: Schema.Attribute.Text
    clientCompanyName: Schema.Attribute.String
    clientContactName: Schema.Attribute.String
    clientEmail: Schema.Attribute.Email
    clientPhone: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    creationMode: Schema.Attribute.Enumeration<['BUILDER', 'UPLOAD']> &
      Schema.Attribute.DefaultTo<'BUILDER'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    date: Schema.Attribute.Date
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>
    documentType: Schema.Attribute.Enumeration<['SOW', 'PROPOSAL', 'QUOTE']> &
      Schema.Attribute.DefaultTo<'PROPOSAL'>
    estimatedTimeline: Schema.Attribute.String
    handoverDeliverables: Schema.Attribute.JSON
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::proposal.proposal'> &
      Schema.Attribute.Private
    milestones: Schema.Attribute.JSON
    modules: Schema.Attribute.JSON
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    outOfScope: Schema.Attribute.JSON
    outOfScopeRate: Schema.Attribute.Decimal
    outOfScopeRateUnit: Schema.Attribute.String
    paymentTerms: Schema.Attribute.String
    preparedByCompany: Schema.Attribute.String
    preparedByEmail: Schema.Attribute.Email
    preparedByName: Schema.Attribute.String
    preparedByPhone: Schema.Attribute.String
    projectName: Schema.Attribute.String
    projectOverview: Schema.Attribute.Text
    proposalFile: Schema.Attribute.Media<'files'>
    proposalNumber: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    securityItems: Schema.Attribute.JSON
    status: Schema.Attribute.Enumeration<['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']> &
      Schema.Attribute.DefaultTo<'DRAFT'>
    taxInfo: Schema.Attribute.String
    title: Schema.Attribute.String
    totalValue: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    validUntil: Schema.Attribute.Date
    warrantyDays: Schema.Attribute.Integer
  }
}

export interface ApiPurchaseOrderPurchaseOrder extends Struct.CollectionTypeSchema {
  collectionName: 'purchase_orders'
  info: {
    description: 'Purchase orders to vendors'
    displayName: 'Purchase Order'
    pluralName: 'purchase-orders'
    singularName: 'purchase-order'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    deliveryAddress: Schema.Attribute.JSON
    expectedDelivery: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::purchase-order.purchase-order'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    poDate: Schema.Attribute.Date
    poNumber: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['draft', 'sent', 'billed', 'cancelled']> &
      Schema.Attribute.DefaultTo<'draft'>
    subtotal: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
  }
}

export interface ApiRecurringExpenseRecurringExpense extends Struct.CollectionTypeSchema {
  collectionName: 'recurring_expenses'
  info: {
    description: 'Recurring expense profiles'
    displayName: 'Recurring Expense'
    pluralName: 'recurring-expenses'
    singularName: 'recurring-expense'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    billable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    category: Schema.Attribute.Enumeration<
      [
        'subcontractor',
        'software_saas',
        'travel',
        'office',
        'meals',
        'training',
        'marketing',
        'utilities',
        'rent',
        'salaries',
        'other',
      ]
    >
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    endDate: Schema.Attribute.Date
    frequency: Schema.Attribute.Enumeration<['weekly', 'monthly', 'quarterly', 'yearly']> &
      Schema.Attribute.DefaultTo<'monthly'>
    lastCreatedAt: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recurring-expense.recurring-expense'
    > &
      Schema.Attribute.Private
    nextExpenseDate: Schema.Attribute.Date
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    profileName: Schema.Attribute.String
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>
    publishedAt: Schema.Attribute.DateTime
    startDate: Schema.Attribute.Date
    status: Schema.Attribute.Enumeration<['active', 'paused', 'expired']> &
      Schema.Attribute.DefaultTo<'active'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendor: Schema.Attribute.Relation<'manyToOne', 'api::vendor.vendor'>
  }
}

export interface ApiRecurringInvoiceRecurringInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'recurring_invoices'
  info: {
    description: 'Recurring invoice profiles'
    displayName: 'Recurring Invoice'
    pluralName: 'recurring-invoices'
    singularName: 'recurring-invoice'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    endDate: Schema.Attribute.Date
    frequency: Schema.Attribute.Enumeration<['weekly', 'monthly', 'quarterly', 'yearly']> &
      Schema.Attribute.DefaultTo<'monthly'>
    lastSentAt: Schema.Attribute.DateTime
    lineItems: Schema.Attribute.JSON
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recurring-invoice.recurring-invoice'
    > &
      Schema.Attribute.Private
    nextInvoiceDate: Schema.Attribute.Date
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    profileName: Schema.Attribute.String
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>
    publishedAt: Schema.Attribute.DateTime
    startDate: Schema.Attribute.Date
    status: Schema.Attribute.Enumeration<['active', 'paused', 'expired']> &
      Schema.Attribute.DefaultTo<'active'>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    totalInvoicesSent: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiRetainerInvoiceRetainerInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'retainer_invoices'
  info: {
    description: 'Retainer / advance invoices'
    displayName: 'Retainer Invoice'
    pluralName: 'retainer-invoices'
    singularName: 'retainer-invoice'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    amount: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.DefaultTo<0>
    balanceDue: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    dueDate: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::retainer-invoice.retainer-invoice'
    > &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paidAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    project: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>
    publishedAt: Schema.Attribute.DateTime
    retainerDate: Schema.Attribute.Date
    retainerNumber: Schema.Attribute.String
    retainerType: Schema.Attribute.Enumeration<['advance', 'monthly', 'project_based']> &
      Schema.Attribute.DefaultTo<'project_based'>
    status: Schema.Attribute.Enumeration<['draft', 'sent', 'viewed', 'partial', 'paid', 'void']> &
      Schema.Attribute.DefaultTo<'draft'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiSalesOrderSalesOrder extends Struct.CollectionTypeSchema {
  collectionName: 'sales_orders'
  info: {
    description: 'Sales orders to customers'
    displayName: 'Sales Order'
    pluralName: 'sales-orders'
    singularName: 'sales-order'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    customer: Schema.Attribute.Relation<'manyToOne', 'api::contact.contact'>
    deliveryAddress: Schema.Attribute.JSON
    expectedShipDate: Schema.Attribute.Date
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::sales-order.sales-order'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    soDate: Schema.Attribute.Date
    soNumber: Schema.Attribute.String
    status: Schema.Attribute.Enumeration<['draft', 'confirmed', 'invoiced', 'cancelled']> &
      Schema.Attribute.DefaultTo<'draft'>
    subtotal: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    taxAmount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    total: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiSubscriptionSubscription extends Struct.CollectionTypeSchema {
  collectionName: 'subscriptions'
  info: {
    description: 'Organization subscriptions to apps and modules'
    displayName: 'Subscription'
    pluralName: 'subscriptions'
    singularName: 'subscription'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    app: Schema.Attribute.Relation<'manyToOne', 'api::app.app'>
    autoRenew: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    basePrice: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    billingCycle: Schema.Attribute.Enumeration<['monthly', 'annual']> &
      Schema.Attribute.DefaultTo<'monthly'>
    calculatedPrice: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    endDate: Schema.Attribute.DateTime
    lastPaymentDate: Schema.Attribute.DateTime
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::subscription.subscription'> &
      Schema.Attribute.Private
    nextBillingDate: Schema.Attribute.DateTime
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentMethod: Schema.Attribute.String
    pricePerUser: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    publishedAt: Schema.Attribute.DateTime
    selectedModules: Schema.Attribute.Relation<'manyToMany', 'api::module.module'>
    startDate: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['trial', 'active', 'suspended', 'cancelled']> &
      Schema.Attribute.DefaultTo<'trial'>
    totalUsers: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiTaskTask extends Struct.CollectionTypeSchema {
  collectionName: 'tasks'
  info: {
    description: 'PM and CRM tasks scoped to an organization'
    displayName: 'Task'
    pluralName: 'tasks'
    singularName: 'task'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    assignee: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    assigner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    assignmentApprovalStatus: Schema.Attribute.Enumeration<
      ['not_required', 'pending', 'approved', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'not_required'>
    assignmentRequestedBy: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    billable: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    clientAccount: Schema.Attribute.Relation<'manyToOne', 'api::client-account.client-account'>
    collaborators: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    deal: Schema.Attribute.Relation<'manyToOne', 'api::deal.deal'>
    description: Schema.Attribute.Text
    endTime: Schema.Attribute.String
    hoursLogged: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>
    invoiced: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    invoicedOn: Schema.Attribute.DateTime
    leadCompany: Schema.Attribute.Relation<'manyToOne', 'api::lead-company.lead-company'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::task.task'> &
      Schema.Attribute.Private
    logDate: Schema.Attribute.Date
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    parent: Schema.Attribute.Relation<'manyToOne', 'api::task.task'>
    pendingCollaborators: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>
    priority: Schema.Attribute.Enumeration<['low', 'medium', 'high']> &
      Schema.Attribute.DefaultTo<'medium'>
    projects: Schema.Attribute.Relation<'manyToMany', 'api::project.project'>
    publishedAt: Schema.Attribute.DateTime
    rate: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    recurrenceCustomUnit: Schema.Attribute.Enumeration<['day', 'week', 'month']> &
      Schema.Attribute.DefaultTo<'day'>
    recurrenceEndsAt: Schema.Attribute.DateTime
    recurrenceFrequency: Schema.Attribute.Enumeration<
      ['none', 'daily', 'weekly', 'monthly', 'custom']
    > &
      Schema.Attribute.DefaultTo<'none'>
    recurrenceGroupId: Schema.Attribute.String
    recurrenceInterval: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>
    recurrenceMonthDay: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 31
          min: 1
        },
        number
      >
    recurrenceWeekdays: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    scheduledDate: Schema.Attribute.DateTime
    startDate: Schema.Attribute.DateTime
    startTime: Schema.Attribute.String
    status: Schema.Attribute.Enumeration<
      [
        'SCHEDULED',
        'IN_PROGRESS',
        'INTERNAL_REVIEW',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'OVERDUE',
      ]
    > &
      Schema.Attribute.DefaultTo<'SCHEDULED'>
    subtasks: Schema.Attribute.Relation<'oneToMany', 'api::task.task'>
    tags: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>
    timeInvoice: Schema.Attribute.Relation<'manyToOne', 'api::invoice.invoice'>
    timeProject: Schema.Attribute.Relation<'manyToOne', 'api::project.project'>
    timerRunning: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    timerStartedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiTeamTeam extends Struct.CollectionTypeSchema {
  collectionName: 'teams'
  info: {
    description: 'Organization teams'
    displayName: 'Team'
    pluralName: 'teams'
    singularName: 'team'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    department: Schema.Attribute.Relation<'manyToOne', 'api::department.department'>
    description: Schema.Attribute.Text
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    leader: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::team.team'> &
      Schema.Attribute.Private
    members: Schema.Attribute.Relation<'manyToMany', 'plugin::users-permissions.user'>
    name: Schema.Attribute.String & Schema.Attribute.Required
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface ApiVendorVendor extends Struct.CollectionTypeSchema {
  collectionName: 'vendors'
  info: {
    description: 'Vendors / suppliers'
    displayName: 'Vendor'
    pluralName: 'vendors'
    singularName: 'vendor'
  }
  options: {
    draftAndPublish: false
  }
  attributes: {
    bankDetails: Schema.Attribute.JSON
    billingAddress: Schema.Attribute.JSON
    companyName: Schema.Attribute.String
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    createdByUser: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'INR'>
    displayName: Schema.Attribute.String & Schema.Attribute.Required
    email: Schema.Attribute.Email
    isActive: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::vendor.vendor'> &
      Schema.Attribute.Private
    notes: Schema.Attribute.Text
    organization: Schema.Attribute.Relation<'manyToOne', 'api::organization.organization'>
    paymentTerms: Schema.Attribute.Enumeration<
      ['net_15', 'net_30', 'net_45', 'net_60', 'due_on_receipt']
    > &
      Schema.Attribute.DefaultTo<'net_30'>
    phone: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    taxNumber: Schema.Attribute.String
    unusedCredits: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    vendorCode: Schema.Attribute.String
  }
}

export interface PluginContentReleasesRelease extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases'
  info: {
    displayName: 'Release'
    pluralName: 'releases'
    singularName: 'release'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    actions: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release-action'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required
    publishedAt: Schema.Attribute.DateTime
    releasedAt: Schema.Attribute.DateTime
    scheduledAt: Schema.Attribute.DateTime
    status: Schema.Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> &
      Schema.Attribute.Required
    timezone: Schema.Attribute.String
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginContentReleasesReleaseAction extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions'
  info: {
    displayName: 'Release Action'
    pluralName: 'release-actions'
    singularName: 'release-action'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    entryDocumentId: Schema.Attribute.String
    isEntryValid: Schema.Attribute.Boolean
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    release: Schema.Attribute.Relation<'manyToOne', 'plugin::content-releases.release'>
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale'
  info: {
    collectionName: 'locales'
    description: ''
    displayName: 'Locale'
    pluralName: 'locales'
    singularName: 'locale'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::i18n.locale'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50
          min: 1
        },
        number
      >
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginReviewWorkflowsWorkflow extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows'
  info: {
    description: ''
    displayName: 'Workflow'
    name: 'Workflow'
    pluralName: 'workflows'
    singularName: 'workflow'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >
    stages: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow-stage'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginReviewWorkflowsWorkflowStage extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages'
  info: {
    description: ''
    displayName: 'Stages'
    name: 'Workflow Stage'
    pluralName: 'workflow-stages'
    singularName: 'workflow-stage'
  }
  options: {
    draftAndPublish: false
    version: '1.1.0'
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private
    name: Schema.Attribute.String
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    workflow: Schema.Attribute.Relation<'manyToOne', 'plugin::review-workflows.workflow'>
  }
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files'
  info: {
    description: ''
    displayName: 'File'
    pluralName: 'files'
    singularName: 'file'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    alternativeText: Schema.Attribute.Text
    caption: Schema.Attribute.Text
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    ext: Schema.Attribute.String
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    formats: Schema.Attribute.JSON
    hash: Schema.Attribute.String & Schema.Attribute.Required
    height: Schema.Attribute.Integer
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'> &
      Schema.Attribute.Private
    mime: Schema.Attribute.String & Schema.Attribute.Required
    name: Schema.Attribute.String & Schema.Attribute.Required
    previewUrl: Schema.Attribute.Text
    provider: Schema.Attribute.String & Schema.Attribute.Required
    provider_metadata: Schema.Attribute.JSON
    publishedAt: Schema.Attribute.DateTime
    related: Schema.Attribute.Relation<'morphToMany'>
    size: Schema.Attribute.Decimal & Schema.Attribute.Required
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    url: Schema.Attribute.Text & Schema.Attribute.Required
    width: Schema.Attribute.Integer
  }
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders'
  info: {
    displayName: 'Folder'
    pluralName: 'folders'
    singularName: 'folder'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1
      }>
    pathId: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.Unique
    publishedAt: Schema.Attribute.DateTime
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginUsersPermissionsPermission extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions'
  info: {
    description: ''
    displayName: 'Permission'
    name: 'permission'
    pluralName: 'permissions'
    singularName: 'permission'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'> &
      Schema.Attribute.Private
    publishedAt: Schema.Attribute.DateTime
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
  }
}

export interface PluginUsersPermissionsRole extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles'
  info: {
    description: ''
    displayName: 'Role'
    name: 'role'
    pluralName: 'roles'
    singularName: 'role'
  }
  options: {
    draftAndPublish: false
  }
  pluginOptions: {
    'content-manager': {
      visible: false
    }
    'content-type-builder': {
      visible: false
    }
  }
  attributes: {
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    description: Schema.Attribute.String
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.role'> &
      Schema.Attribute.Private
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3
      }>
    permissions: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'>
    publishedAt: Schema.Attribute.DateTime
    type: Schema.Attribute.String & Schema.Attribute.Unique
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    users: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'>
  }
}

export interface PluginUsersPermissionsUser extends Struct.CollectionTypeSchema {
  collectionName: 'up_users'
  info: {
    description: ''
    displayName: 'User'
    name: 'user'
    pluralName: 'users'
    singularName: 'user'
  }
  options: {
    draftAndPublish: false
    timestamps: true
  }
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>
    createdAt: Schema.Attribute.DateTime
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    firstName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80
      }>
    lastName: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 80
      }>
    locale: Schema.Attribute.String & Schema.Attribute.Private
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'> &
      Schema.Attribute.Private
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6
      }>
    provider: Schema.Attribute.String
    publishedAt: Schema.Attribute.DateTime
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>
    updatedAt: Schema.Attribute.DateTime
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3
      }>
  }
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken
      'admin::api-token-permission': AdminApiTokenPermission
      'admin::permission': AdminPermission
      'admin::role': AdminRole
      'admin::session': AdminSession
      'admin::transfer-token': AdminTransferToken
      'admin::transfer-token-permission': AdminTransferTokenPermission
      'admin::user': AdminUser
      'api::app.app': ApiAppApp
      'api::bank-account.bank-account': ApiBankAccountBankAccount
      'api::bank-transaction.bank-transaction': ApiBankTransactionBankTransaction
      'api::bill-line-item.bill-line-item': ApiBillLineItemBillLineItem
      'api::bill.bill': ApiBillBill
      'api::chart-of-account.chart-of-account': ApiChartOfAccountChartOfAccount
      'api::client-account.client-account': ApiClientAccountClientAccount
      'api::client-portal-access.client-portal-access': ApiClientPortalAccessClientPortalAccess
      'api::client-portal-document.client-portal-document': ApiClientPortalDocumentClientPortalDocument
      'api::community-membership.community-membership': ApiCommunityMembershipCommunityMembership
      'api::community-submission.community-submission': ApiCommunitySubmissionCommunitySubmission
      'api::community.community': ApiCommunityCommunity
      'api::contact.contact': ApiContactContact
      'api::credit-note.credit-note': ApiCreditNoteCreditNote
      'api::crm-activity.crm-activity': ApiCrmActivityCrmActivity
      'api::deal.deal': ApiDealDeal
      'api::delivery-challan.delivery-challan': ApiDeliveryChallanDeliveryChallan
      'api::department.department': ApiDepartmentDepartment
      'api::direct-message.direct-message': ApiDirectMessageDirectMessage
      'api::document.document': ApiDocumentDocument
      'api::email-campaign.email-campaign': ApiEmailCampaignEmailCampaign
      'api::email-log.email-log': ApiEmailLogEmailLog
      'api::email-template.email-template': ApiEmailTemplateEmailTemplate
      'api::estimate-line-item.estimate-line-item': ApiEstimateLineItemEstimateLineItem
      'api::estimate.estimate': ApiEstimateEstimate
      'api::expense.expense': ApiExpenseExpense
      'api::invitation.invitation': ApiInvitationInvitation
      'api::invoice-line-item.invoice-line-item': ApiInvoiceLineItemInvoiceLineItem
      'api::invoice.invoice': ApiInvoiceInvoice
      'api::item.item': ApiItemItem
      'api::lead-company.lead-company': ApiLeadCompanyLeadCompany
      'api::manual-journal.manual-journal': ApiManualJournalManualJournal
      'api::meeting.meeting': ApiMeetingMeeting
      'api::module.module': ApiModuleModule
      'api::notification.notification': ApiNotificationNotification
      'api::organization-role.organization-role': ApiOrganizationRoleOrganizationRole
      'api::organization-user.organization-user': ApiOrganizationUserOrganizationUser
      'api::organization.organization': ApiOrganizationOrganization
      'api::payment-made.payment-made': ApiPaymentMadePaymentMade
      'api::payment-received.payment-received': ApiPaymentReceivedPaymentReceived
      'api::platform-activity.platform-activity': ApiPlatformActivityPlatformActivity
      'api::project.project': ApiProjectProject
      'api::proposal.proposal': ApiProposalProposal
      'api::purchase-order.purchase-order': ApiPurchaseOrderPurchaseOrder
      'api::recurring-expense.recurring-expense': ApiRecurringExpenseRecurringExpense
      'api::recurring-invoice.recurring-invoice': ApiRecurringInvoiceRecurringInvoice
      'api::retainer-invoice.retainer-invoice': ApiRetainerInvoiceRetainerInvoice
      'api::sales-order.sales-order': ApiSalesOrderSalesOrder
      'api::subscription.subscription': ApiSubscriptionSubscription
      'api::task.task': ApiTaskTask
      'api::team.team': ApiTeamTeam
      'api::vendor.vendor': ApiVendorVendor
      'plugin::content-releases.release': PluginContentReleasesRelease
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction
      'plugin::i18n.locale': PluginI18NLocale
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage
      'plugin::upload.file': PluginUploadFile
      'plugin::upload.folder': PluginUploadFolder
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission
      'plugin::users-permissions.role': PluginUsersPermissionsRole
      'plugin::users-permissions.user': PluginUsersPermissionsUser
    }
  }
}
