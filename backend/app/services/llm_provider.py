import json
import os
import random
from typing import Dict, Any

# Mock the LLM provider for the demo
async def call_llm(prompt: str, model: str = "google/gemini-2.0-flash-001") -> str:
    print(f"DEBUG: Calling mock LLM with model {model}")

    if "Parse the following resume" in prompt:
        return json.dumps({
            "contact_info": {"name": "Jane Doe", "email": "jane@example.com", "phone": "123-456-7890", "location": "New York, NY"},
            "summary": "Experienced Software Engineer with a focus on Python and React.",
            "experience": [
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech Corp",
                    "duration": "2020-Present",
                    "bullets": ["Spearheaded development of a high-traffic microservice architecture.", "Mentored 5 junior developers."]
                }
            ],
            "education": [{"degree": "B.S. Computer Science", "school": "State University"}],
            "skills": ["Python", "JavaScript", "React", "Docker", "AWS"],
            "projects": [{"name": "Personal Portfolio", "description": "Built using Next.js"}]
        })

    if "rewrite the provided resume" in prompt:
        return """
# Jane Doe
New York, NY | jane@example.com | 123-456-7890

## Professional Summary
Senior Software Engineer with over 5 years of experience in architecting scalable backend systems and high-performance frontend interfaces. Spearheaded the migration of a legacy monolithic application to a microservices architecture, improving system uptime by 99.9% and reducing latency by 40%. Proven track record of delivering complex technical solutions that drive business value and technical excellence.

## Professional Experience
### Tech Corp | Senior Software Engineer | 2020 – Present
* Engineered a distributed data processing pipeline using Python and AWS Lambda, reducing daily processing time from 6 hours to 45 minutes (87.5% improvement).
* Architected a real-time analytics dashboard with React and WebSockets, enabling stakeholders to monitor KPIs with sub-second latency.
* Optimized database queries and implemented a multi-level caching strategy using Redis, resulting in a 50% reduction in API response times for peak traffic.
* Mentored a team of 5 junior engineers, establishing rigorous code review standards and decreasing production bug reports by 30%.

## Skills
* Languages: Python, JavaScript, TypeScript, SQL
* Frameworks: React, Next.js, FastAPI, Node.js
* Tools: Docker, Kubernetes, AWS (S3, Lambda, RDS), Redis, Git
        """

    if "Write a clean, persuasive, and non-generic cover letter" in prompt:
        return """
Dear Hiring Team at [Company],

I have long admired [Company]'s commitment to [Specific Value/Goal], particularly your recent work on [Project/Product]. As a Senior Software Engineer with a specialized focus on scaling Python-based systems, I am excited to bring my expertise in high-performance architecture to your engineering team.

At Tech Corp, I spearheaded the migration of our core processing engine to a microservices-based model, which not only improved our system reliability to 99.9% but also empowered our team to release features 2x faster. I am particularly drawn to this role because of your focus on [Specific Challenge mentioned in JD], and I am confident that my experience with [Specific Skill] will allow me to contribute immediately to these efforts.

I would welcome the opportunity to discuss how my background in [Skill] and my passion for [Interest] can help [Company] achieve its upcoming goals for [Product].

Best regards,
Jane Doe
        """

    if "Perform a deep ATS" in prompt:
        return json.dumps({
            "score": 85,
            "match_percentage": 92,
            "readability_score": 90,
            "recruiter_read_time_seconds": 45,
            "resume_strength_score": 88,
            "recruiter_likelihood_score": 82,
            "missing_keywords": ["Kubernetes", "GraphQL"],
            "present_keywords": ["Python", "React", "AWS", "Microservices", "Redis"],
            "missing_skills": ["Golang", "NoSQL"],
            "formatting_risks": ["Check font consistency in the header"],
            "section_hierarchy_valid": True,
            "over_optimization_detected": False,
            "is_potential_scam": False,
            "job_quality_score": 95,
            "ats_parsing_risk_level": "low",
            "fit_score_explanation": "Strong alignment on core backend technologies and proven leadership experience.",
            "improvement_suggestions": ["Add more specific metrics for your React projects", "Mention experience with GraphQL if applicable"],
            "recruiter_notes": "A very strong candidate with a clear focus on performance and scalability."
        })

    return "Mocked AI response"
