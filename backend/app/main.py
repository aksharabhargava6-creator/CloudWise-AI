from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import cloud
from .seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()                  # creates the table
    if settings.seed_data:
        seed()                 # inserts the 24 sample resources once
    yield


app = FastAPI(title="CloudWise DB API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(cloud.router)


@app.get("/health")
def health():
    return {"status": "healthy"}