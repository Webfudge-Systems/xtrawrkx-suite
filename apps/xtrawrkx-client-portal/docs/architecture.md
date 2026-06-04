# 🌐 Client Portal – Frontend Architecture

## 📋 Overview
The Client Portal is a comprehensive web application built with Next.js 14, providing clients and internal staff with a centralized platform for project management, file sharing, communication, and administrative controls.

---

## 🏗️ Technology Stack
- **Framework:** Next.js 14 with App Router
- **Styling:** TailwindCSS with custom design system
- **Language:** JavaScript/JSX
- **State Management:** React hooks (useState, useEffect)
- **Data:** Centralized dummy data for development

---

## 1️⃣ Authentication & Access Control
**Folder:** `apps/client-portal/src/components/auth/`

### Components:
- **SignInForm.jsx** → Username/password input with 2FA optional support
- **SignUpForm.jsx** → Registration fields (name, email, password, role)
- **ForgotPasswordForm.jsx** → Email reset input and validation
- **AuthCard.jsx** → Wrapper component for auth forms
- **AuthButton.jsx** → Customized auth-specific buttons
- **AuthInput.jsx** → Specialized input components for auth
- **AuthToggle.jsx** → Toggle between sign in/up modes

### Features:
- 🔐 Role-based authentication (Admin, User, Staff)
- 🔒 Password validation and security
- 📧 Email-based password recovery
- 🎨 Consistent auth UI/UX

**Route:** `/auth` - Entry point for all authentication flows

---

## 2️⃣ Dashboard
**Folder:** `apps/client-portal/src/app/dashboard/`  
**Components:** `apps/client-portal/src/components/dashboard/`

### Components:
- **DashboardHeader.jsx** → Page title, quick actions, and breadcrumbs
- **ProjectCard.jsx** → Active projects snapshot with progress indicators
- **MilestoneCard.jsx** → Key milestone status and upcoming deadlines
- **NotificationList.jsx** → Latest notifications and messages preview
- **MeetingCard.jsx** → Upcoming meetings with participant info
- **StatsCard.jsx** → Key metrics and project statistics
- **SidebarNav.jsx** → Main navigation with active state indicators
- **TopNavbar.jsx** → User avatar, notifications, search functionality

### Features:
- 📊 **At-a-glance project health** overview
- 📈 Progress tracking and milestone monitoring
- 🔔 Real-time notification previews
- 📅 Meeting and deadline management
- 🎯 Quick access to key actions

**Route:** `/dashboard` - Main landing page after authentication

---

## 3️⃣ Notifications / Inbox
**Folder:** `apps/client-portal/src/app/notifications/`  
**Components:** `apps/client-portal/src/components/notifications/`

### Components:
- **NotificationItem.jsx** → Single notification with type-specific icons and styles
- **NotificationFilter.jsx** → Filter bar (All, Unread, Files, Comments, Milestones, Messages)
- **NotificationList.jsx** → Scrollable list of notifications with pagination
- **NotificationFilter.jsx** → Advanced filtering and search capabilities

### Features:
- 📬 **Centralized activity feed** for all project updates
- 🏷️ Notification categorization (file, comment, milestone, chat, system)
- ✅ Read/unread status tracking
- 🔍 Advanced filtering and search
- ⏰ Time-based organization (2h ago, 1d ago, etc.)

**Route:** `/notifications` - Dedicated notifications management page

---

## 4️⃣ Project Viewer
**Folder:** `apps/client-portal/src/app/projects/[id]/`  
**Components:** `apps/client-portal/src/components/projects/`

### Components:
- **ProjectHeader.jsx** → Project title, description, owner, status badge, completion percentage
- **ProjectTimeline.jsx** → Interactive milestones with progress bar and status indicators
- **ProjectFiles.jsx** → Project-specific file repository with upload/download capabilities
- **ProjectComments.jsx** → Threaded comments system with reply functionality
- **ProjectChat.jsx** → Real-time chat panel with message history
- **ProjectHeader.jsx** → Project overview and key information
- **Timeline.jsx** → Milestone tracking and progress visualization
- **FileRepository.jsx** → File management within project context
- **CommentsSection.jsx** → Collaborative feedback system
- **ChatThread.jsx** → Project-specific communication channel

### Features:
- 🎯 **The heart of the portal** - deep-dive project management
- 📋 Comprehensive project overview with key metrics
- 📅 Milestone tracking with visual progress indicators
- 📁 File repository with version control
- 💬 Collaborative commenting and feedback system
- 💬 Real-time project chat for team communication
- 📊 Progress tracking and completion status

**Route:** `/projects/[id]` - Dynamic project detail pages

---

## 5️⃣ File Management
**Folder:** `apps/client-portal/src/app/files/`  
**Components:** `apps/client-portal/src/components/files/`

### Components:
- **FileTable.jsx** → Global repository table (File | Project | Uploaded By | Date | Version | Actions)
- **FileUploadButton.jsx** → File upload with progress bar and drag-and-drop support
- **FileVersionHistory.jsx** → Slide-over panel with complete version history
- **FileFilter.jsx** → Advanced filters (Project, File Type, Uploader, Date range)

### Features:
- 🌐 **Global view of all files** across all projects
- 📤 File upload with progress tracking
- 📊 File type detection and appropriate icons
- 🔍 Advanced filtering and search capabilities
- 📋 Version history and change tracking
- 👥 User attribution and upload tracking
- 📁 Project-based file organization

**Route:** `/files` - Centralized file management hub

---

## 6️⃣ Settings / Admin
**Folder:** `apps/client-portal/src/app/settings/`  
**Components:** `apps/client-portal/src/components/settings/`

