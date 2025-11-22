# AI-Assisted Document Authoring and Generation Platform


## 🌊 **Executive Summary**

This project implements a **full-stack, AI-powered document generation platform** that fulfills all requirements specified in the OceanAI assignment. Built with **FastAPI** and **React**, the platform enables authenticated users to create professional business documents through an intuitive workflow: **Login → Configure → Generate → Refine → Export**.

Designed with **OceanAI's maritime innovation mission** in mind, this platform demonstrates the exact **Generative AI Developer skills** required for the role: **LLM integration, RAG-ready architecture, database expertise, and production-quality code**.

---

## 🎥 **Demo Video**

A complete 10-minute demonstration of the AI Document Platform is available here:  
**[Watch Demo Video](https://youtu.be/your-demo-video)**



## 🔗 **Live Deployment Links**

**Frontend**: https://ai-document-generator-frontend.vercel.app  
**Backend**: https://ai-document-generator-1.onrender.com  
**Database**: PostgreSQL on Supabase (connected and operational)

---

## 🎯 **Assignment Compliance Matrix**

| Requirement Category | Requirement | Status | Implementation Details |
|---------------------|-------------|--------|----------------------|
| **Functional Requirements** | JWT Authentication | ✅ | Secure user registration/login with Bcrypt hashing |
| | Project Dashboard | ✅ | Responsive dashboard with project management |
| | Document Configuration | ✅ | Word (.docx) and PowerPoint (.pptx) scaffolding |
| | AI Content Generation | ✅ | Anthropic Claude 3 Haiku for context-aware generation |
| | Interactive Refinement | ✅ | AI prompts, like/dislike, comments |
| | Document Export | ✅ | Professional .docx/.pptx export with python-docx/python-pptx |
| **Bonus Features** | AI-Generated Templates | ✅ | One-click outline/slide title generation |
| **Technical Requirements** | FastAPI Backend | ✅ | RESTful API with comprehensive endpoint coverage |
| | React Frontend | ✅ | Responsive Vite/React interface with Tailwind CSS |
| | PostgreSQL Database | ✅ | Supabase integration with proper relationships |

---

## 🚀 **Key Features**

### 🔐 **Secure Authentication**
- JWT-based authentication with secure password hashing
- Protected routes requiring valid tokens
- Automatic token refresh handling

### 📄 **Document Configuration**
- **Word Documents (.docx)**: Create professional outlines with section headers
- **PowerPoint Presentations (.pptx)**: Define slide titles and structure
- **AI-Suggested Outlines** (Bonus): One-click AI-generated templates

### 🤖 **AI-Powered Content Generation**
- **Anthropic Claude 3 Haiku** integration for professional content
- **Context-aware generation**: Each section considers the full document structure
- **Document-type specific prompts**: Optimized prompts for Word vs PowerPoint content
- **Content sanitization**: Automatic removal of AI artifacts and markdown

### ✨ **Interactive Refinement Interface**
- **AI Refinement Prompts**: Custom instructions for section-specific refinement
- **Feedback System**: Like/Dislike buttons for user satisfaction tracking
- **Comment System**: User notes stored with full history
- **History Tracking**: Complete audit trail of all interactions

### 📥 **Professional Document Export**
- **Word (.docx)**: Professionally formatted with proper styling, headers, and layout
- **PowerPoint (.pptx)**: Clean slide designs with consistent branding
- **Quality Assurance**: Exported documents accurately reflect the latest refined content

---

## 🏗️ **Technical Architecture**

### **Backend: FastAPI (Python 3.12)**
- **Authentication**: JWT with OAuth2 password flow
- **Database**: PostgreSQL (Supabase) with SQLAlchemy ORM
- **AI Integration**: Anthropic Claude 3 Haiku API with robust error handling
- **Document Generation**: python-docx and python-pptx libraries
- **Security**: CORS, input validation, and proper error handling
- **API Structure**: RESTful endpoints with comprehensive documentation

### **Frontend: React with Vite**
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom theming
- **State Management**: React Query for server state
- **Routing**: React Router DOM
- **UI Components**: Heroicons, Framer Motion for animations
- **Notifications**: react-hot-toast for user feedback

### **Database: PostgreSQL (Supabase)**


### **AI Integration Architecture**
- **Prompt Engineering**: Document-type specific prompts with clear constraints
- **Content Generation**: Section-by-section generation with context awareness
- **Refinement**: Iterative refinement with user instruction preservation
- **Error Handling**: Graceful fallbacks for AI service failures
- **Rate Limiting**: Respects Anthropic API rate limits

---
### **Database: PostgreSQL (Supabase)**

![Database Schema](database-schema.svg)

*The database schema shows the complete relationship structure with users, projects, sections, content, and interaction history.*
---
## 📦 **Project Structure**

```
OceanAI/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── ai_service.py       # Anthropic Claude 3 Haiku integration
│   │   ├── auth.py             # JWT authentication utilities
│   │   ├── database.py         # Database configuration and session management
│   │   ├── export_service.py   # Document export functionality (.docx/.pptx)
│   │   ├── main.py             # FastAPI application and routes
│   │   ├── models.py           # SQLAlchemy database models
│   │   └── schemas.py          # Pydantic validation schemas
│   ├── requirements.txt        # Python dependencies (includes pydantic[email])
│   └── Dockerfile              # Containerization for deployment
├── frontend/                   # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── lib/                # API clients and utility functions
│   │   ├── pages/              # Application pages (Dashboard, Project, etc.)
│   │   └── App.tsx             # Main application component
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## ⚙️ **Setup Instructions**

### **Prerequisites**
- Python 3.12+
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Anthropic API key

### **Backend Setup**

1. **Clone the repository:**
```bash
git clone https://github.com/avr-varshan/ai-document-generator.git
cd ai-document-generator/backend
```

2. **Create virtual environment and install dependencies:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

3. **Configure environment variables:**
Create a `.env` file in the `backend` directory:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SECRET_KEY=your_32_character_random_secret_key_here
# For production with Supabase:
DATABASE_URL=postgresql://username:password@host:port/database_name
# For local development (SQLite), omit DATABASE_URL
```

4. **Run the backend server:**
```bash
uvicorn app.main:app --reload --port 8000
```

### **Frontend Setup**

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env` file:
```env
VITE_API_BASE_URL=http://localhost:8000
```

4. **Run the frontend development server:**
```bash
npm run dev
```

5. **Access the application** at `http://localhost:5173`

---

## 🌐 **Deployment**

### **Backend Deployment (Render)**

1. **Push code to GitHub:**
```bash
git add .
git commit -m "Complete OceanAI Document Platform"
git push origin main
```

2. **Create Render Web Service:**
   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect to your GitHub repository
   - Set **Root Directory** to `backend`
   - Set **Build Command**: `pip install -r requirements.txt`
   - Set **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Configure Environment Variables in Render:**
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `SECRET_KEY`: Your secret key (32+ characters)
   - `DATABASE_URL`: Your Supabase connection string

### **Frontend Deployment (Vercel)**

1. **Import repository on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set **Root Directory** to `frontend`

2. **Configure Environment Variables:**
   - `VITE_API_BASE_URL`: Your deployed backend URL

---

## 🔌 **API Documentation**

### **Authentication Endpoints**
- `POST /register` - Register new user
- `POST /login` - Authenticate and get JWT token
- `GET /users/me` - Get current user details

### **Project Management**
- `GET /projects/` - List all user projects
- `POST /projects/` - Create new project (with optional `ai_suggest_outline=true`)
- `GET /projects/{id}` - Get project details with sections and content
- `DELETE /projects/{id}` - Delete project and all associated data

### **Section Management**
- `POST /projects/{project_id}/sections` - Add sections to project
- `PATCH /sections/{section_id}` - Update section title or content
- `PATCH /sections/{section_id}/order` - Reorder sections
- `DELETE /sections/{section_id}` - Delete section

### **AI Integration**
- `POST /projects/{project_id}/generate_content` - Generate content for all sections
- `POST /sections/{section_id}/refine` - Refine specific section with custom prompt

### **User Interaction**
- `POST /sections/{section_id}/feedback` - Record like/dislike feedback
- `POST /sections/{section_id}/comment` - Add comments to sections
- `GET /sections/{section_id}/history` - Get section interaction history

### **Document Export**
- `GET /projects/{project_id}/export` - Export as .docx or .pptx

---


## 🛠️ **Implementation Details**

### **AI Prompt Engineering**
The platform uses **document-type specific prompts** optimized for professional business content:

**Word Document Prompts:**
- Generate 3 detailed, professional paragraphs per section
- Include specific insights, examples, and data points
- Maintain formal, business-appropriate tone
- End with concluding sentences that tie back to main topic

**PowerPoint Prompts:**
- Generate exactly 4 concise, impactful bullet points per slide
- Start each point with relevant keywords (e.g., "Efficiency:", "Growth:")
- Focus on key insights, not explanations or filler
- Use clear, professional language suitable for executive audiences

### **Content Sanitization**
AI-generated content undergoes **comprehensive sanitization**:
- Remove AI artifacts and irrelevant phrases
- Clean markdown headers and formatting
- Normalize bullet points and numbering
- Remove excessive whitespace and empty lines
- Validate content length and quality

### **Document Formatting**
Exported documents feature **professional formatting**:

**Word Documents (.docx):**
- Professional header styling with company branding
- Justified text with proper line spacing
- Section headers with subtle borders
- Professional footer with page numbers

**PowerPoint Presentations (.pptx):**
- Clean title slides with consistent branding
- Professional slide layouts with proper spacing
- Consistent font sizing and color scheme
- Professional footer with company branding

### **Error Handling & Resilience**
- **AI Service Failures**: Graceful fallbacks with user-friendly error messages
- **Database Errors**: Comprehensive error handling with proper HTTP status codes
- **Authentication Errors**: Secure token validation with automatic logout on 401
- **Network Issues**: Robust retry logic for external API calls

---

## 🔒 **Security Considerations**

### **Authentication & Authorization**
- **JWT Token Security**: Strong secret keys with proper expiration
- **Password Security**: Bcrypt hashing with proper salting
- **Route Protection**: All sensitive endpoints require valid JWT tokens
- **Input Validation**: Comprehensive validation with Pydantic

### **Data Protection**
- **Environment Variables**: Sensitive data stored in environment variables, never in code
- **Database Security**: Proper PostgreSQL configuration with SSL
- **CORS**: Properly configured CORS with specific allowed origins
- **Rate Limiting**: Built-in protection against abuse

### **API Security**
- **Input Sanitization**: All user inputs properly validated and sanitized
- **Error Handling**: No sensitive information leaked in error responses
- **HTTP Security**: Proper headers and security best practices


---

## 🎯 **Why This Implementation Stands Out**

### **OceanAI Mission Alignment**
This platform directly supports **OceanAI's mission** of "harnessing the power of AI for maritime innovation" by:
- Providing a foundation for **maritime document generation** (reports, analyses, compliance documents)
- Demonstrating **cutting-edge AI integration** capabilities
- Showing **customized solution development** expertise
- Proving ability to deliver **production-ready AI solutions**

### **Generative AI Developer Skills Demonstrated**
The implementation showcases **all required skills** from the job description:
- ✅ **Expert Python proficiency** with modern best practices
- ✅ **Generative AI project experience** with LLM integration
- ✅ **LLM Frameworks knowledge** (though Anthropic used directly for simplicity)
- ✅ **RAG-ready architecture** with proper data structure for future integration
- ✅ **Database expertise** with both SQL (PostgreSQL) design
- ✅ **API Development** with FastAPI and comprehensive RESTful design
- ✅ **Frontend skills** with React and responsive design

### **Production-Ready Quality**
- **Enterprise-grade code quality** with proper error handling
- **Comprehensive documentation** suitable for team collaboration
- **Scalable architecture** ready for production deployment
- **Security-first approach** with proper authentication and data protection

---

## 📞 **Contact Information**

**Assignment Submission for:**  
Generative AI Developer Position  
OceanAI (MariApps Marine Solutions Private Limited)

**Candidate:**  
Avr Varshan  
Email: avr.varshaj20@gmail.com  

**Repository:**  
https://github.com/avr-varshan/ai-document-generator



---

## 📜 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**OceanAI Document Platform - Transforming Ideas into Professional Documents with the Power of AI**
