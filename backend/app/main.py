from fastapi import FastAPI, Depends, HTTPException, status
from typing import List
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from . import models, schemas, auth, database
from . import ai_service
from . import export_service
from fastapi.middleware.cors import CORSMiddleware

# Initialize Database Tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="AI Doc Platform")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """
    Register a new user with email and password.
    
    Args:
        user: User registration data
        db: Database session
        
    Returns:
        Created user data
    """
    # Check if email already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password and create user
    hashed_pwd = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    """
    Authenticate user and return JWT token.
    
    Args:
        form_data: Login credentials (username/email and password)
        db: Database session
        
    Returns:
        JWT access token
    """
    # Find user by email
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    # Verify user and password
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate JWT token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """
    Get current authenticated user details.
    
    Args:
        current_user: Authenticated user from token
        
    Returns:
        Current user data
    """
    return current_user

@app.get("/")
def read_root():
    """
    Root endpoint to verify API is running.
    
    Returns:
        API status message
    """
    return {"message": "AI Doc Platform API is running"}

@app.get("/projects/", response_model=List[schemas.ProjectResponse])
def list_projects(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    List all projects for the authenticated user.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of user's projects
    """
    projects = db.query(models.Project).filter(
        models.Project.user_id == current_user.id
    ).order_by(models.Project.created_at.desc()).all()
    return projects