### Components:
- **BrandingForm.jsx** → Logo upload, color picker, custom domain setup
- **UserManagementTable.jsx** → Complete user list with roles, status, and management actions
- **InviteUserModal.jsx** → Email-based user invitation with role selection
- **RoleBadge.jsx** → Visual role indicators (Admin/User/Staff) with color coding
- **AccountPreferences.jsx** → Notification toggles, password management, regional settings

### Features:
- 🎨 **Admin-level customization** and branding control
- 👥 Comprehensive user management with role-based access control
- 📧 User invitation system with email notifications
- 🔐 Security settings and password management
- 🌍 Regional preferences (timezone, language)
- 🔔 Notification preference management
- 🏢 Client branding and domain customization

**Route:** `/settings` - Administrative control panel

---

## 7️⃣ Global/Common Components
**Folder:** `apps/client-portal/src/components/ui/` & `apps/client-portal/src/components/layout/`

### UI Components:
- **Button.jsx** → Consistent button styling with variants (primary, secondary, danger)
- **Card.jsx** → Reusable card containers with consistent spacing and shadows
- **Modal.jsx** → Overlay modals with backdrop and close functionality
- **Input.jsx** → Form inputs with validation states and error handling
- **Avatar.jsx** → User avatar components with fallback initials
- **Badge.jsx** → Status and role indicators with color coding
- **Select.jsx** → Dropdown selection components
- **Table.jsx** → Data table components with sorting and filtering

### Layout Components:
- **Sidebar.jsx** → Persistent navigation sidebar with active state management
- **Header.jsx** → Top navigation bar with user controls and search

### Features:
- 🎨 **Consistent design system** across all components
- ♻️ High reusability and maintainability
- 📱 Responsive design for all screen sizes
- 🎯 Accessibility considerations and keyboard navigation
- 🎨 Theme consistency with customizable color schemes

---

## 🎨 Design System & Theme

### Typography:
- **Primary Font:** Inter / System default fonts
- **Headings:** Consistent hierarchy (h1: 2xl, h2: xl, h3: lg)
- **Body Text:** Optimized readability with proper line heights

### Color Palette:
- **Primary:** Blue (`#2563eb`) - Main actions and branding
- **Secondary:** Gray neutrals (`#6b7280`, `#9ca3af`) - Text and borders
- **Success:** Green (`#10b981`) - Completed states and positive actions
- **Warning:** Yellow (`#f59e0b`) - Pending states and cautions
- **Error:** Red (`#ef4444`) - Errors and destructive actions

### UI Style:
- **Cards:** Rounded corners (`rounded-xl`), subtle shadows (`shadow-sm`)
- **Buttons:** Consistent padding, hover states, and focus indicators
- **Spacing:** Systematic spacing scale (4, 6, 8, 12, 16, 24px)
- **Layout:** Clean, modern, card-based design with proper visual hierarchy

### Layout Structure:
- **Sidebar Navigation:** Persistent left sidebar with active state indicators
- **Top Navigation:** User avatar, notifications, search, and profile controls
- **Main Content:** Responsive grid layouts with consistent padding and margins

---

## 📊 Data Management

### Centralized Data:
**File:** `apps/client-portal/src/data/dummyData.js`

- **Auth Data:** User accounts, roles, and authentication info
- **Dashboard Data:** Project summaries, milestones, notifications preview
- **Project Data:** Detailed project info, files, comments, chat messages
- **File Management:** Global file repository with metadata
- **Settings Data:** User management, client branding, preferences

### Data Structure:
- Consistent ID-based relationships
- Standardized date formats and naming conventions
- Proper data relationships and foreign key references
- Export/import patterns for easy component integration

---

## ✅ User Flow & Navigation

### 1. **Authentication Flow**
```
/auth → Sign In/Up/Forgot Password → Dashboard
```

### 2. **Main Application Flow**
```
Dashboard → Project Overview → Project Details → File Management → Settings
```

### 3. **Project Management Flow**
```
Dashboard → Project Card → Project Viewer → Files/Comments/Chat → Back to Dashboard
```

### 4. **Notification Flow**
```
Any Page → Notification Bell → Notification List → Action/Response
```

### 5. **File Management Flow**
```
Dashboard → Files Tab → File Table → Upload/Download/Version History
```

### 6. **Administrative Flow**
```
Dashboard → Settings → User Management → Branding → Preferences
```

---

## 🔧 Development Guidelines

### Component Structure:
- Functional components with React hooks
- Consistent prop interfaces and TypeScript-ready
- Proper error handling and loading states
- Accessibility considerations (ARIA labels, keyboard navigation)

### File Organization:
- Feature-based folder structure
- Consistent naming conventions (PascalCase for components)
- Proper separation of concerns (UI, business logic, data)

### Performance Considerations:
- Lazy loading for heavy components
- Optimized re-renders with proper dependency arrays
- Efficient state management patterns
- Image optimization and asset management

---

## 🚀 Future Enhancements

### Planned Features:
- Real-time collaboration with WebSocket integration
- Advanced file versioning and diff visualization
- Enhanced notification system with push notifications
- Mobile-responsive design improvements
- Advanced search and filtering capabilities
- Integration with external project management tools

### Technical Improvements:
- TypeScript migration for better type safety
- State management with Redux or Zustand
- API integration and data persistence
- Testing framework implementation (Jest, Cypress)
- Performance monitoring and analytics

---

*This architecture documentation provides a comprehensive overview of the Client Portal Frontend structure, components, and design principles. It serves as a guide for development, maintenance, and future enhancements.*
