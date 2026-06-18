from crewai import Agent
from langchain_openai import ChatOpenAI

def create_writer(llm: str) -> Agent:
    return Agent(
        role="Technical Report Writer",
        goal=(
            "Transform the research analysis into a polished, well-structured markdown report. "
            "The report must include: an executive summary, clearly organized sections with "
            "descriptive headings, inline citations linking to sources, a key findings section, "
            "and a numbered references list at the end. The writing should be clear, professional, "
            "and accessible to an informed but non-specialist reader."
        ),
        backstory=(
            "You are a senior technical writer who has authored hundreds of research reports "
            "for think tanks, consulting firms, and academic institutions. Your writing is "
            "precise, authoritative, and engaging. You know exactly how to structure a report "
            "for maximum clarity and impact: strong executive summaries, logical flow between "
            "sections, and citations that build credibility without cluttering the prose. "
            "You always produce valid, well-formatted markdown."
        ),
        llm=llm,
        verbose=False,
        allow_delegation=False,
        max_iter=3,
    )