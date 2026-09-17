from fastapi import FastAPI
from app.models.user import User
from app.core.database import Base, engine
from app.models.cloud import CloudResource
from app.api.cloud import router as cloud_router
from app.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="CloudWise AI API",
    description="Backend API for CloudWise AI",
    version="1.0.0"
)

app.include_router(cloud_router)
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "CloudWise AI API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}