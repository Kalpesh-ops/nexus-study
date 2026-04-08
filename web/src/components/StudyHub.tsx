"use client"

import { useState } from "react"
import { RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Flashcard {
  id: string
  question: string
  answer: string
}

const flashcards: Flashcard[] = [
  { id: "1", question: "What is the time complexity of binary search?", answer: "O(log n)" },
  { id: "2", question: "What is a hash table?", answer: "A data structure that maps keys to values using a hash function." },
  { id: "3", question: "What is the difference between stack and queue?", answer: "Stack is LIFO (Last In First Out), Queue is FIFO (First In First Out)." },
  { id: "4", question: "What is recursion?", answer: "A function that calls itself to solve smaller subproblems." },
  { id: "5", question: "What is Big O notation?", answer: "A mathematical notation that describes the upper bound of an algorithm's time or space complexity." },
]

const quizQuestions = [
  {
    id: "1",
    question: "Which data structure uses LIFO?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    correctAnswer: 1,
  },
  {
    id: "2",
    question: "What is the worst-case time complexity of quick sort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    correctAnswer: 2,
  },
  {
    id: "3",
    question: "Which algorithm is used to find the shortest path in a weighted graph?",
    options: ["DFS", "BFS", "Dijkstra", "Binary Search"],
    correctAnswer: 2,
  },
]

export function StudyHub() {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<number[]>([])

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