import os
import httpx
from typing import List, Dict, Any, Optional

ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs"

# Countries to search — Canada first, then US, GB, AU as fallback
COUNTRIES = ["ca", "us", "gb", "au"]

async def search_jobs(
    query: str,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    max_days_old: Optional[int] = None,
    sort_by: Optional[str] = None,
    page: int = 1,
    results_per_page: int = 20,
) -> Dict[str, Any]:
    app_id = os.getenv("ADZUNA_APP_ID", "")
    app_key = os.getenv("ADZUNA_APP_KEY", "")

    if app_id and app_key and app_id != "your_adzuna_app_id":
        return await _search_adzuna(
            query=query,
            app_id=app_id,
            app_key=app_key,
            location=location,
            job_type=job_type,
            salary_min=salary_min,
            salary_max=salary_max,
            max_days_old=max_days_old,
            sort_by=sort_by,
            page=page,
            results_per_page=results_per_page,
        )
    else:
        print("DEBUG: Adzuna not configured, using mock data")
        return _mock_results(query)


async def _search_adzuna(
    query: str,
    app_id: str,
    app_key: str,
    location: Optional[str] = None,
    job_type: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    max_days_old: Optional[int] = None,
    sort_by: Optional[str] = None,
    page: int = 1,
    results_per_page: int = 20,
) -> Dict[str, Any]:
    """Search jobs via the Adzuna API — Canada first, then US/GB/AU fallback."""
    all_results: List[Dict[str, Any]] = []
    errors: List[str] = []
    total_count = 0

    # Map frontend sort options to Adzuna sort_by values
    sort_map = {
        "relevance": "relevance",
        "date": "date",
        "salary": "salary",
    }
    adzuna_sort = sort_map.get(sort_by, "relevance")

    # Map frontend job_type to Adzuna contract_type
    contract_type_map = {
        "full-time": "permanent",
        "part-time": "part_time",
        "contract": "contract",
        "internship": "internship",
    }
    adzuna_contract = contract_type_map.get(job_type.lower()) if job_type else None

    async with httpx.AsyncClient(timeout=15.0) as client:
        for country in COUNTRIES:
            if len(all_results) >= results_per_page:
                break

            url = f"{ADZUNA_BASE_URL}/{country}/search/{page}"
            params = {
                "app_id": app_id,
                "app_key": app_key,
                "what": query,
                "results_per_page": results_per_page,
                "content-type": "application/json",
                "sort_by": adzuna_sort,
            }

            # Add optional filter params — skip "where" for Canada-wide search
            if location and location.strip().lower() != "canada":
                params["where"] = location
            if adzuna_contract:
                params["contract_type"] = adzuna_contract
            if salary_min is not None:
                params["salary_min"] = salary_min
            if salary_max is not None:
                params["salary_max"] = salary_max
            if max_days_old is not None:
                params["max_days_old"] = max_days_old

            try:
                print(f"DEBUG: Searching Adzuna ({country}) for: {query}")
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                jobs = data.get("results", [])
                total_count = data.get("count", len(jobs))
                print(f"DEBUG: Adzuna ({country}) returned {len(jobs)} results (total: {total_count})")

                for job in jobs:
                    if len(all_results) >= results_per_page:
                        break

                    title = job.get("title", "Unknown Position")
                    company_raw = job.get("company", {}) or {}
                    company = company_raw.get("display_name") if isinstance(company_raw, dict) else str(company_raw)

                    location_raw = job.get("location", {}) or {}
                    job_location = location_raw.get("display_name") if isinstance(location_raw, dict) else str(location_raw)

                    salary_min_val = job.get("salary_min")
                    salary_max_val = job.get("salary_max")
                    currency = job.get("salary_currency", "USD")
                    salary_str = _format_salary(salary_min_val, salary_max_val, currency)

                    description = job.get("description", "")
                    redirect_url = job.get("redirect_url", "")

                    tags = _extract_tags(description, title)
                    match_score = compute_match_score(title, description)

                    all_results.append({
                        "id": job.get("id"),
                        "title": title,
                        "company": company or "Unknown",
                        "location": job_location or "",
                        "description": description,
                        "salary": salary_str,
                        "salary_min": salary_min_val,
                        "salary_max": salary_max_val,
                        "salary_currency": currency,
                        "url": redirect_url,
                        "source": f"Adzuna ({country.upper()})",
                        "tags": tags,
                        "match_score": match_score,
                        "posted_date": job.get("created"),
                        "job_type": job.get("contract_type", "Full-time"),
                        "company_logo": None,
                    })

                # If we got results from this country, stop
                if all_results:
                    print(f"DEBUG: Using results from Adzuna ({country.upper()})")
                    break

            except httpx.HTTPStatusError as e:
                errors.append(f"{country}: HTTP {e.response.status_code}")
                print(f"WARNING: Adzuna ({country}) HTTP {e.response.status_code}")
                continue
            except httpx.RequestError as e:
                errors.append(f"{country}: {str(e)}")
                print(f"WARNING: Adzuna ({country}) request error: {str(e)}")
                continue
            except Exception as e:
                errors.append(f"{country}: {str(e)}")
                print(f"WARNING: Adzuna ({country}) unexpected error: {str(e)}")
                continue

    if all_results:
        print(f"DEBUG: Total {len(all_results)} real job results returned")
        return {
            "results": all_results,
            "total": total_count,
            "page": page,
            "results_per_page": results_per_page,
        }

    print(f"WARNING: Adzuna API failed for all countries. Errors: {'; '.join(errors)}")
    print("DEBUG: Falling back to mock data")
    return _mock_results(query)


