"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { StudyCard } from "@/components/study-card";
import { PORTFOLIO_CATEGORIES } from "@/lib/constants";
import type { PublicStudy } from "@/lib/public-study";

export function PortfolioFilter({ studies }: { studies: PublicStudy[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [platform, setPlatform] = useState("All");
  const [skill, setSkill] = useState("All");
  const [studyType, setStudyType] = useState("All");

  const platforms = useMemo(
    () => ["All", ...Array.from(new Set(studies.map((study) => study.platform))).sort()],
    [studies]
  );
  const skills = useMemo(
    () => [
      "All",
      ...Array.from(new Set(studies.flatMap((study) => study.skills_demonstrated))).sort()
    ],
    [studies]
  );
  const studyTypes = useMemo(
    () => ["All", ...Array.from(new Set(studies.map((study) => study.study_type))).sort()],
    [studies]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return studies.filter((study) => {
      const matchesQuery =
        !q ||
        [
          study.safe_public_title,
          study.safe_public_description,
          study.platform,
          study.study_type,
          study.recommended_section,
          study.skills_demonstrated.join(" ")
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesCategory =
        category === "All" || study.recommended_section === category;
      const matchesPlatform = platform === "All" || study.platform === platform;
      const matchesSkill =
        skill === "All" || study.skills_demonstrated.includes(skill);
      const matchesType = studyType === "All" || study.study_type === studyType;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPlatform &&
        matchesSkill &&
        matchesType
      );
    });
  }, [category, platform, query, skill, studies, studyType]);

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr]">
        <label className="space-y-2">
          <span className="label">Search</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 dark:text-paper/40"
              size={16}
            />
            <input
              className="field pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="AI, fintech, voice, prototype"
            />
          </span>
        </label>

        <FilterSelect label="Category" value={category} onChange={setCategory}>
          {["All", ...PORTFOLIO_CATEGORIES].map((item) => (
            <option key={item}>{item}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Platform" value={platform} onChange={setPlatform}>
          {platforms.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Skill" value={skill} onChange={setSkill}>
          {skills.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Study type" value={studyType} onChange={setStudyType}>
          {studyTypes.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </FilterSelect>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((study) => (
          <StudyCard study={study} key={study.id} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-sm text-ink/64 dark:text-paper/64">
          No approved entries match those filters yet.
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}
