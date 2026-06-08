import type { Template, ColorVariant } from '@/types/template'

/* -------------------------------------------------------------------------- */
/*  Sample resume personas                                                    */
/* -------------------------------------------------------------------------- */

const PERSONAS = [
  {
    name: 'Alex Morgan',
    title: 'Senior Product Manager',
    email: 'alex.morgan@email.com',
    phone: '415-555-0182',
    location: 'San Francisco, CA',
    summary: 'Results-driven PM with 8 years experience in SaaS.',
    skills: ['Product Strategy', 'Agile', 'SQL', 'Figma', 'Roadmapping'],
    experience: [
      { role: 'Senior PM', company: 'Stripe', years: '2021–Present', bullets: ['Led payments API redesign', 'Grew adoption 34% YoY', 'Managed team of 6 engineers'] },
      { role: 'Product Manager', company: 'Dropbox', years: '2018–2021', bullets: ['Shipped 3 major features', 'Reduced churn by 18%'] },
    ],
    education: 'B.S. Computer Science — Stanford University, 2017',
  },
  {
    name: 'Jordan Lee',
    title: 'Full Stack Engineer',
    email: 'jordan.lee@dev.io',
    phone: '512-555-0247',
    location: 'Austin, TX',
    summary: 'Engineer specializing in React and distributed systems.',
    skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    experience: [
      { role: 'Staff Engineer', company: 'Vercel', years: '2022–Present', bullets: ['Architected edge runtime', 'Cut deploy times by 60%', 'Mentored 4 junior devs'] },
      { role: 'Frontend Engineer', company: 'Shopify', years: '2019–2022', bullets: ['Built checkout flow', 'Improved LCP by 40%'] },
    ],
    education: 'B.S. Software Engineering — UT Austin, 2019',
  },
  {
    name: 'Priya Sharma',
    title: 'UX Design Lead',
    email: 'priya.sharma@design.co',
    phone: '206-555-0391',
    location: 'Seattle, WA',
    summary: 'Design leader with a track record in enterprise SaaS.',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Notion'],
    experience: [
      { role: 'Design Lead', company: 'Microsoft', years: '2020–Present', bullets: ['Led redesign of Azure portal', 'Managed 5-person design team', 'Defined design system v2'] },
      { role: 'Senior Designer', company: 'Zillow', years: '2017–2020', bullets: ['Improved search UX', 'Ran 12 usability studies'] },
    ],
    education: 'BFA Interaction Design — RISD, 2017',
  },
  {
    name: 'Marcus Chen',
    title: 'Data Science Manager',
    email: 'm.chen@analytics.ai',
    phone: '347-555-0158',
    location: 'New York, NY',
    summary: 'Data scientist turned manager, ML infrastructure focus.',
    skills: ['Python', 'TensorFlow', 'Spark', 'dbt', 'Leadership'],
    experience: [
      { role: 'DS Manager', company: 'Meta', years: '2021–Present', bullets: ['Built ML platform team', 'Deployed 8 production models', 'Reduced infra costs 25%'] },
      { role: 'Data Scientist', company: 'Airbnb', years: '2018–2021', bullets: ['Pricing algorithm redesign', 'A/B tested 20+ features'] },
    ],
    education: 'M.S. Statistics — Columbia University, 2018',
  },
  {
    name: 'Sofia Reyes',
    title: 'Marketing Director',
    email: 'sofia.reyes@growth.co',
    phone: '773-555-0274',
    location: 'Chicago, IL',
    summary: 'Growth marketer specializing in B2B demand generation.',
    skills: ['HubSpot', 'Paid Media', 'SEO', 'Analytics', 'Content Strategy'],
    experience: [
      { role: 'Marketing Director', company: 'HubSpot', years: '2020–Present', bullets: ['Grew pipeline 2.4x', 'Managed $4M budget', 'Built 8-person team'] },
      { role: 'Sr. Growth Manager', company: 'Intercom', years: '2017–2020', bullets: ['Launched 3 product lines', 'Email open rate +22%'] },
    ],
    education: 'MBA Marketing — Northwestern Kellogg, 2017',
  },
]

