// Comprehensive resources data for whitepapers, articles, and reports
export const resourcesData = [
  // Whitepapers
  {
    id: 1,
    slug: "ev-financing-landscape-2024",
    title: "Electric Vehicle Financing Landscape 2024",
    type: "whitepaper",
    category: "Finance",
    description: "Comprehensive analysis of EV financing trends, challenges, and opportunities in the global market.",
    excerpt: "This whitepaper explores the evolving landscape of electric vehicle financing, examining key trends, market drivers, and emerging opportunities for stakeholders across the EV ecosystem.",
    author: "Xtrawrkx Research Team",
    publishedDate: "2024-01-15",
    readTime: "12 min read",
    downloadUrl: "/downloads/ev-financing-landscape-2024.pdf",
    image: "/images/resources/ev-financing-whitepaper.jpg",
    tags: ["EV Finance", "Market Analysis", "Investment", "Trends"],
    featured: true,
    views: 2847,
    downloads: 1523,
    content: `
      <h2>Executive Summary</h2>
      <p>The electric vehicle financing landscape has undergone significant transformation in 2024, driven by technological advances, regulatory changes, and shifting consumer preferences. This comprehensive analysis examines the current state of EV financing and provides insights into future opportunities.</p>
      
      <h2>Key Findings</h2>
      <ul>
        <li>EV financing options have expanded by 40% compared to 2023</li>
        <li>Government incentives remain a crucial driver of adoption</li>
        <li>Battery leasing models are gaining traction globally</li>
        <li>Corporate fleet financing shows strongest growth potential</li>
      </ul>
      
      <h2>Market Overview</h2>
      <p>The global EV financing market reached $45 billion in 2024, representing a 35% increase from the previous year. Traditional automotive financing institutions are adapting their models to accommodate the unique characteristics of electric vehicles.</p>
      
      <h2>Recommendations</h2>
      <p>Based on our analysis, we recommend that financial institutions focus on developing specialized EV financing products, particularly in the commercial vehicle segment where growth opportunities are most significant.</p>
    `
  },
  {
    id: 2,
    slug: "sustainable-supply-chain-report",
    title: "Building Sustainable Supply Chains for EV Manufacturing",
    type: "whitepaper",
    category: "Manufacturing",
    description: "Strategic guide to developing sustainable and resilient supply chains in the electric vehicle industry.",
    excerpt: "A comprehensive guide for manufacturers looking to build sustainable, resilient supply chains that support the growing electric vehicle market while maintaining operational efficiency.",
    author: "Dr. Sarah Chen & Manufacturing Team",
    publishedDate: "2024-02-20",
    readTime: "15 min read",
    downloadUrl: "/downloads/sustainable-supply-chain-report.pdf",
    image: "/images/resources/supply-chain-whitepaper.jpg",
    tags: ["Supply Chain", "Sustainability", "Manufacturing", "EV"],
    featured: false,
    views: 1892,
    downloads: 987,
    content: `
      <h2>Introduction</h2>
      <p>The electric vehicle industry faces unique supply chain challenges that require innovative approaches to sourcing, manufacturing, and distribution. This whitepaper provides a roadmap for building sustainable supply chains.</p>
      
      <h2>Supply Chain Challenges</h2>
      <p>Key challenges include battery material sourcing, semiconductor availability, and the need for specialized manufacturing capabilities. Our analysis shows that companies addressing these challenges early gain significant competitive advantages.</p>
      
      <h2>Best Practices</h2>
      <ul>
        <li>Diversified supplier networks</li>
        <li>Vertical integration strategies</li>
        <li>Sustainable material sourcing</li>
        <li>Technology partnerships</li>
      </ul>
    `
  },
  {
    id: 3,
    slug: "regulatory-compliance-ev-industry",
    title: "Regulatory Compliance in the EV Industry: A Global Perspective",
    type: "whitepaper",
    category: "Regulatory",
    description: "Navigate the complex regulatory landscape governing electric vehicle development and deployment worldwide.",
    excerpt: "Understanding and navigating the complex regulatory environment is crucial for EV industry success. This whitepaper provides a comprehensive overview of global regulatory frameworks.",
    author: "Legal & Compliance Team",
    publishedDate: "2024-03-10",
    readTime: "18 min read",
    downloadUrl: "/downloads/regulatory-compliance-ev-industry.pdf",
    image: "/images/resources/regulatory-whitepaper.jpg",
    tags: ["Regulation", "Compliance", "Policy", "Global"],
    featured: true,
    views: 3156,
    downloads: 1876,
    content: `
      <h2>Global Regulatory Overview</h2>
      <p>The regulatory landscape for electric vehicles varies significantly across regions, with each market presenting unique challenges and opportunities for manufacturers and service providers.</p>
      
      <h2>Key Regulatory Areas</h2>
      <ul>
        <li>Vehicle safety standards</li>
        <li>Battery disposal and recycling</li>
        <li>Charging infrastructure requirements</li>
        <li>Emissions and environmental standards</li>
      </ul>
      
      <h2>Compliance Strategies</h2>
      <p>Successful companies develop comprehensive compliance strategies that anticipate regulatory changes and build flexibility into their operations.</p>
    `
  },

  // Articles
  {
    id: 4,
    slug: "future-of-ev-charging-infrastructure",
    title: "The Future of EV Charging Infrastructure: Trends and Innovations",
    type: "article",
    category: "Technology",
    description: "Exploring the latest developments in EV charging technology and infrastructure deployment strategies.",
    excerpt: "From ultra-fast charging to wireless power transfer, the EV charging landscape is evolving rapidly. This article explores the key trends shaping the future of charging infrastructure.",
    author: "Alex Rodriguez, Technology Analyst",
    publishedDate: "2024-04-05",
    readTime: "8 min read",
    downloadUrl: null,
    image: "/images/resources/charging-infrastructure-article.jpg",
    tags: ["Charging", "Infrastructure", "Technology", "Innovation"],
    featured: false,
    views: 4523,
    downloads: 0,
    content: `
      <h2>The Charging Revolution</h2>
      <p>Electric vehicle charging infrastructure is undergoing a transformation that will fundamentally change how we think about vehicle refueling. New technologies are making charging faster, more convenient, and more accessible than ever before.</p>
      
      <h2>Key Innovations</h2>
      <ul>
        <li>Ultra-fast charging up to 350kW</li>
        <li>Wireless charging technology</li>
        <li>Vehicle-to-grid (V2G) capabilities</li>
        <li>Smart charging management systems</li>
      </ul>
      
      <h2>Market Implications</h2>
      <p>These technological advances are creating new business models and opportunities for energy companies, technology providers, and automotive manufacturers.</p>
    `
  },
  {
    id: 5,
    slug: "ev-adoption-emerging-markets",
    title: "EV Adoption in Emerging Markets: Opportunities and Challenges",
    type: "article",
    category: "Market Analysis",
    description: "Analysis of electric vehicle adoption patterns and growth potential in emerging markets worldwide.",
    excerpt: "Emerging markets present both significant opportunities and unique challenges for electric vehicle adoption. This analysis examines the key factors driving growth in these regions.",
    author: "Maria Santos, Market Research Director",
    publishedDate: "2024-04-12",
    readTime: "10 min read",
    downloadUrl: null,
    image: "/images/resources/emerging-markets-article.jpg",
    tags: ["Emerging Markets", "Adoption", "Growth", "Strategy"],
    featured: true,
    views: 3789,
    downloads: 0,
    content: `
      <h2>Market Dynamics</h2>
      <p>Emerging markets are experiencing rapid economic growth and urbanization, creating ideal conditions for electric vehicle adoption. However, infrastructure limitations and affordability concerns present significant challenges.</p>
      
      <h2>Success Factors</h2>
      <ul>
        <li>Government policy support</li>
        <li>Affordable vehicle options</li>
        <li>Charging infrastructure development</li>
        <li>Local manufacturing capabilities</li>
      </ul>
      
      <h2>Regional Insights</h2>
      <p>Different emerging markets show varying adoption patterns based on local economic conditions, government policies, and consumer preferences.</p>
    `
  },
  {
    id: 6,
    slug: "battery-technology-breakthroughs",
    title: "Battery Technology Breakthroughs: What's Next for EV Performance",
    type: "article",
    category: "Technology",
    description: "Latest developments in battery technology and their impact on electric vehicle performance and adoption.",
    excerpt: "Revolutionary advances in battery technology are set to transform electric vehicle performance, range, and affordability. This article explores the most promising developments.",
    author: "Dr. Yuki Tanaka, Battery Technology Expert",
    publishedDate: "2024-04-18",
    readTime: "12 min read",
    downloadUrl: null,
    image: "/images/resources/battery-technology-article.jpg",
    tags: ["Battery", "Technology", "Performance", "Innovation"],
    featured: false,
    views: 5234,
    downloads: 0,
    content: `
      <h2>Next-Generation Batteries</h2>
      <p>The next generation of battery technology promises to address the key limitations of current EV batteries: range, charging time, and cost. Several breakthrough technologies are nearing commercial viability.</p>
      
      <h2>Key Technologies</h2>
      <ul>
        <li>Solid-state batteries</li>
        <li>Silicon nanowire anodes</li>
        <li>Lithium-metal batteries</li>
        <li>Advanced thermal management</li>
      </ul>
      
      <h2>Industry Impact</h2>
      <p>These technological advances will enable longer range, faster charging, and lower costs, accelerating mass adoption of electric vehicles.</p>
    `
  },

  // Reports
  {
    id: 7,
    slug: "ev-market-outlook-2024",
    title: "EV Market Outlook 2024: Growth Projections and Investment Opportunities",
    type: "report",
    category: "Market Analysis",
    description: "Comprehensive market analysis with growth projections and investment recommendations for the EV industry.",
    excerpt: "Our annual market outlook provides detailed analysis of EV market trends, growth projections, and investment opportunities across different segments and regions.",
    author: "Xtrawrkx Analytics Team",
    publishedDate: "2024-01-30",
    readTime: "25 min read",
    downloadUrl: "/downloads/ev-market-outlook-2024.pdf",
    image: "/images/resources/market-outlook-report.jpg",
    tags: ["Market Outlook", "Investment", "Growth", "Analysis"],
    featured: true,
    views: 6789,
    downloads: 3456,
    content: `
      <h2>Market Overview</h2>
      <p>The global electric vehicle market is experiencing unprecedented growth, with sales increasing by 60% year-over-year in 2024. This comprehensive report analyzes market trends, growth drivers, and investment opportunities.</p>
      
      <h2>Key Findings</h2>
      <ul>
        <li>Global EV sales reached 14.2 million units in 2024</li>
        <li>Battery costs decreased by 15% year-over-year</li>
        <li>Charging infrastructure expanded by 85% globally</li>
        <li>Commercial vehicle segment shows highest growth potential</li>
      </ul>
      
      <h2>Investment Opportunities</h2>
      <p>We identify key investment opportunities in battery technology, charging infrastructure, and software solutions for the EV ecosystem.</p>
      
      <h2>Regional Analysis</h2>
      <p>Detailed analysis of market conditions and growth prospects in North America, Europe, Asia-Pacific, and emerging markets.</p>
    `
  },
  {
    id: 8,
    slug: "sustainability-impact-report-2024",
    title: "Sustainability Impact Report 2024: EV Industry Environmental Benefits",
    type: "report",
    category: "Sustainability",
    description: "Comprehensive assessment of the environmental impact and sustainability benefits of electric vehicle adoption.",
    excerpt: "This report quantifies the environmental benefits of electric vehicle adoption and provides insights into the industry's contribution to global sustainability goals.",
    author: "Environmental Impact Team",
    publishedDate: "2024-02-15",
    readTime: "20 min read",
    downloadUrl: "/downloads/sustainability-impact-report-2024.pdf",
    image: "/images/resources/sustainability-report.jpg",
    tags: ["Sustainability", "Environment", "Impact", "ESG"],
    featured: false,
    views: 2134,
    downloads: 1567,
    content: `
      <h2>Environmental Impact Assessment</h2>
      <p>Electric vehicles have demonstrated significant environmental benefits compared to traditional internal combustion engine vehicles. This report quantifies these benefits across the entire vehicle lifecycle.</p>
      
      <h2>Key Metrics</h2>
      <ul>
        <li>50% reduction in lifecycle CO2 emissions</li>
        <li>80% reduction in local air pollutants</li>
        <li>Significant noise pollution reduction</li>
        <li>Improved urban air quality</li>
      </ul>
      
      <h2>Sustainability Goals</h2>
      <p>The EV industry is contributing significantly to global sustainability goals, including carbon neutrality targets and improved air quality standards.</p>
    `
  },
  {
    id: 9,
    slug: "technology-innovation-report-2024",
    title: "Technology Innovation Report 2024: Driving the Future of Mobility",
    type: "report",
    category: "Technology",
    description: "Analysis of key technology innovations shaping the future of electric vehicles and sustainable mobility.",
    excerpt: "This report examines the most significant technology innovations in the EV industry and their potential impact on future mobility solutions.",
    author: "Innovation Research Team",
    publishedDate: "2024-03-25",
    readTime: "22 min read",
    downloadUrl: "/downloads/technology-innovation-report-2024.pdf",
    image: "/images/resources/technology-innovation-report.jpg",
    tags: ["Innovation", "Technology", "R&D", "Future"],
    featured: true,
    views: 4567,
    downloads: 2890,
    content: `
      <h2>Innovation Landscape</h2>
      <p>The electric vehicle industry continues to drive technological innovation across multiple domains, from battery technology to autonomous driving systems.</p>
      
      <h2>Key Innovation Areas</h2>
      <ul>
        <li>Advanced battery management systems</li>
        <li>Autonomous driving technology</li>
        <li>Connected vehicle platforms</li>
        <li>Sustainable manufacturing processes</li>
      </ul>
      
      <h2>Future Outlook</h2>
      <p>Emerging technologies will continue to transform the mobility landscape, creating new opportunities for innovation and growth.</p>
    `
  },
  {
    id: 10,
    slug: "investment-trends-report-2024",
    title: "Investment Trends Report 2024: Capital Flows in the EV Ecosystem",
    type: "report",
    category: "Investment",
    description: "Analysis of investment patterns, funding trends, and capital allocation in the electric vehicle industry.",
    excerpt: "This report provides comprehensive analysis of investment trends in the EV ecosystem, including venture capital, private equity, and public market activities.",
    author: "Investment Analysis Team",
    publishedDate: "2024-04-01",
    readTime: "18 min read",
    downloadUrl: "/downloads/investment-trends-report-2024.pdf",
    image: "/images/resources/investment-trends-report.jpg",
    tags: ["Investment", "Funding", "Capital", "Trends"],
    featured: false,
    views: 3421,
    downloads: 2156,
    content: `
      <h2>Investment Overview</h2>
      <p>Investment in the electric vehicle ecosystem reached record levels in 2024, with over $85 billion in total funding across all segments.</p>
      
      <h2>Funding Trends</h2>
      <ul>
        <li>Battery technology companies attracted 35% of total funding</li>
        <li>Charging infrastructure investments doubled</li>
        <li>Software and services segment showed strong growth</li>
        <li>Government co-investment programs expanded globally</li>
      </ul>
      
      <h2>Investment Outlook</h2>
      <p>We expect continued strong investment activity, with particular focus on next-generation technologies and emerging market opportunities.</p>
    `
  }
];

// Helper functions
export const getResourcesByType = (type) => {
  return resourcesData.filter(resource => resource.type === type);
};

export const getResourcesByCategory = (category) => {
  return resourcesData.filter(resource => resource.category === category);
};

export const getFeaturedResources = () => {
  return resourcesData.filter(resource => resource.featured);
};

export const getResourceBySlug = (slug) => {
  return resourcesData.find(resource => resource.slug === slug);
};

export const getRelatedResources = (currentResource, limit = 3) => {
  return resourcesData
    .filter(resource =>
      resource.id !== currentResource.id &&
      (resource.category === currentResource.category ||
        resource.tags.some(tag => currentResource.tags.includes(tag)))
    )
    .slice(0, limit);
};

// Categories for filtering
export const resourceCategories = [
  "All",
  "Finance",
  "Technology",
  "Manufacturing",
  "Market Analysis",
  "Sustainability",
  "Regulatory",
  "Investment"
];

// Resource types
export const resourceTypes = [
  { value: "all", label: "All Resources" },
  { value: "whitepaper", label: "Whitepapers" },
  { value: "article", label: "Articles" },
  { value: "report", label: "Reports" }
]; 
