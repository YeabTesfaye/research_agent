import os
os.environ["OPENAI_API_KEY"] = "ollama"
os.environ["OPENAI_API_BASE"] = os.getenv("OPENAI_API_BASE", "http://localhost:11434/v1")


from crewai import Crew, Task, Process
from langchain_openai import ChatOpenAI
from agents.researcher import create_researcher
from agents.reader import create_reader
from agents.analyst import create_analyst
from agents.writer import create_writer


def get_ollama_llm() -> ChatOpenAI:
    return ChatOpenAI(
        model=os.getenv("OLLAMA_MODEL", "llama3.2"),
        base_url=os.getenv("OPENAI_API_BASE", "http://localhost:11434/v1"),
        api_key="ollama",
        temperature=0.7,
    )


def run_research(topic: str) -> str:

    model = os.getenv("OLLAMA_MODEL", "llama3.2")

    llm = get_ollama_llm()

    researcher = create_researcher(llm=model)
    reader     = create_reader(llm=model)
    analyst    = create_analyst(llm=model)
    writer     = create_writer(llm=model)

    task_research = Task(
        description=(
            f"Search the web for credible, recent sources about: '{topic}'. "
            "Find at least 5 high-quality sources. For each source, record: "
            "the title, URL, publication date (if available), and a 2-3 sentence "
            "description of what the source covers. Focus on authoritative sources "
            "such as academic papers, reputable news outlets, government reports, "
            "and industry publications."
        ),
        expected_output=(
            "A structured list of 5+ sources. Each entry includes: "
            "title, URL, publication date (if available), and a brief description "
            "of what the source covers and why it is relevant."
        ),
        agent=researcher,
    )

    task_read = Task(
        description=(
            f"Using the sources found by the Research Specialist about '{topic}', "
            "read and summarize each one. For each source: "
            "1. Extract the 3-5 most important facts, statistics, or arguments. "
            "2. Note any specific data points, quotes, or claims that stand out. "
            "3. Record the source URL so it can be cited later. "
            "Preserve factual accuracy — do not interpret or editorialize."
        ),
        expected_output=(
            "A structured set of source summaries. Each summary includes: "
            "source title, URL, and 3-5 key facts/data points extracted from that source. "
            "All information is attributed to its source URL."
        ),
        agent=reader,
        context=[task_research],
    )

    task_analyze = Task(
        description=(
            f"Analyze the source summaries about '{topic}' to produce a synthesis. "
            "Your analysis must cover: "
            "1. Major trends and patterns across sources. "
            "2. Key data points and statistics that appear significant. "
            "3. Areas of consensus across multiple sources. "
            "4. Contradictions or tensions between sources (if any). "
            "5. Notable gaps or unanswered questions in the current research. "
            "6. Implications and what the evidence suggests going forward. "
            "Every claim must be grounded in specific sources from the summaries."
        ),
        expected_output=(
            "A structured analytical synthesis with clearly labeled sections: "
            "Major Trends, Key Data Points, Areas of Consensus, Contradictions/Tensions, "
            "Research Gaps, and Implications. Each section cites the specific sources "
            "that support its claims."
        ),
        agent=analyst,
        context=[task_read],
    )

    task_write = Task(
        description=(
            f"Write a comprehensive, well-structured research report about '{topic}' "
            "in markdown format, using all the research and analysis provided. "
            "The report must include these sections in order: "
            "1. A title (H1) with the topic. "
            "2. Executive Summary (2-3 paragraphs). "
            "3. Introduction and Background. "
            "4. Key Findings (with subsections for each major theme). "
            "5. Analysis and Implications. "
            "6. Limitations and Research Gaps. "
            "7. Conclusion. "
            "8. References (numbered list with titles and URLs). "
            "Use inline citations like [1], [2] etc. that correspond to the references list. "
            "The tone should be professional and accessible to an informed non-specialist."
        ),
        expected_output=(
            "A complete, well-formatted markdown research report with all 8 sections, "
            "inline citations, and a numbered references list. The report should be "
            "1500-3000 words and read as a polished, publication-ready document."
        ),
        agent=writer,
        context=[task_analyze],
    )

    crew = Crew(
        agents=[researcher, reader, analyst, writer],
        tasks=[task_research, task_read, task_analyze, task_write],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()
    return str(result)