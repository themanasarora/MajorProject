// src/pages/TeacherHost.jsx
import React, { useEffect, useState } from "react";
import { db, functions, auth } from "../firebase"; // auth should be exported from your firebase.js
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
  increment,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../contexts/AuthContext";

export default function TeacherHost() {
  const { user, userData } = useAuth();
  const [topic, setTopic] = useState("");
  const [games, setGames] = useState([]);
  const [activeGameId, setActiveGameId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [creatingGame, setCreatingGame] = useState(false);
  const [generating, setGenerating] = useState(false);
  const API_BASE = import.meta.env.VITE_OLLAMA_API_BASE || "http://localhost:5000";

  // New question UI state
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newChoices, setNewChoices] = useState(["", "", "", ""]);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [newDuration, setNewDuration] = useState(20);
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Load teacher's games (hosted by this teacher)
  useEffect(() => {
    if (!user) return;
    const gCol = collection(db, "games");
    const q = query(gCol, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap
          .docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((g) => g.hostId === user.uid); // only teacher's games
        setGames(arr);
        // auto-select first if none selected
        if (!activeGameId && arr.length) setActiveGameId(arr[0].id);
      },
      (err) => console.error("games onSnapshot error:", err)
    );
    return () => unsub();
  }, [user, activeGameId]);

  // Subscribe to questions and leaderboard for active game (resilient)
  useEffect(() => {
    if (!activeGameId) {
      setQuestions([]);
      setLeaderboard([]);
      return;
    }

    // QUESTIONS (from games/{gameId}/questions)
    const qRef = collection(db, "games", activeGameId, "questions");
    const qQ = query(qRef);
    const unsubQ = onSnapshot(
      qQ,
      (snap) => {
        const arr = snap.docs.map((d) => {
          const data = d.data();
          const createdMs =
            data.createdAt && typeof data.createdAt.toMillis === "function"
              ? data.createdAt.toMillis()
              : data.createdAt || 0;
          return { id: d.id, ...data, _createdMs: createdMs };
        });
        arr.sort((a, b) => (a._createdMs || 0) - (b._createdMs || 0));
        setQuestions(arr);
      },
      (err) => console.error("questions onSnapshot error:", err)
    );

    // PLAYERS / LEADERBOARD (subscribe to live_quizzes/{gameId}/players)
    const pRef = collection(db, "live_quizzes", activeGameId, "players");
    const pQ = query(pRef, orderBy("score", "desc"));
    const unsubP = onSnapshot(
      pQ,
      (snap) => {
        setLeaderboard(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.error("players onSnapshot error:", err)
    );

    return () => {
      unsubQ();
      unsubP();
    };
  }, [activeGameId]);

  // Create a new game
  const createGame = async () => {
    if (!topic.trim()) return alert("Enter a topic for the game.");
    setCreatingGame(true);
    try {
      const gRef = doc(collection(db, "games"));
      await setDoc(gRef, {
        hostId: user.uid,
        topic: topic.trim(),
        state: "lobby",
        currentQuestionId: null,
        settings: { timerSec: 20, shuffleChoices: false },
        createdAt: serverTimestamp(),
      });
      setTopic("");
      setActiveGameId(gRef.id);
    } catch (err) {
      console.error("Create game error", err);
      alert("Failed to create game");
    } finally {
      setCreatingGame(false);
    }
  };

  // Delete a game (teacher only)
  const deleteGame = async (gameId) => {
    if (!confirm("Delete this game? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "games", gameId));
      if (gameId === activeGameId) setActiveGameId(null);
    } catch (err) {
      console.error("Delete game error", err);
      alert("Failed to delete game");
    }
  };

  // Generate questions via Flask / Ollama
  const generateQuestions = async (gameId, count = 5, durationSec = 20, difficulty = "medium") => {
    if (!gameId) return alert("Select a game first");
    setGenerating(true);
    try {
      const body = {
        subject: "General",
        topic: games.find(g => g.id === gameId)?.topic || topic || "General knowledge",
        difficulty,
        grade_level: "highschool",
        num_questions: count
      };

      const res = await fetch(`${API_BASE}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server responded ${res.status}: ${text}`);
      }

      const data = await res.json();
      const quizText = data.quiz || data.quiz_content || data.quizText || "";
      if (!quizText || typeof quizText !== "string") {
        throw new Error("Empty quiz response from backend");
      }

      const parsed = parseQuizText(quizText, count);
      if (!parsed.length) {
        throw new Error("Parser returned no questions. Inspect backend output.");
      }

      const qCol = collection(db, "games", gameId, "questions");
      for (const q of parsed) {
        await addDoc(qCol, {
          text: q.text,
          choices: q.choices,
          correctIndex: q.correctIndex,
          durationSec: durationSec,
          startAt: null,
          createdAt: serverTimestamp()
        });
      }

      alert(`Generated and saved ${parsed.length} questions`);
    } catch (err) {
      console.error("Generate error:", err);
      alert("Failed to generate questions: " + (err.message || err));
    } finally {
      setGenerating(false);
    }
  };

  // Start a question (publish to live_quizzes so students get it)
  const startQuestion = async (gameId, questionId) => {
    if (!gameId || !questionId) return alert("Missing gameId or questionId");
    if (!confirm("Start this question now?")) return;

    try {
      const qSnap = await getDoc(doc(db, "games", gameId, "questions", questionId));
      if (!qSnap.exists()) {
        alert("Question not found in game questions.");
        return;
      }
      const qData = qSnap.data();

      const options = Array.isArray(qData.choices) ? qData.choices : (qData.options || []);
      const correctIdx = typeof qData.correctIndex === "number" ? qData.correctIndex : 0;
      const correctAnswer = options[correctIdx] || options[0] || null;

      const liveQuestion = {
        question: qData.text || qData.question || "Question",
        options: options,
        correctAnswer: correctAnswer,
        questionId: questionId,
        startedAt: serverTimestamp(),
        durationSec: qData.durationSec || (games.find(g => g.id === gameId)?.settings?.timerSec) || 20
      };

      await setDoc(doc(db, "live_quizzes", gameId), {
        currentQuestion: liveQuestion,
        hostId: user.uid,
        topic: games.find(g => g.id === gameId)?.topic || null,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await updateDoc(doc(db, "games", gameId), { currentQuestionId: questionId });

      alert("Question published to live quiz (students will receive it).");
    } catch (err) {
      console.error("startQuestion publish failed:", err);
      alert("Failed to start question: " + (err.message || err));
    }
  };

  // End the currently active question
  const endQuestionPublish = async (gameId) => {
    try {
      await updateDoc(doc(db, "live_quizzes", gameId), { currentQuestion: null, updatedAt: serverTimestamp() });
      await updateDoc(doc(db, "games", gameId), { currentQuestionId: null });
      alert("Question ended.");
    } catch (err) {
      console.error("endQuestion failed:", err);
      alert("Failed to end question: " + (err.message || err));
    }
  };

  // End game (set state to finished)
  const endGame = async (gameId) => {
    if (!confirm("End this game now?")) return;
    try {
      await updateDoc(doc(db, "games", gameId), { state: "finished" });
      alert("Game ended");
    } catch (err) {
      console.error("End game error", err);
      alert("Failed to end game");
    }
  };

  // Add question manually (teacher)
  const addQuestion = async () => {
    if (!activeGameId) return alert("Select a game first");
    if (!newQuestionText.trim()) return alert("Enter question text");
    const cleanedChoices = newChoices.map((c) => c && c.trim()).filter((c) => c && c.length);
    if (cleanedChoices.length < 2) return alert("Provide at least 2 choices");
    if (newCorrectIndex < 0 || newCorrectIndex >= cleanedChoices.length) return alert("Correct index out of range");
    setAddingQuestion(true);
    try {
      const qRef = collection(db, "games", activeGameId, "questions");
      await addDoc(qRef, {
        text: newQuestionText.trim(),
        choices: cleanedChoices,
        correctIndex: newCorrectIndex,
        durationSec: Number(newDuration) || 20,
        startAt: null,
        createdAt: serverTimestamp(),
      });
      // reset form
      setNewQuestionText("");
      setNewChoices(["", "", "", ""]);
      setNewCorrectIndex(0);
      setNewDuration(20);
      setShowAddQuestion(false);
      alert("Question added");
    } catch (err) {
      console.error("Add question error:", err);
      alert("Failed to add question");
    } finally {
      setAddingQuestion(false);
    }
  };

  // ----------------- Award points (client-side batch) -----------------
  const awardPointsClient = async (gameId, points = 1) => {
    if (!gameId) return alert("No active game selected");
    if (!confirm(`Award ${points} point(s) to each player who answered the current question correctly?`)) return;
    try {
      // read live quiz root
      const liveSnap = await getDoc(doc(db, "live_quizzes", gameId));
      if (!liveSnap.exists()) return alert("No active live quiz for this game.");
      const currentQuestion = liveSnap.data().currentQuestion;
      if (!currentQuestion || !currentQuestion.questionId) return alert("No active question to award points for.");

      // read all players
      const playersCol = collection(db, "live_quizzes", gameId, "players");
      const playersSnapshot = await getDocs(playersCol);

      const batch = writeBatch(db);
      let awarded = 0;
      playersSnapshot.forEach((pDoc) => {
        const pdata = pDoc.data();
        if (pdata.lastQuestionId === currentQuestion.questionId && pdata.lastResult === true) {
          const pRef = doc(db, "live_quizzes", gameId, "players", pDoc.id);
          batch.update(pRef, { score: increment(points) });
          awarded++;
        }
      });

      if (awarded === 0) return alert("No correct players to award points to.");
      await batch.commit();
      alert(`Awarded ${points} point(s) to ${awarded} player(s) (client-side).`);
    } catch (err) {
      console.error("awardPointsClient failed:", err);
      alert("Failed to award points (client): " + (err.message || err));
    }
  };

  // ----------------- Award points (server-side secure) -----------------
  const awardPointsServer = async (gameId, points = 1) => {
    if (!gameId) return alert("No active game selected");
    if (!confirm(`Ask server to award ${points} point(s) to correct players?`)) return;
    try {
      if (!auth.currentUser) return alert("You must be signed in to call server endpoint.");
      const idToken = await auth.currentUser.getIdToken();

      const res = await fetch(`${API_BASE}/award-points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + idToken
        },
        body: JSON.stringify({
          quizId: gameId,
          points
        })
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Server responded ${res.status}: ${txt}`);
      }

      const data = await res.json();
      alert(`Server awarded points to ${data.awardedCount || 0} player(s).`);
    } catch (err) {
      console.error("awardPointsServer failed:", err);
      alert("Failed to award points (server): " + (err.message || err));
    }
  };

  // ---------------- Helpers for dynamic choices ----------------
  const setChoice = (index, value) => {
    setNewChoices((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };
  const addChoiceField = () => setNewChoices((prev) => [...prev, ""]);
  const removeChoiceField = (index) => {
    setNewChoices((prev) => prev.filter((_, i) => i !== index));
    setNewCorrectIndex((prev) => (prev >= index ? Math.max(0, prev - 1) : prev));
  };

  // ---------------- Quiz text parser (unchanged) ----------------
  function parseQuizText(text, maxQuestions = 20) {
    const raw = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();
    const questionBlocks = [];
    const lines = raw.split("\n");
    let cur = [];
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i].trim();
      if (/^(Q\d+[\.\)]|^\d+[\.\)]).*/i.test(ln) && cur.length > 0) {
        questionBlocks.push(cur.join("\n"));
        cur = [ln];
      } else {
        cur.push(ln);
      }
    }
    if (cur.length) questionBlocks.push(cur.join("\n"));
    if (questionBlocks.length === 0) {
      questionBlocks.push(...raw.split(/\n{2,}/).slice(0, maxQuestions));
    }
    const parsed = [];
    for (const block of questionBlocks.slice(0, maxQuestions)) {
      const firstLineMatch = block.match(/^(?:Q\d+[\.\)]\s*)?(?:\d+[\.\)]\s*)?(.*)/i);
      const possibleQuestion = firstLineMatch ? firstLineMatch[1].trim() : "";
      const choiceMatches = [...block.matchAll(/^[A-D][\)\.\:]\s*(.+)$/gim)].map(m => m[1].trim());
      if (choiceMatches.length === 0) {
        const altChoices = [...block.matchAll(/^\s*[-•]\s*(.+)$/gim)].map(m => m[1].trim());
        if (altChoices.length >= 2) choiceMatches.push(...altChoices);
      }
      let choices = choiceMatches;
      if (choices.length === 0) {
        const inline = block.split(/A\)|A\./i);
        if (inline.length > 1) {
          let rest = "A)" + inline.slice(1).join("A)");
          const out = rest.split(/(?=[B-D][\)\.])/i).map(s => s.replace(/^[A-D][\)\.]\s*/i,"").trim()).filter(Boolean);
          if (out.length >= 2) choices = out;
        }
      }
      let correctIndex = -1;
      const corrMatch = block.match(/Correct Answer\:\s*([A-D]|[1-4]|[a-d])/i)
        || block.match(/Answer\:\s*([A-D]|[1-4]|[a-d])/i)
        || block.match(/Correct\:\s*([A-D]|[1-4]|[a-d])/i);
      if (corrMatch) {
        const v = corrMatch[1].toString().trim();
        if (/^[A-Da-d]$/.test(v)) correctIndex = v.toUpperCase().charCodeAt(0) - 65;
        else if (/^[1-4]$/.test(v)) correctIndex = Number(v) - 1;
      } else correctIndex = 0;
      if (choices.length === 0) {
        const afterQuestion = block.replace(/^(?:Q\d+[\.\)]\s*)?(?:\d+[\.\)]\s*)?(.*)/i, "$1").split(/\n/).slice(1).join(" ").trim();
        if (afterQuestion) {
          const guessed = afterQuestion.split(/\s*[;\|\/]\s*|,\s*/).map(s => s.trim()).filter(Boolean);
          if (guessed.length >= 2 && guessed.length <= 6) choices = guessed;
        }
      }
      if (!possibleQuestion && choices.length === 0) continue;
      if (choices.length > 6) choices = choices.slice(0, 6);
      if (correctIndex < 0 || correctIndex >= choices.length) correctIndex = 0;
      parsed.push({ text: possibleQuestion || block.split("\n")[0].trim(), choices, correctIndex });
    }
    return parsed;
  }

  // ---------------- Render ----------------
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-white">Quiz Host</h1>

      {/* Create game */}
      <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="font-medium mb-2 text-white">Create a new game</h3>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g., Photosynthesis)"
            className="flex-1 p-2 border rounded-lg bg-gray-700 border-gray-600 text-white"
          />
          <button onClick={createGame} disabled={creatingGame} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            {creatingGame ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      {/* Games list */}
      <div className="mb-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="font-medium mb-3 text-white">Your Games</h3>
        {games.length === 0 ? (
          <div className="text-sm text-gray-400">No games yet — create one above.</div>
        ) : (
          <div className="space-y-2">
            {games.map((g) => (
              <div key={g.id} className={`p-3 rounded-lg border ${g.id === activeGameId ? "border-blue-500" : "border-gray-700"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{g.topic}</div>
                    <div className="text-xs text-gray-400">Created: {g.createdAt?.toDate ? g.createdAt.toDate().toLocaleString() : "-"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveGameId(g.id)} className="px-3 py-1 bg-gray-700 text-white rounded">Select</button>
                    <button onClick={() => generateQuestions(g.id)} className="px-3 py-1 bg-green-600 text-white rounded">
                      {generating ? "Generating..." : "Generate"}
                    </button>
                    <button onClick={() => deleteGame(g.id)} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Game Panel */}
      {activeGameId && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">Active Game</h3>
              <p className="text-sm text-gray-400">{games.find(g => g.id === activeGameId)?.topic || activeGameId}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-gray-400">Game ID:</div>
                <div className="font-mono text-sm px-2 py-1 bg-gray-700 rounded text-white">{activeGameId}</div>
                <button
                  onClick={() => { navigator.clipboard.writeText(activeGameId); alert('Copied game ID'); }}
                  className="px-2 py-1 bg-blue-600 text-white rounded"
                >
                  Copy
                </button>
                <button
                  onClick={() => setShowAddQuestion((s) => !s)}
                  className="px-2 py-1 bg-yellow-600 text-white rounded"
                >
                  {showAddQuestion ? "Close" : "Add Question"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => endGame(activeGameId)} className="px-3 py-1 bg-red-600 text-white rounded">End Game</button>
            </div>
          </div>

          {/* Add Question form (toggle) */}
          {showAddQuestion && (
            <div className="mb-4 p-4 rounded-lg bg-gray-700 border border-gray-600">
              <h4 className="font-medium mb-2 text-white">Add Question</h4>
              <div className="space-y-3">
                <textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="Question text"
                  className="w-full p-2 bg-gray-800 border rounded text-white"
                  rows={3}
                />
                <div>
                  <label className="text-sm text-gray-400">Choices</label>
                  <div className="space-y-2 mt-2">
                    {newChoices.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-6 text-sm text-white">{String.fromCharCode(65 + idx)}.</div>
                        <input
                          value={c}
                          onChange={(e) => setChoice(idx, e.target.value)}
                          placeholder={`Choice ${idx + 1}`}
                          className="flex-1 p-2 bg-gray-800 border rounded text-white"
                        />
                        {newChoices.length > 2 && (
                          <button onClick={() => removeChoiceField(idx)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <div>
                      <button onClick={addChoiceField} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Add choice</button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Correct choice index</label>
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, newChoices.length - 1)}
                      value={newCorrectIndex}
                      onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
                      className="ml-2 w-20 p-1 text-sm rounded border bg-gray-800 text-white"
                    />
                    <div className="text-xs text-gray-400 mt-1">0-based index (0 = first choice)</div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Duration (sec)</label>
                    <input
                      type="number"
                      min={5}
                      max={300}
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="ml-2 w-28 p-1 text-sm rounded border bg-gray-800 text-white"
                    />
                  </div>

                  <div className="ml-auto">
                    <button
                      onClick={addQuestion}
                      className="px-4 py-2 bg-green-600 text-white rounded"
                      disabled={addingQuestion}
                    >
                      {addingQuestion ? "Adding..." : "Add Question"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Questions list */}
          <div className="mb-4">
            <h4 className="font-medium mb-2 text-white">Questions</h4>
            {questions.length === 0 ? (
              <div className="text-sm text-gray-400">No questions yet. Use Generate to create AI questions or Add Question to create manually.</div>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => (
                  <div key={q.id} className="p-3 rounded-lg border border-gray-700 bg-gray-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm text-white">{q.text}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Choices: {q.choices?.map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`).join("  |  ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startQuestion(activeGameId, q.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                        >
                          Start
                        </button>
                        <div className="text-xs text-gray-400">Correct: {typeof q.correctIndex === "number" ? String.fromCharCode(65 + q.correctIndex) : "-"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div>
            <h4 className="font-medium mb-2 text-white">Live Leaderboard</h4>
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-sm text-gray-400">No players joined yet.</div>
              ) : (
                leaderboard.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded border border-gray-700 bg-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold text-white">{(p.name || p.displayName || "S").charAt(0)}</div>
                      <div>
                        <div className="font-medium text-white">{p.name || p.displayName || "Student"}</div>
                        <div className="text-xs text-gray-400">UID: {p.uid}</div>
                        {p.lastQuestionId && <div className="text-xs text-gray-400">LastQ: {p.lastQuestionId}</div>}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-white">{p.score || 0} pts</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={() => awardPointsClient(activeGameId, 1)} className="px-3 py-1 bg-yellow-600 text-white rounded">Award points (client)</button>
              <button onClick={() => awardPointsServer(activeGameId, 1)} className="px-3 py-1 bg-green-600 text-white rounded">Award points (server)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
