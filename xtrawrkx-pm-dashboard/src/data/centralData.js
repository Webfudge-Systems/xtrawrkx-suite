// Centralized Data Structure for Projects, Tasks, and Subtasks
// This file contains all data used across the PM Dashboard

// Team Members
export const teamMembers = {
    1: { id: 1, name: "Mark Atenson", role: "Senior Designer", avatar: "MA", color: "bg-blue-500", email: "mark@company.com" },
    2: { id: 2, name: "Jane Cooper", role: "Creative Director", avatar: "JC", color: "bg-green-500", email: "jane@company.com" },
    3: { id: 3, name: "Alex Johnson", role: "Brand Strategist", avatar: "AJ", color: "bg-purple-500", email: "alex@company.com" },
    4: { id: 4, name: "Sarah Wilson", role: "UX Designer", avatar: "SW", color: "bg-pink-500", email: "sarah@company.com" },
    5: { id: 5, name: "Mike Chen", role: "Developer", avatar: "MC", color: "bg-indigo-500", email: "mike@company.com" },
    6: { id: 6, name: "Lisa Anderson", role: "Project Manager", avatar: "LA", color: "bg-yellow-500", email: "lisa@company.com" },
    7: { id: 7, name: "Robert Martinez", role: "Developer", avatar: "RM", color: "bg-red-500", email: "robert@company.com" },
    8: { id: 8, name: "Emily Davis", role: "Designer", avatar: "ED", color: "bg-teal-500", email: "emily@company.com" },
    9: { id: 9, name: "Marc Atenson", role: "Senior Designer", avatar: "MA", color: "bg-blue-500", email: "marcnine@gmail.com" },
    10: { id: 10, name: "Susan Drake", role: "Designer", avatar: "SD", color: "bg-green-500", email: "contact@susandrak.com" },
    11: { id: 11, name: "Ronald Richards", role: "Developer", avatar: "RR", color: "bg-purple-500", email: "ronaldrichard@gmail.com" },
    12: { id: 12, name: "Ian Warren", role: "Designer", avatar: "IW", color: "bg-orange-500", email: "wadewarren@mail.com" },
    13: { id: 13, name: "Darrell Steward", role: "Manager", avatar: "DS", color: "bg-red-500", email: "darrelsteward@gmail.com" }
};

// Projects - Enhanced with comprehensive data
export const projects = {
    1: {
        id: 1,
        name: "Yellow Branding",
        slug: "yellow-branding",
        color: "from-blue-400 to-blue-600",
        icon: "Y",
        description: "Complete brand identity and visual design for Yellow company",
        status: "In Progress",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
        progress: 65,
        clientId: 1,
        teamMemberIds: [1, 2, 3],
        budget: 75000,
        spent: 48750,
        tasksCount: "1 task due soon",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800"
    },
    2: {
        id: 2,
        name: "Mogo Web Design",
        slug: "mogo-web-design",
        color: "from-green-400 to-green-600",
        icon: "M",
        description: "Modern responsive website design and development",
        status: "In Progress",
        startDate: "2024-01-15",
        endDate: "2024-04-15",
        progress: 45,
        clientId: 2,
        teamMemberIds: [4, 5, 6],
        budget: 120000,
        spent: 54000,
        tasksCount: "no task",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800"
    },
    3: {
        id: 3,
        name: "Futurework",
        slug: "futurework",
        color: "from-purple-400 to-purple-600",
        icon: "F",
        description: "Future of work platform design",
        status: "Planning",
        startDate: "2024-02-01",
        endDate: "2024-05-01",
        progress: 15,
        clientId: 3,
        teamMemberIds: [1, 4, 7],
        budget: 95000,
        spent: 14250,
        tasksCount: "7 task due soon",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800"
    },
    4: {
        id: 4,
        name: "Resto Dashboard",
        slug: "resto-dashboard",
        color: "from-pink-400 to-pink-600",
        icon: "R",
        description: "Restaurant management dashboard and POS system",
        status: "In Progress",
        startDate: "2024-01-20",
        endDate: "2024-05-20",
        progress: 55,
        clientId: 4,
        teamMemberIds: [2, 5, 8],
        budget: 85000,
        spent: 46750,
        tasksCount: "4 task due soon",
        bgColor: "bg-pink-100",
        textColor: "text-pink-800"
    },
    5: {
        id: 5,
        name: "Hajime Illustration",
        slug: "hajime-illustration",
        color: "from-green-400 to-green-600",
        icon: "H",
        description: "Character illustration and animation project",
        status: "In Progress",
        startDate: "2024-02-01",
        endDate: "2024-04-30",
        progress: 70,
        clientId: 5,
        teamMemberIds: [3, 6, 7],
        budget: 65000,
        spent: 45500,
        tasksCount: "3 task due soon",
        bgColor: "bg-green-100",
        textColor: "text-green-800"
    },
    6: {
        id: 6,
        name: "Carl UI/UX",
        slug: "carl-ui-ux",
        color: "from-orange-400 to-orange-600",
        icon: "C",
        description: "Mobile app UI/UX design and user experience optimization",
        status: "Planning",
        startDate: "2024-02-15",
        endDate: "2024-06-15",
        progress: 30,
        clientId: 6,
        teamMemberIds: [4, 5, 8],
        budget: 95000,
        spent: 28500,
        tasksCount: "3 task due soon",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800"
    },
    7: {
        id: 7,
        name: "Fitness App Design",
        slug: "fitness-app-design",
        color: "from-purple-400 to-purple-600",
        icon: "F",
        description: "Complete UI/UX design for fitness tracking mobile app",
        status: "Active",
        startDate: "2024-01-10",
        endDate: "2024-03-15",
        progress: 25,
        clientId: 7,
        teamMemberIds: [1, 2, 4],
        budget: 65000,
        spent: 16250,
        tasksCount: "3 tasks in progress",
        bgColor: "bg-purple-100",
        textColor: "text-purple-800"
    }
};

