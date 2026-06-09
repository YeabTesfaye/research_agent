from crewai_tools import RagTool
from tavily import TavilyClient
from config import settings


class TavilySearchTool(RagTool):
    name: str = "tavily_search"
    description: str = (
        "Search the web for current, credible information on a given topic. "
        "Returns a list of results with titles, URLs, and content snippets. "
        "Use this to find sources for research tasks."
    )

    def _run(self, query: str) -> str:
        client = TavilyClient(api_key=settings.TAVILY_API_KEY)
        response = client.search(
            query=query,
            search_depth="advanced",
            max_results=7,
            include_answer=True,
            include_raw_content=False,
        )

        results = []
        if response.get("answer"):
            results.append(f"Quick answer: {response['answer']}\n")

        for i, r in enumerate(response.get("results", []), 1):
            results.append(
                f"[{i}] {r['title']}\n"
                f"    URL: {r['url']}\n"
                f"    {r.get('content', '')[:400]}\n"
            )

        return "\n".join(results) if results else "No results found."
