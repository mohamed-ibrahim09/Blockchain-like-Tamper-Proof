"""Authentication-related Pydantic schemas."""

from pydantic import BaseModel, Field


class UserRegisterRequest(BaseModel):
    """Request schema for user registration."""
    username: str = Field(min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_]+$")
    first_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    """Request schema for user login."""
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    """Response schema for user information."""
    id: int
    username: str
    first_name: str


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""
    access_token: str
    token_type: str
    user: UserResponse