def _format_salary(salary_min: Optional[float], salary_max: Optional[float], currency: str) -> str:
    """Format salary range into a readable string."""
    symbols = {"USD": "$", "GBP": "£", "EUR": "€", "INR": "₹", "AUD": "A$", "CAD": "C$", "NZD": "NZ$", "SGD": "S$"}
    sym = symbols.get(currency, currency + " ")

    if salary_min and salary_max:
        if salary_max > 1000000:
            return f"{sym}{int(salary_min/1000)}k - {sym}{int(salary_max/1000)}k"
        return f"{sym}{int(salary_min):,} - {sym}{int(salary_max):,}"
    elif salary_min:
        return f"From {sym}{int(salary_min):,}"
    elif salary_max:
        return f"Up to {sym}{int(salary_max):,}"
    return ""


def _extract_tags(description: str, title: str) -> List[str]:
    """Extract technology/tool tags from the description and title."""
    tech_keywords = [
        "Python", "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js",
        "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
        "PostgreSQL", "MongoDB", "MySQL", "Redis", "Elasticsearch",
        "FastAPI", "Django", "Flask", "Spring Boot", "GraphQL",
        "REST", "API", "CI/CD", "Git", "Linux", "Agile", "Scrum",
        "Machine Learning", "AI", "Deep Learning", "NLP",
        "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP",
        "Kafka", "RabbitMQ", "Spark", "Hadoop", "Airflow",
        "TensorFlow", "PyTorch", "scikit-learn",
    ]
    text = (description + " " + title).lower()
    found = []
    for kw in tech_keywords:
        if kw.lower() in text:
            found.append(kw)
    return found[:8]


def compute_match_score(title: str, description: str) -> int:
    """Compute a simple relevance score based on keyword density."""
    high_value = [
        "senior", "lead", "principal", "staff", "architect",
        "python", "fastapi", "typescript", "react", "aws",
        "docker", "kubernetes", "backend", "full-stack",
    ]
    text = (title + " " + description).lower()
    count = sum(1 for kw in high_value if kw in text)
    return min(60 + (count * 5), 98)


def _mock_results(query: str) -> Dict[str, Any]:
    """Return mock job listings when no real API is available."""
    return {
        "results": [
            {
                "id": 1,
                "title": "Senior Python Developer",
                "company": "Innovative AI",
                "location": "Toronto, ON",
                "description": "We are looking for a Senior Python Developer to join our team. "
                               "You will be responsible for building scalable backend services "
                               "and integrating with AI models. Experience with FastAPI and Redis is a plus.",
                "url": "https://example.com/job/1",
                "source": "Adzuna (CA)",
                "tags": ["Python", "FastAPI", "Redis", "AI"],
                "salary": "C$120k - C$160k",
                "match_score": 92,
                "posted_date": "2026-06-01",
                "job_type": "Full-time",
            },
            {
                "id": 2,
                "title": "Lead Software Engineer",
                "company": "FastScale Inc.",
                "location": "Vancouver, BC",
                "description": "Lead our engineering team in building the next generation of fintech "
                               "applications. Deep knowledge of Python, AWS, and distributed systems required.",
                "url": "https://example.com/job/2",
                "source": "Adzuna (CA)",
                "tags": ["Python", "AWS", "Distributed Systems", "Leadership"],
                "salary": "C$150k - C$200k",
                "match_score": 85,
                "posted_date": "2026-06-02",
                "job_type": "Full-time",
            },
        ],
        "total": 2,
        "page": 1,
        "results_per_page": 20,
    }
