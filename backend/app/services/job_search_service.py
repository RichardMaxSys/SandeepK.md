import httpx
import os
from typing import List, Dict, Any

ADZUNA_APP_ID = os.getenv("ADZUNA_APP_ID")
ADZUNA_APP_KEY = os.getenv("ADZUNA_APP_KEY")

async def search_adzuna(query: str, location: str = "us") -> List[Dict[str, Any]]:
    if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
        return []

    url = f"https://api.adzuna.com/v1/api/jobs/{location}/search/1"
    params = {
        "app_id": ADZUNA_APP_ID,
        "app_key": ADZUNA_APP_KEY,
        "results_per_page": 20,
        "what": query,
        "content-type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            return []

        data = response.json()
        results = []
        for job in data.get("results", []):
            results.append({
                "title": job.get("title"),
                "company": job.get("company", {}).get("display_name"),
                "location": job.get("location", {}).get("display_name"),
                "description": job.get("description"),
                "url": job.get("redirect_url"),
                "source": "Adzuna"
            })
        return results

import random

async def search_jobs(query: str) -> List[Dict[str, Any]]:
    # For now, we only implement Adzuna. JSearch can be added similarly.
    jobs = await search_adzuna(query)
    # Add preliminary mock match score for UI presentation
    for job in jobs:
        job["match_score"] = random.randint(60, 95)
    return jobs
