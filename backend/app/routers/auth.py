"""Authentication router with JWT-based authentication.

Provides endpoints for user registration, login, and current user info.
All endpoints use bcrypt for password hashing and JWT for token generation.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.schemas.auth import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.db import create_user, get_user_by_id, get_user_by_username, init_db
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a plain password."""
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    """Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        User dictionary with id, username, first_name
        
    Raises:
        HTTPException: If authentication fails
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = decode_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(int(user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[dict[str, Any]]:
    """Get current user if authenticated, otherwise return None.
    
    Used for endpoints that allow both authenticated and anonymous access.
    """
    if not credentials:
        return None
    
    payload = decode_token(credentials.credentials)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    return get_user_by_id(int(user_id))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_user(request: Request, payload: UserRegisterRequest) -> TokenResponse:
    """Register a new user.
    
    Args:
        request: FastAPI request object for IP extraction
        payload: Registration data with username, password, first_name, confirm_password
        
    Returns:
        TokenResponse with access token and user info
        
    Raises:
        HTTPException: If validation fails or username exists
    """
    # Validate passwords match
    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    
    # Check minimum password length
    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters",
        )
    
    # Hash the password
    password_hash = get_password_hash(payload.password)
    
    # Create user in database
    try:
        user = create_user(
            username=payload.username,
            password_hash=password_hash,
            first_name=payload.first_name,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username already exists: {exc}",
        ) from exc
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["id"])})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            first_name=user["first_name"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login_user(request: Request, payload: UserLoginRequest) -> TokenResponse:
    """Authenticate a user and return a JWT token.
    
    Args:
        request: FastAPI request object for IP extraction
        payload: Login credentials with username and password
        
    Returns:
        TokenResponse with access token and user info
        
    Raises:
        HTTPException: If authentication fails
    """
    # Get user from database
    user = get_user_by_username(payload.username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": str(user["id"])})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            username=user["username"],
            first_name=user["first_name"],
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict[str, Any] = Depends(get_current_user)) -> UserResponse:
    """Get the currently authenticated user's information.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        UserResponse with user details
    """
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        first_name=current_user["first_name"],
    )
