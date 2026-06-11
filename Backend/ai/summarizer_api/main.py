from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import logging
from summarizer import Summarizer

# Initialize FastAPI app
app = FastAPI()
summarizer = Summarizer()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Request schema
class TextInput(BaseModel):
    passage: str

@app.post("/summarize")
def summarize_text(data: TextInput):
    text = data.passage.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Passage cannot be empty.")
    
    try:
        logger.info(f"Summarizing text of length: {len(text)} characters")
        result = summarizer.summarize(text)

        bullet_points = result.get("bullet_points", [])
        if len(bullet_points) < 5:
            logger.warning(f"Received only {len(bullet_points)} bullet points, expected at least 5")
            if len(bullet_points) > 0:
                enhanced_points = []
                for point in bullet_points:
                    if len(enhanced_points) >= 5:
                        break
                    if len(point) > 100:
                        parts = point.split('. ')
                        for part in parts:
                            if part and len(enhanced_points) < 5:
                                enhanced_points.append(part)
                    else:
                        enhanced_points.append(point)
                bullet_points = enhanced_points[:5]
            
            if len(bullet_points) < 5:
                summary_sentences = result["summary"].split('. ')
                for sent in summary_sentences:
                    if sent and len(bullet_points) < 5:
                        bullet_points.append(sent)
            
            bullet_points = [f"* {p[0].upper() + p[1:]}" if p else p for p in bullet_points[:5]]
            result["bullet_points"] = bullet_points

        flash_cards = result.get("flash_cards", [])
        if len(flash_cards) < 3:  # Ensure at least 3 flash cards
            logger.warning(f"Only generated {len(flash_cards)} flash cards")
            # Create simple flash cards from bullet points if needed
            for point in bullet_points:
                if len(flash_cards) >= 3:
                    break
                clean_point = point.replace('* ', '').strip()
                if clean_point.endswith('.'):
                    clean_point = clean_point[:-1]
                flash_cards.append({
                    "question": f"What is the significance of: '{clean_point[:80]}'?",
                    "answer": clean_point
                })
            result["flash_cards"] = flash_cards[:3]

        return {
            "summary": result["summary"],
            "bullet_points": bullet_points[:10],
            "flash_cards": result["flash_cards"]
        }

    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Summarization failed due to internal error."
        )