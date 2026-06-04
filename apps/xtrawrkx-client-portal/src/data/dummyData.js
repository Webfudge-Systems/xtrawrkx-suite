// =============================================
// CENTRALIZED DUMMY DATA FOR CLIENT PORTAL
// =============================================

// 1. AUTH DATA
export const users = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Admin",
    passwordHash: "hashed_password_123",
    avatar: "/avatars/john.png"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "User",
    passwordHash: "hashed_password_456",
    avatar: "/avatars/jane.png"
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "Staff",
    passwordHash: "hashed_password_789",
    avatar: "/avatars/mike.png"
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    role: "User",
    passwordHash: "hashed_password_101",
    avatar: "/avatars/sarah.png"
  }
];

// 2. DASHBOARD DATA
export const projectsSummary = [
  {
    id: 1,
    title: "Project Apollo Redesign",
    status: "Active",
    dueDate: "2025-10-30",
    progress: 65,
    owner: "Jane Doe"
  },
  {
    id: 2,
    title: "Mobile App Development",
    status: "In Progress",
    dueDate: "2025-11-15",
    progress: 45,
    owner: "John Smith"
  },
  {
    id: 3,
    title: "Website Migration",
    status: "Planning",
    dueDate: "2025-12-01",
    progress: 15,
    owner: "Mark Lee"
  },
  {
    id: 4,
    title: "Brand Identity Update",
    status: "Completed",
    dueDate: "2025-09-30",
    progress: 100,
    owner: "Sarah Johnson"
  }
];

export const milestonesSummary = [
  {
    id: 1,
    title: "Wireframes Completed",
    dueDate: "2025-09-01",
    status: "Completed",
    projectId: 1
  },
  {
    id: 2,
    title: "UI Design Finalized",
    dueDate: "2025-09-15",
    status: "Completed",
    projectId: 1
  },
  {
    id: 3,
    title: "Frontend Development",
    dueDate: "2025-10-05",
    status: "In Progress",
    projectId: 1
  },
  {
    id: 4,
    title: "Beta Release",
    dueDate: "2025-10-25",
    status: "Pending",
    projectId: 1
  }
];

export const notificationsPreview = [
  {
    id: 1,
    type: "file",
    message: "New file 'design-v2.pdf' uploaded to Project Apollo",
    projectId: 1,
    time: "2h ago",
    read: false
  },
  {
    id: 2,
    type: "comment",
    message: "Jane Doe commented on Task 'Homepage Redesign'",
    projectId: 1,
    time: "4h ago",
    read: true
  },
  {
    id: 3,
    type: "milestone",
    message: "Milestone 'Beta Release' marked complete",
    projectId: 1,
    time: "1d ago",
    read: false
  }
];

export const meetings = [
  {
    id: 1,
    title: "Project Apollo Sprint Planning",
    date: "2025-01-20T10:00:00Z",
    participants: ["Jane Doe", "John Smith", "Mark Lee"]
  },
  {
    id: 2,
    title: "Design Review Meeting",
    date: "2025-01-22T14:00:00Z",
    participants: ["Jane Doe", "Sarah Johnson"]
  },
  {
    id: 3,
    title: "Client Feedback Session",
    date: "2025-01-25T16:00:00Z",
    participants: ["John Smith", "Mike Johnson", "Sarah Wilson"]
  }
];

// 3. NOTIFICATIONS DATA
export const notifications = [
  {
    id: 1,
    type: "file",
    message: "New file 'design-v2.pdf' uploaded to Project Apollo",
    projectId: 1,
    time: "2h ago",
    read: false
  },
  {
    id: 2,
    type: "comment",
    message: "Jane Doe commented on Task 'Homepage Redesign'",
    projectId: 1,
    time: "4h ago",
    read: true
  },
  {
    id: 3,
    type: "milestone",
    message: "Milestone 'Beta Release' marked complete",
    projectId: 1,
    time: "1d ago",
    read: false
  },
  {
    id: 4,
    type: "chat",
    message: "New message from John in Project Apollo thread",
    projectId: 1,
    time: "1d ago",
    read: true
  },
  {
    id: 5,
    type: "system",
    message: "Your password will expire in 5 days",
    projectId: null,
    time: "2d ago",
    read: true
  },
  {
    id: 6,
    type: "file",
    message: "Specs document updated in Project Orion",
    projectId: 2,
    time: "3d ago",
    read: false
  }
];

// 4. PROJECT VIEWER DATA
export const projectDetails = {
  id: 1,
  title: "Project Apollo Redesign",
  description: "A complete redesign of the Apollo landing page and dashboard.",
  status: "Active",
  owner: "Jane Doe",
  dueDate: "2025-10-30",
  completion: 65
};

export const milestones = [
  {
    id: 1,
    title: "Wireframes Completed",
    dueDate: "2025-09-01",
    status: "Completed"
  },
  {
    id: 2,
    title: "UI Design Finalized",
    dueDate: "2025-09-15",
    status: "Completed"
  },
  {
    id: 3,
    title: "Frontend Development",
    dueDate: "2025-10-05",
    status: "In Progress"
  },
  {
    id: 4,
    title: "Beta Release",
    dueDate: "2025-10-25",
    status: "Pending"
  }
];