/* -------------------------------------------------------------------------- */
/*  Micro-text helpers                                                        */
/* -------------------------------------------------------------------------- */

function MicroText({ text, className = '', style = {} }: {
  text: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        fontSize: '3.5px',
        lineHeight: 1.5,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        color: '#374151',
        ...style,
      }}
    >
      {text}
    </div>
  )
}

function MicroLabel({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        fontSize: '3px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color,
        marginBottom: '1.5px',
      }}
    >
      {text}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Common                                                                     */
/* -------------------------------------------------------------------------- */

interface LayoutProps {
  template: Template
  activeColor?: ColorVariant
}

interface TemplatePreviewProps {
  template: Template
  activeColor?: ColorVariant
  size: 'card' | 'modal'
}

function detectLayout(template: Template): string {
  if (template.modernFeatures.hasBentoGrid) return 'BENTO'
  if (template.modernFeatures.hasTimeline) return 'TIMELINE'
  if (template.modernFeatures.hasColorSidebar) return 'SIDEBAR_STRIP'
  if (template.modernFeatures.hasDarkHeader) return 'DARK_HEADER'
  const lt = template.layoutType
  if (lt.toLowerCase().includes('two') || lt.toLowerCase().includes('sidebar'))
    return 'TWO_COLUMN'
  return 'SINGLE_COLUMN'
}

function useColors(template: Template, activeColor?: ColorVariant) {
  const c = activeColor ?? template.colorPalette
  return { primary: c.primary, accent: c.accent, neutral: c.neutral, text: c.text }
}

/* -------------------------------------------------------------------------- */
/*  Single column                                                              */
/* -------------------------------------------------------------------------- */

