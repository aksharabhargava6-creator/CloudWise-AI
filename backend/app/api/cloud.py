from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter(
    prefix="/api/cloud",
    tags=["Cloud"]
)


class CloudResource(BaseModel):
    name: str
    provider: str
    resource_type: str
    region: str
    status: str


resources = [
    CloudResource(
        name="web-server-01",
        provider="AWS",
        resource_type="EC2",
        region="ap-south-1",
        status="running"
    ),
    CloudResource(
        name="database-01",
        provider="Azure",
        resource_type="Database",
        region="centralindia",
        status="running"
    )
]


@router.get("/resources", response_model=List[CloudResource])
def get_resources():
    return resources


@router.get("/resources/{resource_name}")
def get_resource(resource_name: str):
    for resource in resources:
        if resource.name == resource_name:
            return resource

    return {"error": "Resource not found"}