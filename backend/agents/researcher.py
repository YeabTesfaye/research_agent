from crewai import Agent
from tools.search import WebSearchTool

def create_researcher_agent() -> Agent:
    return Agent(
        role="Senior Research Specialist",
        goal=(
            "Find the most relevant, credible, and up-to-date sources "
            "on the given research topic. Focus on authoritative sources "
            "like academic papers, industry reports, and reputable news sites."
        ),
        backstory=(
            "You are a veteran research specialist with 15 years of experience "
            "finding high-quality information. You know how to search effectively, "
            "identify credible sources, and avoid misinformation. You always "
            "find at least 4-5 strong sources on any topic."
        ),
        tools=[WebSearchTool()],
        llm="gpt-4o-mini",     # cheap + fast
        verbose=True,
        max_iter=3,            # max search attempts
        memory=True,
    )