const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface JobSearchFilters {
  location?: string;
  job_type?: string;
  salary_min?: number;
  salary_max?: number;
  max_days_old?: number;
  sort_by?: string;
  page?: number;
  results_per_page?: number;
}

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload-resume`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function searchJobs(query: string, filters: JobSearchFilters = {}) {
  const params = new URLSearchParams();
  params.set('query', query);
  if (filters.location) params.set('location', filters.location);
  if (filters.job_type) params.set('job_type', filters.job_type);
  if (filters.salary_min) params.set('salary_min', String(filters.salary_min));
  if (filters.salary_max) params.set('salary_max', String(filters.salary_max));
  if (filters.max_days_old) params.set('max_days_old', String(filters.max_days_old));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.results_per_page) params.set('results_per_page', String(filters.results_per_page));

  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
  return response.json();
}

export async function generatePackage(jobId: number, resumeId: number) {
  const response = await fetch(`${API_BASE_URL}/generate-package/${jobId}/${resumeId}`, {
    method: 'POST',
  });
  return response.json();
}

export async function getPackages() {
  const response = await fetch(`${API_BASE_URL}/packages`);
  return response.json();
}

export function getDownloadUrl(packageId: number, format: 'pdf' | 'docx') {
  return `${API_BASE_URL}/download/${packageId}/${format}`;
}

export async function triggerDryRun(packageId: number) {
  const response = await fetch(`${API_BASE_URL}/dry-run/${packageId}`, {
    method: 'POST',
  });
  return response.json();
}

export async function approvePackage(packageId: number) {
  const response = await fetch(`${API_BASE_URL}/approve-package/${packageId}`, {
    method: 'POST',
  });
  return response.json();
}

// --- ATS Analysis endpoints ---

export interface ATSAnalysisRequest {
  job_description: string;
  resume_text: string;
  resume_id?: number;
}

export interface ATSAnalysisResult {
  score: number;
  match_percentage?: number;
  readability_score: number;
  recruiter_read_time_seconds?: number;
  resume_strength_score: number;
  recruiter_likelihood_score?: number;
  missing_keywords: string[];
  present_keywords: string[];
  missing_skills?: string[];
  formatting_risks?: string[];
  section_hierarchy_valid?: boolean;
  over_optimization_detected?: boolean;
  is_potential_scam: boolean;
  job_quality_score?: number;
  ats_parsing_risk_level: string;
  fit_score_explanation: string;
  improvement_suggestions: string[];
  recruiter_notes: string;
}

export async function analyzeATS(data: ATSAnalysisRequest) {
  const response = await fetch(`${API_BASE_URL}/ats/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function rewriteResume(data: ATSAnalysisRequest) {
  const response = await fetch(`${API_BASE_URL}/ats/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function downloadATSResume(resumeText: string, format: 'pdf' | 'docx') {
  const response = await fetch(`${API_BASE_URL}/ats/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, format }),
  });
  if (!response.ok) throw new Error('Download failed');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rewritten-resume.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
