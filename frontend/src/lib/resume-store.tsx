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

export type AiSkillsState = {
  level: "basic" | "intermediate" | "advanced" | "professional";
  concepts: string[];
  usages: string[];
  bullets: string[];
  includeInResume: boolean;
};

export const EMPTY_AI_SKILLS: AiSkillsState = {
  level: "intermediate",
  concepts: [],
  usages: [],
  bullets: [],
  includeInResume: false,
};

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
    name: "Your Name",
    title: "Job Title",
    email: "your@email.com",
    phone: "+1 (555) 000-0000",
    location: "City, State",
    website: "",
    linkedin: "",
    github: "",
  },
  summary: "",
  experience: [
    {
      id: "exp-1",
      company: "",
      role: "",
      location: "",
      start: "",
      end: "",
      bullets: [""],
    },
  ],
  education: [
    {
      id: "edu-1",
      school: "",
      degree: "",
      field: "",
      start: "",
      end: "",
    },
  ],
  skills: [],
  projects: [],
  certifications: [],
};

/* -------------------------------------------------------------------------- */
/*                          ResumeVersion (multi-version)                     */
/* -------------------------------------------------------------------------- */

export type VersionSource = "base" | "tailored";

export interface ResumeVersion {
  id: string;
  /** "base" = the canonical master resume, edited in the Build tab.
   *  "tailored" = a saved Tailor output for a specific job. */
  source: VersionSource;
  /** Display label shown in the version selector. */
  label: string;
  /** Tailor-only: the role this version targets */
  targetRole?: string;
  /** Tailor-only: the company this version targets */
  company?: string;
  /** Tailor-only: the full JD text this version was tailored against */
  jd?: string;
  /** Tailor-only: the match score (0-100) at save time, for the ATS Check comparison */
  matchScoreAtSave?: number;
  createdAt: number;
  updatedAt: number;
  data: ResumeData;
  /** Per-version AI Skills module state. Lives alongside data. */
  aiSkills: AiSkillsState;
}

const LEGACY_STORAGE_KEY = "resumeelevate.resume.v1";
const VERSIONS_STORAGE_KEY = "resumeelevate.versions.v1";
const ACTIVE_VERSION_STORAGE_KEY = "resumeelevate.activeVersion.v1";
const BASE_VERSION_ID = "base";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

/* -------------------------------------------------------------------------- */
/*                                 Store                                      */
/* -------------------------------------------------------------------------- */

export interface ResumeStore {
  /** All versions, keyed by id. The version with id === "base" is always present. */
  versions: Record<string, ResumeVersion>;
  /** The version currently being edited in Build / scored in Check / tailored from in Tailor. */
  activeVersionId: string;
  /** Convenience accessor: the active ResumeData. */
  resume: ResumeData;
  /** List of versions sorted by updatedAt desc. */
  versionList: ResumeVersion[];
  /** AI Skills state for the active version. */
  aiSkills: AiSkillsState;

  setActiveVersion: (id: string) => void;

  // Whole-version actions
  createTailoredVersion: (opts: {
    sourceVersionId?: string;
    targetRole: string;
    company: string;
    jd: string;
    data: ResumeData;
    matchScoreAtSave?: number;
  }) => string; // returns new version id
  duplicateVersion: (id: string, newLabel: string) => string;
  renameVersion: (id: string, newLabel: string) => void;
  deleteVersion: (id: string) => void;
  resetBaseVersion: () => void;

  // Per-version AI Skills (operate on the active version)
  updateAiSkills: (patch: Partial<AiSkillsState>) => void;

  // Field-level actions (operate on the active version)
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
}

const Ctx = React.createContext<ResumeStore | null>(null);

/* ----------------------------- Storage ----------------------------- */

interface VersionsState {
  versions: Record<string, ResumeVersion>;
  activeVersionId: string;
}

function readVersionsState(): VersionsState {
  if (typeof window === "undefined") {
    return { versions: { [BASE_VERSION_ID]: makeBaseVersion() }, activeVersionId: BASE_VERSION_ID };
  }
  try {
    const raw = localStorage.getItem(VERSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VersionsState;
      // Defensive: ensure base version exists
      if (!parsed.versions[BASE_VERSION_ID]) {
        parsed.versions[BASE_VERSION_ID] = makeBaseVersion();
      }
      // Backfill: older versions may have been saved before aiSkills existed
      for (const v of Object.values(parsed.versions)) {
        if (!v.aiSkills) v.aiSkills = { ...EMPTY_AI_SKILLS };
      }
      if (!parsed.activeVersionId || !parsed.versions[parsed.activeVersionId]) {
        parsed.activeVersionId = BASE_VERSION_ID;
      }
      return parsed;
    }
    // Migration: read legacy single-resume key
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const baseData: ResumeData = legacy ? { ...EMPTY_RESUME, ...JSON.parse(legacy) } : EMPTY_RESUME;
    const base: ResumeVersion = {
      ...makeBaseVersion(),
      data: baseData,
      updatedAt: Date.now(),
    };
    return { versions: { [BASE_VERSION_ID]: base }, activeVersionId: BASE_VERSION_ID };
  } catch {
    return { versions: { [BASE_VERSION_ID]: makeBaseVersion() }, activeVersionId: BASE_VERSION_ID };
  }
}

