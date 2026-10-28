from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# Subject schemas
class SubjectBase(BaseModel):
    code: str = Field(..., json_schema_extra={"example": "CS301"})
    name: str = Field(..., json_schema_extra={"example": "Data Structures & Algorithms"})
    semester: Optional[str] = "Semester 1"
    department: Optional[str] = "Computer Science & Engineering"
    color: Optional[str] = "#6366f1"
    description: Optional[str] = ""


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    semester: Optional[str] = None
    department: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class SubjectOut(SubjectBase):
    id: str
    created_at: datetime
    practical_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# Practical schemas
class PracticalBase(BaseModel):
    practical_number: int = Field(..., json_schema_extra={"example": 1})
    title: str = Field(..., json_schema_extra={"example": "Implementation of Singly Linked List"})
    description: Optional[str] = ""
    language: Optional[str] = "cpp"
    code: str = Field(..., json_schema_extra={"example": "#include <iostream>..."})
    tags: Optional[str] = ""
    discarded_output: Optional[str] = ""


class PracticalCreate(PracticalBase):
    subject_id: Optional[str] = None


class PracticalUpdate(BaseModel):
    practical_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    code: Optional[str] = None
    tags: Optional[str] = None
    discarded_output: Optional[str] = None


class PracticalOut(PracticalBase):
    id: str
    subject_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Parsed Item preview schema
class ParsedPracticalPreview(BaseModel):
    practical_number: int
    title: str
    description: Optional[str] = ""
    language: str
    code: str
    discarded_output: Optional[str] = ""
    confidence: int = 90
    include: bool = True


class DocxPreviewResponse(BaseModel):
    filename: str
    total_practicals_found: int
    practicals: List[ParsedPracticalPreview]
    warnings: List[str] = []


class IngestionCommitItem(BaseModel):
    practical_number: int
    title: str
    description: Optional[str] = ""
    language: str
    code: str
    tags: Optional[str] = ""


class IngestionCommitRequest(BaseModel):
    subject_id: str
    practicals: List[IngestionCommitItem]