function SingleColumn({ template, activeColor }: LayoutProps) {
  const c = useColors(template, activeColor)
  const p = PERSONAS[template.id % PERSONAS.length]

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center px-3 py-2"
        style={{ background: c.primary, minHeight: 28 }}
      >
        <MicroText text={p.name} style={{ color: 'white', fontWeight: 700, fontSize: '5px' }} />
        <MicroText text={p.title} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '3.5px' }} />
        <MicroText text={`${p.email}  ·  ${p.phone}  ·  ${p.location}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: '3px' }} />
      </div>
      {/* Body */}
      <div className="flex-1 px-3 py-2 flex flex-col gap-2 overflow-hidden">
        <div>
          <MicroLabel text="Summary" color={c.accent} />
          <MicroText text={p.summary} />
        </div>
        <div>
          <MicroLabel text="Experience" color={c.accent} />
          {p.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '2px' }}>
              <MicroText text={`${exp.role} — ${exp.company}`} style={{ fontWeight: 600, fontSize: '3.5px' }} />
              <MicroText text={exp.years} style={{ color: '#9CA3AF', fontSize: '3px' }} />
              {exp.bullets.slice(0, 2).map((b, j) => (
                <MicroText key={j} text={`· ${b}`} style={{ color: '#6B7280', paddingLeft: '3px' }} />
              ))}
            </div>
          ))}
        </div>
        <div>
          <MicroLabel text="Skills" color={c.accent} />
          <MicroText text={p.skills.join('  ·  ')} />
        </div>
        <div>
          <MicroLabel text="Education" color={c.accent} />
          <MicroText text={p.education} />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Two column                                                                 */
/* -------------------------------------------------------------------------- */

function TwoColumn({ template, activeColor }: LayoutProps) {
  const c = useColors(template, activeColor)
  const p = PERSONAS[template.id % PERSONAS.length]

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div
        className="flex-shrink-0 flex flex-col items-start justify-center px-3 py-2"
        style={{ background: c.primary, minHeight: 24 }}
      >
        <MicroText text={p.name} style={{ color: 'white', fontWeight: 700, fontSize: '5px' }} />
        <MicroText text={p.title} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '3.5px' }} />
      </div>
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          className="flex-shrink-0 w-[30%] px-2 py-2 flex flex-col gap-2 overflow-hidden"
          style={{ background: `${c.primary}18` }}
        >
          <div>
            <MicroLabel text="Contact" color={c.accent} />
            <MicroText text={p.email} />
            <MicroText text={p.phone} />
            <MicroText text={p.location} />
          </div>
          <div>
            <MicroLabel text="Skills" color={c.accent} />
            {p.skills.map((s, i) => <MicroText key={i} text={s} />)}
          </div>
        </div>
        <div className="flex-1 px-2 py-2 flex flex-col gap-2 overflow-hidden">
          <div>
            <MicroLabel text="Experience" color={c.accent} />
            {p.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '3px' }}>
                <MicroText text={`${exp.role} — ${exp.company}`} style={{ fontWeight: 600 }} />
                <MicroText text={exp.years} style={{ color: '#9CA3AF', fontSize: '3px' }} />
                {exp.bullets.slice(0, 2).map((b, j) => (
                  <MicroText key={j} text={`· ${b}`} style={{ paddingLeft: '3px', color: '#6B7280' }} />
                ))}
              </div>
            ))}
          </div>
          <div>
            <MicroLabel text="Education" color={c.accent} />
            <MicroText text={p.education} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Dark header band                                                           */
/* -------------------------------------------------------------------------- */

function DarkHeaderBand({ template, activeColor }: LayoutProps) {
  const c = useColors(template, activeColor)
  const p = PERSONAS[template.id % PERSONAS.length]

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div
        className="flex-shrink-0 flex flex-col items-start justify-center gap-0.5 px-3 py-2 relative"
        style={{ background: c.primary, minHeight: 32 }}
      >
        <MicroText text={p.name} style={{ color: 'white', fontWeight: 700, fontSize: '5px' }} />
        <MicroText text={p.title} style={{ color: 'rgba(255,255,255,0.85)', fontSize: '3.5px' }} />
        <MicroText text={`${p.email}  ·  ${p.location}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '3px' }} />
        <div
          className="absolute bottom-1.5 left-3"
          style={{ width: 14, height: 5, borderRadius: 999, background: c.accent }}
        />
      </div>
      <div className="flex-1 px-3 py-2 flex flex-col gap-2 overflow-hidden">
        <div className="pl-2" style={{ borderLeft: `2px solid ${c.accent}` }}>
          <MicroLabel text="Summary" color={c.accent} />
          <MicroText text={p.summary} />
        </div>
        <div className="pl-2" style={{ borderLeft: `2px solid ${c.accent}` }}>
          <MicroLabel text="Experience" color={c.accent} />
          {p.experience.slice(0, 1).map((exp, i) => (
            <div key={i}>
              <MicroText text={`${exp.role} — ${exp.company}`} style={{ fontWeight: 600 }} />
              <MicroText text={exp.years} style={{ color: '#9CA3AF', fontSize: '3px' }} />
              {exp.bullets.slice(0, 2).map((b, j) => (
                <MicroText key={j} text={`· ${b}`} style={{ paddingLeft: '3px', color: '#6B7280' }} />
              ))}
            </div>
          ))}
        </div>
        <div className="pl-2" style={{ borderLeft: `2px solid ${c.accent}` }}>
          <MicroLabel text="Skills" color={c.accent} />
          <MicroText text={p.skills.slice(0, 3).join('  ·  ')} />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sidebar strip                                                              */
/* -------------------------------------------------------------------------- */

