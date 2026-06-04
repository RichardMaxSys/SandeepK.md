"use client";

import * as React from "react";

/* -------------------------------------------------------------------------- */
/*                              Resume data model                             */
/* -------------------------------------------------------------------------- */

export interface ContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
  gpa?: string;
  honors?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  link?: string;
  description: string;
  bullets: string[];
  tech: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
}

export const EMPTY_RESUME: ResumeData = {
  contact: {
    name: "Sandeep K",
    title: "Senior Software Engineer",
    email: "sandeep.k@example.com",
    phone: "+1 (416) 555-0123",
    location: "Toronto, ON",
    website: "sandeepk.dev",
    linkedin: "linkedin.com/in/sandeepk",
    github: "github.com/sandeepk",
  },
  summary:
    "Senior software engineer with 6+ years building production Python services. Shipped a FastAPI platform handling 2M daily requests with 99.95% uptime. Reduced p99 latency by 40% through async pipeline redesign. Strong mentor — 4 engineers promoted to senior in 2024.",
  experience: [
    {
      id: "exp-1",
      company: "CloudBase",
      role: "Senior Software Engineer",
      location: "Toronto, ON",
      start: "2022",
      end: "Present",
      bullets: [
        "Led migration of legacy monolith to FastAPI microservices across 4 teams",
        "Cut p99 latency by 40% via async pipeline + Redis caching",
        "Owned Kubernetes deployment topology (12 services, 3 regions)",
        "Mentored 4 mid-level engineers; 2 promoted to senior in 2024",
      ],
    },
    {
      id: "exp-2",
      company: "Maple Health",
      role: "Software Engineer",
      location: "Toronto, ON",
      start: "2019",
      end: "2022",
      bullets: [
        "Built patient-facing API serving 800k daily active users",
        "Reduced infrastructure cost by 32% via GCP rightsizing",
        "Introduced CI/CD pipelines reducing deploy time from 45 min to 6 min",
      ],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "University of Toronto",
      degree: "B.Sc.",
      field: "Computer Science",
      start: "2014",
      end: "2018",
      honors: "Dean's List 2016-2018",
    },
  ],
  skills: [
    "Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Kubernetes",
    "AWS", "GCP", "CI/CD", "REST", "gRPC", "Linux", "Microservices",
  ],
  projects: [
    {
      id: "proj-1",
      name: "openrec",
      link: "github.com/sandeepk/openrec",
      description: "Open-source recommendation engine (3.2k GitHub stars)",
      bullets: [
        "Built async Python pipeline processing 50k events/sec",
        "Used by 12 companies in production",
      ],
      tech: ["Python", "FastAPI", "PostgreSQL", "Redis"],
    },
  ],
  certifications: [
    { id: "cert-1", name: "AWS Solutions Architect Associate", issuer: "AWS", date: "2023" },
  ],
};

const STORAGE_KEY = "careerai.resume.v1";

/* -------------------------------------------------------------------------- */
/*                                 Store                                      */
/* -------------------------------------------------------------------------- */

export interface ResumeStore {
  resume: ResumeData;
  setResume: (r: ResumeData) => void;
  updateContact: (patch: Partial<ContactInfo>) => void;
  updateSummary: (s: string) => void;
  setSkills: (skills: string[]) => void;
  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  addProject: () => void;
  updateProject: (id: string, patch: Partial<ProjectItem>) => void;
  removeProject: (id: string) => void;
  resetResume: () => void;
}

const Ctx = React.createContext<ResumeStore | null>(null);

function load(): ResumeData {
  if (typeof window === "undefined") return EMPTY_RESUME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_RESUME;
    return { ...EMPTY_RESUME, ...JSON.parse(raw) };
  } catch {
    return EMPTY_RESUME;
  }
}

function save(r: ResumeData) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch {}
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [resume, setResumeState] = React.useState<ResumeData>(EMPTY_RESUME);

  // Hydrate from localStorage after mount
  React.useEffect(() => {
    setResumeState(load());
  }, []);

  const setResume = React.useCallback((r: ResumeData) => {
    setResumeState(r);
    save(r);
  }, []);

  const updateContact = React.useCallback((patch: Partial<ContactInfo>) => {
    setResumeState((prev) => {
      const next = { ...prev, contact: { ...prev.contact, ...patch } };
      save(next);
      return next;
    });
  }, []);

  const updateSummary = React.useCallback((s: string) => {
    setResumeState((prev) => {
      const next = { ...prev, summary: s };
      save(next);
      return next;
    });
  }, []);

  const setSkills = React.useCallback((skills: string[]) => {
    setResumeState((prev) => {
      const next = { ...prev, skills };
      save(next);
      return next;
    });
  }, []);

  const addExperience = React.useCallback(() => {
    setResumeState((prev) => {
      const next = {
        ...prev,
        experience: [
          ...prev.experience,
          { id: uid("exp"), company: "", role: "", location: "", start: "", end: "", bullets: [""] },
        ],
      };
      save(next);
      return next;
    });
  }, []);

  const updateExperience = React.useCallback((id: string, patch: Partial<ExperienceItem>) => {
    setResumeState((prev) => {
      const next = {
        ...prev,
        experience: prev.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      };
      save(next);
      return next;
    });
  }, []);

  const removeExperience = React.useCallback((id: string) => {
    setResumeState((prev) => {
      const next = { ...prev, experience: prev.experience.filter((e) => e.id !== id) };
      save(next);
      return next;
    });
  }, []);

  const addEducation = React.useCallback(() => {
    setResumeState((prev) => {
      const next = {
        ...prev,
        education: [
          ...prev.education,
          { id: uid("edu"), school: "", degree: "", field: "", start: "", end: "" },
        ],
      };
      save(next);
      return next;
    });
  }, []);

  const updateEducation = React.useCallback((id: string, patch: Partial<EducationItem>) => {
    setResumeState((prev) => {
      const next = {
        ...prev,
        education: prev.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      };
      save(next);
      return next;
    });
  }, []);

  const removeEducation = React.useCallback((id: string) => {
    setResumeState((prev) => {
      const next = { ...prev, education: prev.education.filter((e) => e.id !== id) };
      save(next);
      return next;
    });
  }, []);

  const addProject = React.useCallback(() => {
    setResumeState((prev) => {
      const next = {
        ...prev,
        projects: [
          ...prev.projects,
          { id: uid("proj"), name: "", description: "", bullets: [""], tech: [] },
        ],
      };
      save(next);
      return next;
    });
  }, []);

  const updateProject = React.useCallback((id: string, patch: Partial<ProjectItem>) => {
    setResumeState((prev) => {
      const next = {
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      };
      save(next);
      return next;
    });
  }, []);

  const removeProject = React.useCallback((id: string) => {
    setResumeState((prev) => {
      const next = { ...prev, projects: prev.projects.filter((p) => p.id !== id) };
      save(next);
      return next;
    });
  }, []);

  const resetResume = React.useCallback(() => {
    setResumeState(EMPTY_RESUME);
    save(EMPTY_RESUME);
  }, []);

  const value: ResumeStore = {
    resume, setResume,
    updateContact, updateSummary, setSkills,
    addExperience, updateExperience, removeExperience,
    addEducation, updateEducation, removeEducation,
    addProject, updateProject, removeProject,
    resetResume,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useResume(): ResumeStore {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useResume must be used inside <ResumeProvider>");
  return v;
}
