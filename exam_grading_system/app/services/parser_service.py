import re
from app.models.schemas import QuestionData, SubAnswer

def parse_question_paper(text_lines):
    """
    Parses 2_1_1_English L & L.pdf structure
    """
    questions = []
    current_q = None
    
    # Regex for "1. Text..."
    q_pattern = re.compile(r'^\s*(\d+)\.\s*(.*)')
    
    for line in text_lines:
        match = q_pattern.match(line)
        if match:
            # Save previous if exists
            if current_q:
                questions.append(current_q)
            current_q = QuestionData(q_no=match.group(1), text=match.group(2))
        elif current_q:
            # Append text to current question (simplified)
            current_q.text += " " + line
            
    if current_q:
        questions.append(current_q)
    return questions

def parse_answer_sheet(text_lines):
    """
    Parses eng_1.pdf (Handwritten)
    Pattern: Q6 or 6 or Ans 6
    """
    answers = {}
    # Regex for "Ans 6", "Q6", "Question 6", or just "6" at start
    ans_pattern = re.compile(r'^\s*(?:Ans\s*|Q\s*|Question\s*)?(\d+)', re.IGNORECASE)
    
    for line in text_lines:
        match = ans_pattern.match(line.strip())
        if match:
            q_no = match.group(1)
            if q_no not in answers:
                answers[q_no] = QuestionData(
                    q_no=q_no, 
                    text=line.strip(),
                    subparts=[]
                )
            
    return list(answers.values())