// Clients
export const clients = {
    1: { id: 1, name: "Yellow Corp", email: "contact@yellow.com", industry: "Technology" },
    2: { id: 2, name: "Mogo Inc", email: "hello@mogo.com", industry: "E-commerce" },
    3: { id: 3, name: "FutureWork Ltd", email: "info@futurework.com", industry: "HR Tech" },
    4: { id: 4, name: "RestoChain", email: "contact@restochain.com", industry: "Food & Beverage" },
    5: { id: 5, name: "Hajime Studio", email: "hello@hajime.com", industry: "Entertainment" },
    6: { id: 6, name: "Carl Tech", email: "info@carltech.com", industry: "Technology" },
    7: { id: 7, name: "FitTech Solutions", email: "contact@fittech.com", industry: "Health & Fitness" }
};

// Tasks - Comprehensive task data from all sources
export const tasks = {
    // Yellow Branding Project Tasks
    1: {
        id: 1,
        name: "Social Illustration",
        project: {
            name: "Hajime Illustration",
            color: "from-green-400 to-green-600",
            icon: "H",
        },
        assignee: "You",
        dueDate: "Jan 8 2024",
        time: null,
        status: "In Progress",
        progress: 20,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 5,
        assigneeId: 1,
        priority: "medium",
        description: "Social media illustration designs",
        tags: ["illustration", "social"]
    },
    5: {
        id: 5,
        name: "Ads Illustration",
        project: {
            name: "Hajime Illustration",
            color: "from-green-400 to-green-600",
            icon: "H",
        },
        assignee: "You",
        dueDate: "Jan 8 2024",
        time: null,
        status: "In Progress",
        progress: 40,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 5,
        assigneeId: 1,
        priority: "high",
        description: "Advertisement illustration designs",
        tags: ["illustration", "advertising"]
    },
    6: {
        id: 6,
        name: "Point of Sell",
        project: {
            name: "Resto Dashboard",
            color: "from-pink-400 to-pink-600",
            icon: "R",
        },
        assignee: "You",
        dueDate: "Jan 9 2024",
        time: null,
        status: "In Progress",
        progress: 50,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 4,
        assigneeId: 1,
        priority: "high",
        description: "Point of sale interface design",
        tags: ["pos", "interface"]
    },
    7: {
        id: 7,
        name: "Banner Illustration",
        project: {
            name: "Hajime Illustration",
            color: "from-green-400 to-green-600",
            icon: "H",
        },
        assignee: "You",
        dueDate: "Jan 10 2024",
        time: null,
        status: "In Progress",
        progress: 35,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 5,
        assigneeId: 1,
        priority: "medium",
        description: "Banner illustration designs",
        tags: ["illustration", "banner"]
    },
    8: {
        id: 8,
        name: "Resto Management Dash...",
        project: {
            name: "Resto Dashboard",
            color: "from-blue-400 to-blue-600",
            icon: "R",
        },
        assignee: "You",
        dueDate: "Jan 12 2024",
        time: null,
        status: "In Progress",
        progress: 50,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 4,
        assigneeId: 1,
        priority: "high",
        description: "Restaurant management dashboard design",
        tags: ["dashboard", "management"]
    },
    9: {
        id: 9,
        name: "First Draft",
        project: {
            name: "Carl UI/UX",
            color: "from-orange-400 to-orange-600",
            icon: "C",
        },
        assignee: "You",
        dueDate: "Jan 12 2024",
        time: null,
        status: "To Do",
        progress: 5,
        hasMultipleAssignees: false,
        borderColor: "border-orange-400",
        projectId: 6,
        assigneeId: 1,
        priority: "medium",
        description: "First draft of UI/UX design",
        tags: ["ui", "ux", "draft"]
    },
    10: {
        id: 10,
        name: "Online Order Flow",
        project: {
            name: "Resto Dashboard",
            color: "from-pink-400 to-pink-600",
            icon: "R",
        },
        assignee: "You",
        dueDate: "Jan 15 2024",
        time: null,
        status: "In Progress",
        progress: 45,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 4,
        assigneeId: 1,
        priority: "high",
        description: "Online ordering flow design",
        tags: ["flow", "ordering"]
    },
    11: {
        id: 11,
        name: "Landing Page Options",
        project: {
            name: "Carl UI/UX",
            color: "from-orange-400 to-orange-600",
            icon: "C",
        },
        assignee: "You",
        dueDate: "Jan 15 2024",
        time: null,
        status: "In Progress",
        progress: 25,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 6,
        assigneeId: 1,
        priority: "medium",
        description: "Landing page design options",
        tags: ["landing", "options"]
    },
    12: {
        id: 12,
        name: "Landing Page",
        project: {
            name: "Mogo Web Design",
            color: "from-blue-400 to-blue-600",
            icon: "M",
        },
        assignee: "You",
        dueDate: "Jan 17 2024",
        time: null,
        status: "In Progress",
        progress: 60,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 2,
        assigneeId: 1,
        priority: "high",
        description: "Landing page design and development",
        tags: ["landing", "web"]
    },
    13: {
        id: 13,
        name: "Table Management Flow",
        project: {
            name: "Resto Dashboard",
            color: "from-pink-400 to-pink-600",
            icon: "R",
        },
        assignee: "You",
        dueDate: "Jan 18 2024",
        time: null,
        status: "In Progress",
        progress: 55,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 4,
        assigneeId: 1,
        priority: "medium",
        description: "Table management flow design",
        tags: ["table", "management"]
    },
    15: {
        id: 15,
        name: "Homepage",
        project: {
            name: "Mogo Web Design",
            color: "from-blue-400 to-blue-600",
            icon: "M",
        },
        assignee: "You",
        dueDate: "Jan 23 2024",
        time: null,
        status: "In Review",
        progress: 100,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 2,
        assigneeId: 1,
        priority: "high",
        description: "Homepage design and development",
        tags: ["homepage", "web"]
    },
    16: {
        id: 16,
        name: "Brand Guide Deck",
        project: {
            name: "Yellow Branding",
            color: "from-blue-400 to-blue-600",
            icon: "Y",
        },
        assignee: "Multiple",
        dueDate: "Jan 25 2024",
        time: null,
        status: "Done",
        progress: 100,
        hasMultipleAssignees: true,
        borderColor: "border-green-400",
        projectId: 1,
        assigneeIds: [1, 2, 3],
        priority: "high",
        description: "Brand guidelines presentation deck",
        tags: ["guidelines", "presentation"]
    },
    17: {
        id: 17,
        name: "Web Mockup",
        project: {
            name: "Yellow Branding",
            color: "from-blue-400 to-blue-600",
            icon: "Y",
        },
        assignee: "You",
        dueDate: "Jan 25 2024",
        time: "19:00",
        status: "In Progress",
        progress: 60,
        hasMultipleAssignees: false,
        borderColor: "border-blue-400",
        projectId: 1,
        assigneeId: 1,
        priority: "medium",
        description: "Website mockup designs",
        tags: ["web", "mockup"]
    },
    18: {
        id: 18,
        name: "Resto Dashboard",
        project: {
            name: "Resto Dashboard",
            color: "from-pink-400 to-pink-600",
            icon: "R",
        },
        assignee: "You",
        dueDate: "Jan 26 2024",
        time: null,
        status: "In Progress",
        progress: 50,
        hasMultipleAssignees: false,
        borderColor: "border-orange-400",
        projectId: 4,
        assigneeId: 1,
        priority: "high",
        description: "Restaurant dashboard main interface",
        tags: ["dashboard", "restaurant"]
    },
    19: {
        id: 19,
        name: "Hero Illustration",
        project: {
            name: "Hajime Illustration",
            color: "from-green-400 to-green-600",
            icon: "H",
        },
        assignee: "You",
        dueDate: "Jan 29 2024",
        time: null,
        status: "In Progress",
        progress: 20,
        hasMultipleAssignees: false,
        borderColor: "border-green-400",
        projectId: 5,
        assigneeId: 1,
        priority: "medium",
        description: "Hero section illustration",
        tags: ["hero", "illustration"]
    },
    20: {
        id: 20,
        name: "Landing Page Options",
        project: {
            name: "Carl UI/UX",
            color: "from-orange-400 to-orange-600",
            icon: "C",
        },
        assignee: "You",
        dueDate: "Jan 30 2024",
        time: null,
        status: "To Do",
        progress: 5,
        hasMultipleAssignees: false,
        borderColor: "border-orange-400",
        projectId: 6,
        assigneeId: 1,
        priority: "medium",
        description: "Landing page design options",
        tags: ["landing", "options"]
    },
    21: {
        id: 21,
        name: "Onboarding Flow",
        project: {
            name: "Futurework",
            color: "from-blue-400 to-blue-600",
            icon: "F",
        },
        assignee: "Multiple",
        dueDate: "Jan 21 2024",
        time: "9:00",
        status: "In Progress",
        progress: 15,
        hasMultipleAssignees: true,
        borderColor: "border-orange-400",
        projectId: 3,
        assigneeIds: [1, 4, 7],
        priority: "high",
        description: "User onboarding flow design",
        tags: ["onboarding", "flow"]
    },
    22: {
        id: 22,
        name: "Mid Month Review",
        project: {
            name: "Yellow Branding",
            color: "from-blue-400 to-blue-600",
            icon: "Y",
        },
        assignee: "You",
        dueDate: "Jan 22 2024",
        time: null,
        status: "In Review",
        progress: 100,
        hasMultipleAssignees: false,
        borderColor: "border-blue-400",
        projectId: 1,
        assigneeId: 1,
        priority: "medium",
        description: "Mid-month project review",
        tags: ["review", "monthly"]
    },
    23: {
        id: 23,
        name: "App Wireframes",
        project: {
            name: "Fitness App Design",
            color: "from-purple-400 to-purple-600",
            icon: "F",
        },
        assignee: "You",
        dueDate: "Jan 25 2024",
        time: null,
        status: "In Progress",
        progress: 70,
        hasMultipleAssignees: false,
        borderColor: "border-purple-400",
        projectId: 7,
        assigneeId: 1,
        priority: "high",
        description: "Create wireframes for fitness app screens",
        tags: ["wireframes", "mobile"]
    },
    24: {
        id: 24,
        name: "UI Design System",
        project: {
            name: "Fitness App Design",
            color: "from-purple-400 to-purple-600",
            icon: "F",
        },
        assignee: "You",
        dueDate: "Jan 28 2024",
        time: null,
        status: "To Do",
        progress: 20,
        hasMultipleAssignees: false,
        borderColor: "border-purple-400",
        projectId: 7,
        assigneeId: 1,
        priority: "high",
        description: "Design comprehensive UI system and components",
        tags: ["ui", "design-system"]
    },
    25: {
        id: 25,
        name: "User Testing",
        project: {
            name: "Fitness App Design",
            color: "from-purple-400 to-purple-600",
            icon: "F",
        },
        assignee: "You",
        dueDate: "Feb 5 2024",
        time: null,
        status: "To Do",
        progress: 5,
        hasMultipleAssignees: false,
        borderColor: "border-purple-400",
        projectId: 7,
        assigneeId: 1,
        priority: "medium",
        description: "Conduct user testing sessions for app prototypes",
        tags: ["testing", "user-research"]
    }
};

