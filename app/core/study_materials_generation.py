import json
import os
from typing import TypedDict

from groq import Groq

from app.core.config import get_groq_client


class Flashcard(TypedDict):
    question: str
    answer: str


class QuizQuestion(TypedDict):
    question: str
    options: list[str]
    correct_answer: str


class StudyMaterials(TypedDict):
    flashcards: list[Flashcard]
    quiz_questions: list[QuizQuestion]


def generate_study_materials(subject: str) -> StudyMaterials:
    """
    Generate study materials for a given subject using Groq API.

    Args:
        subject: The subject to generate materials for

    Returns:
        StudyMaterials: Generated flashcards and quiz questions
    """
    try:
        client = get_groq_client()
    except ValueError:
        return generate_mock_study_materials(subject)

    prompt = f"""Generate 3 flashcards and 3 quiz questions about {subject}.

Return ONLY a valid JSON object with this exact structure (no additional text):
{{
    "flashcards": [
        {{"question": "question text", "answer": "answer text"}},
        {{"question": "question text", "answer": "answer text"}},
        {{"question": "question text", "answer": "answer text"}}
    ],
    "quiz_questions": [
        {{
            "question": "question text",
            "options": ["option 1", "option 2", "option 3", "option 4"],
            "correct_answer": "correct option"
        }},
        {{
            "question": "question text",
            "options": ["option 1", "option 2", "option 3", "option 4"],
            "correct_answer": "correct option"
        }},
        {{
            "question": "question text",
            "options": ["option 1", "option 2", "option 3", "option 4"],
            "correct_answer": "correct option"
        }}
    ]
}}

Make sure the correct_answer matches exactly one of the options.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert educator. Generate study materials in JSON format only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        result = json.loads(content)

        flashcards = result.get("flashcards", [])
        quiz_questions = result.get("quiz_questions", [])

        return {
            "flashcards": flashcards[:3] if len(flashcards) > 3 else flashcards,
            "quiz_questions": quiz_questions[:3]
            if len(quiz_questions) > 3
            else quiz_questions,
        }

    except Exception as e:
        print(f"Groq API error: {e}")
        return generate_mock_study_materials(subject)


def generate_mock_study_materials(subject: str) -> StudyMaterials:
    """Generate mock study materials for a given subject."""
    flashcards = [
        {
            "question": f"What is the first key concept of {subject}?",
            "answer": f"This is a mock answer for the first concept of {subject}.",
        },
        {
            "question": f"What is the second important aspect of {subject}?",
            "answer": f"This is a mock answer for the second aspect of {subject}.",
        },
        {
            "question": f"How does {subject} relate to real-world applications?",
            "answer": f"The real-world applications of {subject} include practical implementations and use cases.",
        },
    ]

    quiz_questions = [
        {
            "question": f"Which of the following best defines {subject}?",
            "options": [
                f"Definition A of {subject}",
                f"Definition B of {subject}",
                f"Definition C of {subject}",
                f"Definition D of {subject}",
            ],
            "correct_answer": f"Definition A of {subject}",
        },
        {
            "question": f"What is an example of {subject} in practice?",
            "options": [
                f"Example 1 of {subject}",
                f"Example 2 of {subject}",
                f"Example 3 of {subject}",
                f"Example 4 of {subject}",
            ],
            "correct_answer": f"Example 1 of {subject}",
        },
        {
            "question": f"How is {subject} typically used?",
            "options": [
                f"Use case A for {subject}",
                f"Use case B for {subject}",
                f"Use case C for {subject}",
                f"Use case D for {subject}",
            ],
            "correct_answer": f"Use case A for {subject}",
        },
    ]

    return {"flashcards": flashcards, "quiz_questions": quiz_questions}
