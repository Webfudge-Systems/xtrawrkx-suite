// Core Leadership Team
export const coreTeam = [
    {
        id: 1,
        name: "Rajesh Kumar",
        title: "Chief Executive Officer",
        location: "Mumbai, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "rajesh@xtrawrkx.com",
        bio: "Visionary leader with 15+ years experience in automotive and EV industry transformation.",
        category: "core",
        isActive: true,
        joinDate: "2020-01-15"
    },
    {
        id: 2,
        name: "Priya Sharma",
        title: "Head of Business Advisory",
        location: "Delhi, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "priya@xtrawrkx.com",
        bio: "Strategic business advisor specializing in automotive sector growth and market expansion.",
        category: "core",
        isActive: true,
        joinDate: "2020-03-01"
    },
    {
        id: 3,
        name: "Arjun Mehta",
        title: "Director of Financial Analysis",
        location: "Bengaluru, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "arjun@xtrawrkx.com",
        bio: "Financial expert with deep understanding of automotive and manufacturing investment landscapes.",
        category: "core",
        isActive: true,
        joinDate: "2020-06-10"
    }
];

// Employees/Team Members
export const employees = [
    {
        id: 4,
        name: "Kavya Patel",
        title: "EV Strategy Consultant",
        location: "Pune, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "kavya@xtrawrkx.com",
        bio: "Specialist in electric vehicle market dynamics and strategic planning for sustainable mobility.",
        category: "employee",
        isActive: true,
        joinDate: "2021-02-15"
    },
    {
        id: 5,
        name: "Suresh Nair",
        title: "Operations Manager",
        location: "Chennai, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "suresh@xtrawrkx.com",
        bio: "Operations excellence expert ensuring smooth project delivery and client satisfaction.",
        category: "employee",
        isActive: true,
        joinDate: "2021-05-20"
    },
    {
        id: 6,
        name: "Neha Gupta",
        title: "Client Relations Head",
        location: "Hyderabad, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "neha@xtrawrkx.com",
        bio: "Relationship management expert fostering long-term client partnerships and success.",
        category: "employee",
        isActive: true,
        joinDate: "2021-08-10"
    },
    {
        id: 7,
        name: "Ravi Shankar",
        title: "Technical Consultant",
        location: "Bangalore, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "ravi@xtrawrkx.com",
        bio: "Technical expert in automotive systems and manufacturing process optimization.",
        category: "employee",
        isActive: true,
        joinDate: "2022-01-05"
    },
    {
        id: 8,
        name: "Anita Singh",
        title: "Research Analyst",
        location: "Gurgaon, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "anita@xtrawrkx.com",
        bio: "Market research specialist providing insights on emerging automotive technologies.",
        category: "employee",
        isActive: true,
        joinDate: "2022-04-18"
    },
    {
        id: 9,
        name: "Vikram Reddy",
        title: "Project Manager",
        location: "Hyderabad, India",
        img: "/images/hero.png",
        linkedin: "#",
        email: "vikram@xtrawrkx.com",
        bio: "Experienced project manager ensuring timely delivery of complex consulting engagements.",
        category: "employee",
        isActive: true,
        joinDate: "2022-07-12"
    }
];

// Combined team data for backward compatibility
export const team = [...coreTeam, ...employees];

// Helper functions
export const getActiveTeamMembers = () => {
    return team.filter(member => member.isActive);
};

export const getTeamMembersByCategory = (category) => {
    return team.filter(member => member.category === category && member.isActive);
};

export const getTeamMemberById = (id) => {
    return team.find(member => member.id === parseInt(id));
};
