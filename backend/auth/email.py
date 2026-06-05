import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from config import settings
from auth.models import User


def generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def send_reset_email(to_email: str, reset_token: str):
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Reset your Research Agent password"
    msg["From"] = settings.FROM_EMAIL
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                 background: #f8f8f6; margin: 0; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff;
                  border-radius: 12px; padding: 40px; border: 1px solid #e5e5e0;">
        <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 500; color: #1a1a18;">
          Password reset
        </h2>
        <p style="color: #6b6b66; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
          Click the button below to reset your password. This link expires in 1 hour.
        </p>
        <a href="{reset_url}"
           style="display: inline-block; background: #1a1a18; color: #ffffff;
                  padding: 12px 28px; border-radius: 8px; text-decoration: none;
                  font-size: 14px; font-weight: 500;">
          Reset password
        </a>
        <p style="color: #9b9b96; margin-top: 32px; font-size: 13px; line-height: 1.6;">
          If you did not request this, you can safely ignore this email.
          Your password will not change.
        </p>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())


def initiate_password_reset(db: Session, email: str) -> bool:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return True  # Don't leak whether email exists

    token = generate_reset_token()
    user.password_reset_token = token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()

    send_reset_email(email, token)
    return True