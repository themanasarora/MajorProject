from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess

app = Flask(__name__)
CORS(app)

MODEL_NAME = "gemma3:4b"
OLLAMA_CLI = "ollama"  # full path if not in PATH


def run_ollama(prompt: str) -> str:
    """Run Ollama CLI with a prompt and return the output"""
    try:
        process = subprocess.Popen(
            [OLLAMA_CLI, "run", MODEL_NAME],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        stdout, stderr = process.communicate(input=prompt.encode("utf-8"))

        if process.returncode != 0:
            print("Ollama CLI error:", stderr.decode("utf-8", errors="ignore"))
            return "❌ Ollama CLI failed. Check server logs."

        return stdout.decode("utf-8", errors="ignore").strip()

    except FileNotFoundError:
        return "❌ Ollama executable not found. Check OLLAMA_CLI path."
    except Exception as e:
        return f"❌ Unexpected error: {e}"


# ---------- ROUTES ----------

@app.route("/summarize-text", methods=["POST"])
def summarize_text():
    data = request.get_json()
    text = data.get("text", "")
    length = data.get("length", "medium")

    if not text.strip():
        return jsonify({"summary": "❌ No text provided"}), 400

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
    text = data.get("text", "").strip()
    source_lang = data.get("source", "auto").strip()
    target_lang = data.get("target", "english").strip()

    if not text:
        return jsonify({"translation": "❌ No text provided"}), 400
    if not target_lang:
        return jsonify({"translation": "❌ No target language provided"}), 400

    # Construct prompt for one-word translation only
    prompt = f"Translate the following word into {target_lang}. Output only the exact one-word translation, no explanations: {text}"

    try:
        translation = run_ollama(prompt)
        # Optionally strip extra spaces or line breaks
        translation = translation.strip().split()[0]  # ensures only one word
    except Exception as e:
        return jsonify({"translation": f"❌ Error: {str(e)}"}), 500

    return jsonify({"translation": translation})



@app.route("/generate-notes", methods=["POST"])
def generate_notes():
    data = request.get_json()
    text = data.get("text", "")
    style = data.get("style", "bullet")
    subject = data.get("subject", "general")
    grade = data.get("grade", "college")  # default to college

    if not text.strip():
        return jsonify({"notes": "❌ No text provided"}), 400

    # Style-specific instructions
    style_instruction = {
        "bullet": "Generate notes in clear bullet points. Output only the notes; do not add explanations or suggestions.",
        "detailed": "Generate notes in detailed format with headings and subpoints. Output only the notes; no extra commentary.",
        "qa": "Generate notes in a Question and Answer format. Output only the notes; do not add anything else.",
        "mindmap": "Generate notes in a structured mind map style (use indentation). Output only the notes; no explanations."
    }.get(style, "Generate structured notes. Output only the notes; no extra explanations.")

    # Grade-specific instructions
    grade_instruction = {
        "highschool": "Make the notes simple and easy to understand for high school students. Avoid technical jargon.",
        "college": "Generate detailed, well-structured notes suitable for undergraduate college students.",
        "advanced": "Generate in-depth, advanced-level notes with technical details, formulas, and critical insights."
    }.get(grade, "Generate clear and structured notes appropriate for general learners.")

    # Final prompt
    prompt = f"""
{style_instruction}
{grade_instruction}

Subject: {subject}

Content to cover:
{text}
"""

    notes = run_ollama(prompt)
    return jsonify({"notes": notes})



if __name__ == "__main__":
    app.run(debug=True)
