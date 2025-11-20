# app/ai_service.py

import os
import re
import json
import time
import random
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Anthropic client for AI content generation
api_key = os.getenv("ANTHROPIC_API_KEY")
if not api_key:
    print("CRITICAL: ANTHROPIC_API_KEY not found in .env file!")
    client = None
else:
    client = Anthropic(api_key=api_key)
    print("Anthropic client initialized successfully")

def _sanitize_text(text: str) -> str:
    """
    Clean up AI-generated text by removing artifacts, markdown, and empty lines.
    
    Args:
        text: Raw text from AI model
        
    Returns:
        Cleaned text ready for document content
    """
    if not text:
        return ""
    
    # Remove common AI artifacts and irrelevant phrases
    text = re.sub(r"(Content generation|This section|Here is|Based on the|You are).*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"---+", "", text)
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
    
    # Remove markdown headers
    text = re.sub(r"(?m)^#+\s*", "", text)
    
    # Normalize bullet points
    text = re.sub(r"(?m)^\s*[\-\*\•]\s+", "• ", text)
    text = re.sub(r"(?m)^\s*\d+\.\s+", "", text)
    
    # Clean up excessive whitespace
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
    text = text.strip()
    
    return text

def generate_document_scaffolding(doc_type: str, main_topic: str) -> list[str]:
    """
    Generate document outline using AI based on document type and main topic.
    
    Args:
        doc_type: Document type ('docx' or 'pptx')
        main_topic: Main topic for the document
        
    Returns:
        List of section headers or slide titles
    """
    if not client:
        print("AI client not initialized. Returning mock data.")
        if doc_type == 'docx':
            # Default section headers for Word documents
            return ["Executive Summary", "Introduction and Scope", "Methodology", "Key Findings", "Recommendations", "Conclusion"]
        else:
            # Default slide titles for PowerPoint presentations
            return ["Title Slide", "Problem Statement", "Market Opportunity", "Solution Overview", "Implementation Plan", "Financial Impact", "Call to Action"]

    # Define AI prompt based on document type
    if doc_type == 'docx':
        prompt = f"""Generate exactly 6 professional section headers for a comprehensive business document about: "{main_topic}"

Requirements:
- Each header must be 2–4 words
- Must be specific, actionable, and relevant to the topic
- Avoid generic terms like "Introduction," "Overview," or "Conclusion"
- Use professional business language
- Return ONLY a JSON array of strings, like: ["Header 1", "Header 2", "Header 3", "Header 4", "Header 5", "Header 6"]
- Do not include any other text, explanations, or formatting"""
    else:
        prompt = f"""Generate exactly 8 professional slide titles for a compelling business presentation about: "{main_topic}"

Requirements:
- Each title must be 2–5 words
- Must be clear, engaging, and specific to the topic
- Avoid vague phrases like "Summary" or "Next Steps"
- Use action-oriented language where possible
- Return ONLY a JSON array of strings, like: ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5", "Title 6", "Title 7", "Title 8"]
- Do not include any other text, explanations, or formatting"""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        raw_text = response.content[0].text.strip()

        # Parse JSON response from AI model
        result = json.loads(raw_text)
        
        if isinstance(result, list) and all(isinstance(item, str) for item in result):
            cleaned = [title.strip() for title in result if title.strip()]
            return cleaned[:6] if doc_type == 'docx' else cleaned[:8]
        else:
            print("AI returned non-list JSON")
            return []

    except json.JSONDecodeError as e:
        print(f"JSON parsing failed: {e}. Raw output: {raw_text}")
        return []
    except Exception as e:
        print(f"AI scaffolding error: {e}")
        return []

def generate_section_content(doc_type: str, main_prompt: str, section_title: str, outline: list = None) -> str:
    """
    Generate content for a specific section using AI based on document type and context.
    
    Args:
        doc_type: Document type ('docx' or 'pptx')
        main_prompt: Main document topic
        section_title: Title of the current section/slide
        outline: List of all section titles for context awareness
        
    Returns:
        Generated content for the section
    """
    if not client:
        print("AI client not initialized. Returning placeholder.")
        return f"Content for '{section_title}' on '{main_prompt[:30]}...' would appear here in production."

    # Build context string with document outline if available
    context_str = ""
    if outline:
        outline_text = "\n".join(f"- {title}" for title in outline)
        context_str = f"\n\nDocument Structure:\n{outline_text}"

    # Define AI prompt based on document type
    if doc_type == 'docx':
        prompt = f"""You are a senior business consultant writing a comprehensive report titled: "{main_prompt}"

{context_str}

Your task is to write the section titled: "{section_title}"

Requirements:
- Write 3 detailed, professional paragraphs (3-5 sentences each)
- Start with a clear topic sentence that relates to the section title
- Include specific insights, examples, or data points where relevant
- Maintain formal, business-appropriate tone throughout
- Ensure content aligns with the overall document structure and purpose
- End with a concluding sentence that ties back to the main topic
- Do NOT include the section title in your response
- Do NOT use markdown, bullet points, or headers
- Return ONLY the paragraphs, nothing else"""
    else:
        prompt = f"""You are creating a professional business presentation titled: "{main_prompt}"

{context_str}

Your task is to create content for the slide titled: "{section_title}"

Requirements:
- Write exactly 4 concise, impactful bullet points
- Each bullet point must be 1-2 sentences maximum
- Focus on key insights, not explanations or filler
- Start each point with a relevant keyword (e.g., "Efficiency:", "Growth:", "Strategy:")
- Use clear, professional language suitable for executive audiences
- Ensure content complements other slides in the presentation
- Do NOT include the slide title
- Do NOT use markdown, numbering, or extra formatting
- Return ONLY the 4 bullet points, one per line, nothing else"""

    try:
        # Small delay to respect rate limits
        time.sleep(random.uniform(0.2, 0.5))

        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}]
        )

        raw_text = response.content[0].text.strip()

        # Clean and validate generated content
        result = _sanitize_text(raw_text)
        
        # Validate content length
        if len(result) < 30:
            print(f"Generated content too short for section '{section_title}'")
            return ""

        return result

    except Exception as e:
        print(f"AI content generation error for section '{section_title}': {e}")
        return ""

def refine_section_content(current_content: str, refinement_prompt: str) -> str:
    """
    Refine existing content based on user instruction using AI.
    
    Args:
        current_content: Current content to be refined
        refinement_prompt: User's instruction for refinement
        
    Returns:
        Refined content based on user's instruction
    """
    if not client:
        return current_content

    prompt = f"""You are an expert business content editor. Revise the following text based ONLY on the user's specific instruction.

USER INSTRUCTION: "{refinement_prompt}"

ORIGINAL CONTENT:
{current_content}

Requirements:
- Maintain the section's core topic and professional tone
- Only make changes that directly address the user's instruction
- Preserve the document type format (paragraphs for docx, bullet points for pptx)
- Do NOT add explanations, headers, or markdown
- Return ONLY the revised content, nothing else"""

    try:
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=1200,
            messages=[{"role": "user", "content": prompt}]
        )
        raw_text = response.content[0].text.strip()
        return _sanitize_text(raw_text)
    except Exception as e:
        print(f"AI refinement error: {e}")
        return current_content  # Return original on failure