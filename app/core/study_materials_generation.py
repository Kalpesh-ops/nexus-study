from typing import TypedDict


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


def generate_mock_study_materials(subject: str) -> StudyMaterials:
    """
    Generate mock study materials for a given subject.
    
    This is a placeholder function that will be replaced with real LLM API calls.
    
    Args:
        subject: The subject to generate materials for
        
    Returns:
        StudyMaterials: Generated flashcards and quiz questions
    """
    # Mock flashcards
    flashcards = [
        {
            "question": f"What is the first key concept of {subject}?",
            "answer": f"This is a mock answer for the first concept of {subject}."
        },
        {
            "question": f"What is the second important aspect of {subject}?",
            "answer": f"This is a mock answer for the second aspect of {subject}."
        },
        {
            "question": f"How does {subject} relate to real-world applications?",
            "answer": f"The real-world applications of {subject} include practical implementations and use cases."
        }
    ]
    
    # Mock quiz questions
    quiz_questions = [
        {
            "question": f"Which of the following best defines {subject}?",
            "options": [
                f"Definition A of {subject}",
                f"Definition B of {subject}",
                f"Definition C of {subject}",
                f"Definition D of {subject}"
            ],
            "correct_answer": f"Definition A of {subject}"
        },
        {
            "question": f"What is an example of {subject} in practice?",
            "options": [
                f"Example 1 of {subject}",
                f"Example 2 of {subject}",
                f"Example 3 of {subject}",
                f"Example 4 of {subject}"
            ],
            "correct_answer": f"Example 1 of {subject}"
        },
        {
            "question": f"How is {subject} typically used?",
            "options": [
                f"Use case A for {subject}",
                f"Use case B for {subject}",
                f"Use case C for {subject}",
                f"Use case D for {subject}"
            ],
            "correct_answer": f"Use case A for {subject}"
        }
    ]
    
    return {
        "flashcards": flashcards,
        "quiz_questions": quiz_questions
    }
