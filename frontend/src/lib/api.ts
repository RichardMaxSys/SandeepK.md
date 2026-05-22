const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload-resume`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
}

export async function searchJobs(query: string) {
  const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
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
