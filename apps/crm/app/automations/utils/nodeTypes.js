/**
 * Automation node type registry.
 * Each entry defines how a node looks in the library, on the canvas, and in the config panel.
 *
 * configSchema: array of field definitions used by NodeConfigPanel to dynamically render forms.
 *   { key, label, type: 'text'|'select'|'textarea'|'user'|'number', options?, placeholder?, required? }
 */

// ─── TRIGGERS ────────────────────────────────────────────────────────────────

export const TRIGGER_NODES = [
  {
    id: 'trigger_lead_created',
    type: 'trigger',
    label: 'Lead Created',
    description: 'Fires when a new lead company is added',
    iconName: 'Users',
    color: 'orange',
    handles: { input: false, output: true },
    defaultConfig: { source: 'any' },
    configSchema: [
      {
        key: 'source',
        label: 'Lead Source',
        type: 'select',
        options: [
          { value: 'any', label: 'Any source' },
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'social', label: 'Social Media' },
          { value: 'cold_outreach', label: 'Cold Outreach' },
        ],
        placeholder: 'Select lead source',
      },
      {
        key: 'segment',
        label: 'Segment',
        type: 'text',
        placeholder: 'Filter by segment (optional)',
      },
    ],
    templates: [],
  },
  {
    id: 'trigger_deal_updated',
    type: 'trigger',
    label: 'Deal Updated',
    description: 'Fires when a deal changes stage or value',
    iconName: 'Briefcase',
    color: 'orange',
    handles: { input: false, output: true },
    defaultConfig: { field: 'stage', fromStage: 'any', toStage: 'any' },
    configSchema: [
      {
        key: 'field',
        label: 'Watch Field',
        type: 'select',
        options: [
          { value: 'stage', label: 'Stage' },
          { value: 'value', label: 'Deal Value' },
          { value: 'assignedTo', label: 'Assigned User' },
          { value: 'any', label: 'Any field' },
        ],
      },
      {
        key: 'fromStage',
        label: 'From Stage',
        type: 'select',
        options: [
          { value: 'any', label: 'Any' },
          { value: 'prospect', label: 'Prospect' },
          { value: 'proposal', label: 'Proposal' },
          { value: 'negotiation', label: 'Negotiation' },
          { value: 'won', label: 'Won' },
          { value: 'lost', label: 'Lost' },
        ],
      },
      {
        key: 'toStage',
        label: 'To Stage',
        type: 'select',
        options: [
          { value: 'any', label: 'Any' },
          { value: 'prospect', label: 'Prospect' },
          { value: 'proposal', label: 'Proposal' },
          { value: 'negotiation', label: 'Negotiation' },
          { value: 'won', label: 'Won' },
          { value: 'lost', label: 'Lost' },
        ],
      },
    ],
    templates: [],
  },
  {
    id: 'trigger_meeting_completed',
    type: 'trigger',
    label: 'Meeting Completed',
    description: 'Fires when a meeting is marked as done',
    iconName: 'Calendar',
    color: 'orange',
    handles: { input: false, output: true },
    defaultConfig: { meetingType: 'any' },
    configSchema: [
      {
        key: 'meetingType',
        label: 'Meeting Type',
        type: 'select',
        options: [
          { value: 'any', label: 'Any type' },
          { value: 'discovery', label: 'Discovery call' },
          { value: 'demo', label: 'Product demo' },
          { value: 'followup', label: 'Follow-up' },
          { value: 'closing', label: 'Closing' },
        ],
      },
    ],
    templates: [],
  },
  {
    id: 'trigger_contact_created',
    type: 'trigger',
    label: 'Contact Added',
    description: 'Fires when a new contact is created',
    iconName: 'UserPlus',
    color: 'orange',
    handles: { input: false, output: true },
    defaultConfig: {},
    configSchema: [],
    templates: [],
  },
  {
    id: 'trigger_invoice_overdue',
    type: 'trigger',
    label: 'Invoice Overdue',
    description: 'Fires when an invoice passes its due date',
    iconName: 'Receipt',
    color: 'orange',
    handles: { input: false, output: true },
    defaultConfig: { daysOverdue: 1 },
    configSchema: [
      {
        key: 'daysOverdue',
        label: 'Days Overdue',
        type: 'number',
        placeholder: '1',
      },
    ],
    templates: [],
  },
];

// ─── ACTIONS ─────────────────────────────────────────────────────────────────

