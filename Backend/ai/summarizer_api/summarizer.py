from transformers import BartForConditionalGeneration, BartTokenizer
import re
import logging
import random

# Optional: enable logging for debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Summarizer:
    def __init__(self):
        self.model_name = "facebook/bart-large-cnn"
        self.tokenizer = BartTokenizer.from_pretrained(self.model_name)
        self.model = BartForConditionalGeneration.from_pretrained(self.model_name)

    def summarize(self, text: str) -> dict:
        # Truncate the input if it's too long (BART handles ~1024 tokens)
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            max_length=1024,
            truncation=True
        )

        # Generate a longer summary to ensure we have enough content
        summary_ids = self.model.generate(
            inputs['input_ids'],
            num_beams=5,
            max_length=400,
            early_stopping=True,
            no_repeat_ngram_size=2,
            length_penalty=1.5
        )

        summary_text = self.tokenizer.decode(
            summary_ids[0],
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True
        )

        bullet_points = self._to_bullet_points(summary_text)
        flash_cards = self._generate_flash_cards(text, summary_text)

        return {
            "summary": summary_text,
            "bullet_points": bullet_points,
            "flash_cards": flash_cards
        }

    def _to_bullet_points(self, text: str) -> list:
        # Normalize and clean text into a list of bullet points
        text = text.strip()
        text = re.sub(r'\s+', ' ', text)
        sentences = re.split(r'(?<=[.!?]) +', text)
        points = []

        for s in sentences:
            s = s.strip()
            if s:
                if not s.endswith(('.', '!', '?')):
                    s += '.'
                points.append(f"* {s[0].upper() + s[1:]}")
        
        if len(points) < 5:
            new_points = []
            for point in points:
                if len(new_points) >= 5:
                    break
                if len(point) > 150:
                    parts = re.split(r'[,;]', point)
                    for part in parts:
                        part = part.strip()
                        if part:
                            new_points.append(f"* {part[0].upper() + part[1:]}")
                            if len(new_points) >= 5:
                                break
                else:
                    new_points.append(point)
            points = new_points[:5]
        
        return points[:10]

    def _generate_flash_cards(self, original_text: str, summary_text: str) -> list:
        # Extract key concepts and facts for flash cards
        sentences = re.split(r'(?<=[.!?]) +', original_text)
        summary_sentences = re.split(r'(?<=[.!?]) +', summary_text)
        
        # Combine original and summary sentences
        all_sentences = [s.strip() for s in sentences + summary_sentences if s.strip()]
        
        flash_cards = []
        used_questions = set()
        
        # Generate question-answer pairs
        for sentence in all_sentences:
            if len(flash_cards) >= 5:  # Limit to 5 flash cards
                break
            
            # Skip very short sentences
            if len(sentence.split()) < 8:
                continue
                
            # Create definition cards
            noun_phrases = self._extract_noun_phrases(sentence)
            for phrase in noun_phrases:
                if len(flash_cards) >= 5:
                    break
                question = f"What is {phrase}?"
                if question not in used_questions:
                    flash_cards.append({
                        "question": question,
                        "answer": sentence
                    })
                    used_questions.add(question)
            
            # Create fill-in-the-blank cards
            if len(flash_cards) < 5:
                blank_sentence = self._create_blank(sentence)
                if blank_sentence and blank_sentence != sentence:
                    question = f"Fill in the blank: {blank_sentence}"
                    if question not in used_questions:
                        flash_cards.append({
                            "question": question,
                            "answer": sentence
                        })
                        used_questions.add(question)
        
        # If we still don't have enough, create simpler cards
        if len(flash_cards) < 5:
            for sentence in all_sentences:
                if len(flash_cards) >= 5:
                    break
                if sentence not in used_questions:
                    question = f"What is the main idea of: '{sentence[:100]}...'?"
                    flash_cards.append({
                        "question": question,
                        "answer": sentence
                    })
                    used_questions.add(sentence)
        
        return flash_cards[:5]  # Return max 5 flash cards

    def _extract_noun_phrases(self, sentence: str) -> list:
        # Simple pattern to find noun phrases (improve with proper NLP if needed)
        pattern = r'\b(?:The|the|A|a|An|an)?\s+[\w-]+\s+(?:[\w-]+\s+)*[\w-]+\b'
        matches = re.findall(pattern, sentence)
        # Filter out too short phrases and duplicates
        return list({m.strip() for m in matches if len(m.split()) >= 2})

    def _create_blank(self, sentence: str) -> str:
        words = sentence.split()
        if len(words) < 5:
            return sentence
            
        # Select a significant word to blank out (not first/last, not too short)
        candidates = [i for i, word in enumerate(words[1:-1], 1) 
                    if len(word) > 4 and word[-1] not in ',;.!?']
        if not candidates:
            return sentence
            
        blank_pos = random.choice(candidates)
        words[blank_pos] = "_____"
        return ' '.join(words)