import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(20), index=True)
    resource_type: Mapped[str] = mapped_column(String(100))
    region: Mapped[str] = mapped_column(String(50), default="")
    status: Mapped[str] = mapped_column(String(20), default="running")
    instance_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cpu_utilization: Mapped[float] = mapped_column(Float, default=0)
    memory_utilization: Mapped[float] = mapped_column(Float, default=0)
    storage_utilization: Mapped[float] = mapped_column(Float, default=0)
    network_in_mb: Mapped[float] = mapped_column(Float, default=0)
    network_out_mb: Mapped[float] = mapped_column(Float, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0)
    monthly_cost: Mapped[float] = mapped_column(Float, default=0)
    anomaly_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())