/**
 * CRM navigation structure (sidebar + sub-sidebar).
 * Primary areas: Dashboard, Sales, Workspace, Clients, Analytics.
 */
import {
  LayoutDashboard,
  LayoutGrid,
  FolderKanban,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  FileText,
  Receipt,
  BarChart3,
  CheckSquare,
  FolderOpen,
  DollarSign,
  MessageSquare,
  GitBranch,
  Layers,
  Plug,
  Phone,
  Calendar,
  CalendarDays,
  Activity,
  FileStack,
} from 'lucide-react';

const comingSoonUrl = (feature) => `/coming-soon?feature=${encodeURIComponent(feature)}`;

export const navigationData = [
  {
    id: 'sales',
    label: 'Sales',
    children: [
      {
        id: 'lead-companies',
        label: 'Lead Companies',
        icon: Users,
        href: '/sales/lead-companies',
      },
      {
        id: 'contacts',
        label: 'Contacts',
        icon: UserCheck,
        href: '/sales/contacts',
      },
      {
        id: 'deals',
        label: 'Deals',
        icon: Briefcase,
        href: '/sales/deals',
      },
      {
        id: 'pipeline-board',
        label: 'Pipeline Board',
        icon: BarChart3,
        href: '/sales/deals/pipeline',
      },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    children: [
      { id: 'workspace-home', label: 'Overview', icon: LayoutGrid, href: '/workspace' },
      { id: 'threads', label: 'Threads', icon: MessageSquare, href: '/threads' },
      { id: 'activity-log', label: 'Activity log', icon: Activity, href: '/activities' },
      { id: 'proposals', label: 'Proposals', icon: FileText, href: '/clients/proposals' },
      { id: 'tasks', label: 'Tasks', icon: CheckSquare, href: '/clients/tasks' },
      { id: 'meetings', label: 'Meetings', icon: Calendar, href: '/meetings' },
      { id: 'calendar', label: 'Calendar', icon: CalendarDays, href: '/calendar' },
      { id: 'documents', label: 'Documents', icon: FileStack, href: comingSoonUrl('Documents') },
    ],
  },
  {
    id: 'clients',
    label: 'Clients',
    children: [
      {
        id: 'accounts',
        label: 'Client Accounts',
        icon: Building2,
        href: '/clients/accounts',
      },
      { id: 'invoices', label: 'Invoices', icon: Receipt, href: '/clients/invoices' },
      { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/clients/projects' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    children: [
      { id: 'analytics-home', label: 'Overview', icon: BarChart3, href: '/analytics' },
      {
        id: 'reports',
        label: 'Reports & Forecasts',
        icon: BarChart3,
        href: comingSoonUrl('Analytics'),
      },
    ],
  },
];

/** Primary grid in sidebar (Analytics lives in the bottom System section). */
export const mainNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/', hasSubNav: false },
  { id: 'sales', label: 'Sales', icon: DollarSign, hasSubNav: true },
  { id: 'workspace', label: 'Workspace', icon: FolderKanban, hasSubNav: true },
  { id: 'clients', label: 'Clients', icon: Building2, hasSubNav: true },
];

export const automationNavItems = [
  { label: 'Workflows', icon: GitBranch, href: '/automations' },
  { label: 'Task Templates', icon: Layers, href: comingSoonUrl('Task Templates') },
  { label: 'Documents', icon: FileText, href: comingSoonUrl('Document templates') },
  { label: 'Integrations', icon: Plug, href: comingSoonUrl('Integrations') },
];

export const quickActionItems = [
  { label: 'Add Lead', icon: Users, href: '/sales/lead-companies/new' },
  { label: 'Log Call', icon: Phone, href: comingSoonUrl('Log Call') },
  { label: 'Send WhatsApp', icon: MessageSquare, href: comingSoonUrl('Send WhatsApp') },
  { label: 'Create Proposal', icon: FileText, href: '/clients/proposals' },
  { label: 'Schedule Meeting', icon: Calendar, href: '/meetings/new' },
  { label: 'Add Task', icon: CheckSquare, href: '/clients/tasks' },
];
