from pydantic import BaseModel, EmailStr
from typing import List, Optional, Union
from datetime import datetime

# --- User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    class Config:
        from_attributes = True # Allows Pydantic to read SQLAlchemy models

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Union[str, None] = None

# --- Project Schemas (We will need these soon) ---
class ProjectBase(BaseModel):
    title: str
    doc_type: str # 'docx' or 'pptx'
    main_prompt: str

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# --- Section Schemas ---
class SectionCreate(BaseModel):
    title: str
    order_index: Optional[int] = None

class SectionResponse(BaseModel):
    id: int
    project_id: int
    order_index: int
    title: str
    class Config:
        from_attributes = True

class SectionReorder(BaseModel):
    order_index: int

class SectionUpdate(BaseModel):
    title: Optional[str] = None
    content_text: Optional[str] = None

class SectionRefine(BaseModel):
    """
    Schema for the user's request to refine a section's content.
    """
    refinement_prompt: str
    
    # Optional fields for F.R. 4 feedback/history
    # Although we don't use them in the refinement function, they should be
    # accepted here for persistence in a robust implementation.
    user_comment: Optional[str] = None
    user_like: Optional[bool] = None # True for Like, False for Dislike

# --- NEW: Feedback/Comment Schemas ---
class SectionFeedback(BaseModel):
    """
    Schema for recording user feedback (Like/Dislike) on a section.
    """
    user_like: bool  # True for Like, False for Dislike
    user_comment: Optional[str] = None  # Optional additional comment

class SectionComment(BaseModel):
    """
    Schema for recording user comments on a section.
    """
    comment_text: str

class SectionHistoryResponse(BaseModel):
    """
    Schema for returning interaction history for a section.
    """
    id: int
    interaction_type: str
    user_prompt: Optional[str]
    feedback_rating: Optional[int]  # 1 for Like, -1 for Dislike, None for no feedback
    created_at: datetime
    
    class Config:
        from_attributes = True