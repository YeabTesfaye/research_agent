import os
from crewai import Crew, Task, Process, LLM
from crewai.tasks.task_output import TaskOutput
from agents.researcher import create_researcher
from agents.reader import create_reader
from agents.analyst import create_analyst
from agents.writer import create_writer
from typing import Callable


def get_llm() -> LLM:
    if os.environ.get("OLLAMA_MODEL"):
        return LLM(
            model=f"ollama/{os.environ['OLLAMA_MODEL']}",
            base_url=os.environ.get("OPENAI_API_BASE", "http://localhost:11434"),
            temperature=0.7,
        )
    return LLM(
        model="gemini/gemini-2.5-flash",
        api_key=os.environ["GEMINI_API_KEY"],
        temperature=0.7,
    )


def run_research(topic: str, on_agent_change: Callable[[str], None] | None = None) -> str:
    """
    Synchronous — runs in a thread executor.
    on_agent_change(agent_name) is called before each task starts.
    """
    llm = get_llm()

    researcher = create_researcher(llm=llm)
    reader     = create_reader(llm=llm)
    analyst    = create_analyst(llm=llm)
    writer     = create_writer(llm=llm)

    def notify(name: str):
        if on_agent_change:
            on_agent_change(name)

    # ── Tasks with before-start notifications via callbacks ────────
    task_research = Task(
        description=(
            f"Search the web for credible, recent sources about: '{topic}'. "
            "Find at least 5 high-quality sources. For each source record: "
            "title, URL, publication date (if available), and a 2-3 sentence description."
        ),
        expected_output="A structured list of 5+ sources with title, URL, date, and description.",
        agent=researcher,
        callback=lambda _: notify("reader"),  # fires AFTER task → next agent starts
    )

    task_read = Task(
        description=(
            f"Using the sources found about '{topic}', read and summarize each one. "
            "Extract 3-5 key facts, data points, or arguments per source. "
            "Record the source URL for citation."
        ),
        expected_output="Source summaries with title, URL, and 3-5 key facts each.",
        agent=reader,
        context=[task_research],
        callback=lambda _: notify("analyst"),
    )

    task_analyze = Task(
        description=(
            f"Analyze the source summaries about '{topic}'. Cover: "
            "1. Major trends. 2. Key data points. 3. Consensus areas. "
            "4. Contradictions. 5. Research gaps. 6. Implications. "
            "Ground every claim in specific sources."
        ),
        expected_output=(
            "Structured synthesis: Major Trends, Key Data, Consensus, "
            "Contradictions, Gaps, Implications — each citing sources."
        ),
        agent=analyst,
        context=[task_read],
        callback=lambda _: notify("writer"),
    )

    task_write = Task(
        description=(
            f"Write a research report about '{topic}' in markdown. Sections: "
            "1. Title (H1). 2. Executive Summary. 3. Introduction. "
            "4. Key Findings. 5. Analysis. 6. Limitations. 7. Conclusion. "
            "8. References (numbered). Use [1], [2] inline citations."
        ),
        expected_output=(
            "Complete markdown report, 1500-3000 words, with all 8 sections "
            "and a numbered references list."
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