/**
 * Mock legal / informational copy for client portal static pages.
 */

import {
  Building2,
  Target,
  ListChecks,
  Mail,
  ScrollText,
  Database,
  Workflow,
  Share2,
  UserCheck,
  Lock,
  FileCheck,
  Users,
  Scale,
  Server,
  Copyright,
  AlertTriangle,
  LogOut,
  HelpCircle,
  Shield,
  FileText,
} from "lucide-react";

export const legalRelatedPages = [
  {
    id: "about",
    href: "/about",
    label: "About",
    description: "Portal overview and mission",
    icon: HelpCircle,
  },
  {
    id: "privacy",
    href: "/privacy",
    label: "Privacy Policy",
    description: "How we handle your data",
    icon: Shield,
  },
  {
    id: "terms",
    href: "/terms",
    label: "Terms of Service",
    description: "Rules for using the portal",
    icon: FileText,
  },
];

export const aboutContent = {
  title: "About",
  description:
    "Learn about the xtrawrkx Client Portal and how we support your projects and communities.",
  lastUpdated: "May 2026",
  sections: [
    {
      id: "overview",
      title: "Overview",
      icon: Building2,
      navDescription: "What the client portal is",
      paragraphs: [
        "The xtrawrkx Client Portal is your central workspace for projects, tasks, communities, events, and account settings. It connects your team with delivery updates, messaging, and resources in one place.",
        "This portal is part of the broader xtrawrkx ecosystem — built to keep collaboration transparent and your work moving forward.",
      ],
    },
    {
      id: "mission",
      title: "Our Mission",
      icon: Target,
      navDescription: "How we work with clients",
      paragraphs: [
        "We help organizations solve complex engineering and product challenges with practical consulting, execution support, and long-term partnership — from advisory through delivery.",
      ],
    },
    {
      id: "what-you-can-do",
      title: "What You Can Do Here",
      icon: ListChecks,
      navDescription: "Features available to you",
      list: [
        "Track active projects, milestones, and deliverables",
        "Manage tasks and collaborate with your dedicated team",
        "Join communities, register for events, and access resources",
        "Update profile and notification preferences under Settings",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      navDescription: "How to reach us",
      paragraphs: [
        "For account or billing questions, reach your assigned point of contact from the sidebar, or email support@xtrawrkx.com (placeholder).",
        "Office: xtrawrkx Management Consulting Pvt. Ltd. — sample address, Bengaluru, India.",
      ],
    },
  ],
};

export const privacyContent = {
  title: "Privacy Policy",
  description:
    "How we collect, use, and protect information when you use the Client Portal.",
  lastUpdated: "May 2026",
  sections: [
    {
      id: "introduction",
      title: "Introduction",
      icon: ScrollText,
      navDescription: "Scope of this policy",
      paragraphs: [
        "This Privacy Policy describes how xtrawrkx (“we”, “us”) handles personal information when you access the Client Portal and related services. This is placeholder text for demonstration purposes.",
        "By using the portal, you acknowledge that you have read this policy. We may update it from time to time; the “Last updated” date reflects the latest revision.",
      ],
    },
    {
      id: "information-we-collect",
      title: "Information We Collect",
      icon: Database,
      navDescription: "Data we may gather",
      paragraphs: [
        "We may collect account details (name, email, company), usage data (pages visited, actions taken), and content you submit (messages, task comments, uploads).",
      ],
      list: [
        "Registration and profile information",
        "Authentication and session identifiers",
        "Device and browser metadata for security",
        "Communications sent through in-app messaging",
      ],
    },
    {
      id: "how-we-use",
      title: "How We Use Information",
      icon: Workflow,
      navDescription: "Purposes of processing",
      list: [
        "Provide and improve portal features",
        "Authenticate users and prevent fraud",
        "Send service-related notifications you opt into",
        "Comply with legal obligations",
      ],
    },
    {
      id: "sharing",
      title: "Sharing & Retention",
      icon: Share2,
      navDescription: "Third parties and storage",
      paragraphs: [
        "We do not sell personal information. We may share data with service providers under contract, or when required by law. Data is retained only as long as needed for the purposes above or as required by applicable regulations.",
      ],
    },
    {
      id: "your-rights",
      title: "Your Choices",
      icon: UserCheck,
      navDescription: "Access and preferences",
      paragraphs: [
        "You may update profile details in Settings, adjust notification preferences, or contact us to request access, correction, or deletion of your data where applicable.",
      ],
    },
    {
      id: "security",
      title: "Security",
      icon: Lock,
      navDescription: "How we protect data",
      paragraphs: [
        "We use industry-standard measures including encryption in transit, access controls, and monitoring. No method of transmission over the internet is 100% secure; we continuously work to protect your information.",
      ],
    },
  ],
};

export const termsContent = {
  title: "Terms of Service",
  description:
    "Terms governing your use of the xtrawrkx Client Portal.",
  lastUpdated: "May 2026",
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: FileCheck,
      navDescription: "Agreement to these terms",
      paragraphs: [
        "By accessing or using the Client Portal, you agree to these Terms of Service. If you do not agree, do not use the service. These terms are sample placeholder content for the UI.",
      ],
    },
    {
      id: "eligibility",
      title: "Eligibility & Accounts",
      icon: Users,
      navDescription: "Who may use the portal",
      paragraphs: [
        "Access is provided to authorized users of client organizations. You are responsible for safeguarding login credentials and for all activity under your account.",
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use",
      icon: Scale,
      navDescription: "Rules of conduct",
      list: [
        "Do not misuse the platform or attempt unauthorized access",
        "Do not upload malicious code or infringing content",
        "Do not harass other users or share confidential data improperly",
        "Comply with applicable laws and your organization’s policies",
      ],
    },
    {
      id: "services",
      title: "Services & Availability",
      icon: Server,
      navDescription: "Uptime and changes",
      paragraphs: [
        "We strive to keep the portal available but do not guarantee uninterrupted access. Features may change; we may suspend access for maintenance, security, or policy violations.",
      ],
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property",
      icon: Copyright,
      navDescription: "Ownership and licenses",
      paragraphs: [
        "The portal, branding, and underlying software are owned by xtrawrkx or its licensors. You retain rights to content you submit; you grant us a limited license to host and display it as needed to operate the service.",
      ],
    },
    {
      id: "limitation",
      title: "Disclaimer & Limitation of Liability",
      icon: AlertTriangle,
      navDescription: "Legal disclaimers",
      paragraphs: [
        "The portal is provided “as is” to the extent permitted by law. We are not liable for indirect or consequential damages arising from use of the service. Specific engagements may be governed by separate agreements with your organization.",
      ],
    },
    {
      id: "termination",
      title: "Termination",
      icon: LogOut,
      navDescription: "Ending access",
      paragraphs: [
        "We may suspend or terminate access for breach of these terms or at the request of your organization. Provisions that by nature should survive termination will remain in effect.",
      ],
    },
    {
      id: "contact",
      title: "Contact",
      icon: Mail,
      navDescription: "Legal inquiries",
      paragraphs: [
        "Questions about these terms: legal@xtrawrkx.com (placeholder). Governing law and venue may be specified in your master services agreement.",
      ],
    },
  ],
};
