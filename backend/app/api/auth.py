from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.get("/test")
def auth_test():
    return {"message": "Authentication API is working"}