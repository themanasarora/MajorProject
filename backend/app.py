from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import PyPDF2
import io
import os
import tempfile
import sys
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

MODEL_NAME = "gemma3:4b"
OLLAMA_CLI = "ollama"

# Configuration for file uploads
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def extract_text_from_pdf_bytes(pdf_bytes):
    """Extract text from PDF bytes (for in-memory processing)"""
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def run_ollama(prompt: str) -> str:
    """Run Ollama CLI with a prompt and return the output"""
    try:
        # Set environment for UTF-8 encoding
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        process = subprocess.Popen(
            [OLLAMA_CLI, "run", MODEL_NAME],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            universal_newlines=True,
            encoding='utf-8',
            errors='ignore'
        )
        
        stdout, stderr = process.communicate(input=prompt)

        if process.returncode != 0:
            error_msg = stderr if stderr else "Unknown error"
            print(f"Ollama CLI error (return code {process.returncode}): {error_msg}")
            return "❌ Ollama CLI failed. Check server logs."

        # Clean the output
        if stdout:
            cleaned_output = stdout.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
            return cleaned_output.strip()
        else:
            return "❌ No output received from Ollama."

    except FileNotFoundError:
        return "❌ Ollama executable not found. Check OLLAMA_CLI path."
    except Exception as e:
        print(f"Unexpected error in run_ollama: {str(e)}")
        return f"❌ Unexpected error: {str(e)}"

# ---------- HEALTH CHECK ----------

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "status": "Server is running",
        "model": MODEL_NAME,
        "endpoints": [
            "/summarize-text",
            "/summarize-file",
            "/translate-text", 
            "/generate-notes",
            "/generate-quiz",
            "/generate-assignment",
            "/upload-pdf",
            "/process-pdf"
        ]
    })

# ---------- FILE PROCESSING ROUTES ----------

