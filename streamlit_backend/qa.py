"""
QA module implementing a simple rule-based conversational interface for disparity queries.
Provides a light NLP-capable skeleton: keyword-based intent extraction and optional transformer-backed
answering when a model is available.
"""
"""
QA module implementing a transformer-based conversational interface for disparity queries.
This version uses a pre-trained model from Hugging Face to perform question-answering.
"""
import pandas as pd
from transformers import pipeline, AutoTokenizer, AutoModelForQuestionAnswering
from typing import Optional

# Initialize the QA pipeline with a compact model suitable for an MVP
# Using a smaller, distilled model for faster inference and lower resource usage.
MODEL_NAME = "distilbert-base-cased-distilled-squad"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForQuestionAnswering.from_pretrained(MODEL_NAME)
qa_pipeline = pipeline("question-answering", model=model, tokenizer=tokenizer)

def answer_query(df: pd.DataFrame, query: str, default_year: Optional[int]=None) -> str:
    """
    Return a human-readable answer to disparity queries using the provided dataset
    and a transformer-based question-answering model.
    
    This version expects a pre-aggregated and privacy-suppressed DataFrame.
    """
    # Filter out suppressed data before answering
    df_safe = df[df['suppressed'] == False].copy()
    if df_safe.empty:
        return "Sorry, there is not enough data to answer this query without violating privacy rules."

    # For the model to work, we need to convert our structured data (DataFrame)
    # into a semi-structured text "context" that the model can read.
    # We'll create a descriptive paragraph for each row in the DataFrame.
    
    context_lines = []
    for _, row in df_safe.iterrows():
        # Ensure all data is string and handle potential missing values
        state = str(row.get('state', 'N/A'))
        year = str(row.get('year', 'N/A'))
        cases = f"{row.get('cases', 0):.0f}"
        population = f"{row.get('population', 0):.0f}"
        rate = f"{row.get('rate', 0):.3%}"
        
        context_lines.append(
            f"In {state} during the year {year}, there were {cases} cases out of a population of {population}, resulting in a rate of {rate}."
        )
    
    context = " ".join(context_lines)

    # If the context is too short or empty, we can't answer.
    if len(context.strip()) < 20:
        return "I could not find enough specific data to answer your question. Please try a broader query."

    # Use the QA pipeline to find the answer within the generated context
    result = qa_pipeline(question=query, context=context)

    # Format the answer for display
    answer = result['answer'].strip()
    confidence = result['score']

    if confidence < 0.1: # Low confidence threshold
        return f"I'm not very confident, but I believe the answer is: {answer}. (Confidence: {confidence:.2%})"
    
    # Capitalize the first letter of the answer for better readability
    if answer:
        answer = answer[0].upper() + answer[1:]

    return f"{answer} (based on the available data with a confidence of {confidence:.2%})"

