from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict

Provider = Literal["AWS", "Azure", "GCP"]
Status = Literal["running", "stopped", "attached"]


class ResourceBase(BaseModel):
    name: str
    provider: Provider
    resource_type: str
    region: str = ""
    status: Status = "running"
    instance_type: Optional[str] = None
    cpu_utilization: float = 0
    memory_utilization: float = 0
    storage_utilization: float = 0
    network_in_mb: float = 0
    network_out_mb: float = 0
    cost_usd: float = 0
    monthly_cost: Optional[float] = None
    anomaly_type: Optional[str] = None


class ResourceCreate(ResourceBase):
    id: Optional[str] = None
    created_at: Optional[datetime] = None


class ResourceUpdate(BaseModel):
    status: Optional[Status] = None
    instance_type: Optional[str] = None
    region: Optional[str] = None
    cpu_utilization: Optional[float] = None
    memory_utilization: Optional[float] = None
    storage_utilization: Optional[float] = None
    network_in_mb: Optional[float] = None
    network_out_mb: Optional[float] = None
    cost_usd: Optional[float] = None
    monthly_cost: Optional[float] = None
    anomaly_type: Optional[str] = None


class ResourceOut(ResourceBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    monthly_cost: float = 0
    created_at: Optional[datetime] = None