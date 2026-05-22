import os
import json
import httpx
import asyncio
from typing import Dict, Any, List

class LLMProvider:
    def __init__(self, api_key: str, base_url: str):
        self.api_key = api_key
        self.base_url = base_url

    async def complete(self, prompt: str, model: str, system_prompt: str = "You are a professional career assistant.", retries: int = 3) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/job-assistant",
        }

        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
        }

        for attempt in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(self.base_url, headers=headers, json=data, timeout=60.0)
                    if response.status_code == 429:
                        await asyncio.sleep(2 ** attempt)
                        continue
                    response.raise_for_status()
                    result = response.json()
                    return result["choices"][0]["message"]["content"]
            except Exception as e:
                if attempt == retries - 1:
                    raise e
                await asyncio.sleep(1)
        return "Error: AI call failed."

# Global provider instance
provider = LLMProvider(
    api_key=os.getenv("OPENROUTER_API_KEY", ""),
    base_url="https://openrouter.ai/api/v1/chat/completions"
)

async def call_llm(prompt: str, model: str = "google/gemini-2.0-flash-001", system_prompt: str = "You are a professional career assistant and ATS expert.") -> str:
    try:
        return await provider.complete(prompt, model, system_prompt)
    except Exception:
        # Fallback logic
        if model != "anthropic/claude-3-haiku":
            return await provider.complete(prompt, "anthropic/claude-3-haiku", system_prompt)
        return "Error: All AI providers failed."
