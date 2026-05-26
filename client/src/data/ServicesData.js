const servicesData = [
    {
        id: 1,
        name: "Sales & BD",
        slug: "sales-bd",
        image: "/images/services/sales.png",
        description: "Expand your market reach and grow your business with expert sales and business development support.",
        link: "/services/sales-bd",
        isFavorite: false,
        category: "Sales",
        subCompany: "XMC",
        tags: ["sales", "business development", "growth"],
        featured: false,
        createdAt: "2023-05-12T15:20:00Z",
        updatedAt: "2024-05-05T20:00:00Z",
        stats: {},
        highlights: [
            "Market expansion",
            "Business growth"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 2,
        name: "Funding & Financing",
        slug: "funding-financing",
        image: "/images/services/funding.png",
        description: "Get access to funding solutions and financial expertise to grow your business.",
        link: "/services/funding-financing",
        isFavorite: false,
        category: "Finance",
        subCompany: "XGV",
        tags: ["funding", "loans", "capital"],
        featured: true,
        createdAt: "2023-01-10T09:00:00Z",
        updatedAt: "2024-05-01T12:00:00Z",
        stats: {
            b2c_purchase_likelihood: 0.5,
            b2b_purchase_likelihood: 0.37,
            automation_interest: 0.7,
        },
        highlights: [
            "Seamless, data-driven experiences",
            "Personalized and proactive support",
            "Unlock new opportunities for growth"
        ],
        partners: [
            { name: "AWS", logo: "/images/partners/aws.png", url: "https://aws.amazon.com/" },
            { name: "Salesforce", logo: "/images/partners/salesforce.png", url: "https://www.salesforce.com/" }
        ],
        caseStudies: [
            {
                title: "BBVA banks on happy customers",
                summary: "A reinvented digital sales model helped BBVA achieve 117% growth in new customers in 5 years.",
                url: "https://www.accenture.com/in-en/case-studies/bbva-digital-sales"
            }
        ],
        testimonials: [
            {
                author: "Jane Doe, CFO",
                company: "Acme Corp",
                quote: "Their funding solutions helped us scale faster than we thought possible."
            }
        ]
    },
    {
        id: 3,
        name: "Sourcing & Supplychain",
        slug: "sourcing-supplychain",
        image: "/images/services/supplychain.png",
        description: "Optimize your sourcing and supply chain for efficiency and resilience.",
        link: "/services/sourcing-supplychain",
        isFavorite: false,
        category: "Operations",
        subCompany: "XMB",
        tags: ["sourcing", "logistics", "supply chain"],
        featured: false,
        createdAt: "2023-03-20T11:15:00Z",
        updatedAt: "2024-05-03T16:00:00Z",
        stats: {
            product_failure_rate: 0.95,
        },
        highlights: [
            "End-to-end supply chain visibility",
            "Resilient sourcing strategies"
        ],
        partners: [
            { name: "Microsoft", logo: "/images/partners/microsoft.png", url: "https://www.microsoft.com/" }
        ],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 4,
        name: "Manufacturing",
        slug: "manufacturing",
        image: "/images/services/manufacturing.png",
        description: "Enhance your manufacturing processes with innovative solutions and technology.",
        link: "/services/manufacturing",
        isFavorite: false,
        category: "Digital Engineering",
        subCompany: "XMB",
        tags: ["manufacturing", "digital", "automation"],
        featured: false,
        createdAt: "2023-04-10T10:00:00Z",
        updatedAt: "2024-05-06T10:00:00Z",
        stats: {},
        highlights: [
            "Digital engineering and manufacturing",
            "Smart factory solutions"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 5,
        name: "Prototyping",
        slug: "prototyping",
        image: "/images/services/prototyping.png",
        description: "Turn your ideas into reality with rapid prototyping and product development.",
        link: "/services/prototyping",
        isFavorite: false,
        category: "Product Development",
        subCompany: "XMB",
        tags: ["prototyping", "MVP", "design"],
        featured: true,
        createdAt: "2023-04-05T13:45:00Z",
        updatedAt: "2024-05-04T18:00:00Z",
        stats: {},
        highlights: [
            "Rapid prototyping",
            "Product development expertise"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },

    {
        id: 7,
        name: "Franchise & Dealer development",
        slug: "franchise-dealer-development",
        image: "/images/services/franchise.png",
        description: "Develop and scale your franchise or dealer network with our proven strategies.",
        link: "/services/franchise-dealer-development",
        isFavorite: false,
        category: "Franchise",
        subCompany: "XMC",
        tags: ["franchise", "dealer", "network"],
        featured: false,
        createdAt: "2023-06-01T09:00:00Z",
        updatedAt: "2024-05-07T12:00:00Z",
        stats: {},
        highlights: [
            "Franchise growth",
            "Dealer network expansion"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 8,
        name: "Engineering",
        slug: "engineering",
        image: "/images/services/engineering.png",
        description: "Innovative engineering solutions to solve your toughest technical challenges.",
        link: "/services/engineering",
        isFavorite: false,
        category: "Engineering",
        subCompany: "XMC",
        tags: ["engineering", "solutions", "innovation"],
        featured: false,
        createdAt: "2023-07-01T09:00:00Z",
        updatedAt: "2024-05-08T12:00:00Z",
        stats: {},
        highlights: [
            "Technical innovation",
            "Engineering expertise"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 9,
        name: "Product Design",
        slug: "product-design",
        image: "/images/services/product-design.png",
        description: "Design products that delight customers and drive business growth.",
        link: "/services/product-design",
        isFavorite: false,
        category: "Design",
        subCompany: "XMC",
        tags: ["product design", "UX", "innovation"],
        featured: false,
        createdAt: "2023-08-01T09:00:00Z",
        updatedAt: "2024-05-09T12:00:00Z",
        stats: {},
        highlights: [
            "Customer-centric design",
            "Innovative product solutions"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 10,
        name: "Org Dev & hiring",
        slug: "org-dev-hiring",
        image: "/images/services/orgdev.png",
        description: "Build a high-performing organization with our org development and hiring solutions.",
        link: "/services/org-dev-hiring",
        isFavorite: false,
        category: "Organization",
        subCompany: "XMC",
        tags: ["org development", "hiring", "talent"],
        featured: false,
        createdAt: "2023-09-01T09:00:00Z",
        updatedAt: "2024-05-10T12:00:00Z",
        stats: {},
        highlights: [
            "Talent acquisition",
            "Organizational growth"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
    {
        id: 11,
        name: "Marketing & PR",
        slug: "marketing-pr",
        image: "/images/services/marketing.png",
        description: "Boost your brand visibility and connect with your audience through strategic marketing and PR.",
        link: "/services/marketing-pr",
        isFavorite: false,
        category: "Marketing",
        subCompany: "XMC",
        tags: ["marketing", "PR", "branding"],
        featured: false,
        createdAt: "2023-10-01T09:00:00Z",
        updatedAt: "2024-05-11T12:00:00Z",
        stats: {},
        highlights: [
            "Brand visibility",
            "Strategic communications"
        ],
        partners: [],
        caseStudies: [],
        testimonials: []
    },
];

export const engagementModels = [
    {
        name: "Complementary Support",
        subtitle: "Best for starting up",
        price: "₹0",
        period: "startup",
        features: [
            "Task Management",
            "Project Planning",
            "Team Collaboration",
            "Notifications and Reminders",
            "What you get",
        ],
        popular: false,
        headerStyle: "normal",
    },
    {
        name: "Membership Advisory",
        subtitle: "Best for growing use",
        price: "Rs. 31lac",
        period: "Monthly",
        features: [
            "All free features, plus:",
            "Kanban Boards",
            "Agent Chatbot",
            "Resource Allocation",
            "Calendar Integration",
            "Progress Tracking",
        ],
        popular: false,
        headerStyle: "pink",
    },
    {
        name: "Consulting",
        subtitle: "Best for enterprise use",
        price: "Rs. 24lac",
        period: "Monthly",
        features: [
            "All starter features, plus:",
            "Enterprise Workflows",
            "Reporting and Analytics",
            "Document Management",
            "Agile Methodology Support",
            "Issue Tracking",
        ],
        popular: true,
        headerStyle: "primary",
    },
];

export const plans = [
    {
        name: "Complementary Support",
        price: 0,
        period: "/month",
        button: "Get started",
        popular: false,
    },
    {
        name: "Membership Advisory",
        price: 8,
        period: "/month",
        button: "Get started",
        popular: false,
    },
    {
        name: "Consulting",
        price: 16,
        period: "/month",
        button: "Get started",
        popular: true,
    },
];

export const featureSections = [
    {
        title: "Task Management",
        features: [
            {
                name: "Customizable Workflows",
                info: true,
                values: ["100", "100", "Unlimited"],
            },
            {
                name: "Project Planning",
                info: true,
                values: ["-", "tick", "tick"],
            },
            {
                name: "Time Tracking",
                info: true,
                values: ["tick", "tick", "tick"],
            },
        ],
    },
    {
        title: "Visualization",
        features: [
            {
                name: "Gantt Charts",
                info: true,
                values: ["-", "-", "tick"],
            },
            {
                name: "Agile Methodology Support",
                info: true,
                values: ["tick", "tick", "tick"],
            },
            {
                name: "Reporting and Analytics",
                info: true,
                values: ["-", "-", "tick"],
            },
            {
                name: "Team and Individual Dashboards",
                info: true,
                values: ["tick", "tick", "tick"],
            },
        ],
    },
    {
        title: "Integrations",
        features: [
            {
                name: "Document Management",
                info: true,
                values: ["-", "-", "tick"],
            },
            {
                name: "Client Collaboration",
                info: true,
                values: ["-", "tick", "tick"],
            },
            {
                name: "Mobile App Integration",
                info: true,
                values: ["-", "tick", "tick"],
            },
        ],
    },
];

export default servicesData; 