// Subtasks - Sub-task data for all tasks
export const subtasks = {
    // Task 1: Social Illustration - Subtasks
    1: {
        id: 1,
        taskId: 1,
        name: "Research visual style",
        status: "Done",
        assigneeId: 1,
        dueDate: "Jan 6 2024",
        description: "Research current social media design trends",
        priority: "medium",
        progress: 100,
        subtasks: [
            {
                id: 101,
                name: "Analyze competitor designs",
                status: "Done",
                assigneeId: 1,
                dueDate: "Jan 5 2024",
                progress: 100,
                priority: "medium"
            },
            {
                id: 102,
                name: "Create mood board",
                status: "Done",
                assigneeId: 1,
                dueDate: "Jan 6 2024",
                progress: 100,
                priority: "medium"
            }
        ]
    },
    2: {
        id: 2,
        taskId: 1,
        name: "Create initial sketches",
        status: "Done",
        assigneeId: 1,
        dueDate: "Jan 7 2024",
        description: "Create rough sketches for illustration concepts",
        priority: "high",
        progress: 100
    },
    3: {
        id: 3,
        taskId: 1,
        name: "Digital illustration",
        status: "In Progress",
        assigneeId: 1,
        dueDate: "Jan 8 2024",
        description: "Create final digital illustration",
        priority: "high",
        progress: 60,
        subtasks: [
            {
                id: 103,
                name: "Create base illustration",
                status: "Done",
                assigneeId: 1,
                dueDate: "Jan 7 2024",
                progress: 100,
                priority: "high"
            },
            {
                id: 104,
                name: "Add color and effects",
                status: "In Progress",
                assigneeId: 1,
                dueDate: "Jan 8 2024",
                progress: 40,
                priority: "high"
            },
            {
                id: 105,
                name: "Final review and export",
                status: "To Do",
                assigneeId: 1,
                dueDate: "Jan 8 2024",
                progress: 0,
                priority: "medium"
            }
        ]
    },

    // Task 5: Ads Illustration - Subtasks
    4: {
        id: 4,
        taskId: 5,
        name: "Define ad campaign requirements",
        status: "Done",
        assigneeId: 2,
        dueDate: "Jan 6 2024",
        description: "Gather requirements from marketing team",
        priority: "high"
    },
    5: {
        id: 5,
        taskId: 5,
        name: "Create ad mockups",
        status: "In Progress",
        assigneeId: 1,
        dueDate: "Jan 8 2024",
        description: "Design advertisement mockups",
        priority: "high"
    },
    6: {
        id: 6,
        taskId: 5,
        name: "Review and refine",
        status: "To Do",
        assigneeId: 1,
        dueDate: "Jan 9 2024",
        description: "Review with client and make refinements",
        priority: "medium"
    },

    // Task 6: Point of Sell - Subtasks
    7: {
        id: 7,
        taskId: 6,
        name: "Wireframe POS interface",
        status: "Done",
        assigneeId: 3,
        dueDate: "Jan 8 2024",
        description: "Create wireframes for point of sale interface",
        priority: "high"
    },
    8: {
        id: 8,
        taskId: 6,
        name: "Design UI components",
        status: "In Progress",
        assigneeId: 1,
        dueDate: "Jan 9 2024",
        description: "Design individual UI components",
        priority: "high"
    },
    9: {
        id: 9,
        taskId: 6,
        name: "Integration testing",
        status: "To Do",
        assigneeId: 5,
        dueDate: "Jan 10 2024",
        description: "Test POS system integration",
        priority: "medium"
    },

    // Task 7: Banner Illustration - Subtasks
    10: {
        id: 10,
        taskId: 7,
        name: "Concept development",
        status: "Done",
        assigneeId: 2,
        dueDate: "Jan 10 2024",
        description: "Develop banner illustration concepts",
        priority: "medium"
    },
    11: {
        id: 11,
        taskId: 7,
        name: "Design execution",
        status: "In Progress",
        assigneeId: 1,
        dueDate: "Jan 12 2024",
        description: "Execute final banner design",
        priority: "high"
    },
    15: {
        id: 15,
        taskId: 7,
        name: "Color palette refinement",
        status: "To Do",
        assigneeId: 3,
        dueDate: "Jan 13 2024",
        description: "Refine color palette for banner",
        priority: "medium"
    },

    // Task 8: Tracking Design - Subtasks
    12: {
        id: 12,
        taskId: 8,
        name: "Analytics requirements",
        status: "Done",
        assigneeId: 6,
        dueDate: "Jan 11 2024",
        description: "Define tracking and analytics requirements",
        priority: "high"
    },
    13: {
        id: 13,
        taskId: 8,
        name: "Dashboard design",
        status: "In Progress",
        assigneeId: 4,
        dueDate: "Jan 13 2024",
        description: "Design tracking dashboard interface",
        priority: "high"
    },
    14: {
        id: 14,
        taskId: 8,
        name: "Data visualization",
        status: "To Do",
        assigneeId: 4,
        dueDate: "Jan 14 2024",
        description: "Create data visualization components",
        priority: "medium"
    }
};

