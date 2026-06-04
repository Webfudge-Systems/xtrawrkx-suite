export const communitiesData = [
    {
        id: 1,
        name: "XEV.FiN",
        fullName: "xtrawrkx Electric Vehicle Finance Network",
        slug: "xev-fin",
        description: "A premier community for EV & HW startups to network and get assistance from 250+ Angel investor syndicates, VCs, PE, IBs, NBFCs and Franchise Owners.",
        icon: "mdi:finance",
        logo: "/images/xevfin.png",
        color: "from-[#2d5a9e] to-[#24487a]",
        members: "500+",
        category: "Finance & Investment",
        features: [
            "Access to 250+ Angel investor syndicates",
            "Venture Capital connections",
            "Private Equity partnerships",
            "Investment Banking networks",
            "NBFC collaborations",
            "Franchise opportunities"
        ],
        benefits: [
            "Direct access to funding opportunities",
            "Mentor guidance from industry experts",
            "Networking with successful entrepreneurs",
            "Investment readiness programs",
            "Pitch deck development support"
        ],
        targetAudience: [
            "EV Startups seeking funding",
            "Hardware startups",
            "Early-stage entrepreneurs",
            "Scale-up companies",
            "Tech innovators"
        ],
        joinProcess: "Application-based membership with screening process",
        meetingFrequency: "Monthly investor meetups & quarterly pitch events"
    },
    {
        id: 2,
        name: "XEN",
        fullName: "xtrawrkx Entrepreneurship Network",
        slug: "xen",
        description: "The only community specifically designed for automotive and hardware startups. By the founders, for the founders - connecting you with 40+ experienced consultants.",
        icon: "mdi:factory",
        logo: "/images/xen.png",
        color: "from-[#377ecc] to-[#2c63a3]",
        members: "1000+",
        category: "Hardware & Automotive Startups",
        features: [
            "40+ experienced consultants providing digital support",
            "Business Development Support & partnerships",
            "Investor & Financing Support through XEV.FiN",
            "Sourcing & Supply Chain Support for manufacturing",
            "Hiring & Organizational Development assistance",
            "Mentoring Sessions & Masterclasses from experts"
        ],
        benefits: [
            "Access to 7 specialized advisory service areas",
            "Curated help tailored to your specific needs",
            "Organic client and partner discovery within network",
            "6 membership tiers from free to enterprise level",
            "Up to 112 hours of monthly advisory support"
        ],
        targetAudience: [
            "Hardware startup founders",
            "Automotive industry entrepreneurs",
            "Manufacturing companies ($1M-$10M revenue)",
            "Students & future founders with stable income",
            "Large corporates & MNCs in automotive space"
        ],
        joinProcess: "Tiered membership from X0 (Free WhatsApp) to X5 (Enterprise)",
        meetingFrequency: "Advisory hours allocated based on membership tier"
    },
    {
        id: 3,
        name: "XEVTG",
        fullName: "xtrawrkx EV Talent Group",
        slug: "xevtg",
        description: "An exclusive community of Training & Placement Officers (TPOs) from prominent institutions and HR/Talent Acquisition teams of EV companies, plus student training organizations.",
        icon: "mdi:account-group",
        logo: null, // Add logo when available
        color: "from-green-500 to-green-600",
        members: "300+",
        category: "Talent & Training",
        features: [
            "TPO network from top institutions",
            "HR/TA teams from EV companies",
            "Student training organizations",
            "Talent pipeline development",
            "Skill assessment programs",
            "Industry-academia collaboration"
        ],
        benefits: [
            "Direct access to fresh talent",
            "Customized training programs",
            "Industry-specific skill development",
            "Placement assistance",
            "Career guidance for students"
        ],
        targetAudience: [
            "Training & Placement Officers",
            "HR professionals in EV sector",
            "Talent Acquisition teams",
            "Student training organizations",
            "Educational institutions"
        ],
        joinProcess: "Invitation-based membership for verified professionals",
        meetingFrequency: "Bi-weekly talent exchange & quarterly training summits"
    },
    {
        id: 4,
        name: "xD&D",
        fullName: "xtrawrkx Drones and Designs",
        slug: "xd-d",
        description: "A creative community focused on design thinking, product development, and innovation in the EV and sustainable technology space.",
        icon: "mdi:palette",
        logo: "/images/xd&d.png",
        color: "from-[#f5f37f] to-[#e6e06b]",
        members: "400+",
        category: "Drones and Designs",
        features: [
            "Design thinking workshops",
            "Product development collaboration",
            "Innovation labs access",
            "Prototyping support",
            "UX/UI design resources",
            "Technical development guidance"
        ],
        benefits: [
            "Collaborative design projects",
            "Access to design tools and resources",
            "Peer review and feedback",
            "Innovation challenges",
            "Product development mentorship"
        ],
        targetAudience: [
            "Product designers",
            "UX/UI designers",
            "Development engineers",
            "Innovation managers",
            "Creative professionals"
        ],
        joinProcess: "Portfolio-based application with design challenge",
        meetingFrequency: "Weekly design sprints & monthly innovation showcases"
    }
];

export const getCommunityBySlug = (slug) => {
    return communitiesData.find(community => community.slug === slug);
};

export const getCommunityStats = () => {
    return {
        totalCommunities: communitiesData.length,
        totalMembers: communitiesData.reduce((sum, community) => {
            const memberCount = parseInt(community.members.replace('+', ''));
            return sum + memberCount;
        }, 0),
        categories: [...new Set(communitiesData.map(community => community.category))],
        averageMembers: Math.round(
            communitiesData.reduce((sum, community) => {
                const memberCount = parseInt(community.members.replace('+', ''));
                return sum + memberCount;
            }, 0) / communitiesData.length
        )
    };
}; 
