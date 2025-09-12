import enum
import uuid
from sqlalchemy import Column, String, Enum
from sqlalchemy.dialects.postgresql import UUID
from database import Base

class FunctionType(str, enum.Enum):
    FUNCTION = "FUNCTION"
    IMAGE = "IMAGE"

class SourceType(str, enum.Enum):
    GITHUB = "GITHUB"
    STORAGE = "STORAGE"

class StatusType(str, enum.Enum):
    PENDING = "PENDING"
    DEPLOYED = "DEPLOYED"

class EventType(str, enum.Enum):
    HTTP = "HTTP"
    QUEUE_EVENT = "QUEUE_EVENT"


class Function(Base):
    """
    This is the SQLAlchemy ORM model for the 'functions' table.
    It maps the Python class to the database table.
    """
    __tablename__ = "functions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(Enum(FunctionType), nullable=False)
    source = Column(Enum(SourceType), nullable=False)
    location_url = Column(String, nullable=False)
    status = Column(Enum(StatusType), nullable=False, default=StatusType.PENDING)
    event_type = Column(Enum(EventType), nullable=False)
    redis_host = Column(String, nullable=True)
    redis_queue_name = Column(String, nullable=True)
    name = Column(String, nullable=True)