// Dashboard specific data
export const dashboardStats = [
    {
        title: "Total Project",
        value: "7",
        change: "+2",
        changeType: "increase",
        icon: "FolderOpen",
    },
    {
        title: "Total Tasks",
        value: "49",
        change: "+4",
        changeType: "increase",
        icon: "ClipboardList",
    },
    {
        title: "Assigned Tasks",
        value: "12",
        change: "-3",
        changeType: "decrease",
        icon: "User",
    },
    {
        title: "Completed Tasks",
        value: "6",
        change: "+1",
        changeType: "increase",
        icon: "CheckCircle",
    },
    {
        title: "Overdue Tasks",
        value: "3",
        change: "+2",
        changeType: "increase",
        icon: "AlertTriangle",
    },
];

export const assignedTasks = [
    {
        id: 1,
        title: "Web Mockup",
        project: "Yellow Branding",
        dueDate: "Due in 20 hours",
        priority: "high",
        status: "in_progress",
    },
    {
        id: 2,
        title: "Carl Landing Page",
        project: "Carl UI/UX",
        dueDate: "Due in 3 days",
        priority: "medium",
        status: "pending",
    },
    {
        id: 3,
        title: "POS UI/UX",
        project: "Resto Dashboard",
        dueDate: "Due in 1 week",
        priority: "low",
        status: "review",
    },
];

