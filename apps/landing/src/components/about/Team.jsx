"use client";
import { useState, useEffect } from "react";
import Section from "@/src/components/layout/Section";
import Container from "@/src/components/layout/Container";
import Button from "@/src/components/common/Button";
import { Icon } from "@iconify/react";
import { coreTeam } from "@/src/data/teamData";
import { teamService } from "@/src/services/databaseService";

export default function Team() {
  // Function to filter for Co-Founders and Directors
  const isLeadershipRole = (member) => {
    const title = member.title?.toLowerCase() || "";
    return (
      title.includes("co-founder") ||
      title.includes("director") ||
      title.includes("founder") ||
      title.includes("ceo") ||
      title.includes("cto") ||
      title.includes("cfo") ||
      title.includes("chief") ||
      title.includes("head of") ||
      title.includes("president") ||
      title.includes("vice president") ||
      title.includes("vp")
    );
  };

  // Function to sort team members with Hiten Saklani first
  const sortTeamMembers = (members) => {
    return members.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || "";
      const nameB = b.name?.toLowerCase() || "";

      // Check if either member is Hiten Saklani (with variations in spelling)
      const isHitenA = nameA.includes("hiten") && nameA.includes("saklani");
      const isHitenB = nameB.includes("hiten") && nameB.includes("saklani");

      if (isHitenA && !isHitenB) return -1; // Hiten comes first
      if (!isHitenA && isHitenB) return 1; // Hiten comes first
      return 0; // Keep original order for others
    });
  };

  const [teamMembers, setTeamMembers] = useState(() =>
    sortTeamMembers(coreTeam.filter(isLeadershipRole))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load team members from Firebase
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch core team members from Firebase
        const coreMembers = await teamService.getTeamMembersByCategory("core");

        // Only use Firebase data if we actually get results, otherwise keep static data
        if (coreMembers.length > 0) {
          // Filter for active members with leadership roles
          const leadershipMembers = coreMembers.filter(
            (m) => m.isActive && isLeadershipRole(m)
          );
          setTeamMembers(sortTeamMembers(leadershipMembers));
        } else {
          // Filter static fallback data for leadership roles as well
          const leadershipMembers = coreTeam.filter(isLeadershipRole);
          setTeamMembers(sortTeamMembers(leadershipMembers));
        }
      } catch (error) {
        setError(error.message);

        // Keep using static data as fallback, but filter for leadership roles
        const leadershipMembers = coreTeam.filter(isLeadershipRole);
        setTeamMembers(sortTeamMembers(leadershipMembers));
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <Section className="!py-16 bg-white">
        <Container>
          <h2 className="text-3xl md:text-3xl font-medium text-brand-foreground mb-4 text-left">
            Leadership Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mb-8">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="flex bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="w-28 h-32 bg-gray-300 rounded-lg m-4"></div>
                <div className="flex flex-col justify-center flex-1 px-2 py-4">
                  <div className="h-6 bg-gray-300 rounded mb-1 w-3/4"></div>
                  <div className="h-4 bg-gray-300 rounded mb-1 w-2/3"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2 w-1/2"></div>
                  <div className="w-6 h-6 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <Button
            text="Meet Our Full Team"
            type="primary"
            link="/teams"
            className="w-full md:w-[20%]"
          />
        </Container>
      </Section>
    );
  }

  return (
    <Section className="!py-16 bg-white">
      <Container>
        <h2 className="text-3xl md:text-3xl font-medium text-brand-foreground mb-4 text-left">
          Leadership Team
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p className="text-sm">
              <Icon icon="mdi:alert" className="inline mr-1" />
              Unable to load team data from server. Showing cached information.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mb-8">
          {teamMembers.map((member, i) => (
            <div
              key={member.id || i}
              className="flex bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-sm"
            >
              <img
                src={member.img}
                alt={member.name}
                className="w-28 h-32 object-cover rounded-lg m-4"
              />
              <div className="flex flex-col justify-start flex-1 px-2 py-4">
                <div className="text-2xl font-light underline mb-1 text-brand-foreground">
                  {member.name}
                </div>
                <div className="text-base text-brand-foreground mb-1">
                  {member.title}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  {member.location}
                </div>
                <div className="flex gap-3">
                  <a
                    href={member.linkedin}
                    className="text-gray-700 hover:text-pink-500 transition"
                    aria-label="LinkedIn"
                  >
                    <Icon icon="mdi:linkedin" width="22" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          text="Meet Our Full Team"
          type="primary"
          link="/teams"
          className="w-full md:w-[20%]"
        />
      </Container>
    </Section>
  );
}