@app.route("/summarize-file", methods=["POST"])
def summarize_file():
    """Handle file upload and summarization"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Only PDF and image files are allowed"}), 400
        
        length = request.form.get('length', 'medium')
        
        file_bytes = file.read()
        
        if len(file_bytes) == 0:
            return jsonify({"error": "Uploaded file is empty"}), 400
        
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        
        if file_extension == 'pdf':
            extracted_text = extract_text_from_pdf_bytes(file_bytes)
        else:
            return jsonify({"error": "Image text extraction not implemented yet. Please use PDF files."}), 400
        
        if not extracted_text:
            return jsonify({"error": "Could not extract text from PDF. The PDF might be scanned or image-based."}), 400
        
        extracted_text = extracted_text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        
        if len(extracted_text) > 8000:
            extracted_text = extracted_text[:8000] + "... [text truncated]"
        
        length_instruction = {
            "short": "Summarize the following text in 2-3 concise sentences:",
            "medium": "Summarize the following text in 1 well-structured paragraph:",
            "long": "Summarize the following text in 2-3 detailed paragraphs:"
        }.get(length, "Summarize the following text:")
        
        prompt = f"{length_instruction}\n\n{extracted_text}"
        summary = run_ollama(prompt)
        
        return jsonify({
            "summary": summary, 
            "extracted_length": len(extracted_text),
            "file_type": file_extension
        })
            
    except Exception as e:
        print(f"File processing error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    """Handle PDF file upload and processing"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are allowed"}), 400
        
        processing_type = request.form.get('type', 'summarize')
        
        pdf_bytes = file.read()
        
        if len(pdf_bytes) == 0:
            return jsonify({"error": "Uploaded file is empty"}), 400
        
        extracted_text = extract_text_from_pdf_bytes(pdf_bytes)
        
        if not extracted_text:
            return jsonify({"error": "Could not extract text from PDF. The PDF might be scanned or image-based."}), 400
        
        extracted_text = extracted_text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        
        if len(extracted_text) > 8000:
            extracted_text = extracted_text[:8000] + "... [text truncated]"
        
        if processing_type == 'summarize':
            length = request.form.get('length', 'medium')
            length_instruction = {
                "short": "Summarize the following text in 2-3 concise sentences:",
                "medium": "Summarize the following text in 1 well-structured paragraph:",
                "long": "Summarize the following text in 2-3 detailed paragraphs:"
            }.get(length, "Summarize the following text:")
            
            prompt = f"{length_instruction}\n\n{extracted_text}"
            result = run_ollama(prompt)
            return jsonify({
                "summary": result, 
                "extracted_length": len(extracted_text),
                "processing_type": "summarize"
            })
        
        elif processing_type == 'generate_notes':
            style = request.form.get('style', 'bullet')
            subject = request.form.get('subject', 'general')
            grade = request.form.get('grade', 'college')
            
            style_instruction = {
                "bullet": "Generate notes in clear bullet points. Output only the notes; do not add explanations or suggestions.",
                "detailed": "Generate notes in detailed format with headings and subpoints. Output only the notes; no extra commentary.",
                "qa": "Generate notes in a Question and Answer format. Output only the notes; do not add anything else.",
                "mindmap": "Generate notes in a structured mind map style (use indentation). Output only the notes; no explanations."
            }.get(style, "Generate structured notes. Output only the notes; no extra explanations.")

            grade_instruction = {
                "highschool": "Make the notes simple and easy to understand for high school students. Avoid technical jargon.",
                "college": "Generate detailed, well-structured notes suitable for undergraduate college students.",
                "advanced": "Generate in-depth, advanced-level notes with technical details, formulas, and critical insights."
            }.get(grade, "Generate clear and structured notes appropriate for general learners.")

            prompt = f"""
{style_instruction}
{grade_instruction}

Subject: {subject}

Content to cover:
{extracted_text}
"""
            result = run_ollama(prompt)
            return jsonify({
                "notes": result, 
                "extracted_length": len(extracted_text),
                "processing_type": "generate_notes"
            })
        
        elif processing_type == 'translate':
            target_lang = request.form.get('target', 'english')
            prompt = f"Translate the following text into {target_lang}. Output only the translation, no explanations: {extracted_text}"
            result = run_ollama(prompt)
            return jsonify({
                "translation": result,
                "extracted_length": len(extracted_text),
                "processing_type": "translate"
            })
        
        else:
            return jsonify({"error": "Invalid processing type. Use 'summarize', 'generate_notes', or 'translate'"}), 400
            
    except Exception as e:
        print(f"PDF processing error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ---------- QUIZ GENERATOR ROUTE ----------

@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    """Generate quiz based on subject and topic"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        subject = data.get("subject", "").strip()
        topic = data.get("topic", "").strip()
        difficulty = data.get("difficulty", "medium")
        grade_level = data.get("grade_level", "highschool")
        num_questions = data.get("num_questions", 5)

        if not subject:
            return jsonify({"error": "No subject provided"}), 400
        if not topic:
            return jsonify({"topic": "No topic provided"}), 400

        # Clean inputs
        subject = subject.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        topic = topic.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')

        # Difficulty instructions
        difficulty_instruction = {
            "easy": "Create simple, straightforward questions suitable for beginners.",
            "medium": "Create moderately challenging questions that test understanding.",
            "hard": "Create complex questions that require critical thinking and application."
        }.get(difficulty, "Create questions with moderate difficulty.")

        # Grade level instructions
        grade_instruction = {
            "highschool": "Make questions appropriate for high school students.",
            "college": "Make questions appropriate for college/university students.",
            "advanced": "Make advanced questions suitable for graduate level or experts."
        }.get(grade_level, "Make questions appropriate for general learners.")

        prompt = f"""
Create a {difficulty} level quiz about {topic} in the subject of {subject}.

{difficulty_instruction}
{grade_instruction}

Generate exactly {num_questions} multiple choice questions.

Format each question exactly like this:
Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Correct Answer: [Letter of correct option]

Make sure each question is clearly numbered and each option is labeled A, B, C, D.
Provide the correct answer immediately after each question.

Topic focus: {topic}
"""

        quiz_content = run_ollama(prompt)
        return jsonify({
            "quiz": quiz_content,
            "subject": subject,
            "topic": topic,
            "difficulty": difficulty,
            "grade_level": grade_level,
            "num_questions": num_questions
        })

    except Exception as e:
        print(f"Quiz generation error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ---------- ASSIGNMENT GENERATOR ROUTE ----------

@app.route("/generate-assignment", methods=["POST"])
def generate_assignment():
    """Generate assignment based on type and details"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        assignment_type = data.get("type", "").strip()
        assignment_details = data.get("details", "").strip()
        grade_level = data.get("grade_level", "10")
        subject = data.get("subject", "general")

        if not assignment_type:
            return jsonify({"error": "No assignment type provided"}), 400
        if not assignment_details:
            return jsonify({"error": "No assignment details provided"}), 400

        # Clean inputs
        assignment_type = assignment_type.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        assignment_details = assignment_details.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        subject = subject.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')

        # Assignment type instructions
        type_instruction = {
            "essay": "Create a detailed essay assignment with clear prompts and requirements.",
            "research": "Create a research project assignment with methodology and deliverables.",
            "presentation": "Create a presentation assignment with topic guidelines and evaluation criteria.",
            "worksheet": "Create a worksheet assignment with exercises and problems.",
            "creative": "Create a creative project assignment with artistic or innovative requirements."
        }.get(assignment_type, "Create a well-structured assignment with clear objectives.")

        # Grade level adaptation
        grade_adaptation = f"Make this assignment appropriate for grade {grade_level} students."

        prompt = f"""
Create a {assignment_type} assignment for {subject}.

{type_instruction}
{grade_adaptation}

Assignment Details: {assignment_details}

Format the assignment with the following sections:
1. Title: Clear and descriptive title
2. Objective: Learning objectives and goals
3. Instructions: Step-by-step instructions for students
4. Requirements: Specific requirements and deliverables
5. Evaluation: How the assignment will be graded
6. Deadline: Suggested timeline (if applicable)

Make the assignment clear, structured, and educational.
"""

        assignment_content = run_ollama(prompt)
        return jsonify({
            "assignment": assignment_content,
            "type": assignment_type,
            "subject": subject,
            "grade_level": grade_level
        })

    except Exception as e:
        print(f"Assignment generation error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ---------- TEXT PROCESSING ROUTES ----------

@app.route("/summarize-text", methods=["POST"])
def summarize_text():
    data = request.get_json()
    if not data:
        return jsonify({"summary": "❌ No JSON data provided"}), 400
        
    text = data.get("text", "")
    length = data.get("length", "medium")

    if not text.strip():
        return jsonify({"summary": "❌ No text provided"}), 400

    text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')

    length_instruction = {
        "short": "Summarize the following text in 2-3 concise sentences:",
        "medium": "Summarize the following text in 1 well-structured paragraph:",
        "long": "Summarize the following text in 2-3 detailed paragraphs:"
    }.get(length, "Summarize the following text:")

    prompt = f"{length_instruction}\n\n{text}"
    summary = run_ollama(prompt)
    return jsonify({"summary": summary})


@app.route("/translate-text", methods=["POST"])
def translate_text():
    data = request.get_json()
    if not data:
        return jsonify({"translation": "❌ No JSON data provided"}), 400
        
    text = data.get("text", "").strip()
    source_lang = data.get("source", "auto").strip()
    target_lang = data.get("target", "english").strip()

    if not text:
        return jsonify({"translation": "❌ No text provided"}), 400
    if not target_lang:
        return jsonify({"translation": "❌ No target language provided"}), 400

    text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')

    prompt = f"Translate the following word into {target_lang}. Output only the exact one-word translation, no explanations: {text}"

    try:
        translation = run_ollama(prompt)
        translation = translation.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
        translation = translation.strip().split()[0] if translation.strip() else "No translation"
    except Exception as e:
        return jsonify({"translation": f"❌ Error: {str(e)}"}), 500

    return jsonify({"translation": translation})


@app.route("/generate-notes", methods=["POST"])
def generate_notes():
    data = request.get_json()
    if not data:
        return jsonify({"notes": "❌ No JSON data provided"}), 400
        
    text = data.get("text", "")
    style = data.get("style", "bullet")
    subject = data.get("subject", "general")
    grade = data.get("grade", "college")

    if not text.strip():
        return jsonify({"notes": "❌ No text provided"}), 400

    text = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')

    style_instruction = {
        "bullet": "Generate notes in clear bullet points. Output only the notes; do not add explanations or suggestions.",
        "detailed": "Generate notes in detailed format with headings and subpoints. Output only the notes; no extra commentary.",
        "qa": "Generate notes in a Question and Answer format. Output only the notes; do not add anything else.",
        "mindmap": "Generate notes in a structured mind map style (use indentation). Output only the notes; no explanations."
    }.get(style, "Generate structured notes. Output only the notes; no extra explanations.")

    grade_instruction = {
        "highschool": "Make the notes simple and easy to understand for high school students. Avoid technical jargon.",
        "college": "Generate detailed, well-structured notes suitable for undergraduate college students.",
        "advanced": "Generate in-depth, advanced-level notes with technical details, formulas, and critical insights."
    }.get(grade, "Generate clear and structured notes appropriate for general learners.")

    prompt = f"""
{style_instruction}
{grade_instruction}

Subject: {subject}

Content to cover:
{text}
"""

    notes = run_ollama(prompt)
    return jsonify({"notes": notes})


# ---------- ERROR HANDLERS ----------

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found. Check the URL."}), 404

@app.errorhandler(413)
def too_large(error):
    return jsonify({"error": "File too large. Maximum size is 16MB."}), 413

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    print(f"Starting Flask server with model: {MODEL_NAME}")
    print("Available endpoints:")
    print("  GET  / - Health check")
    print("  POST /summarize-text - Summarize text")
    print("  POST /summarize-file - Summarize uploaded file (PDF)")
    print("  POST /translate-text - Translate text") 
    print("  POST /generate-notes - Generate notes from text")
    print("  POST /generate-quiz - Generate quiz")
    print("  POST /generate-assignment - Generate assignment")
    print("  POST /upload-pdf - Process PDF file")
    print("  POST /process-pdf - Process PDF file (alias)")
    
    if sys.platform == "win32":
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    
    app.run(debug=True, host='0.0.0.0', port=5000)