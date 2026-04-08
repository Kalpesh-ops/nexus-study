"use client"

import { useEffect, useMemo, useState } from "react"
import { RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: string
  question: string
  answer: string
}

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

interface GenerateResponse {
  flashcards: Array<{ question: string; answer: string }>
  quiz_questions: Array<{ question: string; options: string[]; correct_answer: string }>
}

interface StudyHubProps {
  subject: string
  apiBaseUrl: string
}

export function StudyHub({ subject, apiBaseUrl }: StudyHubProps) {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasSubject = useMemo(() => !!subject.trim(), [subject])

  useEffect(() => {
    const loadStudyMaterials = async () => {
      if (!hasSubject) {
        setFlashcards([])
        setQuizQuestions([])
        setQuizAnswers([])
        setCurrentCard(0)
        setIsFlipped(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${apiBaseUrl}/study-materials/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ subject }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          const message = typeof body.detail === "string" ? body.detail : "Failed to load study materials"
          throw new Error(message)
        }

        const data = (await response.json()) as GenerateResponse

        setFlashcards(
          (data.flashcards || []).map((card, index) => ({
            id: String(index + 1),
            question: card.question,
            answer: card.answer,
          }))
        )

        setQuizQuestions(
          (data.quiz_questions || []).map((q, index) => ({
            id: String(index + 1),
            question: q.question,
            options: q.options,
            correctAnswer: Math.max(0, q.options.findIndex((opt) => opt === q.correct_answer)),
          }))
        )
        setCurrentCard(0)
        setIsFlipped(false)
        setQuizAnswers([])
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load study materials"
        setError(message)
        setFlashcards([])
        setQuizQuestions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadStudyMaterials()
  }, [apiBaseUrl, hasSubject, subject])

  const handleNextCard = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCard((prev) => (prev + 1) % flashcards.length)
    }, 150)
  }

  const handlePrevCard = () => {
    setIsFlipped(false)
    setTimeout(() => {
      setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length)
    }, 150)
  }

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers]
    newAnswers[questionIndex] = answerIndex
    setQuizAnswers(newAnswers)
  }

  const getScore = () => {
    return quizQuestions.reduce((score, q, i) => {
      return score + (quizAnswers[i] === q.correctAnswer ? 1 : 0)
    }, 0)
  }

  if (!hasSubject) {
    return <p className="text-sm text-muted-foreground">Enter a subject and start matching to load AI study materials.</p>
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading study materials for {subject}...</p>
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>
  }

  if (flashcards.length === 0 || quizQuestions.length === 0) {
    return <p className="text-sm text-muted-foreground">No study content found for this subject yet.</p>
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Flashcards</h3>
          <span className="text-sm text-muted-foreground">
            {currentCard + 1} / {flashcards.length}
          </span>
        </div>

        <div 
          onClick={handleFlip}
          className="relative h-48 cursor-pointer perspective-1000"
        >
          <div
            className={cn(
              "absolute inset-0 transition-transform duration-500 transform-style-preserve-3d",
              isFlipped && "rotate-y-180"
            )}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-card to-muted rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center shadow-xl">
              <p className="text-lg font-medium text-foreground">
                {flashcards[currentCard].question}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Click to reveal answer
              </p>
            </div>

            <div 
              className="absolute inset-0 backface-hidden bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/30 p-6 flex flex-col items-center justify-center text-center shadow-xl rotate-y-180"
              style={{ transform: "rotateY(180deg)" }}
            >
              <p className="text-lg font-semibold text-primary">
                {flashcards[currentCard].answer}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={handlePrevCard}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => {
              setCurrentCard(0)
              setIsFlipped(false)
            }}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={handleNextCard}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Quick Quiz</h3>
          {quizAnswers.filter((a, i) => a === quizQuestions[i].correctAnswer).length > 0 && (
            <span className="text-sm text-primary font-medium">
              Score: {getScore()}/{quizQuestions.length}
            </span>
          )}
        </div>

        <div className="space-y-6">
          {quizQuestions.map((q, qIndex) => (
            <div key={q.id} className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {qIndex + 1}. {q.question}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((option, oIndex) => {
                  const isSelected = quizAnswers[qIndex] === oIndex
                  const isCorrect = q.correctAnswer === oIndex
                  const showResult = quizAnswers[qIndex] !== undefined

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleQuizAnswer(qIndex, oIndex)}
                      disabled={quizAnswers[qIndex] !== undefined}
                      className={cn(
                        "p-3 rounded-lg text-sm text-left transition-all",
                        "border",
                        showResult
                          ? isCorrect
                            ? "bg-green-500/20 border-green-500 text-green-400"
                            : isSelected && !isCorrect
                            ? "bg-red-500/20 border-red-500 text-red-400"
                            : "bg-secondary border-border text-muted-foreground"
                          : isSelected
                          ? "bg-primary/20 border-primary text-primary"
                          : "bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {showResult && (
                          isCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : isSelected ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : null
                        )}
                        {option}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}