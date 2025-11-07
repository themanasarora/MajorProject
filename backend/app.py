# server.py  (updated)
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import PyPDF2
import io
import os
import tempfile
import sys
from werkzeug.utils import secure_filename
import datetime
import traceback

# --- NEW: Firebase Admin imports ---
import firebase_admin
from firebase_admin import credentials, auth as admin_auth, firestore as admin_firestore

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

# ------------------ Initialize Firebase Admin ------------------
# Two ways to provide credentials:
# 1) Recommended: Set environment variable GOOGLE_APPLICATION_CREDENTIALS to the path of the service account file.
# 2) Alternative: Put the JSON content into FIREBASE_SERVICE_ACCOUNT_JSON environment variable (string).
try:
    if not firebase_admin._apps:
        if os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON"):
            import json
            sa_json = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT_JSON"])
            cred = credentials.Certificate(sa_json)
        else:
            # This will use GOOGLE_APPLICATION_CREDENTIALS if set, otherwise default credentials
            cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
    fs_admin = admin_firestore.client()
    print("Firebase Admin initialized")
except Exception as e:
    print("Warning: Firebase Admin initialization failed. Admin endpoints will not work.")
    print(str(e))
    fs_admin = None

# ------------------ Helpers ------------------
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

# ------------------ Firebase token helper ------------------
def verify_id_token_from_header():
    """
    Verify Firebase ID token passed in Authorization: Bearer <token>
    Returns decoded token dict (contains uid) or raises.
    """
    if not fs_admin:
        raise RuntimeError("Firebase Admin not initialized on server.")
    auth_header = request.headers.get("Authorization", "") or request.headers.get("authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    else:
        # fallback: also allow token in JSON body under idToken
        try:
            j = request.get_json(silent=True) or {}
            token = j.get("idToken") or request.args.get("idToken")
        except Exception:
            token = None

    if not token:
        raise ValueError("Missing Authorization Bearer token or idToken in body/params.")

    try:
        decoded = admin_auth.verify_id_token(token)
        return decoded
    except Exception as e:
        print("Token verify error:", str(e))
        raise

# ------------------ HEALTH CHECK ------------------
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
            "/process-pdf",
            "/submit-answer",
            "/award-points"
        ]
    })