export const files = [
  {
    id: 1,
    name: "wireframes-v1.pdf",
    uploadedBy: "John Smith",
    date: "2025-09-01",
    version: "1.0"
  },
  {
    id: 2,
    name: "ui-design-v2.fig",
    uploadedBy: "Jane Doe",
    date: "2025-09-10",
    version: "2.0"
  },
  {
    id: 3,
    name: "frontend-specs.docx",
    uploadedBy: "Mark Lee",
    date: "2025-09-12",
    version: "1.2"
  }
];

export const comments = [
  {
    id: 1,
    user: "Jane Doe",
    avatar: "/avatars/jane.png",
    text: "I think we should revise the header section layout.",
    time: "2h ago",
    replies: [
      {
        id: 2,
        user: "John Smith",
        avatar: "/avatars/john.png",
        text: "Agreed, the navigation bar feels too cluttered.",
        time: "1h ago"
      }
    ]
  },
  {
    id: 3,
    user: "Mark Lee",
    avatar: "/avatars/mark.png",
    text: "The color scheme works really well with the client's branding.",
    time: "30m ago",
    replies: []
  }
];

export const chatMessages = [
  {
    id: 1,
    sender: "Jane Doe",
    text: "Hi team, are we ready for the demo tomorrow?",
    time: "10:00 AM",
    isMine: false
  },
  {
    id: 2,
    sender: "Me",
    text: "Almost done with final touches. Should be good!",
    time: "10:05 AM",
    isMine: true
  },
  {
    id: 3,
    sender: "Mark Lee",
    text: "I'll update the docs after today's sync call.",
    time: "10:07 AM",
    isMine: false
  }
];

// 5. FILE MANAGEMENT DATA
export const allFiles = [
  {
    id: 1,
    projectId: 1,
    name: "wireframes-v1.pdf",
    type: "pdf",
    uploadedBy: "John Smith",
    date: "2025-09-01",
    version: "1.0",
    size: "2.4 MB"
  },
  {
    id: 2,
    projectId: 2,
    name: "ui-design-v2.fig",
    type: "fig",
    uploadedBy: "Jane Doe",
    date: "2025-09-10",
    version: "2.0",
    size: "5.8 MB"
  },
  {
    id: 3,
    projectId: 1,
    name: "frontend-specs.docx",
    type: "docx",
    uploadedBy: "Mark Lee",
    date: "2025-09-12",
    version: "1.2",
    size: "856 KB"
  },
  {
    id: 4,
    projectId: 3,
    name: "brand-guidelines.pdf",
    type: "pdf",
    uploadedBy: "Sarah Johnson",
    date: "2025-09-15",
    version: "3.1",
    size: "3.1 MB"
  },
  {
    id: 5,
    projectId: 2,
    name: "user-research.xlsx",
    type: "xlsx",
    uploadedBy: "Jane Doe",
    date: "2025-09-18",
    version: "1.0",
    size: "1.2 MB"
  }
];

// 6. SETTINGS / ADMIN DATA
export const clients = [
  {
    id: 1,
    name: "Apollo Corp",
    logoUrl: "/logos/apollo-logo.png",
    domain: "portal.apollocorp.com",
    themeColor: "#2563eb"
  },
  {
    id: 2,
    name: "Orion Industries",
    logoUrl: "/logos/orion-logo.png",
    domain: "portal.orionindustries.com",
    themeColor: "#059669"
  },
  {
    id: 3,
    name: "Zeus Technologies",
    logoUrl: "/logos/zeus-logo.png",
    domain: "portal.zeustech.com",
    themeColor: "#dc2626"
  }
];

export const usersList = [
  {
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    role: "Admin",
    status: "Active",
    lastLogin: "2025-01-20T08:30:00Z"
  },
  {
    id: 2,
    name: "John Smith",
    email: "john@example.com",
    role: "User",
    status: "Active",
    lastLogin: "2025-01-20T09:15:00Z"
  },
  {
    id: 3,
    name: "Mark Lee",
    email: "mark@example.com",
    role: "Staff",
    status: "Invited",
    lastLogin: null
  },
  {
    id: 4,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "User",
    status: "Active",
    lastLogin: "2025-01-19T16:45:00Z"
  },
  {
    id: 5,
    name: "Mike Thompson",
    email: "mike@example.com",
    role: "Staff",
    status: "Active",
    lastLogin: "2025-01-20T07:20:00Z"
  }
];

// =============================================
// EXPORTS
// =============================================

// Named exports for individual imports
export {
  // AUTH
  users,
  
  // DASHBOARD
  projectsSummary,
  milestonesSummary,
  notificationsPreview,
  meetings,
  
  // NOTIFICATIONS
  notifications,
  
  // PROJECT VIEWER
  projectDetails,
  milestones,
  files,
  comments,
  chatMessages,
  
  // FILE MANAGEMENT
  allFiles,
  
  // SETTINGS / ADMIN
  clients,
  usersList,
};

// Default export as grouped object
export default {
  // AUTH
  users,
  
  // DASHBOARD
  projectsSummary,
  milestonesSummary,
  notificationsPreview,
  meetings,
  
  // NOTIFICATIONS
  notifications,
  
  // PROJECT VIEWER
  projectDetails,
  milestones,
  files,
  comments,
  chatMessages,
  
  // FILE MANAGEMENT
  allFiles,
  
  // SETTINGS / ADMIN
  clients,
  usersList,
};
