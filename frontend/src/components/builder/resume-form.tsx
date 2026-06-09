"use client";

import * as React from "react";
import { Plus, Trash2, Mail, Phone, MapPin, Globe, Linkedin, Github, ChevronUp, ChevronDown, Info } from "lucide-react";
import { Button, cn, Badge } from "@/components/ui/base";
import { useResume, BASE_VERSION } from "@/lib/resume-store";
import { VersionSelector } from "@/components/version-selector";
import { AiSkillsModule } from "@/components/builder/ai-skills-module";

/* -------------------------------------------------------------------------- */
/*                              Form primitives                               */
/* -------------------------------------------------------------------------- */

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; icon?: React.ReactNode }> = ({ label, icon, className, ...props }) => (
  <label className="block">
    {label && <span className="block text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">{label}</span>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none">{icon}</span>}
      <input
        {...props}
        className={cn(
          "w-full h-9 px-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle",
          "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all",
          icon && "pl-9",
          className,
        )}
      />
    </div>
  </label>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, className, ...props }) => (
  <label className="block">
    {label && <span className="block text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">{label}</span>}
    <textarea
      {...props}
      className={cn(
        "w-full px-3 py-2 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle resize-y min-h-[80px]",
        "focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all leading-relaxed",
        className,
      )}
    />
  </label>
);