# ---------- existing file and text endpoints (unchanged) ----------
# (copying your existing endpoints below — they remain the same)
# ... (For brevity in this snippet I assume you keep the previous implementations)
# I'll paste them after implementing new endpoints so file remains complete.

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
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ---------- NEW: submit-answer endpoint ----------
@app.route("/submit-answer", methods=["POST"])
def submit_answer():
    """
    Student submits an answer to server.
    Body JSON: { quizId, questionId, selectedOption } and include Authorization: Bearer <idToken>
    Server verifies token, records player's answer in admin Firestore under live_quizzes/{quizId}/players/{uid}
    Optionally awards points immediately (award_on_submit=True => increments score if correct).
    Returns player doc after write.
    """
    try:
        if not fs_admin:
            return jsonify({"error": "Server misconfiguration: Firebase Admin not initialized"}), 500

        payload = request.get_json(force=True)
        if not payload:
            return jsonify({"error": "No JSON body provided"}), 400

        quizId = payload.get("quizId")
        questionId = payload.get("questionId")
        selectedOption = payload.get("selectedOption")
        award_on_submit = bool(payload.get("awardOnSubmit", True))  # default: award immediately

        if not quizId or not questionId or selectedOption is None:
            return jsonify({"error": "Missing quizId, questionId or selectedOption"}), 400

        decoded = verify_id_token_from_header()
        uid = decoded.get("uid")

        # retrieve live question
        live_ref = fs_admin.collection("live_quizzes").document(quizId)
        live_doc = live_ref.get()
        if not live_doc.exists:
            return jsonify({"error": "Quiz not active or quizId not found"}), 404

        live = live_doc.to_dict()
        current = live.get("currentQuestion")
        if not current or current.get("questionId") != questionId:
            # Either no active question or student submitted for wrong question
            return jsonify({"error": "No active question or question mismatch"}), 400

        correct_answer = current.get("correctAnswer")
        # determine correctness
        is_correct = (selectedOption == correct_answer)

        # update player's doc under live_quizzes/{quizId}/players/{uid}
        players_ref = live_ref.collection("players")
        player_doc_ref = players_ref.document(uid)

        # use transaction to update safely
        def txn_update(txn):
            player_snapshot = player_doc_ref.get(transaction=txn)
            now = admin_firestore.SERVER_TIMESTAMP
            if player_snapshot.exists:
                pdata = player_snapshot.to_dict()
                # update last answer/result and optionally add score
                update_data = {
                    "lastAnswer": selectedOption,
                    "lastResult": is_correct,
                    "lastQuestionId": questionId,
                    "lastAnsweredAt": now,
                }
                if award_on_submit and is_correct:
                    # increment score
                    update_data["score"] = pdata.get("score", 0) + 1
                txn.update(player_doc_ref, update_data)
                return {**pdata, **update_data}
            else:
                # create new player doc
                new_doc = {
                    "uid": uid,
                    "name": payload.get("displayName") or decoded.get("name") or decoded.get("email") or "Student",
                    "lastAnswer": selectedOption,
                    "lastResult": is_correct,
                    "lastQuestionId": questionId,
                    "lastAnsweredAt": now,
                    "score": 1 if (award_on_submit and is_correct) else 0,
                    "joinedAt": now,
                }
                txn.set(player_doc_ref, new_doc)
                return new_doc

        # run transaction
        result_data = fs_admin.transaction()(txn_update)()

        # Return sanitized response
        return jsonify({
            "ok": True,
            "player": {
                "uid": uid,
                "name": result_data.get("name"),
                "lastResult": result_data.get("lastResult"),
                "score": result_data.get("score")
            }
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 401
    except Exception as e:
        print("submit-answer error:", str(e))
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ---------- NEW: award-points endpoint ----------
@app.route("/award-points", methods=["POST"])
def award_points():
    """
    Teacher requests server to award points to players who answered the current question correctly.
    Body JSON: { quizId, points }
    Authorization: Bearer <teacher idToken>
    Server verifies teacher role (by reading /users/{uid}.role in Firestore) before awarding.
    """
    try:
        if not fs_admin:
            return jsonify({"error": "Server misconfiguration: Firebase Admin not initialized"}), 500

        payload = request.get_json(force=True)
        if not payload:
            return jsonify({"error": "No JSON body provided"}), 400

        quizId = payload.get("quizId")
        points = int(payload.get("points", 1))
        if not quizId:
            return jsonify({"error": "Missing quizId"}), 400

        decoded = verify_id_token_from_header()
        uid = decoded.get("uid")

        # Verify that the requester is a teacher by reading Firestore users/{uid}.role
        user_doc = fs_admin.collection("users").document(uid).get()
        role = user_doc.to_dict().get("role") if user_doc.exists else None
        if role != "teacher":
            return jsonify({"error": "Unauthorized: only teachers can call this endpoint"}), 403

        # Read current live question
        live_ref = fs_admin.collection("live_quizzes").document(quizId)
        live_doc = live_ref.get()
        if not live_doc.exists:
            return jsonify({"error": "Live quiz not found"}), 404
        live = live_doc.to_dict()
        current = live.get("currentQuestion")
        if not current or not current.get("questionId"):
            return jsonify({"error": "No active question to award points for"}), 400
        qid = current.get("questionId")

        # Query players who have lastQuestionId == qid AND lastResult == True
        players_col = live_ref.collection("players")
        # Note: Firestore requires indexed queries; equality works fine
        matching_query = players_col.where("lastQuestionId", "==", qid).where("lastResult", "==", True)
        players = matching_query.stream()

        batch = fs_admin.batch()
        awarded_count = 0
        for p in players:
            p_ref = players_col.document(p.id)
            p_data = p.to_dict()
            # current score (fallback 0)
            current_score = p_data.get("score", 0)
            new_score = current_score + points
            batch.update(p_ref, {"score": new_score})
            awarded_count += 1

        if awarded_count == 0:
            return jsonify({"ok": True, "awardedCount": 0, "message": "No correct players to award"}), 200

        # commit batch
        batch.commit()
        return jsonify({"ok": True, "awardedCount": awarded_count}), 200

    except ValueError as ve:
        return jsonify({"error": str(ve)}), 401
    except admin_auth.AuthError as ae:
        return jsonify({"error": "Auth error: " + str(ae)}), 401
    except Exception as e:
        print("award-points error:", str(e))
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# ---------- (rest of your endpoints: summarize-text, upload-pdf, etc.) ----------
# Insert your previously-existing endpoints (summarize-file, upload-pdf, translate-text,
# generate-notes, generate-assignment, etc.) below or keep them above as you had them originally.
# For brevity I've left the rest unchanged in this snippet; ensure they remain in the final file.

# (To keep your original code intact, append the other route functions you already wrote here.)

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
    print("Available endpoints: (includes new quiz endpoints)")
    print("  GET  / - Health check")
    print("  POST /generate-quiz - Generate quiz")
    print("  POST /submit-answer - Student submit (secure)")
    print("  POST /award-points - Teacher award points (secure)")
    print("  POST /summarize-text - Summarize text")
    print("  POST /summarize-file - Summarize uploaded file (PDF)")
    print("  POST /translate-text - Translate text") 
    print("  POST /generate-notes - Generate notes from text")
    print("  POST /generate-assignment - Generate assignment")
    print("  POST /upload-pdf - Process PDF file")
    print()
    if sys.platform == "win32":
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    app.run(debug=True, host='0.0.0.0', port=5000)