export const dashboardProjects = [
    {
        id: 1,
        name: "Yellow Branding",
        tasksCount: "1 task due soon",
        color: "from-blue-400 to-blue-600",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
    },
    {
        id: 2,
        name: "Mogo Web Design",
        tasksCount: "no task",
        color: "from-yellow-400 to-yellow-600",
        bgColor: "bg-yellow-100",
        textColor: "text-yellow-800",
    },
    {
        id: 3,
        name: "Futurework",
        tasksCount: "7 task due soon",
        color: "from-blue-400 to-blue-600",
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
    },
    {
        id: 4,
        name: "Resto Dashboard",
        tasksCount: "4 task due soon",
        color: "from-pink-400 to-pink-600",
        bgColor: "bg-pink-100",
        textColor: "text-pink-800",
    },
    {
        id: 5,
        name: "Hajime Illustration",
        tasksCount: "3 task due soon",
        color: "from-green-400 to-green-600",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
    },
    {
        id: 6,
        name: "Carl UI/UX",
        tasksCount: "3 task due soon",
        color: "from-orange-400 to-orange-600",
        bgColor: "bg-orange-100",
        textColor: "text-orange-800",
    },
    {
        id: 7,
        name: "The Run Branding & Graphic",
        tasksCount: "4 task due soon",
        color: "from-green-400 to-green-600",
        bgColor: "bg-green-100",
        textColor: "text-green-800",
    },
];

export const teamMembersDashboard = [
    {
        id: 1,
        name: "Marc Atenson",
        initials: "MA",
        email: "marcnine@gmai.com",
        hasProfilePic: true,
    },
    {
        id: 2,
        name: "Susan Drake",
        initials: "SD",
        email: "contact@susandrak...",
        hasProfilePic: false,
    },
    {
        id: 3,
        name: "Ronald Richards",
        initials: "RR",
        email: "ronaldrichard@gmail..",
        hasProfilePic: false,
    },
    {
        id: 4,
        name: "Jane Cooper",
        initials: "JC",
        email: "janecooper@proton...",
        hasProfilePic: true,
    },
    {
        id: 5,
        name: "Ian Warren",
        initials: "IW",
        email: "wadewarren@mail.co",
        hasProfilePic: false,
    },
    {
        id: 6,
        name: "Darrell Steward",
        initials: "DS",
        email: "darrelsteward@gma..",
        hasProfilePic: true,
    },
];

// Helper functions to get related data
export const getProjectById = (id) => projects[id];

export const getTaskById = (id) => tasks[id];

export const getTeamMemberById = (id) => teamMembers[id];

export const getClientById = (id) => clients[id];

// Get tasks for a specific project
export const getTasksByProjectId = (projectId) => {
    return Object.values(tasks).filter(task => task.projectId === projectId);
};

// Get all tasks assigned to a specific team member
export const getTasksByAssigneeId = (assigneeId) => {
    return Object.values(tasks).filter(task =>
        task.assigneeId === assigneeId ||
        (task.assigneeIds && task.assigneeIds.includes(assigneeId))
    );
};

// Get project statistics
export const getProjectStats = (projectId) => {
    const projectTasks = getTasksByProjectId(projectId);

    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.status === "Done" || task.status === "Completed").length;
    const inProgressTasks = projectTasks.filter(task => task.status === "In Progress").length;
    const todoTasks = projectTasks.filter(task => task.status === "To Do").length;
    const overdueTasks = projectTasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        return dueDate < today && (task.status !== "Done" && task.status !== "Completed");
    }).length;

    return {
        totalTasks,
        assignedTasks: totalTasks,
        completedTasks,
        incompleteTasks: totalTasks - completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks
    };
};

