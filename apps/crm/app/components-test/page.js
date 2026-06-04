'use client';

import { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Checkbox,
  Textarea,
  Card,
  Badge,
  Avatar,
  Table,
  Pagination,
  EmptyState,
  Tabs,
  TabsWithActions,
  Modal,
} from '@webfudge/ui';
import { Container, PageHeader } from '@webfudge/ui/layouts';
import { LoadingSpinner, PageLoader, SkeletonLoader, CardSkeleton, TableSkeleton } from '@webfudge/ui/feedback';
import { FileQuestion, Plus, Filter } from 'lucide-react';

export default function ComponentsTestPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [selectValue, setSelectValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('buttons');
  const [showLoader, setShowLoader] = useState(false);

  // TabsWithActions state
  const [crmTab, setCrmTab] = useState('all');
  const [crmView, setCrmView] = useState('list');
  const [crmSearch, setCrmSearch] = useState('');

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const tableColumns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'email', label: 'Email', sortable: true },
  ];

  const tableData = [
    { id: 1, name: 'John Doe', status: 'active', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', status: 'inactive', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', status: 'active', email: 'bob@example.com' },
  ];

  const tabsData = [
    {
      id: 'buttons',
      label: 'Buttons & Forms',
      content: (
        <div className="space-y-8">
          {/* Buttons Section */}
          <Card title="Buttons" subtitle="All button variants and sizes">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Variants</h4>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sizes</h4>
                <div className="flex flex-wrap gap-2 items-center">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">States</h4>
                <div className="flex flex-wrap gap-2">
                  <Button disabled>Disabled</Button>
                  <Button loading>Loading...</Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Form Components */}
          <Card title="Form Components" subtitle="Inputs, selects, checkboxes, and textareas">
            <div className="space-y-4">
              <Input
                label="Text Input"
                type="text"
                placeholder="Enter some text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="This is a helper text"
              />

              <Input
                label="Email Input"
                type="email"
                placeholder="email@example.com"
                required
              />

              <Input
                label="Input with Error"
                type="text"
                placeholder="This has an error"
                error="This field is required"
              />

              <Select
                label="Select Dropdown"
                options={selectOptions}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Choose an option"
              />

              <Checkbox
                label="Accept terms and conditions"
                checked={checkboxValue}
                onChange={setCheckboxValue}
              />

              <Textarea
                label="Textarea"
                rows={4}
                placeholder="Enter multiple lines of text"
                value={textareaValue}
                onChange={(e) => setTextareaValue(e.target.value)}
                helperText="Max 500 characters"
              />
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'display',
      label: 'Display Components',
      content: (
        <div className="space-y-8">
          {/* Cards */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Card Variants</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card variant="default" title="Default Card">
                This is a default card variant.
              </Card>
              <Card variant="elevated" title="Elevated Card">
                This card has enhanced shadow.
              </Card>
              <Card variant="outlined" title="Outlined Card">
                This card emphasizes the border.
              </Card>
              <Card variant="ghost" title="Ghost Card">
                This card is transparent.
              </Card>
              <Card variant="glass" title="Glass Card">
                Glass morphism effect.
              </Card>
              <Card variant="glass-strong" title="Strong Glass">
                Enhanced glass effect.
              </Card>
            </div>
          </div>

          {/* Badges */}
          <Card title="Badges" subtitle="Status indicators">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </Card>

          {/* Avatars */}
          <Card title="Avatars" subtitle="User profile images">
            <div className="flex flex-wrap gap-4 items-center">
              <Avatar size="sm" alt="Small Avatar" />
              <Avatar size="md" alt="Medium Avatar" />
              <Avatar size="lg" alt="Large Avatar" />
              <Avatar size="xl" alt="Extra Large Avatar" />
              <Avatar
                src="https://i.pravatar.cc/150?img=1"
                size="lg"
                alt="User with image"
              />
            </div>
          </Card>

          {/* Empty State */}
          <Card title="Empty State">
            <EmptyState
              icon={FileQuestion}
              title="No data found"
              description="Try adjusting your filters or search criteria"
              action={
                <Button variant="primary" size="sm">
                  Reset Filters
                </Button>
              }
            />
          </Card>
        </div>
      ),
    },
    {
      id: 'data',
      label: 'Data & Tables',
      content: (
        <div className="space-y-8">
          {/* Table */}
          <Card title="Data Table">
            <Table
              columns={tableColumns}
              data={tableData}
              onRowClick={(row) => alert(`Clicked row: ${row.name}`)}
            />
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={10}
                totalItems={100}
                itemsPerPage={10}
                onPageChange={setCurrentPage}
              />
            </div>
          </Card>

          {/* Table Skeleton */}
          <Card title="Table Skeleton (Loading State)">
            <TableSkeleton rows={5} columns={4} />
          </Card>
        </div>
      ),
    },
    {
      id: 'navigation',
      label: 'Navigation & Tabs',
      content: (
        <div className="space-y-8">
          {/* Simple Tabs */}
          <Card title="Simple Tabs" subtitle="Default and modern tab styles">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Default Style</h4>
                <Tabs
                  tabs={[
                    { id: 'tab1', label: 'Overview', content: <p className="py-4">Overview content here</p> },
                    { id: 'tab2', label: 'Details', content: <p className="py-4">Details content here</p> },
                    { id: 'tab3', label: 'Settings', content: <p className="py-4">Settings content here</p> },
                  ]}
                  variant="default"
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Pills Style</h4>
                <Tabs
                  tabs={[
                    { id: 'tab1', label: 'Overview', content: <p className="py-4">Overview content</p> },
                    { id: 'tab2', label: 'Details', content: <p className="py-4">Details content</p> },
                  ]}
                  variant="pills"
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Modern Style with Badges</h4>
                <Tabs
                  tabs={[
                    { id: 'tab1', label: 'Active', badge: 24 },
                    { id: 'tab2', label: 'Pending', badge: 8 },
                    { id: 'tab3', label: 'Completed', badge: 156 },
                  ]}
                  variant="modern"
                  showBadges={true}
                />
              </div>
            </div>
          </Card>

          {/* CRM-Style Tabs with Actions */}
          <Card title="CRM Tabs with Actions" subtitle="Advanced tabs with search, filters, and actions">
            <div className="space-y-4">
              <TabsWithActions
                tabs={[
                  { id: 'all', label: 'All Companies', badge: 1159 },
                  { id: 'new', label: 'New', badge: 1156 },
                  { id: 'contacted', label: 'Contacted', badge: 3 },
                  { id: 'qualified', label: 'Qualified', badge: 0 },
                  { id: 'lost', label: 'Lost', badge: 0 },
                ]}
                activeTab={crmTab}
                onTabChange={setCrmTab}
                showSearch={true}
                searchQuery={crmSearch}
                onSearchChange={setCrmSearch}
                searchPlaceholder="Search..."
                showAdd={true}
                onAddClick={() => alert('Add new item')}
                showViewToggle={true}
                activeView={crmView}
                onViewChange={setCrmView}
                viewOptions={['list', 'board']}
                showColumnVisibility={true}
                onColumnVisibilityClick={() => alert('Column visibility')}
                showExport={true}
                onExportClick={() => alert('Export data')}
                variant="glass"
              />

              <div className="text-sm text-gray-600 mt-4 p-4 bg-gray-50 rounded-lg">
                <p><strong>Active Tab:</strong> {crmTab}</p>
                <p><strong>Active View:</strong> {crmView}</p>
                <p><strong>Search Query:</strong> {crmSearch || '(empty)'}</p>
              </div>
            </div>
          </Card>

          {/* Glass Variant */}
          <Card title="Glass Variant" subtitle="Beautiful glassmorphism effect">
            <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-6 rounded-xl">
              <Tabs
                tabs={[
                  { id: 'tab1', label: 'Dashboard', badge: 42 },
                  { id: 'tab2', label: 'Analytics', badge: 15 },
                  { id: 'tab3', label: 'Reports', badge: 8 },
                ]}
                variant="glass"
                showBadges={true}
              />
            </div>
          </Card>
        </div>
      ),
    },
    {
      id: 'feedback',
      label: 'Feedback & Loading',
      content: (
        <div className="space-y-8">
          {/* Loading Spinners */}
          <Card title="Loading Spinners">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sizes</h4>
                <div className="flex items-center gap-4">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">With Message</h4>
                <LoadingSpinner message="Loading data..." />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full Page Loader</h4>
                <Button onClick={() => setShowLoader(!showLoader)}>
                  Toggle Page Loader
                </Button>
                {showLoader && <PageLoader message="Loading page..." />}
              </div>
            </div>
          </Card>

          {/* Skeleton Loaders */}
          <Card title="Skeleton Loaders">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Text Skeleton</h4>
                <SkeletonLoader lines={3} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Card Skeleton</h4>
                <CardSkeleton />
              </div>
            </div>
          </Card>

          {/* Modal */}
          <Card title="Modal Dialog">
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example Modal"
              size="md"
            >
              <div className="space-y-4">
                <p className="text-gray-600">
                  This is an example modal dialog. You can put any content here.
                </p>
                <Input
                  label="Modal Input"
                  placeholder="Type something..."
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>
                    Save
                  </Button>
                </div>
              </div>
            </Modal>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="UI Components Showcase"
        subtitle="Testing all components from @webfudge/ui package"
        breadcrumb={[
          { label: 'Home', href: '/' },
          { label: 'Components Test' },
        ]}
        showSearch={true}
      />

      <Container size="default">
        <div className="py-8">
          {/* Info Card */}
          <Card variant="glass" className="mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Badge variant="info">Test Page</Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Component Testing Environment
                </h3>
                <p className="text-gray-600">
                  This page showcases all components from the <code className="px-2 py-1 bg-gray-100 rounded text-sm">@webfudge/ui</code> package.
                  Use the tabs below to explore different component categories.
                </p>
              </div>
            </div>
          </Card>

          {/* Tabs with Components */}
          <Tabs
            tabs={tabsData}
            defaultTab="buttons"
            onChange={setActiveTab}
          />
        </div>
      </Container>
    </>
  );
}
