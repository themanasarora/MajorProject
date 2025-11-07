// src/pages/StudentQuiz.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const StudentQuiz = () => {
  const { userData, loading: authLoading } = useAuth();
  const [quizCode, setQuizCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [listenerError, setListenerError] = useState(null);

  // Listen to the current quiz in real-time
  useEffect(() => {
    // only attach listener if there's a quiz code and user is signed in
    if (!quizCode || authLoading) return;

    setListenerError(null);
    const quizDocRef = doc(db, "live_quizzes", quizCode);

    // quick pre-check: try to read once to show clearer permission error if any
    (async () => {
      try {
        const snap = await getDoc(quizDocRef);
        if (!snap.exists()) {
          console.warn("Quiz doc does not exist:", quizCode);
        }
      } catch (err) {
        console.error("Initial quiz read failed:", err);
        setListenerError(err.message || "Permission error reading quiz");
      }
    })();

    const unsub = onSnapshot(
      quizDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          // adapt to shape: currentQuestion may be a map/object on root doc
          const data = docSnap.data();
          setCurrentQuestion(data.currentQuestion || null);
        } else {
          setCurrentQuestion(null);
        }
      },
      (err) => {
        console.error("Error in quiz listener:", err);
        setListenerError(err.message || "Realtime listener error");
      }
    );

    return () => unsub();
  }, [quizCode, authLoading]);

  const joinQuiz = async (e) => {
    e.preventDefault();
    if (!quizCode.trim()) return;
    if (!userData?.uid) {
      alert("You must be signed in to join the quiz.");
      return;
    }

    setLoading(true);
    try {
      // Use UID as the player document id so updates later can target it reliably.
      const playerId = userData.uid;
      const playerDocRef = doc(db, "live_quizzes", quizCode, "players", playerId);

      await setDoc(playerDocRef, {
        uid: userData.uid,
        name: userData.name || userData.email?.split("@")[0] || "Student",
        joinedAt: serverTimestamp(),
        score: 0
      });

      setJoined(true);
    } catch (err) {
      console.error("Error joining quiz:", err);
      alert("Failed to join quiz: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !selectedOption) return;

    try {
      const correct = selectedOption === currentQuestion.correctAnswer;
      setFeedback(correct ? "✅ Correct!" : "❌ Incorrect!");

      // update player doc by UID (we used UID as doc id above)
      const playerDoc = doc(db, "live_quizzes", quizCode, "players", userData.uid);
      await updateDoc(playerDoc, {
        lastAnswer: selectedOption,
        lastResult: correct,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error submitting answer:", err);
      alert("Failed to submit answer: " + (err.message || err));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-gray-800 rounded-2xl shadow-lg p-8">
        {!joined ? (
          <>
            <h1 className="text-3xl font-bold mb-4 text-center">🎮 Join Live Quiz</h1>
            <form onSubmit={joinQuiz} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Enter Quiz Code"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.trim())}
                className="p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg font-semibold"
              >
                {loading ? "Joining..." : "Join Quiz"}
              </button>
              {listenerError && <p className="text-sm text-yellow-300 mt-2">Listener error: {listenerError}</p>}
            </form>
          </>
        ) : (
          <>
            {currentQuestion ? (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">{currentQuestion.question}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 rounded-lg border transition-all ${
                        selectedOption === opt
                          ? "bg-indigo-600 border-indigo-400"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitAnswer}
                  className="bg-green-600 hover:bg-green-700 py-2 px-6 rounded-lg font-semibold"
                >
                  Submit
                </button>
                {feedback && <p className="text-xl mt-4">{feedback}</p>}
              </div>
            ) : (
              <p className="text-center text-gray-400">Waiting for question...</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentQuiz;
