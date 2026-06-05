from tavily import TavilyClient
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import os

class SearchInput(BaseModel):
    query: str = Field(description="The search query to look up")

class WebSearchTool(BaseTool):
    name: str = "web_search"
    description: str = (
        "Search the web for current information on a topic. "
        "Returns URLs, titles, and content snippets from relevant pages."
    )
    args_schema: type[BaseModel] = SearchInput

    def _run(self, query: str) -> str:
        client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        
        results = client.search(
            query=query,
            search_depth="advanced",  # deeper search
            max_results=5,
            include_raw_content=True,  # get full page content
        )
        
        formatted = []
        for i, result in enumerate(results.get("results", []), 1):
            formatted.append(
                f"Source {i}:\n"
                f"Title: {result.get('title', 'N/A')}\n"
                f"URL: {result.get('url', 'N/A')}\n"
                f"Content: {result.get('content', 'N/A')[:2000]}\n"
            )
        
        return "\n---\n".join(formatted) if formatted else "No results found."