// Get task with enriched data (assignee details, project details, subtasks, comments)
export const getEnrichedTask = (taskId) => {
    const task = tasks[taskId];
    if (!task) return null;

    const assignee = task.assigneeId ? teamMembers[task.assigneeId] : null;
    const assignees = task.assigneeIds ? task.assigneeIds.map(id => teamMembers[id]).filter(Boolean) : [];
    const project = projects[task.projectId];

    // Get subtasks for this task
    const taskSubtasks = Object.values(subtasks).filter(subtask => subtask.taskId === taskId);

    // Enrich subtasks with assignee data
    const enrichedSubtasks = taskSubtasks.map(subtask => ({
        ...subtask,
        assignee: subtask.assigneeId ? teamMembers[subtask.assigneeId] : null
    }));

    // Get comments and activities for this task
    const taskComments = getCommentsByTaskId(taskId);

    // Enrich comments with author data
    const enrichedComments = taskComments.map(comment => ({
        ...comment,
        author: teamMembers[comment.authorId] ? teamMembers[comment.authorId].name : 'Unknown',
        hasProfilePic: comment.authorId === 2, // Jane Cooper has profile pic
        timestamp: new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    return {
        ...task,
        assignee,
        assignees,
        project,
        subtasks: enrichedSubtasks,
        comments: enrichedComments
    };
};

// Get project with enriched data (tasks, team members, client)
export const getEnrichedProject = (projectId) => {
    const project = projects[projectId];
    if (!project) return null;

    const projectTasks = getTasksByProjectId(projectId);
    const projectTeamMembers = project.teamMemberIds.map(id => teamMembers[id]).filter(Boolean);
    const client = clients[project.clientId];
    const stats = getProjectStats(projectId);

    // Enrich tasks with assignee details for backward compatibility
    const enrichedTasks = projectTasks.map(task => {
        let assignee = "Unassigned";

        if (task.assigneeId) {
            const member = teamMembers[task.assigneeId];
            assignee = member ? member.name : "Unknown";
        } else if (task.assigneeIds && task.assigneeIds.length > 0) {
            if (task.assigneeIds.length === 1) {
                const member = teamMembers[task.assigneeIds[0]];
                assignee = member ? member.name : "Unknown";
            } else {
                assignee = "Multiple";
            }
        }

        return {
            ...task,
            assignee // Add the assignee string for backward compatibility
        };
    });

    return {
        ...project,
        tasks: enrichedTasks,
        team: projectTeamMembers,
        client,
        stats
    };
};

// Legacy compatibility - convert to old project data format
export const getProjectBySlug = (slug) => {
    const project = Object.values(projects).find(p => p.slug === slug);
    if (!project) return null;

    return getEnrichedProject(project.id);
};

// Get all tasks for my-task page with proper date formatting
export const getAllTasksForMyTask = () => {
    return Object.values(tasks).map(task => {
        // Get subtasks for this task
        const taskSubtasks = Object.values(subtasks).filter(subtask => subtask.taskId === task.id);

        return {
            ...task,
            dueDate: task.dueDate, // Keep existing format
            time: task.time || null,
            subtaskCount: taskSubtasks.length
        };
    });
};

// Get tasks for specific month
export const getTasksForMonth = (year, month) => {
    const allTasks = Object.values(tasks);
    return allTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate.getFullYear() === year && taskDate.getMonth() === month;
    });
};

// Helper function to get task with subtasks
export const getTaskWithSubtasks = (taskId) => {
    const task = tasks[taskId];
    if (!task) return null;

    const taskSubtasks = Object.values(subtasks).filter(subtask => subtask.taskId === taskId);

    return {
        ...task,
        subtasks: taskSubtasks
    };
};

// Discussion Channels
export const discussionChannels = {
    1: {
        id: 1,
        name: "Design Discussion",
        projectId: 1,
        type: "general",
        lastMessage: "I was thinking a subtle blue or green could complement the existing colors without being too overpowering. What are your thoughts on that?",
        lastActivity: "3 min ago",
        unreadCount: 0,
        isActive: true
    },
    2: {
        id: 2,
        name: "Confidential",
        projectId: 1,
        type: "private",
        lastMessage: "Hi Jonathan, please check this and make sure all the requirements are met before we proceed.",
        lastActivity: "3 min ago",
        unreadCount: 2,
        isActive: false
    },
    3: {
        id: 3,
        name: "Administration & Documents",
        projectId: 1,
        type: "general",
        lastMessage: "Thanks!",
        lastActivity: "3 min ago",
        unreadCount: 0,
        isActive: false
    }
};

// Discussion Messages
export const discussionMessages = {
    1: {
        id: 1,
        channelId: 1,
        senderId: 1,
        content: "Hi Jane! I'm good",
        timestamp: "2024-01-27T10:30:00Z",
        type: "text"
    },
    2: {
        id: 2,
        channelId: 1,
        senderId: 1,
        content: "Yes, I've taken a look at the concepts. Overall, they're solid, but I have a few thoughts.",
        timestamp: "2024-01-27T10:32:00Z",
        type: "text"
    },
    3: {
        id: 3,
        channelId: 1,
        senderId: 1,
        content: "Firstly, I think the color scheme could use a bit more contrast. It feels a bit monotone right now. What do you think?",
        timestamp: "2024-01-27T10:35:00Z",
        type: "text"
    },
    4: {
        id: 4,
        channelId: 1,
        senderId: 2,
        content: "I see your point. Maybe we can introduce a secondary color to make certain elements pop. What color palette are you thinking?",
        timestamp: "2024-01-27T10:38:00Z",
        type: "text"
    },
    5: {
        id: 5,
        channelId: 1,
        senderId: 1,
        content: "I was thinking a subtle blue or green could complement the existing colors without being too overpowering. What are your thoughts on that?",
        timestamp: "2024-01-27T10:42:00Z",
        type: "text"
    }
};

// Task Comments
export const taskComments = {
    1: {
        id: 1,
        taskId: 1,
        authorId: 1,
        content: "This looks great! Just need to adjust the spacing a bit.",
        timestamp: "2024-01-27T09:15:00Z",
        type: "comment"
    },
    2: {
        id: 2,
        taskId: 1,
        authorId: 2,
        content: "I'll make those adjustments and send it back for review.",
        timestamp: "2024-01-27T09:20:00Z",
        type: "comment"
    },
    3: {
        id: 3,
        taskId: 1,
        authorId: 1,
        content: "Perfect! The spacing looks much better now.",
        timestamp: "2024-01-27T09:45:00Z",
        type: "comment"
    },
    4: {
        id: 4,
        taskId: 2,
        authorId: 2,
        content: "I've started working on the wireframes. Should have the first draft ready by tomorrow.",
        timestamp: "2024-01-27T10:30:00Z",
        type: "comment"
    },
    5: {
        id: 5,
        taskId: 2,
        authorId: 3,
        content: "Great! Looking forward to seeing the initial concepts.",
        timestamp: "2024-01-27T10:45:00Z",
        type: "comment"
    },
    6: {
        id: 6,
        taskId: 3,
        authorId: 1,
        content: "The color palette needs some refinement. Let's discuss this in our next meeting.",
        timestamp: "2024-01-27T11:00:00Z",
        type: "comment"
    },
    7: {
        id: 7,
        taskId: 3,
        authorId: 2,
        content: "I agree. I'll prepare some alternative color schemes for review.",
        timestamp: "2024-01-27T11:15:00Z",
        type: "comment"
    },
    8: {
        id: 8,
        taskId: 4,
        authorId: 3,
        content: "The illustration style is perfect for this project.",
        timestamp: "2024-01-27T11:30:00Z",
        type: "comment"
    },
    9: {
        id: 9,
        taskId: 4,
        authorId: 1,
        content: "Thanks! I think it captures the brand personality well.",
        timestamp: "2024-01-27T11:45:00Z",
        type: "comment"
    },
    10: {
        id: 10,
        taskId: 5,
        authorId: 2,
        content: "The user flow looks comprehensive. Any specific areas you'd like me to focus on?",
        timestamp: "2024-01-27T12:00:00Z",
        type: "comment"
    },
    11: {
        id: 11,
        taskId: 5,
        authorId: 1,
        content: "Pay special attention to the checkout process. That's our main conversion point.",
        timestamp: "2024-01-27T12:15:00Z",
        type: "comment"
    },
    12: {
        id: 12,
        taskId: 6,
        authorId: 3,
        content: "The responsive design looks good on mobile. Desktop version needs some tweaks.",
        timestamp: "2024-01-27T12:30:00Z",
        type: "comment"
    },
    13: {
        id: 13,
        taskId: 6,
        authorId: 2,
        content: "I'll work on the desktop layout improvements today.",
        timestamp: "2024-01-27T12:45:00Z",
        type: "comment"
    },
    14: {
        id: 14,
        taskId: 7,
        authorId: 1,
        content: "The animation timing feels a bit slow. Can we speed it up by 20%?",
        timestamp: "2024-01-27T13:00:00Z",
        type: "comment"
    },
    15: {
        id: 15,
        taskId: 7,
        authorId: 3,
        content: "Sure! I'll adjust the timing and send you the updated version.",
        timestamp: "2024-01-27T13:15:00Z",
        type: "comment"
    },
    16: {
        id: 16,
        taskId: 6,
        authorId: 1,
        content: "The mobile layout looks perfect. Desktop needs some work on the header section.",
        timestamp: "2024-01-27T13:30:00Z",
        type: "comment"
    },
    17: {
        id: 17,
        taskId: 6,
        authorId: 2,
        content: "I'll focus on the desktop header improvements today.",
        timestamp: "2024-01-27T13:45:00Z",
        type: "comment"
    },
    18: {
        id: 18,
        taskId: 8,
        authorId: 3,
        content: "The database schema looks good. Ready to start implementation.",
        timestamp: "2024-01-27T14:00:00Z",
        type: "comment"
    },
    19: {
        id: 19,
        taskId: 8,
        authorId: 1,
        content: "Great! Let me know if you need any clarification on the requirements.",
        timestamp: "2024-01-27T14:15:00Z",
        type: "comment"
    },
    20: {
        id: 20,
        taskId: 9,
        authorId: 2,
        content: "The API documentation is comprehensive. Should I start with the authentication endpoints?",
        timestamp: "2024-01-27T14:30:00Z",
        type: "comment"
    },

    // Additional comments and activities for various tasks
    21: {
        id: 21,
        taskId: 1,
        authorId: 1,
        content: "created this task",
        timestamp: "2024-01-26T09:00:00Z",
        type: "activity"
    },
    22: {
        id: 22,
        taskId: 1,
        authorId: 1,
        content: "assigned Jane Cooper",
        timestamp: "2024-01-26T09:30:00Z",
        type: "activity"
    },
    23: {
        id: 23,
        taskId: 1,
        authorId: 2,
        content: "Thanks for assigning me! I'll start working on this right away.",
        timestamp: "2024-01-26T10:00:00Z",
        type: "comment"
    },
    24: {
        id: 24,
        taskId: 1,
        authorId: 1,
        content: "changed status from To Do to In Progress",
        timestamp: "2024-01-26T10:15:00Z",
        type: "activity"
    },
    25: {
        id: 25,
        taskId: 1,
        authorId: 2,
        content: "I've completed the research phase. Moving on to sketches now.",
        timestamp: "2024-01-27T11:00:00Z",
        type: "comment"
    },
    26: {
        id: 26,
        taskId: 5,
        authorId: 1,
        content: "created this task",
        timestamp: "2024-01-25T14:00:00Z",
        type: "activity"
    },
    27: {
        id: 27,
        taskId: 5,
        authorId: 1,
        content: "set priority to High",
        timestamp: "2024-01-25T14:05:00Z",
        type: "activity"
    },
    28: {
        id: 28,
        taskId: 5,
        authorId: 1,
        content: "The ad campaign is crucial for our Q1 launch. Let's make it impactful!",
        timestamp: "2024-01-25T14:30:00Z",
        type: "comment"
    },
    29: {
        id: 29,
        taskId: 6,
        authorId: 3,
        content: "created this task",
        timestamp: "2024-01-24T11:00:00Z",
        type: "activity"
    },
    30: {
        id: 30,
        taskId: 6,
        authorId: 3,
        content: "The POS system needs to be intuitive for restaurant staff.",
        timestamp: "2024-01-24T11:30:00Z",
        type: "comment"
    },
    31: {
        id: 31,
        taskId: 6,
        authorId: 1,
        content: "updated due date",
        timestamp: "2024-01-25T09:00:00Z",
        type: "activity"
    },
    32: {
        id: 32,
        taskId: 7,
        authorId: 2,
        content: "created this task",
        timestamp: "2024-01-23T16:00:00Z",
        type: "activity"
    },
    33: {
        id: 33,
        taskId: 7,
        authorId: 2,
        content: "Banner should align with the overall brand guidelines.",
        timestamp: "2024-01-23T16:15:00Z",
        type: "comment"
    },
    34: {
        id: 34,
        taskId: 8,
        authorId: 6,
        content: "created this task",
        timestamp: "2024-01-22T10:00:00Z",
        type: "activity"
    },
    35: {
        id: 35,
        taskId: 8,
        authorId: 6,
        content: "assigned Alex Johnson",
        timestamp: "2024-01-22T10:15:00Z",
        type: "activity"
    },
    36: {
        id: 36,
        taskId: 8,
        authorId: 3,
        content: "I'll focus on making the tracking data actionable and easy to understand.",
        timestamp: "2024-01-22T11:00:00Z",
        type: "comment"
    },

    // Task 7: Banner Illustration - Comments and Activities
    37: {
        id: 37,
        taskId: 7,
        authorId: 2,
        content: "created this task",
        timestamp: "2024-01-23T16:00:00Z",
        type: "activity"
    },
    38: {
        id: 38,
        taskId: 7,
        authorId: 2,
        content: "Banner should align with the overall brand guidelines.",
        timestamp: "2024-01-23T16:15:00Z",
        type: "comment"
    },
    39: {
        id: 39,
        taskId: 7,
        authorId: 1,
        content: "assigned Mark Atenson",
        timestamp: "2024-01-24T09:00:00Z",
        type: "activity"
    },
    40: {
        id: 40,
        taskId: 7,
        authorId: 1,
        content: "The animation timing feels a bit slow. Can we speed it up by 20%?",
        timestamp: "2024-01-27T13:00:00Z",
        type: "comment"
    },
    41: {
        id: 41,
        taskId: 7,
        authorId: 3,
        content: "Sure! I'll adjust the timing and send you the updated version.",
        timestamp: "2024-01-27T13:15:00Z",
        type: "comment"
    },
    42: {
        id: 42,
        taskId: 7,
        authorId: 1,
        content: "changed status from To Do to In Progress",
        timestamp: "2024-01-27T14:00:00Z",
        type: "activity"
    },

    // Additional comments for other tasks
    43: {
        id: 43,
        taskId: 5,
        authorId: 3,
        content: "updated the mockups based on feedback",
        timestamp: "2024-01-28T10:00:00Z",
        type: "activity"
    },
    44: {
        id: 44,
        taskId: 6,
        authorId: 1,
        content: "The POS interface looks great! Ready for testing.",
        timestamp: "2024-01-28T11:00:00Z",
        type: "comment"
    },
    45: {
        id: 45,
        taskId: 6,
        authorId: 5,
        content: "I'll start the integration testing tomorrow.",
        timestamp: "2024-01-28T11:30:00Z",
        type: "comment"
    }
};

// Helper functions for discussions
export const getChannelsByProjectId = (projectId) => {
    return Object.values(discussionChannels).filter(channel => channel.projectId === projectId);
};

export const getMessagesByChannelId = (channelId) => {
    return Object.values(discussionMessages)
        .filter(message => message.channelId === channelId)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

export const getCommentsByTaskId = (taskId) => {
    if (!taskId) return [];

    const allComments = Object.values(taskComments);

    // Convert taskId to number for comparison
    const numericTaskId = parseInt(taskId);

    const filteredComments = allComments.filter(comment => {
        return comment.taskId === numericTaskId;
    });

    return filteredComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Export all data for debugging/admin purposes
export const getAllData = () => ({
    projects,
    tasks,
    teamMembers,
    clients,
    dashboardStats,
    assignedTasks,
    dashboardProjects,
    teamMembersDashboard,
    discussionChannels,
    discussionMessages,
    taskComments
});