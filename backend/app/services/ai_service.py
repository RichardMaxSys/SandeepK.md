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
    # Use cheaper model for parsing
    prompt = f"""
    Parse the following resume text into a structured JSON format.
    Include sections: contact_info, summary, experience, education, skills, and projects.

    Resume Text:
    {resume_text}

    Return ONLY valid JSON.
    """
    response = await call_llm(prompt, model="google/gemini-2.0-flash-001")
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
    You are an elite Executive Career Coach and Recruiter with 20+ years of experience in top-tier talent acquisition.
    Your task is to rewrite the provided resume to be a high-impact, recruiter-grade document tailored for the job description.

    STRICT OUTPUT GUIDELINES (RECRUITER-QUALITY):
    1. NO GENERIC AI PHRASING: Avoid words like "highly motivated", "passionate", "proven track record", "results-oriented", "synergy", or "team player".
    2. QUANTIFIED IMPACT: Every bullet point MUST attempt to include a metric (%, $, time, or scale). Use the X-Y-Z formula: "Accomplished [X] as measured by [Y], by doing [Z]".
    3. STRONG ACTION VERBS: Start every bullet with a power verb (e.g., "Spearheaded", "Engineered", "Optimized", "Architected", "Negotiated").
    4. BREVITY & PUNCH: Keep bullet points to 1-2 lines maximum. Eliminate fluff and "responsible for".
    5. PROFESSIONAL SUMMARY: A 3-sentence powerful hook. Line 1: Who you are (Years + Role). Line 2: Your biggest achievement. Line 3: How you solve the specific problems in the job description.
    6. ATS OPTIMIZATION: Use keywords naturally. Do not keyword stuff. Ensure headers are standard (e.g., "Professional Experience", "Skills", "Education").

    Maintain 100% truthfulness. Do not hallucinate experiences.
    Output ONLY the tailored resume content in a clean, professional format.

    Resume:
    {resume_text}

    Job Description:
    {job_description}
    """
    return await call_llm(prompt, model="anthropic/claude-3.5-sonnet") # Use premium model for final tailoring

async def generate_cover_letter(resume_text: str, job_description: str) -> str:
    prompt = f"""
    You are a professional Executive Ghostwriter. Write a clean, persuasive, and non-generic cover letter.

    GUIDELINES:
    1. AVOID CLICHES: Do NOT start with "I am writing to express my interest...". Start with a strong value proposition or a specific connection to the company.
    2. FOCUS ON VALUE: Don't just list experience; explain HOW that experience will solve the specific challenges mentioned in the job description.
    3. TONE: Professional, confident, yet humble. Not desperate.
    4. LENGTH: Keep it under 300 words. 3-4 short paragraphs.
    5. CALL TO ACTION: A professional request for a conversation, not a demand.

    Resume:
    {resume_text}

    Job Description:
    {job_description}
    """
    return await call_llm(prompt, model="anthropic/claude-3.5-sonnet")

async def analyze_ats(resume_text: str, job_description: str) -> Dict[str, Any]:
    # Use medium model for analysis
    prompt = f"""
    Perform a deep ATS (Applicant Tracking System) analysis between the resume and the job description.
    Evaluate the following with extreme precision:
    1. Keyword Match: Identify present and missing industry-specific keywords. Check for keyword density.
    2. Formatting Validation: Detect risks (tables, text in images, columns, non-standard fonts, contact info in headers).
    3. Resume Strength: Score based on quantified impact, action verbs, and summary strength.
    4. Job-Fit Score: 0-100 score based on hard and soft skill alignment.
    5. Readability Estimate: Recruiter reading time estimate and clarity score.
    6. Section Hierarchy: Validate logical flow (e.g., Summary -> Experience -> Skills -> Education).
    7. ATS Simulation: Flag if the resume would likely fail a common parser (e.g., Greenhouse, Workday).
    8. Over-Optimization: Flag if keyword stuffing or "hidden text" is detected.

    Return the result as ONLY valid JSON with the following structure:
    {{
        "score": number,
        "match_percentage": number,
        "readability_score": number,
        "recruiter_read_time_seconds": number,
        "resume_strength_score": number,
        "missing_keywords": [string],
        "present_keywords": [string],
        "missing_skills": [string],
        "formatting_risks": [string],
        "section_hierarchy_valid": boolean,
        "over_optimization_detected": boolean,
        "ats_parsing_risk_level": "low" | "medium" | "high",
        "fit_score_explanation": string,
        "improvement_suggestions": [string],
        "recruiter_notes": string
    }}

    Resume:
    {resume_text}

    Job Description:
    {job_description}
    """
    response = await call_llm(prompt, model="google/gemini-2.0-flash-001")
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
            "recruiter_read_time_seconds": 0,
            "resume_strength_score": 0,
            "missing_keywords": [],
            "present_keywords": [],
            "missing_skills": [],
            "formatting_risks": ["Error parsing AI response"],
            "section_hierarchy_valid": False,
            "over_optimization_detected": False,
            "ats_parsing_risk_level": "high",
            "fit_score_explanation": "Error during analysis.",
            "improvement_suggestions": [],
            "recruiter_notes": "Analysis failed."
        }
