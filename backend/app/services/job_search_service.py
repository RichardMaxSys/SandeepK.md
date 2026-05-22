from typing import List, Dict, Any

async def search_jobs(query: str) -> List[Dict[str, Any]]:
    print(f"DEBUG: Mocking job search for query: {query}")
    return [
        {
            "title": "Senior Python Developer",
            "company": "Innovative AI",
            "location": "Remote",
            "description": "We are looking for a Senior Python Developer to join our team. You will be responsible for building scalable backend services and integrating with AI models. Experience with FastAPI and Redis is a plus.",
            "url": "https://example.com/job/1",
            "source": "Adzuna"
        },
        {
            "title": "Lead Software Engineer",
            "company": "FastScale Inc.",
            "location": "New York, NY",
            "description": "Lead our engineering team in building the next generation of fintech applications. Deep knowledge of Python, AWS, and distributed systems required.",
            "url": "https://example.com/job/2",
            "source": "Adzuna"
        }
    ]