function writeVersionsState(state: VersionsState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VERSIONS_STORAGE_KEY, JSON.stringify(state));
    localStorage.setItem(ACTIVE_VERSION_STORAGE_KEY, state.activeVersionId);
  } catch {}
}

function makeBaseVersion(): ResumeVersion {
  return {
    id: BASE_VERSION_ID,
    source: "base",
    label: "Base resume",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: EMPTY_RESUME,
    aiSkills: { ...EMPTY_AI_SKILLS },
  };
}

function makeTailoredVersion(opts: {
  id: string;
  sourceData: ResumeData;
  targetRole: string;
  company: string;
  jd: string;
  matchScoreAtSave?: number;
}): ResumeVersion {
  const stamp = new Date();
  const role = opts.targetRole.trim() || "Custom role";
  const company = opts.company.trim();
  const label = company ? `${role} @ ${company}` : role;
  return {
    id: opts.id,
    source: "tailored",
    label,
    targetRole: opts.targetRole,
    company: opts.company,
    jd: opts.jd,
    matchScoreAtSave: opts.matchScoreAtSave,
    createdAt: stamp.getTime(),
    updatedAt: stamp.getTime(),
    data: opts.sourceData,
    aiSkills: { ...EMPTY_AI_SKILLS },
  };
}

export const ResumeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<VersionsState>(() => ({
    versions: { [BASE_VERSION_ID]: makeBaseVersion() },
    activeVersionId: BASE_VERSION_ID,
  }));

  // Hydrate from localStorage after mount
  React.useEffect(() => {
    setState(readVersionsState());
  }, []);

  // Persist
  React.useEffect(() => {
    writeVersionsState(state);
  }, [state]);

  const setActiveVersion = React.useCallback((id: string) => {
    setState((prev) => {
      if (!prev.versions[id]) return prev;
      return { ...prev, activeVersionId: id };
    });
  }, []);

  const updateActive = React.useCallback(
    (updater: (v: ResumeVersion) => ResumeVersion) => {
      setState((prev) => {
        const cur = prev.versions[prev.activeVersionId];
        if (!cur) return prev;
        const next: ResumeVersion = { ...updater(cur), updatedAt: Date.now() };
        return { ...prev, versions: { ...prev.versions, [next.id]: next } };
      });
    },
    [],
  );

  const createTailoredVersion = React.useCallback(
    (opts: {
      sourceVersionId?: string;
      targetRole: string;
      company: string;
      jd: string;
      data: ResumeData;
      matchScoreAtSave?: number;
    }): string => {
      const id = uid("v");
      setState((prev) => {
        const source = prev.versions[opts.sourceVersionId ?? prev.activeVersionId] ?? prev.versions[BASE_VERSION_ID];
        const tailored = makeTailoredVersion({
          id,
          sourceData: opts.data,
          targetRole: opts.targetRole,
          company: opts.company,
          jd: opts.jd,
          matchScoreAtSave: opts.matchScoreAtSave,
        });
        return {
          versions: { ...prev.versions, [id]: tailored },
          activeVersionId: id, // jump to the new version so user sees it
        };
      });
      return id;
    },
    [],
  );

  const duplicateVersion = React.useCallback((id: string, newLabel: string): string => {
    const newId = uid("v");
    setState((prev) => {
      const src = prev.versions[id];
      if (!src) return prev;
      const copy: ResumeVersion = {
        ...src,
        id: newId,
        source: "tailored",
        label: newLabel,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        data: structuredClone(src.data),
      };
      return { ...prev, versions: { ...prev.versions, [newId]: copy } };
    });
    return newId;
  }, []);

  const renameVersion = React.useCallback((id: string, newLabel: string) => {
    setState((prev) => {
      const cur = prev.versions[id];
      if (!cur) return prev;
      return {
        ...prev,
        versions: { ...prev.versions, [id]: { ...cur, label: newLabel, updatedAt: Date.now() } },
      };
    });
  }, []);

  const deleteVersion = React.useCallback((id: string) => {
    setState((prev) => {
      if (id === BASE_VERSION_ID) return prev; // can't delete base
      const { [id]: _removed, ...rest } = prev.versions;
      return {
        versions: rest,
        activeVersionId: prev.activeVersionId === id ? BASE_VERSION_ID : prev.activeVersionId,
      };
    });
  }, []);

  const resetBaseVersion = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      versions: { ...prev.versions, [BASE_VERSION_ID]: makeBaseVersion() },
      activeVersionId: BASE_VERSION_ID,
    }));
  }, []);

  // Field-level actions on the active version
  const setResume = React.useCallback((r: ResumeData) => {
    updateActive((v) => ({ ...v, data: r }));
  }, [updateActive]);

  const updateContact = React.useCallback((patch: Partial<ContactInfo>) => {
    updateActive((v) => ({ ...v, data: { ...v.data, contact: { ...v.data.contact, ...patch } } }));
  }, [updateActive]);

  const updateSummary = React.useCallback((s: string) => {
    updateActive((v) => ({ ...v, data: { ...v.data, summary: s } }));
  }, [updateActive]);

  const setSkills = React.useCallback((skills: string[]) => {
    updateActive((v) => ({ ...v, data: { ...v.data, skills } }));
  }, [updateActive]);

  const addExperience = React.useCallback(() => {
    updateActive((v) => ({
      ...v,
      data: {
        ...v.data,
        experience: [
          ...v.data.experience,
          { id: uid("exp"), company: "", role: "", location: "", start: "", end: "", bullets: [""] },
        ],
      },
    }));
  }, [updateActive]);

  const updateExperience = React.useCallback((id: string, patch: Partial<ExperienceItem>) => {
    updateActive((v) => ({
      ...v,
      data: {
        ...v.data,
        experience: v.data.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    }));
  }, [updateActive]);

  const removeExperience = React.useCallback((id: string) => {
    updateActive((v) => ({
      ...v,
      data: { ...v.data, experience: v.data.experience.filter((e) => e.id !== id) },
    }));
  }, [updateActive]);

  const addEducation = React.useCallback(() => {
    updateActive((v) => ({
      ...v,
      data: {
        ...v.data,
        education: [
          ...v.data.education,
          { id: uid("edu"), school: "", degree: "", field: "", start: "", end: "" },
        ],
      },
    }));
  }, [updateActive]);

  const updateEducation = React.useCallback((id: string, patch: Partial<EducationItem>) => {
    updateActive((v) => ({
      ...v,
      data: {
        ...v.data,
        education: v.data.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    }));
  }, [updateActive]);

  const removeEducation = React.useCallback((id: string) => {
    updateActive((v) => ({
      ...v,
      data: { ...v.data, education: v.data.education.filter((e) => e.id !== id) },
    }));
  }, [updateActive]);

  const addProject = React.useCallback(() => {
    updateActive((v) => ({
      ...v,
      data: {
        ...v.data,
        projects: [
          ...v.data.projects,
          { id: uid("proj"), name: "", description: "", bullets: [""], tech: [] },
        ],
      },
    }));
  }, [updateActive]);

  const updateProject = React.useCallback((id: string, patch: Partial<ProjectItem>) => {
    updateActive((v) => ({
      ...v,
      data: {
        ...v.data,
        projects: v.data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      },
    }));
  }, [updateActive]);

  const removeProject = React.useCallback((id: string) => {
    updateActive((v) => ({
      ...v,
      data: { ...v.data, projects: v.data.projects.filter((p) => p.id !== id) },
    }));
  }, [updateActive]);

  const updateAiSkills = React.useCallback((patch: Partial<AiSkillsState>) => {
    updateActive((v) => ({ ...v, aiSkills: { ...v.aiSkills, ...patch } }));
  }, [updateActive]);

  // Derived
  const versionList = React.useMemo(
    () => Object.values(state.versions).sort((a, b) => b.updatedAt - a.updatedAt),
    [state.versions],
  );
  const activeVersion = state.versions[state.activeVersionId] ?? state.versions[BASE_VERSION_ID];
  const baseVersion = state.versions[BASE_VERSION_ID];

  const value: ResumeStore = {
    versions: state.versions,
    activeVersionId: state.activeVersionId,
    resume: activeVersion.data,
    versionList,
    aiSkills: activeVersion.aiSkills,
    setActiveVersion,
    createTailoredVersion,
    duplicateVersion,
    renameVersion,
    deleteVersion,
    resetBaseVersion,
    updateAiSkills,
    setResume,
    updateContact,
    updateSummary,
    setSkills,
    addExperience,
    updateExperience,
    removeExperience,
    addEducation,
    updateEducation,
    removeEducation,
    addProject,
    updateProject,
    removeProject,
  };

  // Expose the base version id for components that need to compare against base
  // (kept off the public interface to avoid clutter)
  (value as any).baseVersion = baseVersion;
  (value as any).BASE_VERSION_ID = BASE_VERSION_ID;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export function useResume(): ResumeStore {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useResume must be used inside <ResumeProvider>");
  return v;
}

export const BASE_VERSION = BASE_VERSION_ID;