export const ACTION_NODES = [
  {
    id: 'action_send_email',
    type: 'action',
    label: 'Send Email',
    description: 'Send an email to a contact or user',
    iconName: 'Mail',
    color: 'blue',
    handles: { input: true, output: true },
    defaultConfig: { to: '', subject: '', body: '' },
    configSchema: [
      {
        key: 'to',
        label: 'To (email or variable)',
        type: 'text',
        placeholder: '{{contact.email}}',
        required: true,
      },
      {
        key: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'Email subject',
        required: true,
      },
      {
        key: 'body',
        label: 'Email Body',
        type: 'textarea',
        placeholder: 'Write your email content here…',
        required: true,
      },
    ],
    templates: [],
  },
  {
    id: 'action_create_task',
    type: 'action',
    label: 'Create Task',
    description: 'Create a task and assign it to a user',
    iconName: 'CheckSquare',
    color: 'blue',
    handles: { input: true, output: true },
    defaultConfig: { title: '', assignedTo: '', dueInDays: 1, priority: 'medium' },
    configSchema: [
      {
        key: 'title',
        label: 'Task Title',
        type: 'text',
        placeholder: 'Follow up with {{lead.name}}',
        required: true,
      },
      {
        key: 'assignedTo',
        label: 'Assign To',
        type: 'user',
        placeholder: 'Select user',
      },
      {
        key: 'dueInDays',
        label: 'Due In (days)',
        type: 'number',
        placeholder: '1',
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' },
        ],
      },
    ],
    templates: [],
  },
  {
    id: 'action_update_deal',
    type: 'action',
    label: 'Update Deal',
    description: 'Change a deal field (stage, value, owner)',
    iconName: 'TrendingUp',
    color: 'blue',
    handles: { input: true, output: true },
    defaultConfig: { field: 'stage', value: '' },
    configSchema: [
      {
        key: 'field',
        label: 'Field to Update',
        type: 'select',
        options: [
          { value: 'stage', label: 'Stage' },
          { value: 'value', label: 'Deal Value' },
          { value: 'assignedTo', label: 'Assigned User' },
          { value: 'probability', label: 'Probability' },
        ],
        required: true,
      },
      {
        key: 'value',
        label: 'New Value',
        type: 'text',
        placeholder: 'Enter value or {{variable}}',
        required: true,
      },
    ],
    templates: [],
  },
  {
    id: 'action_assign_user',
    type: 'action',
    label: 'Assign User',
    description: 'Assign a record to a team member',
    iconName: 'UserCheck',
    color: 'blue',
    handles: { input: true, output: true },
    defaultConfig: { assignedTo: '', recordType: 'deal' },
    configSchema: [
      {
        key: 'recordType',
        label: 'Record Type',
        type: 'select',
        options: [
          { value: 'deal', label: 'Deal' },
          { value: 'lead', label: 'Lead Company' },
          { value: 'task', label: 'Task' },
        ],
      },
      {
        key: 'assignedTo',
        label: 'Assign To',
        type: 'user',
        placeholder: 'Select team member',
        required: true,
      },
    ],
    templates: [],
  },
  {
    id: 'action_add_note',
    type: 'action',
    label: 'Add Note / Comment',
    description: 'Log a note on a CRM record',
    iconName: 'MessageSquare',
    color: 'blue',
    handles: { input: true, output: true },
    defaultConfig: { content: '', recordType: 'deal' },
    configSchema: [
      {
        key: 'recordType',
        label: 'Record Type',
        type: 'select',
        options: [
          { value: 'deal', label: 'Deal' },
          { value: 'lead', label: 'Lead Company' },
          { value: 'contact', label: 'Contact' },
        ],
      },
      {
        key: 'content',
        label: 'Note Content',
        type: 'textarea',
        placeholder: 'Note text…',
        required: true,
      },
    ],
    templates: [],
  },
];

// ─── CONDITIONS ───────────────────────────────────────────────────────────────

export const CONDITION_NODES = [
  {
    id: 'condition_if_else',
    type: 'condition',
    label: 'If / Else',
    description: 'Branch workflow based on a condition',
    iconName: 'GitBranch',
    color: 'purple',
    handles: { input: true, outputTrue: true, outputFalse: true },
    defaultConfig: { field: '', operator: 'equals', value: '' },
    configSchema: [
      {
        key: 'field',
        label: 'Field',
        type: 'select',
        options: [
          { value: 'deal.stage', label: 'Deal Stage' },
          { value: 'deal.value', label: 'Deal Value' },
          { value: 'lead.status', label: 'Lead Status' },
          { value: 'lead.segment', label: 'Lead Segment' },
          { value: 'contact.email', label: 'Contact Email' },
          { value: 'task.priority', label: 'Task Priority' },
        ],
        required: true,
      },
      {
        key: 'operator',
        label: 'Operator',
        type: 'select',
        options: [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Does not equal' },
          { value: 'contains', label: 'Contains' },
          { value: 'not_contains', label: 'Does not contain' },
          { value: 'greater_than', label: 'Greater than' },
          { value: 'less_than', label: 'Less than' },
          { value: 'is_empty', label: 'Is empty' },
          { value: 'is_not_empty', label: 'Is not empty' },
        ],
        required: true,
      },
      {
        key: 'value',
        label: 'Value',
        type: 'text',
        placeholder: 'Enter comparison value',
      },
    ],
    templates: [],
  },
];

