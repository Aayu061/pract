import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    semester = Column(String(50), default="Semester 1")
    department = Column(String(100), default="Computer Science & Engineering")
    color = Column(String(20), default="#4f46e5")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    practicals = relationship("Practical", back_populates="subject", cascade="all, delete-orphan", order_by="Practical.practical_number")


class Practical(Base):
    __tablename__ = "practicals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    subject_id = Column(String(36), ForeignKey("subjects.id"), nullable=False, index=True)
    practical_number = Column(Integer, nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String(50), default="text")
    code = Column(Text, nullable=False)
    tags = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    subject = relationship("Subject", back_populates="practicals")
