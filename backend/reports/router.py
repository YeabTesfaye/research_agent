from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, AsyncSessionLocal
from dependencies import get_current_user
from reports import models, schemas
from auth.models import User
from crew import run_research
import uuid
import asyncio
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/", response_model=schemas.ReportResponse, status_code=202)
async def create_report(
    payload: schemas.CreateReportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.topic or len(payload.topic.strip()) < 3:
        raise HTTPException(status_code=400, detail="Topic must be at least 3 characters.")

    report = models.Report(
        user_id=current_user.id,
        topic=payload.topic.strip(),
        job_id=str(uuid.uuid4()),
        status="pending",
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    background_tasks.add_task(run_report_job, report.id, payload.topic.strip())
    return report


async def run_report_job(report_id: int, topic: str):
    """
    Runs in the background. Opens its own DB session since the
    request-scoped session is already closed by the time this runs.
    crew.py's run_research() is synchronous (CrewAI/LiteLLM), so we
    offload it to a thread executor to avoid blocking the event loop.
    Per-agent progress is tracked via a callback passed into run_research.
    """
    async with AsyncSessionLocal() as db:
        # ── helper: update report fields ──────────────────────────
        async def set_status(status: str, agent: str | None = None):
            await db.execute(
                models.Report.__table__.update()
                .where(models.Report.id == report_id)
                .values(
                    status=status,
                    **({"current_agent": agent} if agent is not None else {}),
                )
            )
            await db.commit()

        # ── callback passed to crew.py ─────────────────────────────
        # CrewAI runs synchronously in a thread, so we use
        # run_coroutine_threadsafe to reach back into the async loop.
        loop = asyncio.get_event_loop()

        def on_agent_change(agent_name: str):
            """Called synchronously from inside the executor thread."""
            asyncio.run_coroutine_threadsafe(
                set_status("running", agent_name), loop
            )

        try:
            await set_status("running", "researcher")

            # run_research is blocking — offload to thread pool
            content = await loop.run_in_executor(
                None,
                run_research,   # func
                topic,          # arg 1
                on_agent_change # arg 2 — progress callback
            )

            await db.execute(
                models.Report.__table__.update()
                .where(models.Report.id == report_id)
                .values(
                    status="completed",
                    current_agent=None,
                    content=content,
                    completed_at=datetime.utcnow(),
                )
            )
            await db.commit()

        except Exception as e:
            await db.execute(
                models.Report.__table__.update()
                .where(models.Report.id == report_id)
                .values(
                    status="failed",
                    current_agent=None,
                    error_message=str(e),
                )
            )
            await db.commit()


# ── Read endpoints (unchanged) ─────────────────────────────────────

@router.get("/", response_model=list[schemas.ReportSummary])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(models.Report)
        .where(models.Report.user_id == current_user.id)
        .order_by(models.Report.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{report_id}", response_model=schemas.ReportResponse)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(models.Report).where(
            models.Report.id == report_id,
            models.Report.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@router.delete("/{report_id}", status_code=204)
async def delete_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(models.Report).where(
            models.Report.id == report_id,
            models.Report.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    await db.delete(report)
    await db.commit()