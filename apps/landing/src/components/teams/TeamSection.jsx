import { useState, useEffect } from "react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import { Icon } from "@iconify/react";
import { coreTeam, employees } from "@/src/data/teamData";
import { teamService } from "@/src/services/databaseService";
import SectionHeader from "../common/SectionHeader";

// Function to get hierarchy rank for sorting
const getHierarchyRank = (member) => {
  const title = member.title?.toLowerCase() || "";

  // CEO and Chief executives - highest priority
  if (title.includes("ceo") || title.includes("chief executive")) return 1;

  // Founders and Co-founders
  if (title.includes("founder") || title.includes("co-founder")) return 2;

  // Other C-level executives
  if (title.includes("cto") || title.includes("cfo") || title.includes("coo"))
    return 3;

  // Chiefs (other than CEO)
  if (title.includes("chief") && !title.includes("chief executive")) return 4;

  // Presidents and VPs
  if (
    title.includes("president") ||
    title.includes("vp") ||
    title.includes("vice president")
  )
    return 5;

  // Directors
  if (title.includes("director")) return 6;

  // Heads of departments
  if (title.includes("head of") || title.includes("head,")) return 7;

  // Managers and senior roles
  if (title.includes("manager") || title.includes("senior")) return 8;

  // All other roles
  return 9;
};

// Function to sort team members hierarchically with Hiten Saklani first
const sortTeamHierarchically = (members) => {
  return [...members].sort((a, b) => {
    const nameA = a.name?.toLowerCase() || "";
    const nameB = b.name?.toLowerCase() || "";

    // Check if either member is Hiten Saklani (with variations in spelling)
    const isHitenA = nameA.includes("hiten") && nameA.includes("saklani");
    const isHitenB = nameB.includes("hiten") && nameB.includes("saklani");

    // Hiten Saklani always comes first
    if (isHitenA && !isHitenB) return -1;
    if (!isHitenA && isHitenB) return 1;

    // For non-Hiten members, sort by hierarchy
    const rankA = getHierarchyRank(a);
    const rankB = getHierarchyRank(b);

    // If ranks are the same, sort alphabetically by name
    if (rankA === rankB) {
      return a.name?.localeCompare(b.name || "") || 0;
    }

    return rankA - rankB;
  });
};

export default function TeamSection() {
  const [coreTeamMembers, setCoreTeamMembers] = useState(() =>
    sortTeamHierarchically(coreTeam)
  );
  const [employeeMembers, setEmployeeMembers] = useState(employees);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load team members from Firebase
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both categories in parallel
        const [coreMembers, employeeMembers] = await Promise.all([
          teamService.getTeamMembersByCategory("core"),
          teamService.getTeamMembersByCategory("employee"),
        ]);

        // Only use Firebase data if we actually get results
        if (coreMembers.length > 0) {
          const activeCoreMembers = coreMembers.filter((m) => m.isActive);
          setCoreTeamMembers(sortTeamHierarchically(activeCoreMembers));
        }
        if (employeeMembers.length > 0) {
          setEmployeeMembers(employeeMembers.filter((m) => m.isActive));
        }
      } catch (error) {
        setError(error.message);

        // Keep using static data as fallback (sorted)
        setCoreTeamMembers(sortTeamHierarchically(coreTeam));
        setEmployeeMembers(employees);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  const TeamGrid = ({ members, title }) => (
    <div className="my-16">
      <h3 className="text-2xl md:text-3xl font-medium text-brand-foreground mb-8 text-left">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {members.map((member, i) => (
          <div
            key={i}
            className="flex bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <img
              src={member.img}
              alt={member.name}
              className="w-28 h-32 object-cover object-center rounded-lg m-4"
            />
            <div className="flex flex-col justify-start flex-1 px-2 py-4">
              <div className="text-xl font-light underline mb-1 text-brand-foreground">
                {member.name}
              </div>
              <div className="text-base text-brand-foreground mb-1">
                {member.title}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {member.location}
              </div>
              {member.bio && (
                <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {member.bio}
                </div>
              )}
              <div className="flex gap-3">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    className="text-gray-700 hover:text-pink-500 transition"
                    aria-label="LinkedIn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon icon="mdi:linkedin" width="22" />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="text-gray-700 hover:text-pink-500 transition"
                    aria-label="Email"
                  >
                    <Icon icon="mdi:email" width="22" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Section className="!py-16 bg-white">
      <Container>
        <SectionHeader label="Team" title="Meet Our Team" />

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <Icon
                icon="solar:danger-triangle-bold"
                width={20}
                className="text-yellow-600 mr-2"
              />
              <p className="text-sm text-yellow-800">
                Unable to load latest team data. Showing cached information.
              </p>
            </div>
          </div>
        )}

        {/* Team Content */}
        {!loading && (
          <>
            {/* Core Team */}
            <TeamGrid members={coreTeamMembers} title="Core Leadership Team" />

            {/* Employees */}
            <TeamGrid members={employeeMembers} title="Our Talented Team" />
          </>
        )}
      </Container>
    </Section>
  );
}
