from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CloudResource
from ..schemas import ResourceCreate, ResourceUpdate, ResourceOut

router = APIRouter(prefix="/api/cloud/resources", tags=["Cloud Resources"])


def _find(db: Session, key: str) -> CloudResource:
    res = db.scalar(select(CloudResource).where(or_(CloudResource.id == key, CloudResource.name == key)))
    if not res:
        raise HTTPException(404, f"Resource '{key}' not found")
    return res


@router.get("", response_model=list[ResourceOut])
def list_resources(db: Session = Depends(get_db)):
    return db.scalars(select(CloudResource).order_by(CloudResource.created_at.desc())).all()


@router.get("/{key}", response_model=ResourceOut)
def get_resource(key: str, db: Session = Depends(get_db)):
    return _find(db, key)


@router.post("", response_model=ResourceOut, status_code=201)
def create_resource(body: ResourceCreate, db: Session = Depends(get_db)):
    clash = db.scalar(select(CloudResource).where(
        or_(CloudResource.name == body.name, CloudResource.id == (body.id or ""))))
    if clash:
        raise HTTPException(409, "A resource with this name or id already exists")
    res = CloudResource(**body.model_dump(exclude_none=True))
    if res.created_at is not None and res.created_at.tzinfo is not None:
        res.created_at = res.created_at.replace(tzinfo=None)  # SQL Server DateTime is timezone-naive
    if not res.monthly_cost:
        res.monthly_cost = round(res.cost_usd * 720, 2)
    db.add(res)
    db.commit()
    db.refresh(res)
    return res


@router.patch("/{key}", response_model=ResourceOut)
def update_resource(key: str, body: ResourceUpdate, db: Session = Depends(get_db)):
    res = _find(db, key)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(res, k, v)
    if "cost_usd" in data and "monthly_cost" not in data:
        res.monthly_cost = round(res.cost_usd * 720, 2)
    db.commit()
    db.refresh(res)
    return res


@router.delete("/{key}", status_code=204)
def delete_resource(key: str, db: Session = Depends(get_db)):
    db.delete(_find(db, key))
    db.commit()