@app.post("/projects/", response_model=schemas.ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project: schemas.ProjectCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
    ai_suggest_outline: bool = False
):
    """
    Create a new project and optionally generate AI outline.
    
    Args:
        project: Project creation data
        db: Database session
        current_user: Authenticated user
        ai_suggest_outline: Whether to generate AI outline
        
    Returns:
        Created project data
    """
    # Create the base Project model
    db_project = models.Project(
        **project.model_dump(),
        user_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    # Handle AI Scaffolding (Bonus Feature)
    if ai_suggest_outline:
        try:
            # Call the AI service to get the list of titles/sections
            titles = ai_service.generate_document_scaffolding(
                doc_type=db_project.doc_type.value,
                main_topic=db_project.main_prompt
            )
            
            # Create Section entries based on the AI titles
            sections_to_add = []
            for index, title in enumerate(titles):
                if title and isinstance(title, str) and title.strip():  # Only add non-empty string titles
                    new_section = models.Section(
                        project_id=db_project.id,
                        order_index=index + 1,
                        title=title.strip()
                    )
                    sections_to_add.append(new_section)
            
            if sections_to_add:
                db.add_all(sections_to_add)
                db.commit()
        except Exception as e:
            # Log error but don't fail the project creation
            pass

    return db_project

@app.post("/projects/{project_id}/sections", response_model=List[schemas.SectionResponse], status_code=status.HTTP_201_CREATED)
def create_sections(
    project_id: int,
    sections: List[schemas.SectionCreate],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Create outline sections for an existing project.
    
    Args:
        project_id: ID of the project to add sections to
        sections: List of section data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of created sections
    """
    # Verify project exists and owned
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")

    # Determine current max order_index so we can append if not provided
    existing_max = db.query(models.Section).filter(models.Section.project_id == project_id).order_by(models.Section.order_index.desc()).first()
    next_index = existing_max.order_index + 1 if existing_max and existing_max.order_index else 1

    created_sections = []
    for s in sections:
        idx = s.order_index if s.order_index is not None else next_index
        new_section = models.Section(project_id=project_id, order_index=idx, title=s.title)
        db.add(new_section)
        db.commit()
        db.refresh(new_section)
        created_sections.append(new_section)
        if s.order_index is None:
            next_index += 1

    return created_sections

@app.post("/projects/{project_id}/generate_content", status_code=status.HTTP_200_OK)
def generate_project_content(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Generate content for all sections of a project using AI.
    
    Args:
        project_id: ID of the project to generate content for
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Generation status message
    """
    # Verify Project Ownership and existence
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")

    # Retrieve all Sections for this project
    db_sections = db.query(models.Section).filter(
        models.Section.project_id == project_id
    ).order_by(models.Section.order_index).all()

    if not db_sections:
        return {"message": "Project found, but no outline sections exist. Create an outline first."}

    # Iterate through sections and generate content
    failures = []
    successes = 0
    for section in db_sections:
        # Call the AI Service to get content (string)
        generated_text = ai_service.generate_section_content(
            doc_type=db_project.doc_type.value,
            main_prompt=db_project.main_prompt,
            section_title=section.title
        )

        # If generation failed or returned empty, skip and record failure
        if not generated_text or not str(generated_text).strip():
            failures.append(section.id)
            continue

        # Convert the returned text into the StructuredContent JSON shape expected by the model
        body_json = [{"type": "paragraph", "text": generated_text}]

        # If a StructuredContent already exists for this section, update it; otherwise create one
        if section.content:
            section.content.body_json = body_json
        else:
            new_structured = models.StructuredContent(section_id=section.id, body_json=body_json)
            section.content = new_structured

        db.add(section)
        db.commit()
        successes += 1

    msg = f"Successfully generated content for {successes} sections in project ID {project_id}."
    if failures:
        msg += f" Skipped sections with IDs: {failures} due to generation failures."

    return {"message": msg}

@app.get("/projects/{project_id}", status_code=status.HTTP_200_OK)
def get_project_details(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get project details and all associated sections with content.
    
    Args:
        project_id: ID of the project to retrieve
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Project details with sections and content
    """
    # Verify Project Ownership and existence
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")

    # Retrieve Sections and join them with the project
    # This creates a structured output representing the final document
    db_sections = db.query(models.Section).filter(
        models.Section.project_id == project_id
    ).order_by(models.Section.order_index).all()
    
    # Format the complete response
    sections_list = []
    for s in db_sections:
        content_str = ""
        if s.content and hasattr(s.content, 'body_json') and s.content.body_json:
            # Extract content from body_json
            body = s.content.body_json
            if isinstance(body, list):
                parts = []
                for b in body:
                    if isinstance(b, dict):
                        parts.append(b.get("text") or b.get("content") or "")
                    elif isinstance(b, str):
                        parts.append(b)
                content_str = "\n\n".join([p for p in parts if p])
            else:
                content_str = str(body)
        else:
            content_str = "Content pending or failed to generate."
        
        sections_list.append({
            "id": s.id,
            "order_index": s.order_index,
            "title": s.title,
            "content": content_str
        })

    return {
        "project_id": db_project.id,
        "title": db_project.title,
        "document_type": db_project.doc_type.value,
        "main_prompt": db_project.main_prompt,
        "created_at": db_project.created_at,
        "outline_sections": sections_list # The final document structure
    }

@app.patch("/sections/{section_id}/order", status_code=status.HTTP_200_OK)
def reorder_section(
    section_id: int,
    data: schemas.SectionReorder,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Reorder a section within a project.
    
    Args:
        section_id: ID of the section to reorder
        data: New order index
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    # Verify section and ownership via project join
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id,
        models.Project.user_id == current_user.id
    ).join(models.Project).first()

    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")

    # Get all sections of the project ordered
    sections = db.query(models.Section).filter(
        models.Section.project_id == db_section.project_id
    ).order_by(models.Section.order_index).all()

    # Bound new index to [1, len(sections)]
    new_index = max(1, min(data.order_index, len(sections)))

    # Re-sequence: remove target and insert at new position
    sections = [s for s in sections if s.id != db_section.id]
    sections.insert(new_index - 1, db_section)

    for idx, s in enumerate(sections, start=1):
        s.order_index = idx
        db.add(s)

    db.commit()

    return {"message": "Section order updated."}

@app.patch("/sections/{section_id}", status_code=status.HTTP_200_OK)
def update_section(
    section_id: int,
    data: schemas.SectionUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update section title or content.
    
    Args:
        section_id: ID of the section to update
        data: Update data (title or content)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Success message
    """
    # Verify section and ownership via project join
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id,
        models.Project.user_id == current_user.id
    ).join(models.Project).first()

    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")

    # Update title if provided
    if data.title is not None:
        db_section.title = data.title

    # Update content if provided
    if data.content_text is not None:
        new_body_json = [{"type": "paragraph", "text": data.content_text}]
        if db_section.content:
            db_section.content.body_json = new_body_json
        else:
            new_structured = models.StructuredContent(section_id=db_section.id, body_json=new_body_json)
            db_section.content = new_structured

        # Log manual edit to history
        history_record = models.SectionHistory(
            section_id=section_id,
            interaction_type=models.InteractionType.comment,
            user_prompt="manual edit",
            feedback_rating=None,
            ai_snapshot_json=new_body_json
        )
        db.add(history_record)

    db.add(db_section)
    db.commit()
    db.refresh(db_section)
    return {"message": "Section updated."}

@app.post("/sections/{section_id}/refine", status_code=status.HTTP_200_OK)
def refine_section(
    section_id: int,
    refine_data: schemas.SectionRefine,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Refine the content of a specific section using AI.
    
    Args:
        section_id: ID of the section to refine
        refine_data: Refinement prompt
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Refinement result with preview
    """
    # Retrieve the Section and verify project ownership
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id, # Join condition
        models.Project.user_id == current_user.id
    ).join(models.Project).first()
    
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")

    # Check if content exists to refine
    if not db_section.content:
        raise HTTPException(status_code=400, detail="Content must be generated before refinement.")
    
    # Pass the current content and the user's instruction to the AI service
    # Extract a plain-text representation from the StructuredContent.body_json
    current_text = ""
    try:
        if db_section.content and getattr(db_section.content, "body_json", None):
            # body_json is expected to be a list of blocks like [{"type":"paragraph","text":"..."}, ...]
            blocks = db_section.content.body_json
            paragraphs = []
            for b in blocks:
                if isinstance(b, dict) and b.get("text"):
                    paragraphs.append(b.get("text"))
                elif isinstance(b, str):
                    paragraphs.append(b)
            current_text = "\n\n".join(paragraphs)
    except Exception:
        # Fallback: try to coerce to str
        current_text = str(db_section.content)

    revised_content = ai_service.refine_section_content(
        current_content=current_text,
        refinement_prompt=refine_data.refinement_prompt
    )

    # Store the revised content and user feedback (persistence)
    # Wrap the revised text into the structured JSON shape expected by StructuredContent
    new_body_json = [{"type": "paragraph", "text": revised_content}]

    if db_section.content:
        # update existing StructuredContent
        db_section.content.body_json = new_body_json
    else:
        # create a new StructuredContent instance and link it
        new_structured = models.StructuredContent(section_id=db_section.id, body_json=new_body_json)
        db_section.content = new_structured

    # Note: saving db_section will cascade and persist the StructuredContent
    db.add(db_section)
    db.commit()
    db.refresh(db_section)

    return {
        "message": f"Section {section_id} successfully refined.",
        "new_content_preview": revised_content[:200] + "..."
    }

@app.get("/sections/{section_id}/history", response_model=List[schemas.SectionHistoryResponse], status_code=status.HTTP_200_OK)
def get_section_history(
    section_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get interaction history for a section (refinements, feedback, comments).
    
    Args:
        section_id: ID of the section to get history for
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of history records for the section
    """
    # Verify section exists and belongs to user
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id,
        models.Project.user_id == current_user.id
    ).join(models.Project).first()
    
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")

    # Get all history records for this section
    history_records = db.query(models.SectionHistory).filter(
        models.SectionHistory.section_id == section_id
    ).order_by(models.SectionHistory.created_at.desc()).all()

    return history_records

@app.get("/projects/{project_id}/history", status_code=status.HTTP_200_OK)
def get_project_history(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get interaction history for all sections in a project.
    
    Args:
        project_id: ID of the project to get history for
        db: Database session
        current_user: Authenticated user
        
    Returns:
        History for all sections in the project
    """
    # Verify project exists and belongs to user
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")

    # Get all sections and their history
    sections = db.query(models.Section).filter(
        models.Section.project_id == project_id
    ).all()

    project_history = {}
    for section in sections:
        history_records = db.query(models.SectionHistory).filter(
            models.SectionHistory.section_id == section.id
        ).order_by(models.SectionHistory.created_at.desc()).all()
        
        project_history[section.id] = [
            {
                "id": h.id,
                "interaction_type": h.interaction_type.value,
                "user_prompt": h.user_prompt,
                "feedback_rating": h.feedback_rating,
                "created_at": h.created_at
            }
            for h in history_records
        ]

    return {
        "project_id": project_id,
        "section_history": project_history
    }

@app.get("/projects/{project_id}/export", status_code=status.HTTP_200_OK)
def export_project(
    project_id: int,
    export_format: str = "docx",  # Query parameter: docx or pptx
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Export the project to a file format (docx, pptx).
    
    Args:
        project_id: ID of the project to export
        export_format: File format (docx or pptx)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        File download response
    """
    try:
        # Use the export service to generate the file
        file_bytes = export_service.export_project_to_file(
            db=db,
            project_id=project_id,
            user_id=current_user.id
        )
        
        # Return the file for download
        from fastapi.responses import StreamingResponse
        import io
        
        file_like = io.BytesIO(file_bytes)
        
        # Set appropriate content type
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if export_format == "docx" else "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        
        filename = f"project_{project_id}.{export_format}"
        
        return StreamingResponse(
            file_like,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.post("/sections/{section_id}/feedback", status_code=status.HTTP_200_OK)
def record_section_feedback(
    section_id: int,
    feedback_data: schemas.SectionFeedback,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Record user feedback (like/dislike) for a section.
    
    Args:
        section_id: ID of the section to provide feedback for
        feedback_data: Feedback data (like/dislike + optional comment)
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Feedback recording result
    """
    # Verify section exists and belongs to user's project
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id,
        models.Project.user_id == current_user.id
    ).join(models.Project).first()
    
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")
    
    # Determine feedback rating: 1 for Like, -1 for Dislike
    feedback_rating = 1 if feedback_data.user_like else -1
    
    # Create history record
    history_record = models.SectionHistory(
        section_id=section_id,
        interaction_type=models.InteractionType.feedback,
        user_prompt=feedback_data.user_comment or f"User {'liked' if feedback_data.user_like else 'disliked'} this section",
        feedback_rating=feedback_rating,
        ai_snapshot_json=getattr(db_section.content, 'body_json', None) if db_section.content else None
    )
    
    db.add(history_record)
    db.commit()
    
    return {
        "message": f"Feedback recorded: {'Like' if feedback_data.user_like else 'Dislike'}",
        "section_id": section_id
    }

@app.post("/sections/{section_id}/comment", status_code=status.HTTP_200_OK)
def add_section_comment(
    section_id: int,
    comment_data: schemas.SectionComment,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Add a comment to a section.
    
    Args:
        section_id: ID of the section to comment on
        comment_data: Comment text
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Comment addition result
    """
    # Verify section exists and belongs to user's project
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id,
        models.Project.user_id == current_user.id
    ).join(models.Project).first()
    
    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")
    
    # Create history record for the comment
    history_record = models.SectionHistory(
        section_id=section_id,
        interaction_type=models.InteractionType.comment,
        user_prompt=comment_data.comment_text,
        feedback_rating=None,  # No rating for comments
        ai_snapshot_json=getattr(db_section.content, 'body_json', None) if db_section.content else None
    )
    
    db.add(history_record)
    db.commit()
    
    return {
        "message": "Comment added successfully",
        "section_id": section_id
    }

@app.delete("/projects/{project_id}", status_code=status.HTTP_200_OK)
def delete_project(
    project_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete a project and all its associated sections, content, and history.
    
    Args:
        project_id: ID of the project to delete
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Deletion confirmation message
    """
    # Verify project exists and belongs to user
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()
    
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found or unauthorized")
    
    # Get project title for response before deletion
    project_title = db_project.title
    
    # Delete the project - CASCADE will handle all related records
    # (sections → structured_contents → section_history)
    db.delete(db_project)
    db.commit()
    
    return {
        "message": f"Project '{project_title}' (ID: {project_id}) and all associated data deleted successfully",
        "deleted_project_id": project_id
    }

@app.delete("/sections/{section_id}", status_code=status.HTTP_200_OK)
def delete_section(
    section_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete a single section and all associated content + history.

    Args:
        section_id: ID of the section to delete
        db: Database session
        current_user: Authenticated user

    Returns:
        Deletion confirmation message
    """
    # Verify section exists and belongs to current authenticated user
    db_section = db.query(models.Section).filter(
        models.Section.id == section_id,
        models.Section.project_id == models.Project.id,
        models.Project.user_id == current_user.id
    ).join(models.Project).first()

    if not db_section:
        raise HTTPException(status_code=404, detail="Section not found or unauthorized")

    section_title = db_section.title

    # Delete the section (CASCADE will delete structured_content + history)
    db.delete(db_section)
    db.commit()

    return {
        "message": f"Section '{section_title}' (ID: {section_id}) deleted successfully",
        "deleted_section_id": section_id
    }
