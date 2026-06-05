from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from ..services.llm_provider import call_llm, safe_parse_json

router = APIRouter(prefix="/api", tags=["ai"])

REWRITE_SYSTEM_PROMPT = """You are a resume bullet rewriter. STRENGTHEN a single bullet by REFRAMING what the candidate already did. NEVER invent new experience.

RULES:
1. NO FABRICATION. Only reframe what is in the original.
2. Lead with a strong action verb: Built, Led, Shipped, Owned, Drove, Cut, Reduced, Increased, Designed, Architected, Launched, Migrated, Optimized, Scaled.
3. Include a metric ONLY if the bullet implies scale. NEVER invent numbers.
4. Strip generic phrases: passionate, team player, results-driven, leverage, synergize.
5. If a JD is provided, weave in 1-2 specific JD terms ONLY if compatible.
6. Keep to 1-2 lines, 80-200 chars.
7. Capitalize first letter, end with period.

OUTPUT (strict JSON only):
{"after": "<rewritten bullet>", "reason": "<one short sentence, max 80 chars>", "changed": true|false}
If already strong, return original with changed: false."""

COVER_LETTER_SYSTEM_PROMPT = """You are a cover-letter writer. Write a 3-paragraph cover letter (250-350 words).

Paragraph 1: Why this role at this company. Reference 1-2 things from the JD.
Paragraph 2: Relevant experience from the top bullets only. NO FABRICATION.
Paragraph 3: Close with a clear call to action.

Voice: Confident, specific, human. No "I am passionate", no "team player".
Return ONLY the letter text."""


class RewriteRequest(BaseModel):
    bullet: str = Field(..., min_length=1, max_length=2000)
    jd: Optional[str] = Field(None, max_length=20000)
    targetRole: Optional[str] = Field(None, max_length=200)
    tone: Optional[str] = Field("impact", pattern="^(concise|impact)$")


class RewriteResponse(BaseModel):
    before: str
    after: str
    reason: str
    changed: bool


class CoverLetterRequest(BaseModel):
    name: str = Field(..., max_length=200)
    targetRole: str = Field(..., max_length=200)
    company: str = Field(..., max_length=200)
    jd: str = Field(..., min_length=1, max_length=20000)
    topBullets: list[str] = Field(default_factory=list, max_length=20)
    tone: Optional[str] = None


class CoverLetterResponse(BaseModel):
    letter: str


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite(req: RewriteRequest):
    user_prompt = f"""BULLET: {req.bullet}

JD CONTEXT:
{req.jd or "(none)"}

TARGET ROLE: {req.targetRole or "(general)"}
TONE: {req.tone or "impact"}"""
    try:
        raw = await call_llm(system=REWRITE_SYSTEM_PROMPT, user=user_prompt, max_tokens=500, temperature=0.4, response_format="json")
    except Exception as e:
        raise HTTPException(503, f"LLM unavailable: {str(e)}")
    parsed = safe_parse_json(raw, fallback_after=req.bullet)
    return RewriteResponse(before=req.bullet, after=parsed.get("after", req.bullet), reason=parsed.get("reason", "AI rewrite."), changed=parsed.get("after", "").strip() != req.bullet.strip())


@router.post("/cover-letter", response_model=CoverLetterResponse)
async def cover_letter(req: CoverLetterRequest):
    bullets_text = "\n".join(f"- {b}" for b in req.topBullets[:5])
    user_prompt = f"""Name: {req.name}
Target Role: {req.targetRole}
Company: {req.company}

Job Description:
{req.jd[:4000]}

Top Resume Bullets:
{bullets_text}"""
    try:
        letter = await call_llm(system=COVER_LETTER_SYSTEM_PROMPT, user=user_prompt, max_tokens=800, temperature=0.6)
    except Exception as e:
        raise HTTPException(503, f"LLM unavailable: {str(e)}")
    return CoverLetterResponse(letter=letter.strip())


@router.get("/health")
async def health():
    try:
        from ..services.llm_provider import _get_api_key
        _get_api_key()
        return {"status": "ok", "model": "openai/gpt-4o-mini"}
    except ValueError:
        return {"status": "error", "message": "OPENROUTER_API_KEY not set"}
