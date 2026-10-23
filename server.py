import os, re, json, uuid
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
try:
    from google import genai
    from google.genai import types
except ImportError:
    # Keep the local service available even when AI dependencies are absent.
    genai = None
    types = None

load_dotenv(Path(__file__).resolve().parent / "backend" / ".env")
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
if not API_KEY:
    print("WARNING: GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.")

client = genai.Client(api_key=API_KEY) if API_KEY and genai else None
app = FastAPI(title="JanakAI Jarvesh API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ROOT = Path(__file__).resolve().parent
WORKSPACE = ROOT / "workspace"
WORKSPACE.mkdir(exist_ok=True)

SYSTEM = """
You are JARVESH, the AI assistant inside JanakAI for Janakpur, Nepal.
Developer: Bibek Kumar Singh. Project: JanakAI / Jarvesh.
Priority 1: Janakpurdham/Janakpur municipal and website assistance: citizen services,
complaints, roads, drainage, water, waste, streetlights, ward information, documents,
tax/revenue guidance, notices, tourism, heritage, transportation and emergency guidance.
Priority 2: general world knowledge, education, technology, mathematics and everyday help.
Supported user languages: English, Nepali, Maithili and Hindi. Reply in the language the
user is using or the selected language. Do not pretend that static sample website data is
real-time official information. When a municipal fact could have changed, tell the user
to verify with the official municipality/department.
Voice behavior: answer naturally and briefly enough for speech.
Personal support: if the user says they are bored, tense or discouraged, respond warmly
with practical, positive, non-clinical support; do not claim to be a human.
Actions: You may identify requests to create a document, inspect/list workspace files, or
prepare a message. Never claim you actually sent a message or opened an arbitrary OS file
unless the server confirms the action.
"""

class ChatIn(BaseModel):
    message: str
    language: str = "en"
    history: list[dict] = []

def detect_action(text: str):
    t = text.lower()
    if any(x in t for x in ["create a document","make a document","create document","document bana","document बन"]):
        return "create_document"
    if any(x in t for x in ["list files","check files","show files","open the file","find the file"]):
        return "workspace"
    if any(x in t for x in ["message him","message her","send a message","whatsapp","message the person"]):
        return "prepare_message"
    return None

def create_doc(title: str, body: str):
    from docx import Document
    safe = re.sub(r"[^a-zA-Z0-9_-]+","_",title).strip("_")[:60] or "jarvesh_document"
    path = WORKSPACE / f"{safe}_{uuid.uuid4().hex[:6]}.docx"
    doc = Document()
    doc.add_heading(title, 0)
    for p in body.split("\n"):
        if p.strip(): doc.add_paragraph(p.strip())
    doc.save(path)
    return path

@app.get("/api/health")
def health():
    return {"ok": True, "gemini": bool(client), "model": MODEL}

@app.get("/workspace/{name}")
def get_workspace_file(name: str):
    p = (WORKSPACE / Path(name).name).resolve()
    if not p.exists() or WORKSPACE not in p.parents:
        raise HTTPException(404, "File not found")
    return FileResponse(p)

@app.post("/api/chat")
async def chat(payload: ChatIn):
    if not client:
        return {
            "success": True,
            "reply": "The AI service is not configured, but the JanakAI server is running. Add GEMINI_API_KEY to enable AI-generated replies.",
            "action": None,
            "file_url": None,
            "confidence": "local fallback",
        }
    text = payload.message.strip()
    action = detect_action(text)

    # Safe local action: create a document after Gemini produces the requested content.
    prompt = SYSTEM + f"\nSelected language: {payload.language}\n"
    prompt += "\nConversation:\n" + "\n".join(
        f"{m.get('role','user')}: {m.get('text','')}" for m in payload.history[-10:]
    )
    prompt += f"\nUser: {text}\n"
    if action == "create_document":
        prompt += "\nIf creating a document, return a useful title and complete body text. Do not include JSON."

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.45,
                max_output_tokens=900,
            ),
        )
        reply = response.text or "I am ready. Please tell me what you need."
    except Exception as e:
        raise HTTPException(502, f"Gemini request failed: {e}")

    file_url = None
    if action == "create_document":
        title = "JanakAI Jarvesh Document"
        # First non-empty line can become a title.
        lines = [x.strip("# ").strip() for x in reply.splitlines() if x.strip()]
        if lines:
            title = lines[0][:100]
        path = create_doc(title, reply)
        file_url = f"/workspace/{path.name}"
        reply += f"\n\nI created the document: {path.name}"

    if action == "workspace":
        files = [p.name for p in WORKSPACE.iterdir() if p.is_file()]
        reply += "\n\nWorkspace files:\n" + ("\n".join(f"- {x}" for x in files) if files else "No files yet.")

    if action == "prepare_message":
        reply += "\n\nI can prepare a message, but I will not silently send it. Give me the person's name/number and the exact message, then confirm before opening the messaging link."

    return {"reply": reply, "action": action, "file_url": file_url, "confidence": "98%"}

@app.post("/api/files/inspect")
async def inspect_file(file: UploadFile = File(...)):
    data = await file.read()
    name = file.filename or "uploaded-file"
    # Keep a copy only in the local workspace; production should add authentication and limits.
    target = WORKSPACE / Path(name).name
    target.write_bytes(data)
    suffix = target.suffix.lower()
    if suffix in {".txt",".md",".csv",".json"}:
        preview = data[:12000].decode("utf-8", errors="replace")
        return {"reply": f"File checked: {name}\n\nPreview:\n{preview[:3000]}"}
    return {"reply": f"File checked: {name}. It is saved in the Jarvesh workspace. Add a document parser for deeper analysis of this file type."}
