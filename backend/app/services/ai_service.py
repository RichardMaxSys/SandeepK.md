import os
import json
import httpx
from typing import Dict, Any

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

async def call_llm(prompt: str, model: str = "google/gemini-2.0-flash-001") -> str:
    if not OPENROUTER_API_KEY:
        return "Error: OPENROUTER_API_KEY not set."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a professional career assistant and ATS expert."},
            {"role": "user", "content": prompt}
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(OPENROUTER_URL, headers=headers, json=data, timeout=60.0)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]

async def parse_resume(resume_text: str) -> Dict[str, Any]:
    prompt = f"""
    Parse the following resume text into a structured JSON format.
    Include sections: contact_info, summary, experience, education, skills, and projects.

    Resume Text:
    {resume_text}

    Return ONLY valid JSON.
    """
    response = await call_llm(prompt)
    try:
        # Simple cleanup if the model adds markdown formatting
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
        return json.loads(response)
    except Exception:
        return {"error": "Failed to parse resume", "raw": response}

async def tailor_resume(resume_text: str, job_description: str) -> str:
    prompt = f"""
    Tailor the following resume to better match the job description below.
    Focus on highlighting relevant skills and experiences while maintaining truthfulness.
    Output the tailored resume in a clean professional format.

    Resume:
    {resume_text}

    Job Description:
    {job_description}
    """
    return await call_llm(prompt)

async def generate_cover_letter(resume_text: str, job_description: str) -> str:
    prompt = f"""
    Generate a professional cover letter based on the resume and job description provided.

    Resume:
    {resume_text}

    Job Description:
    {job_description}
    """
    return await call_llm(prompt)

async def analyze_ats(resume_text: str, job_description: str) -> Dict[str, Any]:
    prompt = f"""
    Perform a deep ATS (Applicant Tracking System) analysis between the resume and the job description.
    Evaluate the following:
    1. Keyword Match: Identify present and missing industry-specific keywords.
    2. Formatting Validation: Check for common ATS issues (complex columns, images, missing sections).
    3. Resume Strength: Evaluate impact-driven language and quantifiable achievements.
    4. Job-Fit Score: A total score from 0 to 100.

    Return the result as ONLY valid JSON with the following structure:
    {{
        "score": number,
        "match_percentage": number,
        "missing_keywords": [string],
        "present_keywords": [string],
        "formatting_issues": [string],
        "resume_strength_score": number,
        "improvement_suggestions": [string],
        "recruiter_simulation_notes": string
    }}

    Resume:
    {resume_text}

    Job Description:
    {job_description}
    """
    response = await call_llm(prompt)
    try:
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0].strip()
        elif "```" in response:
            response = response.split("```")[1].split("```")[0].strip()
        return json.loads(response)
    except Exception:
        return {
            "score": 0,
            "match_percentage": 0,
            "missing_keywords": [],
            "present_keywords": [],
            "formatting_issues": ["Error parsing AI response"],
            "resume_strength_score": 0,
            "improvement_suggestions": [],
            "recruiter_simulation_notes": "Analysis failed."
        }
