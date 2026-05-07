"""Alert service for real-time notifications.

Provides webhook and email alerting capabilities for security events.
"""

import json
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Optional

import httpx
import aiosmtplib

from app.core.config import settings
from app.services.db import log_audit_event


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AlertService:
    """Service for sending real-time alerts via webhooks and email."""
    
    def __init__(self):
        self.webhook_url = settings.alert_webhook_url
        self.email_to = settings.alert_email_to
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_user = settings.smtp_user
        self.smtp_password = settings.smtp_password
    
    async def send_webhook(
        self,
        event_type: str,
        severity: str,
        message: str,
        details: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Send alert via webhook.
        
        Args:
            event_type: Type of event (e.g., "tamper_detected", "failed_login")
            severity: Severity level (low, medium, high, critical)
            message: Alert message
            details: Additional details dict
            
        Returns:
            Result of webhook call
        """
        if not self.webhook_url:
            return {
                "sent": False,
                "method": "webhook",
                "error": "No webhook URL configured",
            }
        
        payload = {
            "timestamp": _now().isoformat(),
            "event_type": event_type,
            "severity": severity,
            "message": message,
            "details": details or {},
            "app_name": settings.app_name,
        }
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()
                
                return {
                    "sent": True,
                    "method": "webhook",
                    "status_code": response.status_code,
                    "response": response.text,
                }
        except Exception as e:
            return {
                "sent": False,
                "method": "webhook",
                "error": str(e),
            }
    
    async def send_email(
        self,
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        to_email: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send alert via email.
        
        Args:
            subject: Email subject
            body_text: Plain text body
            body_html: Optional HTML body
            to_email: Override recipient (uses default if not provided)
            
        Returns:
            Result of email send
        """
        recipient = to_email or self.email_to
        
        if not recipient:
            return {
                "sent": False,
                "method": "email",
                "error": "No recipient email configured",
            }
        
        if not self.smtp_host or not self.smtp_user:
            return {
                "sent": False,
                "method": "email",
                "error": "SMTP not configured (missing host or user)",
            }
        
        try:
            # Build message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"[SecureLog Alert] {subject}"
            msg["From"] = self.smtp_user
            msg["To"] = recipient
            
            # Add plain text part
            msg.attach(MIMEText(body_text, "plain"))
            
            # Add HTML part if provided
            if body_html:
                msg.attach(MIMEText(body_html, "html"))
            
            # Send email
            await aiosmtplib.send(
                msg,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_user,
                password=self.smtp_password,
                start_tls=True,
            )
            
            return {
                "sent": True,
                "method": "email",
                "recipient": recipient,
            }
        except Exception as e:
            return {
                "sent": False,
                "method": "email",
                "error": str(e),
            }
    
    async def send_alert(
        self,
        event_type: str,
        severity: str,
        message: str,
        details: Optional[dict[str, Any]] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> dict[str, Any]:
        """Send alert through all configured channels.
        
        Args:
            event_type: Type of security event
            severity: low, medium, high, critical
            message: Alert message
            details: Additional context
            user_id: User ID associated with event (optional)
            username: Username associated with event (optional)
            ip_address: Client IP address (optional)
            
        Returns:
            Results from all alert channels
        """
        results = []
        
        # Send webhook
        if self.webhook_url:
            webhook_result = await self.send_webhook(
                event_type=event_type,
                severity=severity,
                message=message,
                details=details,
            )
            results.append(webhook_result)
        
        # Send email
        if self.email_to and self.smtp_host:
            # Format email body
            body_lines = [
                f"SecureLog Security Alert",
                f"=======================",
                f"",
                f"Event Type: {event_type}",
                f"Severity: {severity.upper()}",
                f"Time: {_now().isoformat()}",
                f"",
                f"Message:",
                f"{message}",
                f"",
            ]
            
            if details:
                body_lines.append("Details:")
                for key, value in details.items():
                    body_lines.append(f"  {key}: {value}")
                body_lines.append("")
            
            if username:
                body_lines.append(f"User: {username}")
            if ip_address:
                body_lines.append(f"IP Address: {ip_address}")
            
            body_lines.append("")
            body_lines.append("---")
            body_lines.append("This is an automated alert from SecureLog.")
            
            email_result = await self.send_email(
                subject=f"[{severity.upper()}] {event_type}",
                body_text="\n".join(body_lines),
            )
            results.append(email_result)
        
        # Log to audit trail
        log_audit_event(
            user_id=user_id,
            username=username or "system",
            action="ALERT_SENT",
            resource="alert",
            resource_id=event_type,
            ip_address=ip_address,
            details=json.dumps({
                "severity": severity,
                "message": message,
                "channels": [r.get("method") for r in results if r.get("sent")],
            }),
        )
        
        return {
            "alert_id": f"{_now().timestamp()}",
            "timestamp": _now().isoformat(),
            "event_type": event_type,
            "severity": severity,
            "message": message,
            "results": results,
            "channels_used": len([r for r in results if r.get("sent")]),
        }
    
    async def test_email(self, to_email: str, test_message: str = "test") -> dict[str, Any]:
        """Send a test email to verify configuration.
        
        Args:
            to_email: Recipient email address
            test_message: Message to include in test
            
        Returns:
            Test result
        """
        body = f"""SecureLog Email Test
====================

This is a test email from SecureLog.

Test message: {test_message}
Time: {_now().isoformat()}

If you received this email, your SMTP configuration is working correctly.

---
SecureLog Alert System
"""
        
        return await self.send_email(
            subject="Test Email - SecureLog Alerts",
            body_text=body,
            to_email=to_email,
        )


# Global alert service instance
alert_service = AlertService()


# Convenience functions for common alert types

async def alert_tamper_detected(
    log_id: int,
    details: dict[str, Any],
    username: Optional[str] = None,
) -> dict[str, Any]:
    """Alert when tampering is detected in the chain."""
    return await alert_service.send_alert(
        event_type="tamper_detected",
        severity="critical",
        message=f"Chain tampering detected in block #{log_id}",
        details=details,
        username=username,
    )


async def alert_failed_login(
    username: str,
    ip_address: Optional[str] = None,
    failure_count: int = 1,
) -> dict[str, Any]:
    """Alert on suspicious failed login activity."""
    severity = "high" if failure_count >= 5 else "medium"
    return await alert_service.send_alert(
        event_type="failed_login",
        severity=severity,
        message=f"Multiple failed login attempts for user: {username}",
        details={"failure_count": failure_count, "username": username},
        username=username,
        ip_address=ip_address,
    )


async def alert_key_rotation_needed(
    days_until_expiry: int,
    fingerprint: str,
) -> dict[str, Any]:
    """Alert when signing key needs rotation."""
    return await alert_service.send_alert(
        event_type="key_rotation_needed",
        severity="high" if days_until_expiry <= 7 else "medium",
        message=f"Signing key expires in {days_until_expiry} days",
        details={
            "days_until_expiry": days_until_expiry,
            "key_fingerprint": fingerprint,
        },
    )


async def alert_high_failure_rate(
    failure_rate: float,
    window_minutes: int,
) -> dict[str, Any]:
    """Alert when API failure rate is abnormally high."""
    return await alert_service.send_alert(
        event_type="high_failure_rate",
        severity="high",
        message=f"High API failure rate detected: {failure_rate:.1%} in last {window_minutes} minutes",
        details={
            "failure_rate": failure_rate,
            "window_minutes": window_minutes,
        },
    )


async def alert_suspicious_activity(
    activity_type: str,
    description: str,
    user_id: Optional[int] = None,
    username: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> dict[str, Any]:
    """Alert on suspicious activity detected."""
    return await alert_service.send_alert(
        event_type="suspicious_activity",
        severity="high",
        message=f"Suspicious activity: {activity_type}",
        details={
            "activity_type": activity_type,
            "description": description,
        },
        user_id=user_id,
        username=username,
        ip_address=ip_address,
    )
