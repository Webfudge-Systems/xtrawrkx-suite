// ============================================
// CORE UI COMPONENTS
// Form, Display, and Navigation Components
// ============================================

// FORM COMPONENTS
export { Button } from './Button';
export { Input, workspaceSearchInputClassName, WorkspaceSearchInput } from './Input';
export { Select } from './Select';
export { Checkbox } from './Checkbox';
export { Textarea } from './Textarea';

// DISPLAY COMPONENTS
export { Accordion } from './Accordion';
export { Card } from './Card';
export { Badge } from './Badge';
export { Avatar } from './Avatar';
export { Table } from './Table';
export { TableColumnPicker } from './TableColumnPicker';
export { TableSortPanel } from './TableSortPanel';
export { Pagination } from './Pagination';
export { EmptyState } from './EmptyState';
export { TableResultsCount, TableEmptyBelow } from './TableEmptyBelow';
export { KPICard } from './KPICard';
export { FormSectionCard } from './FormSectionCard';
export { SidebarTrialUpsell } from './SidebarTrialUpsell';
export { PwaInstallPrompt } from './PwaInstallPrompt';
export { WorkspaceHeader } from './WorkspaceHeader';
export {
  LoginBrandCorner,
  LoginProductCredit,
  LoginMobileBrandHeader,
  SidebarProductBranding,
} from './LoginBrandCorner';
export { WorkspaceBackButton, workspaceBackButtonClassName } from './WorkspaceBackButton';
export {
  TableCellCreated,
  TableCellDateOnly,
  TableCellOwner,
  TableCellStatusPill,
  TableCellRole,
  TableCellLeadStatus,
  TableCellText,
  TableCellOrangePill,
  TableCellSource,
  TableCellMultiline,
  TableCellPrimaryContact,
  TableCellTitleSubtitle,
  TableCellProbability,
  TableCellNextConnect,
  formatRelativeTime,
  formatTableDate,
  ownerDisplayFromUser,
  LEAD_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  DEAL_STAGE_OPTIONS,
  ACCOUNT_STATUS_OPTIONS,
  PM_TASK_STATUS_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  PROPOSAL_STATUS_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  crmLeadTableSelectFillProps,
  crmTaskTableSelectFillProps,
  crmDealStageTableSelectFillProps,
  crmAccountTableSelectFillProps,
  crmPmTaskTableSelectFillProps,
  crmProjectTableSelectFillProps,
  crmProposalTableSelectFillProps,
  crmInvoiceTableSelectFillProps,
  TableCellTaskStatus,
  TableCellDealStage,
  TableCellProjectStatus,
  TableCellProposalStatus,
  TableCellInvoiceStatus,
  TableCellLeadStatusSelect,
  TableCellTaskStatusSelect,
  TableCellAccountStatusSelect,
  TableCellProjectStatusSelect,
  TableCellDealStageSelect,
  TableCellProposalStatusSelect,
  TableCellInvoiceStatusSelect,
  TableCellCrmRowActions,
  crmTableActionsColumn,
} from './TableCrmCells';
export { crmTableCellTheme } from '../utils/crmTableCellTheme';
export {
  NextConnectFlag,
  getNextConnectFlagVariant,
  getNextConnectFlagLabel,
  toDateInputValue,
} from './NextConnectFlag';
export { TableRowActionMenuPortal } from './TableRowActionMenuPortal';

// NAVIGATION COMPONENTS
export { Tabs } from './Tabs';
export { TabsWithActions } from './TabsWithActions';
export { ViewToggleGroup, ViewToggleButton } from './ViewToggleGroup';
export { Modal } from './Modal';
export { WorkspaceSearchModal } from './WorkspaceSearchModal';

// AUTOMATION / WORKFLOW COMPONENTS
export { NodeHandle } from './NodeHandle';
export { WorkflowStatusBadge } from './WorkflowStatusBadge';

// CROSS-APP SHARED COMPONENTS
export { AppPageHeader } from './AppPageHeader';
export { ProgressBar } from './ProgressBar';
export { MeetingsEmbedList } from './MeetingsEmbedList';
export { TableSortDropdown } from './TableSortDropdown';
export { AccessDeniedPanel } from './AccessDeniedPanel';
export { WorkspaceLayoutContent } from './WorkspaceLayoutContent';
export {
  entityInfoLabelClass,
  InfoSection,
  DetailColumnHeading,
  InfoRow,
  SidebarCardTitle,
} from './EntityDetailLayout';

// CRM / entity activity (timeline + chats panel)
export { ActivitiesTimeline } from './ActivitiesTimeline';
export { EntityActivityPanel } from './EntityActivityPanel';
export { EntityFilesPanel } from './EntityFilesPanel';
export { ChatMessageAttachments } from './ChatMessageAttachments';
export { LinkifiedText } from './LinkifiedText';
export { ChatMessageText } from './ChatMessageText';
export { MentionComposer } from './MentionComposer';

// Workspace calendar (CRM + PM — meetings, tasks, project timelines)
export { UnifiedWorkspaceCalendar } from './UnifiedWorkspaceCalendar';

// DASHBOARD CHARTS — shared across CRM, PM, and beyond
export {
  GradientStackedBarChart,
  DonutChartFrame,
  DonutChartCenterLabel,
  DONUT_TOOLTIP_WRAPPER_STYLE,
  DashboardChartPanel,
  DashboardChartEmpty,
  DASHBOARD_CHART_ACCENT,
  DashboardBarTooltip,
  DASHBOARD_BAR_TOOLTIP_CURSOR,
  DashboardChartCanvas,
  PRIMARY_ORANGE_SHADES,
  STACK_SERIES,
  STACK_ORDER,
  DashboardKpiRow,
  DashboardInsightShell,
  InsightCountBadge,
  DashboardProgressRow,
  progressBarColorForValue,
} from './DashboardCharts';

// QUICK ACTIONS FAB — shared floating action button base
export { QuickActionsFab } from './QuickActionsFab';
