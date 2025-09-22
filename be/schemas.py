from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from models import FunctionType, SourceType, StatusType, EventType

class FunctionBase(BaseModel):
    type: FunctionType
    source: SourceType
    location_url: Optional[str] = None
    event_type: EventType
    redis_host: Optional[str] = None
    redis_queue_name: Optional[str] = None
    name: str

class FunctionCreate(FunctionBase):
    id: Optional[UUID] = None
    github_url: Optional[str] = None

class Function(FunctionBase):
    id: UUID
    location_url: str
    status: StatusType

    model_config = ConfigDict(from_attributes=True)

class LogsResponse():
    id: str
    status: str
    replicas: int
    availableReplicas: int