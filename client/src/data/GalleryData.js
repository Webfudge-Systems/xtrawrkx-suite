export const galleryCategories = [
    { id: "all", label: "All", value: "all" },
    { id: "events", label: "Events", value: "events" },
    { id: "communities", label: "Communities", value: "communities" },
    { id: "achievements", label: "Achievements", value: "achievements" },
    { id: "team", label: "Team", value: "team" },
];

export const galleryItems = [
    {
        id: 1,
        title: "XSOS 2024 Conference",
        description: "Annual conference bringing together industry leaders and innovators.",
        image: "/images/hero.jpg",
        category: "events",
        date: "2024-03-15",
        tags: ["conference", "networking", "innovation"]
    },
    {
        id: 2,
        title: "XEV.FiN Community Launch",
        description: "The official launch of our financial innovation community.",
        image: "/images/xevfin.png",
        category: "communities",
        date: "2024-02-10",
        tags: ["community", "finance", "launch"]
    },
    {
        id: 3,
        title: "XEN Network Expansion",
        description: "Celebrating the growth of our XEN network across multiple regions.",
        image: "/images/xen.png",
        category: "communities",
        date: "2024-01-20",
        tags: ["network", "expansion", "growth"]
    },
    {
        id: 4,
        title: "xD&D Innovation Workshop",
        description: "Hands-on workshop for design and development innovations.",
        image: "/images/xd&d.png",
        category: "events",
        date: "2024-04-05",
        tags: ["workshop", "design", "development"]
    },
    {
        id: 5,
        title: "Team Building Summit",
        description: "Annual team building event fostering collaboration and innovation.",
        image: "/images/hero_services.png",
        category: "team",
        date: "2024-02-28",
        tags: ["team", "collaboration", "summit"]
    },
    {
        id: 6,
        title: "Achievement Awards 2024",
        description: "Recognizing outstanding contributions and achievements.",
        image: "/images/badge1.png",
        category: "achievements",
        date: "2024-05-12",
        tags: ["awards", "recognition", "achievement"]
    },
    {
        id: 7,
        title: "Community Milestone",
        description: "Celebrating reaching 10,000 active community members.",
        image: "/images/badge2.png",
        category: "achievements",
        date: "2024-03-30",
        tags: ["milestone", "community", "growth"]
    },
    {
        id: 8,
        title: "Innovation Showcase",
        description: "Showcasing the latest innovations and technological breakthroughs.",
        image: "/images/mountain_full.png",
        category: "events",
        date: "2024-04-18",
        tags: ["innovation", "technology", "showcase"]
    }
];

export default {
    galleryCategories,
    galleryItems
}; 