// ─── UTILITIES ────────────────────────────────────────────────────────────────

export const UTILITY_NODES = [
  {
    id: 'utility_delay',
    type: 'utility',
    label: 'Delay',
    description: 'Wait before continuing the workflow',
    iconName: 'Clock',
    color: 'gray',
    handles: { input: true, output: true },
    defaultConfig: { duration: 1, unit: 'days' },
    configSchema: [
      {
        key: 'duration',
        label: 'Duration',
        type: 'number',
        placeholder: '1',
        required: true,
      },
      {
        key: 'unit',
        label: 'Unit',
        type: 'select',
        options: [
          { value: 'minutes', label: 'Minutes' },
          { value: 'hours', label: 'Hours' },
          { value: 'days', label: 'Days' },
          { value: 'weeks', label: 'Weeks' },
        ],
      },
    ],
    templates: [],
  },
  {
    id: 'utility_webhook',
    type: 'utility',
    label: 'Webhook',
    description: 'Send an HTTP request to an external URL',
    iconName: 'Plug',
    color: 'gray',
    handles: { input: true, output: true },
    defaultConfig: { url: '', method: 'POST', headers: '', body: '' },
    configSchema: [
      {
        key: 'url',
        label: 'Webhook URL',
        type: 'text',
        placeholder: 'https://example.com/webhook',
        required: true,
      },
      {
        key: 'method',
        label: 'Method',
        type: 'select',
        options: [
          { value: 'POST', label: 'POST' },
          { value: 'GET', label: 'GET' },
          { value: 'PUT', label: 'PUT' },
          { value: 'PATCH', label: 'PATCH' },
        ],
      },
      {
        key: 'headers',
        label: 'Headers (JSON)',
        type: 'textarea',
        placeholder: '{"Authorization": "Bearer ..."}',
      },
      {
        key: 'body',
        label: 'Request Body (JSON)',
        type: 'textarea',
        placeholder: '{"key": "{{variable}}"}',
      },
    ],
    templates: [],
  },
];

// ─── CATEGORY MAP ─────────────────────────────────────────────────────────────

export const NODE_CATEGORIES = [
  {
    id: 'triggers',
    label: 'Triggers',
    description: 'Start your workflow',
    nodes: TRIGGER_NODES,
  },
  {
    id: 'actions',
    label: 'Actions',
    description: 'Do something',
    nodes: ACTION_NODES,
  },
  {
    id: 'conditions',
    label: 'Conditions',
    description: 'Branch your logic',
    nodes: CONDITION_NODES,
  },
  {
    id: 'utilities',
    label: 'Utilities',
    description: 'Flow control',
    nodes: UTILITY_NODES,
  },
];

/** Flat map: nodeTypeId → nodeType definition */
export const NODE_TYPE_MAP = Object.fromEntries(
  [...TRIGGER_NODES, ...ACTION_NODES, ...CONDITION_NODES, ...UTILITY_NODES].map((n) => [n.id, n])
);

/** Color classes per category type */
export const NODE_TYPE_COLORS = {
  trigger: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    icon: 'text-orange-600',
    handle: 'bg-orange-400',
    ring: 'ring-orange-300',
    dot: 'bg-orange-400',
  },
  action: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon: 'text-blue-600',
    handle: 'bg-blue-400',
    ring: 'ring-blue-300',
    dot: 'bg-blue-400',
  },
  condition: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    icon: 'text-purple-600',
    handle: 'bg-purple-400',
    ring: 'ring-purple-300',
    dot: 'bg-purple-400',
  },
  utility: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    icon: 'text-gray-500',
    handle: 'bg-gray-400',
    ring: 'ring-gray-300',
    dot: 'bg-gray-400',
  },
};

/** Workflow execution templates (future marketplace) */
export const WORKFLOW_TEMPLATES = [];
