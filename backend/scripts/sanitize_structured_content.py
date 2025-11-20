#!/usr/bin/env python3
"""
Sanitize existing StructuredContent.body_json entries in the local SQLite DB.
Run from the repo root (where manage.py / app package lives):

python3 scripts/sanitize_structured_content.py

This script will:
- iterate StructuredContent rows
- sanitize any text blocks using ai_service._sanitize_text
- replace blocks with {'type': 'paragraph', 'text': cleaned_text}
- commit changes

Make a DB backup before running if you care about existing data.
"""
from app import ai_service, models
from app.database import SessionLocal


def main():
    session = SessionLocal()
    try:
        rows = session.query(models.StructuredContent).all()
        print(f"Found {len(rows)} StructuredContent rows")
        updated = 0
        for sc in rows:
            body = sc.body_json
            changed = False
            new_blocks = []
            if isinstance(body, list):
                for b in body:
                    if isinstance(b, dict):
                        txt = b.get("text") or b.get("content") or ""
                        cleaned = ai_service._sanitize_text(txt)
                        new_blocks.append({"type": "paragraph", "text": cleaned})
                        if cleaned.strip() != (txt or "").strip():
                            changed = True
                    elif isinstance(b, str):
                        cleaned = ai_service._sanitize_text(b)
                        new_blocks.append({"type": "paragraph", "text": cleaned})
                        if cleaned.strip() != b.strip():
                            changed = True
                    else:
                        # unknown block type: coerce to string
                        cleaned = ai_service._sanitize_text(str(b))
                        new_blocks.append({"type": "paragraph", "text": cleaned})
                        changed = True
            elif body is None:
                continue
            else:
                # body may be a string stored incorrectly
                cleaned = ai_service._sanitize_text(str(body))
                new_blocks = [{"type": "paragraph", "text": cleaned}]
                changed = True

            if changed:
                sc.body_json = new_blocks
                session.add(sc)
                updated += 1

        if updated:
            session.commit()
        print(f"Sanitization complete. Updated rows: {updated}")
    finally:
        session.close()


if __name__ == '__main__':
    main()
