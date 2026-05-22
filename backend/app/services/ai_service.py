import os
import json
import httpx
import asyncio
from typing import Dict, Any

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

async def call_llm(prompt: str, model: str = "google/gemini-2.0-flash-001", retries: int = 3) -> str:
    if not OPENROUTER_API_KEY:
        return "Error: OPENROUTER_API_KEY not set."

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/job-assistant", # Required by some OpenRouter models
    }

    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are a professional career assistant and ATS expert."},
            {"role": "user", "content": prompt}
        ]
    }

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(OPENROUTER_URL, headers=headers, json=data, timeout=60.0)
                if response.status_code == 429: # Rate limit
                    await asyncio.sleep(2 ** attempt)
                    continue
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
        except Exception as e:
            if attempt == retries - 1:
                # Fallback to a cheaper/more stable model on final attempt
                if model != "anthropic/claude-3-haiku":
                    return await call_llm(prompt, model="anthropic/claude-3-haiku", retries=1)
                raise e
            await asyncio.sleep(1)
    return "Error: AI call failed after retries."

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
    You are a world-class executive resume writer. Your task is to tailor the following resume to perfectly match the job description.

    CRITICAL QUALITY GUIDELINES:
    1. Premium Summaries: Create a compelling 3-4 line professional summary that highlights unique value.
    2. Quantified Achievements: Rewrite bullet points to focus on impact (e.g., 'Increased revenue by 20%' instead of 'Managed sales').
    3. ATS-Optimized: Use clear headers and industry-standard terminology.
    4. Bullet Hierarchy: Organize experience by relevance and impact.
    5. Action Verbs: Use strong, varied action verbs (e.g., 'Spearheaded', 'Orchestrated', 'Leveraged').

    Maintain 100% truthfulness while maximizing relevance.
    Output the final resume in a clean, professional, recruiter-grade format.

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
    2. Formatting Validation: Check for common ATS issues (complex columns, images, missing sections, invalid characters).
    3. Resume Strength: Evaluate impact-driven language, quantifiable achievements, and word count.
    4. Job-Fit Score: A total score from 0 to 100 based on skill overlap.
    5. Readability: Score based on font usage, sentence length, and whitespace.
    6. Section Validation: Check if core sections (Summary, Experience, Skills, Education) are present and in optimal order.
    7. Duplicate Detection: Check for keyword stuffing or repetitive phrases.

    Return the result as ONLY valid JSON with the following structure:
    {{
        "score": number,
        "match_percentage": number,
        "readability_score": number,
        "resume_strength_score": number,
        "missing_keywords": [string],
        "present_keywords": [string],
        "missing_skills": [string],
        "formatting_issues": [string],
        "section_order_valid": boolean,
        "duplicate_keywords_found": [string],
        "improvement_suggestions": [string],
        "recruiter_feedback": string
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
            "readability_score": 0,
            "resume_strength_score": 0,
            "missing_keywords": [],
            "present_keywords": [],
            "missing_skills": [],
            "formatting_issues": ["Error parsing AI response"],
            "section_order_valid": False,
            "duplicate_keywords_found": [],
            "improvement_suggestions": [],
            "recruiter_feedback": "Analysis failed."
        }
