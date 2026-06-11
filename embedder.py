from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import pipeline

app = FastAPI()

# Load the updated Sentence Transformer model for embeddings
model = SentenceTransformer("BAAI/bge-large-en-v1.5")

# Load the zero-shot classification model
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

class TextRequest(BaseModel):
    text: str

@app.post("/classify/")
async def classify_text(request: TextRequest):
    user_input = request.text.lower()

    # Improved intent labels
    labels = ["greeting", "course recommendation", "learning inquiry", "career guidance", "technical question", "general"]

    # Standardize input
    user_input = user_input.strip().lower()
    if not user_input.endswith("."):
        user_input += "."

    # Get intent classification result
    result = classifier(user_input, labels)
    top_intent = result["labels"][0]  
    confidence = result["scores"][0]  

    # Debugging log
    print(f"User Input: {user_input}, Classified as: {top_intent} (Confidence: {confidence:.2f})")

    # Handle Greetings Dynamically
    if top_intent == "greeting":
        if "morning" in user_input:
            return {"intent": "greeting", "response": "Good morning! Hope you have a productive day! 🌅"}
        elif "afternoon" in user_input:
            return {"intent": "greeting", "response": "Good afternoon! How can I assist you? ☀️"}
        elif "evening" in user_input:
            return {"intent": "greeting", "response": "Good evening! Ready to learn something new? 🌙"}
        elif "night" in user_input:
            return {"intent": "greeting", "response": "Good night! Have a restful sleep. 😴"}
        else:
            return {"intent": "greeting", "response": "Hello! How can I help you today? 😊"}

    if top_intent == "general":
        return {"intent": "general", "response": "I'm here to help! Let me know what you need assistance with. 🤖"}

    # Handle Course Recommendations & General Queries
    if top_intent in ["course recommendation", "learning inquiry", "career guidance", "technical question"] and confidence > 0.30:
        return {"intent": "course_query"}
    
    return {"intent": "general", "response": "I'm here to help! Let me know what you need assistance with. 🤖"}

@app.post("/embed/")
async def get_embedding(request: TextRequest):
    formatted_text = f"query: {request.text}"
    embedding = model.encode(formatted_text, normalize_embeddings=True).tolist()
    return {"embedding": embedding}