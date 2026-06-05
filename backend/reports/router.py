from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.topic or len(payload.topic.strip()) < 3:
        raise HTTPException(status_code=400, detail="Topic must be at least 3 characters.")

    job_id = str(uuid.uuid4())
    report = models.Report(
        user_id=current_user.id,
        topic=payload.topic.strip(),
        job_id=job_id,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    background_tasks.add_task(run_report_job, report.id, payload.topic.strip())
    return report


async def run_report_job(report_id: int, topic: str):
    from database import SessionLocal
    db = SessionLocal()
    report = None
    try:
        report = db.query(models.Report).filter(models.Report.id == report_id).first()
        report.status = "running"
        db.commit()

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_research, topic)

        report.status = "completed"
        report.content = result
        report.completed_at = datetime.utcnow()
    except Exception as e:
        if report:
            report.status = "failed"
            report.error_message = str(e)
    finally:
        db.commit()
        db.close()


@router.get("/", response_model=list[schemas.ReportSummary])
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(models.Report)
        .filter(models.Report.user_id == current_user.id)
        .order_by(models.Report.created_at.desc())
        .all()
    )


@router.get("/{report_id}", response_model=schemas.ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(models.Report).filter(
        models.Report.id == report_id,
        models.Report.user_id == current_user.id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report


@router.delete("/{report_id}", status_code=204)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = db.query(models.Report).filter(
        models.Report.id == report_id,
        models.Report.user_id == current_user.id,
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    db.delete(report)
    db.commit()