function SidebarStrip({ template, activeColor }: LayoutProps) {
  const c = useColors(template, activeColor)
  const p = PERSONAS[template.id % PERSONAS.length]

  return (
    <div className="w-full h-full flex flex-row bg-white overflow-hidden">
      <div
        className="flex-shrink-0 w-[20%] flex flex-col items-start gap-1.5 p-2"
        style={{ background: c.primary }}
      >
        {p.skills.slice(0, 3).map((s, i) => (
          <div key={i} className="flex flex-col items-start gap-0.5 w-full">
            <div className="rounded-full" style={{ width: 8, height: 8, background: c.neutral }} />
            <MicroText text={s} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '3px' }} />
          </div>
        ))}
      </div>
      <div className="flex-1 px-2 py-2 flex flex-col gap-2 overflow-hidden">
        <MicroText text={p.name} style={{ fontWeight: 700, fontSize: '5px' }} />
        <MicroText text={p.title} style={{ color: '#6B7280', fontSize: '3.5px' }} />
        <div>
          <MicroLabel text="Experience" color={c.accent} />
          {p.experience.slice(0, 1).map((exp, i) => (
            <div key={i}>
              <MicroText text={`${exp.role} — ${exp.company}`} style={{ fontWeight: 600 }} />
              <MicroText text={exp.years} style={{ color: '#9CA3AF', fontSize: '3px' }} />
            </div>
          ))}
        </div>
        <div>
          <MicroLabel text="Skills" color={c.accent} />
          <MicroText text={p.skills.join('  ·  ')} />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Bento                                                                      */
/* -------------------------------------------------------------------------- */