const Section: React.FC<{
  title: string;
  hint?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
}> = ({ title, hint, onAdd, addLabel, children }) => (
  <section className="rounded-2xl bg-canvas-raised border border-line p-5">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-ink tracking-tight">{title}</h3>
        {hint && <p className="text-2xs text-ink-subtle mt-0.5">{hint}</p>}
      </div>
      {onAdd && (
        <Button variant="secondary" size="sm" onClick={onAdd}>
          <Plus size={13} />
          {addLabel ?? "Add"}
        </Button>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </section>
);

const SubCard: React.FC<{ onRemove?: () => void; children: React.ReactNode }> = ({ onRemove, children }) => (
  <div className="relative rounded-xl border border-line bg-canvas-subtle p-4 space-y-3 group/sub">
    {onRemove && (
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 h-7 w-7 rounded-md flex items-center justify-center text-ink-subtle hover:text-danger hover:bg-danger/10 opacity-0 group-hover/sub:opacity-100 transition-all"
        aria-label="Remove"
      >
        <Trash2 size={13} />
      </button>
    )}
    {children}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                Form sections                               */
/* -------------------------------------------------------------------------- */

export const ResumeForm: React.FC = () => {
  const {
    resume, updateContact, updateSummary, setSkills,
    addExperience, updateExperience, removeExperience,
    addEducation, updateEducation, removeEducation,
    addProject, updateProject, removeProject,
    activeVersionId, setActiveVersion,
    aiSkills, updateAiSkills,
  } = useResume();

  const [skillDraft, setSkillDraft] = React.useState("");
  const isTailored = activeVersionId !== BASE_VERSION;

  const addSkill = () => {
    const v = skillDraft.trim();
    if (!v || resume.skills.includes(v)) return;
    setSkills([...resume.skills, v]);
    setSkillDraft("");
  };

  return (
    <div className="space-y-4">
      {/* Tailored version hint */}
      {isTailored && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.05] p-3 flex items-center gap-3">
          <Info size={14} className="text-violet-300 shrink-0" />
          <p className="text-xs text-ink-muted leading-relaxed flex-1">
            You're editing a <span className="text-ink font-medium">tailored</span> version. Changes here don't affect your base resume.
            <button
              onClick={() => setActiveVersion(BASE_VERSION)}
              className="ml-2 text-violet-300 hover:text-violet-200 font-medium"
            >
              Switch to base →
            </button>
          </p>
        </div>
      )}

      {/* AI Skills */}
      <AiSkillsModule state={aiSkills} onChange={updateAiSkills} />

      {/* Contact */}
      <Section title="Contact" hint="The basics. ATS will use these to route you.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Full Name"  value={resume.contact.name}  onChange={(e) => updateContact({ name: e.target.value })}  placeholder="Sandeep K" />
          <Input label="Title"      value={resume.contact.title} onChange={(e) => updateContact({ title: e.target.value })} placeholder="Senior Software Engineer" />
          <Input label="Email"      icon={<Mail size={13} />}    value={resume.contact.email}    onChange={(e) => updateContact({ email: e.target.value })}    placeholder="you@example.com" />
          <Input label="Phone"      icon={<Phone size={13} />}   value={resume.contact.phone}    onChange={(e) => updateContact({ phone: e.target.value })}    placeholder="+1 (555) 000-0000" />
          <Input label="Location"   icon={<MapPin size={13} />}  value={resume.contact.location} onChange={(e) => updateContact({ location: e.target.value })} placeholder="Toronto, ON" />
          <Input label="Website"    icon={<Globe size={13} />}   value={resume.contact.website ?? ""} onChange={(e) => updateContact({ website: e.target.value })} placeholder="yourdomain.dev" />
          <Input label="LinkedIn"   icon={<Linkedin size={13} />} value={resume.contact.linkedin ?? ""} onChange={(e) => updateContact({ linkedin: e.target.value })} placeholder="linkedin.com/in/you" />
          <Input label="GitHub"     icon={<Github size={13} />}  value={resume.contact.github ?? ""}   onChange={(e) => updateContact({ github: e.target.value })}   placeholder="github.com/you" />
        </div>
      </Section>

      {/* Summary */}
      <Section title="Summary" hint="2-3 sentences. Lead with your strongest, most relevant signal.">
        <Textarea
          value={resume.summary}
          onChange={(e) => updateSummary(e.target.value)}
          placeholder="Senior engineer with X years building…"
          rows={4}
        />
      </Section>

      {/* Experience */}
      <Section
        title="Experience"
        hint="Lead each bullet with an action verb and a number."
        onAdd={addExperience}
        addLabel="Add role"
      >
        {resume.experience.map((exp) => (
          <SubCard key={exp.id} onRemove={() => removeExperience(exp.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Role"      value={exp.role}    onChange={(e) => updateExperience(exp.id, { role: e.target.value })}    placeholder="Senior Software Engineer" />
              <Input label="Company"   value={exp.company} onChange={(e) => updateExperience(exp.id, { company: e.target.value })} placeholder="CloudBase" />
              <Input label="Location"  value={exp.location} onChange={(e) => updateExperience(exp.id, { location: e.target.value })} placeholder="Toronto, ON" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Start" value={exp.start} onChange={(e) => updateExperience(exp.id, { start: e.target.value })} placeholder="2022" />
                <Input label="End"   value={exp.end}   onChange={(e) => updateExperience(exp.id, { end: e.target.value })}   placeholder="Present" />
              </div>
            </div>
            <div>
              <span className="block text-2xs font-medium uppercase tracking-wider text-ink-subtle mb-1.5">Bullets</span>
              <div className="space-y-2">
                {exp.bullets.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex flex-col gap-0.5 mt-1.5">
                      <button
                        onClick={() => {
                          if (i === 0) return;
                          const next = [...exp.bullets];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          updateExperience(exp.id, { bullets: next });
                        }}
                        className="h-4 w-4 rounded flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-white/5 disabled:opacity-20"
                        aria-label="Move bullet up"
                        disabled={i === 0}
                      ><ChevronUp size={10} /></button>
                      <button
                        onClick={() => {
                          if (i === exp.bullets.length - 1) return;
                          const next = [...exp.bullets];
                          [next[i], next[i + 1]] = [next[i + 1], next[i]];
                          updateExperience(exp.id, { bullets: next });
                        }}
                        className="h-4 w-4 rounded flex items-center justify-center text-ink-subtle hover:text-ink hover:bg-white/5 disabled:opacity-20"
                        aria-label="Move bullet down"
                        disabled={i === exp.bullets.length - 1}
                      ><ChevronDown size={10} /></button>
                    </div>
                    <textarea
                      value={b}
                      onChange={(e) => {
                        const next = [...exp.bullets];
                        next[i] = e.target.value;
                        updateExperience(exp.id, { bullets: next });
                      }}
                      placeholder="Built X by Y, resulting in Z."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all leading-relaxed resize-y"
                    />
                    <button
                      onClick={() => updateExperience(exp.id, { bullets: exp.bullets.filter((_, j) => j !== i) })}
                      className="mt-1 h-7 w-7 rounded-md flex items-center justify-center text-ink-subtle hover:text-danger hover:bg-danger/10"
                      aria-label="Remove bullet"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateExperience(exp.id, { bullets: [...exp.bullets, ""] })}
                  className="text-2xs font-medium text-accent-300 hover:text-accent-200 inline-flex items-center gap-1"
                >
                  <Plus size={11} /> Add bullet
                </button>
              </div>
            </div>
          </SubCard>
        ))}
      </Section>

      {/* Education */}
      <Section
        title="Education"
        onAdd={addEducation}
        addLabel="Add school"
      >
        {resume.education.map((edu) => (
          <SubCard key={edu.id} onRemove={() => removeEducation(edu.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="School" value={edu.school} onChange={(e) => updateEducation(edu.id, { school: e.target.value })} placeholder="University of Toronto" />
              <Input label="Degree" value={edu.degree} onChange={(e) => updateEducation(edu.id, { degree: e.target.value })} placeholder="B.Sc." />
              <Input label="Field of Study" value={edu.field} onChange={(e) => updateEducation(edu.id, { field: e.target.value })} placeholder="Computer Science" />
              <div className="grid grid-cols-2 gap-2">
                <Input label="Start" value={edu.start} onChange={(e) => updateEducation(edu.id, { start: e.target.value })} placeholder="2014" />
                <Input label="End"   value={edu.end}   onChange={(e) => updateEducation(edu.id, { end: e.target.value })}   placeholder="2018" />
              </div>
              <Input label="Honors (optional)" value={edu.honors ?? ""} onChange={(e) => updateEducation(edu.id, { honors: e.target.value })} placeholder="Dean's List" className="sm:col-span-2" />
            </div>
          </SubCard>
        ))}
      </Section>

      {/* Skills */}
      <Section title="Skills" hint="Hard skills, tools, languages. ATS scans this list.">
        <div className="flex flex-wrap gap-1.5">
          {resume.skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-2xs font-medium px-2 py-1 rounded-md bg-canvas-subtle text-ink border border-line">
              {s}
              <button
                onClick={() => setSkills(resume.skills.filter((x) => x !== s))}
                className="text-ink-subtle hover:text-danger"
                aria-label={`Remove ${s}`}
              >
                <Trash2 size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="Type a skill and press Enter"
            className="flex-1 h-9 px-3 rounded-lg bg-canvas-subtle border border-line text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all"
          />
          <Button variant="secondary" size="md" onClick={addSkill}>Add</Button>
        </div>
      </Section>

      {/* Projects */}
      <Section title="Projects" onAdd={addProject} addLabel="Add project">
        {resume.projects.map((p) => (
          <SubCard key={p.id} onRemove={() => removeProject(p.id)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Name" value={p.name} onChange={(e) => updateProject(p.id, { name: e.target.value })} placeholder="openrec" />
              <Input label="Link" value={p.link ?? ""} onChange={(e) => updateProject(p.id, { link: e.target.value })} placeholder="github.com/you/repo" />
            </div>
            <Textarea
              label="Description"
              value={p.description}
              onChange={(e) => updateProject(p.id, { description: e.target.value })}
              placeholder="One sentence on what it does and who uses it."
            />
            <Textarea
              label="Bullets"
              value={p.bullets.join("\n")}
              onChange={(e) => updateProject(p.id, { bullets: e.target.value.split("\n") })}
              rows={3}
            />
            <Input
              label="Tech"
              value={p.tech.join(", ")}
              onChange={(e) => updateProject(p.id, { tech: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              placeholder="Python, FastAPI, PostgreSQL"
            />
          </SubCard>
        ))}
      </Section>
    </div>
  );
};
