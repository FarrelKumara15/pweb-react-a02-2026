import { useEffect, useState } from "react";

const INTERVIEW_QUESTIONS = [
  "Ceritakan proyek web atau aplikasi paling menantang yang pernah kamu kerjakan dan peranmu di dalamnya.",
  "Bagaimana cara kerja state, props, dan re-rendering di React? Kapan kamu memakai useEffect atau useRef?",
  "Apa keuntungan TypeScript strict mode dibanding JavaScript biasa saat membangun aplikasi tim?",
  "Ceritakan pengalamanmu saat menghadapi bug yang sulit ditemukan. Bagaimana langkah debugging-mu?",
  "Jika deadline tinggal dua hari dan ada fitur yang belum selesai, bagaimana kamu memprioritaskannya?",
  "Mengapa kamu tertarik magang di posisi dan perusahaan ini, serta skill apa yang ingin kamu kembangkan?",
];

const INITIAL_SECONDS = 120;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function InterviewPrepTimer() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
  }

  function handleNextQuestion() {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
    setQuestionIndex((prev) => (prev + 1) % INTERVIEW_QUESTIONS.length);
  }

  return (
    <div className="prep-timer">
      <div className="prep-question-card">
        <span className="eyebrow">
          PERTANYAAN {questionIndex + 1} DARI {INTERVIEW_QUESTIONS.length}
        </span>
        <p className="prep-question">{INTERVIEW_QUESTIONS[questionIndex]}</p>
      </div>
      <div className="prep-clock-row">
        <div>
          <span className="small">Sisa waktu menjawab</span>
          <strong
            className={`prep-clock ${secondsLeft === 0 ? "expired" : ""}`}
            aria-live="polite"
          >
            {formatTime(secondsLeft)}
          </strong>
        </div>
        <div className="prep-controls">
          <button
            type="button"
            className="button primary"
            onClick={() => setIsRunning((prev) => !prev)}
            disabled={secondsLeft === 0}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={handleNextQuestion}
          >
            Soal Berikutnya
          </button>
        </div>
      </div>
      {secondsLeft === 0 && (
        <p className="field-error" role="status">
          Waktu habis! Klik Reset atau Soal Berikutnya untuk lanjut latihan.
        </p>
      )}
    </div>
  );
}
