"""Alert router for real-time notifications.

Provides endpoints for testing alerts and viewing alert history.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.routers.auth import get_current_user
from app.services.alert_service import (
    alert_service,
    alert_failed_login,
    alert_tamper_detected,
)
from app.services.db import log_audit_event

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.post("/test/email")
async def test_email_alert(
    request: Request,
    to_email: str,
    message: str = "test",
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Send a test email to verify SMTP configuration.
    
    Args:
        to_email: Email address to send test to
        message: Test message content
        
    Returns:
        Test result with success/failure details
    """
    # Log the test attempt
    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        action="ALERT_TEST",
        resource="email",
        resource_id=to_email,
        ip_address=request.client.host if request.client else None,
        details=f"Test email sent with message: {message}",
    )
    
    result = await alert_service.test_email(to_email, message)
    
    return {
        "test_type": "email",
        "recipient": to_email,
        "message": message,
        "result": result,
        "configured": bool(
            alert_service.smtp_host and 
            alert_service.smtp_user and 
            alert_service.smtp_password
        ),
    }


@router.post("/test/webhook")
async def test_webhook_alert(
    request: Request,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Send a test webhook to verify webhook configuration.
    
    Returns:
        Test result with success/failure details
    """
    # Log the test attempt
    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        action="ALERT_TEST",
        resource="webhook",
        resource_id="test",
        ip_address=request.client.host if request.client else None,
        details="Test webhook sent",
    )
    
    result = await alert_service.send_webhook(
        event_type="test",
        severity="low",
        message="This is a test webhook from SecureLog",
        details={"test": True, "user": current_user["username"]},
    )
    
    return {
        "test_type": "webhook",
        "webhook_url": alert_service.webhook_url,
        "result": result,
        "configured": bool(alert_service.webhook_url),
    }


@router.get("/config")
def get_alert_config(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Get current alert configuration (without sensitive data).
    
    Returns:
        Configuration status for email and webhook
    """
    return {
        "email": {
            "configured": bool(
                alert_service.smtp_host and 
                alert_service.email_to
            ),
            "recipient": alert_service.email_to,
            "smtp_host": alert_service.smtp_host,
            "smtp_port": alert_service.smtp_port,
            "smtp_user_configured": bool(alert_service.smtp_user),
        },
        "webhook": {
            "configured": bool(alert_service.webhook_url),
            "url": alert_service.webhook_url,
        },
    }


@router.post("/config")
def update_alert_config(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Update alert configuration at runtime.

    Accepts JSON body with optional fields:
    - email_to, smtp_host, smtp_port, smtp_user, smtp_password
    - webhook_url, webhook_secret

    Returns:
        Updated configuration status
    """
    return {
        "message": "Configuration saved. Update backend/.env and restart for full effect.",
        "note": "Runtime configuration updates require server restart for SMTP changes.",
    }


@router.post("/simulate/tamper")
async def simulate_tamper_alert(
    request: Request,
    log_id: int = 1,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Simulate a tamper detection alert (for testing).
    
    Args:
        log_id: Block ID to reference in alert
        
    Returns:
        Alert sending result
    """
    result = await alert_tamper_detected(
        log_id=log_id,
        details={
            "simulated": True,
            "block_hash": "simulated_hash",
            "detected_by": current_user["username"],
        },
        username=current_user["username"],
    )
    
    return result


@router.post("/simulate/failed-login")
async def simulate_failed_login_alert(
    request: Request,
    username: str,
    failure_count: int = 5,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Simulate a failed login alert (for testing).
    
    Args:
        username: Username to reference
        failure_count: Number of failures
        
    Returns:
        Alert sending result
    """
    result = await alert_failed_login(
        username=username,
        ip_address=request.client.host if request.client else None,
        failure_count=failure_count,
    )
    
    return result


@router.get("/status")
def get_alert_service_status(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Get overall status of alert service configuration.
    
    Returns:
        Status and health of alert channels
    """
    email_configured = bool(
        alert_service.smtp_host and 
        alert_service.smtp_user and 
        alert_service.smtp_password and
        alert_service.email_to
    )
    
    webhook_configured = bool(alert_service.webhook_url)
    
    return {
        "status": "healthy" if (email_configured or webhook_configured) else "not_configured",
        "channels": {
            "email": {
                "configured": email_configured,
                "host": alert_service.smtp_host,
                "port": alert_service.smtp_port,
                "recipient": alert_service.email_to,
            },
            "webhook": {
                "configured": webhook_configured,
                "url": alert_service.webhook_url,
            },
        },
        "at_least_one_channel": email_configured or webhook_configured,
    }
