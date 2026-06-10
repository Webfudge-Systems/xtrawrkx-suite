// ============================================
// WEBFUDGE UI COMPONENT LIBRARY
// Main entry point for all UI components
// ============================================

// COMPONENTS - Form, Display, and Navigation
export {
  // Form Components
  Button,
  Input,
  workspaceSearchInputClassName,
  WorkspaceSearchInput,
  Select,
  Checkbox,
  Textarea,
  // Display Components
  Accordion,
  Card,
  Badge,
  Avatar,
  Table,
  TableSortPanel,
  Pagination,
  EmptyState,
  TableResultsCount,
  TableEmptyBelow,
  KPICard,
  FormSectionCard,
  SidebarTrialUpsell,
  PwaInstallPrompt,
  LoginBrandCorner,
  LoginProductCredit,
  LoginMobileBrandHeader,
  WorkspaceHeader,
  WorkspaceBackButton,
  workspaceBackButtonClassName,
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
  formatRelativeTime,
  formatTableDate,
  ownerDisplayFromUser,
  NextConnectFlag,
  TableCellNextConnect,
  getNextConnectFlagVariant,
  getNextConnectFlagLabel,
  toDateInputValue,
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
  TableRowActionMenuPortal,
  // Navigation Components
  Tabs,
  TabsWithActions,
  ViewToggleGroup,
  ViewToggleButton,
  Modal,
  WorkspaceSearchModal,
  // Automation / Workflow Components
  NodeHandle,
  WorkflowStatusBadge,
  ActivitiesTimeline,
  EntityActivityPanel,
  LinkifiedText,
  ChatMessageText,
  MentionComposer,
  UnifiedWorkspaceCalendar,
  // Cross-app shared components
  AppPageHeader,
  ProgressBar,
  MeetingsEmbedList,
  TableSortDropdown,
  AccessDeniedPanel,
  WorkspaceLayoutContent,
  entityInfoLabelClass,
  InfoSection,
  DetailColumnHeading,
  InfoRow,
  SidebarCardTitle,
  // Dashboard charts
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
  // Quick Actions FAB
  QuickActionsFab,
} from '../components';

// LAYOUTS - Page structure and containers
export {
  Container,
  Section,
  PageHeader,
  AppShell,
  WorkspaceTopBar,
} from '../layouts';

// FEEDBACK - Loading states and user feedback
export {
  LoadingSpinner,
  PageLoader,
  SkeletonLoader,
  CardSkeleton,
  TableSkeleton,
  KPICardSkeleton,
  KPICardsRowSkeleton,
  WidgetCardSkeleton,
  DashboardContentLoader,
} from '../feedback';

// HOOKS
export { useMediaQuery } from '../hooks/useMediaQuery';
export { useTableSort } from '../hooks/useTableSort';
export {
  useIndustrySelectOptions,
  collectDistinctIndustriesFromList,
} from '../hooks/useIndustrySelectOptions';

// UTILS
export {
  sortTableData,
  compareSortValues,
  enrichColumnsWithSort,
  toggleSortRule,
  readStoredSortRules,
  writeStoredSortRules,
} from '../utils/tableSort';

// THEME - Design tokens and configuration
export { theme, colors, spacing, borderRadius, shadows, typography } from '../themes';