function Bento({ template, activeColor }: LayoutProps) {
  const c = useColors(template, activeColor)
  const p = PERSONAS[template.id % PERSONAS.length]

  return (
    <div className="w-full h-full flex flex-col bg-white p-2">
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5 mb-1.5 rounded"
        style={{ background: c.primary, minHeight: 20 }}
      >
        <MicroText text={p.name} style={{ color: 'white', fontWeight: 700, fontSize: '4.5px' }} />
        <MicroText text={p.title} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '3px' }} />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-1 min-h-0">
        {/* Cell 1 — Experience */}
        <div className="rounded-sm px-1 py-1 flex flex-col gap-0.5 overflow-hidden" style={{ background: `${c.accent}33` }}>
          <MicroLabel text="Experience" color={c.accent} />
          <MicroText text={`${p.experience[0].role} — ${p.experience[0].company}`} style={{ fontWeight: 600 }} />
          <MicroText text={p.experience[0].bullets[0]} style={{ color: '#6B7280' }} />
        </div>
        {/* Cell 2 — Skills */}
        <div className="rounded-sm border border-gray-200 px-1 py-1 flex flex-col gap-0.5 overflow-hidden">
          <MicroLabel text="Skills" color={c.accent} />
          {p.skills.slice(0, 3).map((s, i) => (
            <MicroText key={i} text={s} style={{ fontSize: '3px' }} />
          ))}
        </div>
        {/* Cell 3 — Summary + Education (col-span-2) */}
        <div className="col-span-2 rounded-sm border border-gray-200 px-1 py-1 flex flex-col gap-0.5 overflow-hidden">
          <MicroLabel text="Summary" color={c.accent} />
          <MicroText text={p.summary} />
          <MicroText text={p.education} style={{ color: '#6B7280', fontSize: '3px' }} />
        </div>
        {/* Cell 4 — Contact */}
        <div className="rounded-sm px-1 py-1 flex flex-col gap-0.5 overflow-hidden" style={{ background: `${c.primary}1A` }}>
          <MicroLabel text="Contact" color={c.accent} />
          <MicroText text={p.email} style={{ fontSize: '3px' }} />
          <MicroText text={p.phone} style={{ fontSize: '3px' }} />
        </div>
        {/* Cell 5 — More */}
        <div className="rounded-sm border border-gray-200 px-1 py-1 flex flex-col gap-0.5 overflow-hidden">
          <MicroLabel text="Tools" color={c.accent} />
          {p.skills.slice(2, 4).map((s, i) => (
            <MicroText key={i} text={s} style={{ fontSize: '3px' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Timeline                                                                   */
/* -------------------------------------------------------------------------- */

function Timeline({ template, activeColor }: LayoutProps) {
  const c = useColors(template, activeColor)
  const p = PERSONAS[template.id % PERSONAS.length]

  return (
    <div className="w-full h-full flex flex-col bg-white relative overflow-hidden">
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5"
        style={{ background: c.primary, minHeight: 22 }}
      >
        <MicroText text={p.name} style={{ color: 'white', fontWeight: 700, fontSize: '5px' }} />
        <MicroText text={p.title} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '3.5px' }} />
      </div>
      {/* Center line */}
      <div
        className="absolute"
        style={{ left: '50%', top: 22, width: 2, bottom: 0, background: c.accent, transform: 'translateX(-50%)' }}
      />
      <div className="flex-1 relative p-2 overflow-hidden">
        {/* Left entry — Experience */}
        <div className="absolute" style={{ top: '4%', left: 0, right: 0, height: '42%' }}>
          <div
            className="absolute rounded-full z-10"
            style={{ left: '50%', width: 8, height: 8, background: c.accent, transform: 'translateX(-50%)' }}
          />
          <div
            className="absolute p-1.5 rounded-sm"
            style={{
              width: '42%', left: '4%', textAlign: 'right' as React.CSSProperties['textAlign'],
              background: `${c.primary}0D`, borderRight: `2px solid ${c.accent}`,
            }}
          >
            <MicroText text={`${p.experience[0].role}`} style={{ fontWeight: 600 }} />
            <MicroText text={p.experience[0].company} style={{ color: '#9CA3AF', fontSize: '3px' }} />
            <MicroText text={p.experience[0].bullets[0]} style={{ color: '#6B7280', fontSize: '3px' }} />
          </div>
        </div>
        {/* Right entry — Education + Skills */}
        <div className="absolute" style={{ top: '50%', left: 0, right: 0, height: '42%' }}>
          <div
            className="absolute rounded-full z-10"
            style={{ left: '50%', width: 8, height: 8, background: c.accent, transform: 'translateX(-50%)' }}
          />
          <div
            className="absolute p-1.5 rounded-sm"
            style={{
              width: '42%', right: '4%', textAlign: 'left' as React.CSSProperties['textAlign'],
              background: `${c.primary}0D`, borderLeft: `2px solid ${c.accent}`,
            }}
          >
            <MicroLabel text="Education" color={c.accent} />
            <MicroText text={p.education} style={{ fontSize: '3px' }} />
            <div style={{ marginTop: '2px' }}>
              <MicroLabel text="Skills" color={c.accent} />
              <MicroText text={p.skills.slice(0, 3).join('  ·  ')} style={{ fontSize: '3px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function TemplatePreview({
  template,
  activeColor,
  size,
}: TemplatePreviewProps) {
  const layout = detectLayout(template)
  const wrapperStyle: React.CSSProperties =
    size === 'card' ? {} : { aspectRatio: '0.707' }
  const wrapperClass =
    size === 'card'
      ? 'w-full h-full overflow-hidden rounded-lg'
      : 'w-full max-w-[320px] overflow-hidden rounded-xl shadow-lg'

  const renderLayout = () => {
    switch (layout) {
      case 'BENTO':
        return <Bento template={template} activeColor={activeColor} />
      case 'TIMELINE':
        return <Timeline template={template} activeColor={activeColor} />
      case 'SIDEBAR_STRIP':
        return <SidebarStrip template={template} activeColor={activeColor} />
      case 'DARK_HEADER':
        return <DarkHeaderBand template={template} activeColor={activeColor} />
      case 'TWO_COLUMN':
        return <TwoColumn template={template} activeColor={activeColor} />
      default:
        return <SingleColumn template={template} activeColor={activeColor} />
    }
  }

  return (
    <div className={wrapperClass} style={wrapperStyle} data-layout={layout}>
      {renderLayout()}
    </div>
  )
}
