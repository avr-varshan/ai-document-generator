from sqlalchemy import Column, Integer, String, ForeignKey, Text, JSON, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class DocType(str, enum.Enum):
    """
    Document type enumeration for project documents.
    """
    docx = "docx"
    pptx = "pptx"

class InteractionType(str, enum.Enum):
    """
    Interaction type enumeration for tracking user actions on sections.
    """
    refinement = "refinement"  # AI edit
    comment = "comment"        # User note
    feedback = "feedback"      # Like/Dislike

class User(Base):
    """
    User model representing application users.
    """
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    """
    Project model representing a document generation project.
    """
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    doc_type = Column(Enum(DocType))  # 'docx' or 'pptx'
    main_prompt = Column(Text)        # "Analysis of EV Market..."
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="projects")
    sections = relationship("Section", back_populates="project", cascade="all, delete-orphan")

class Section(Base):
    """
    Section model representing individual sections or slides in a project.
    """
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    order_index = Column(Integer)  # 1, 2, 3...
    title = Column(String)         # Outline Header or Slide Title

    project = relationship("Project", back_populates="sections")
    # 1:1 Relationship with Content
    content = relationship("StructuredContent", uselist=False, back_populates="section", cascade="all, delete-orphan")
    history = relationship("SectionHistory", back_populates="section", cascade="all, delete-orphan")

class StructuredContent(Base):
    """
    StructuredContent model storing content in JSON format.
    """
    __tablename__ = "structured_contents"
    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), unique=True)
    
    # Stores: [{"type": "paragraph", "text": "..."}, {"type": "table", ...}]
    body_json = Column(JSON) 

    section = relationship("Section", back_populates="content")

class SectionHistory(Base):
    """
    SectionHistory model tracking all interactions with sections.
    """
    __tablename__ = "section_history"
    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"))
    
    interaction_type = Column(Enum(InteractionType)) 
    user_prompt = Column(Text, nullable=True)      # "Make this shorter" or Comment text
    ai_snapshot_json = Column(JSON, nullable=True) # The content AFTER the edit
    feedback_rating = Column(Integer, nullable=True) # 1 for Like, -1 for Dislike
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    section = relationship("Section", back_populates="history")