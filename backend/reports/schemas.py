from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CreateReportRequest(BaseModel):
    topic: str


class ReportSummary(BaseModel):
    id: int
    topic: str
    status: str
    job_id: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class ReportResponse(BaseModel):
    id: int
    topic: str
    content: Optional[str]
    status: str
    error_message: Optional[str]
    job_id: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True