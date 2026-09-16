from sqlalchemy import Column, Integer, String

from app.core.database import Base


class CloudResource(Base):
    __tablename__ = "cloud_resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    resource_type = Column(String, nullable=False)
    region = Column(String, nullable=False)
    status = Column(String, nullable=False)