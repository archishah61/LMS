const dotenv = require("dotenv");
dotenv.config();

function generateFlashcardsFromPassage(passage, count = 5) {
  const sentences = passage.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s+/);
  const flashcards = [];
  const used = new Set();

  const keyTerms = extractKeyTerms(passage);

  // Shuffle the keyTerms to avoid always picking the same terms first
  const shuffledKeyTerms = keyTerms.sort(() => 0.5 - Math.random());

  for (const term of shuffledKeyTerms) {
    if (flashcards.length >= count) break;
    const key = term.toLowerCase();
    if (!used.has(key)) {
      const context = findTermContext(term, sentences);
      if (context) {
        flashcards.push({
          question: getRandomQuestionType(term),
          answer: context
        });
        used.add(key);
      }
    }
  }

  // Use findImportantNounPhrase to find additional significant phrases
  for (let sentence of sentences) {
    if (flashcards.length >= count) break;
    const nounPhrase = findImportantNounPhrase(sentence);
    if (nounPhrase && !used.has(nounPhrase.toLowerCase())) {
      const context = findTermContext(nounPhrase, sentences);
      if (context) {
        flashcards.push({
          question: getRandomQuestionType(nounPhrase),
          answer: context
        });
        used.add(nounPhrase.toLowerCase());
      }
    }
  }

  // Function to get a random question type
  function getRandomQuestionType(term) {
    const questionTypes = [
      `Explain the concept of ${term}:`,
      `What is the significance of ${term}?`,
      `Define ${term} in your own words:`,
      `How does ${term} relate to the overall topic?`,
      `Provide an example of ${term}:`
    ];
    return questionTypes[Math.floor(Math.random() * questionTypes.length)];
  }

  return flashcards;
}

function extractKeyTerms(passage) {
  const properNouns = passage.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g) || [];
  const words = passage.split(/\s+/);
  const keyWords = words.filter(w =>
    w.length > 6 &&
    !commonWords.has(w.toLowerCase()) &&
    !w.match(/^[0-9.,]+$/)
  );
  return [...new Set([...properNouns, ...keyWords])];
}

function findTermContext(term, sentences) {
  const contextSentence = sentences.find(s =>
    s.includes(term) &&
    s.split(' ').length > 8
  );
  if (contextSentence) return contextSentence.trim();
  const anySentence = sentences.find(s => s.includes(term));
  return anySentence ? anySentence.trim() : null;
}

function findImportantNounPhrase(sentence) {
  const words = sentence.split(' ');
  let longestPhrase = '';
  let currentPhrase = '';

  for (const word of words) {
    if (/^[A-Z]/.test(word) || word.length > 5) {
      currentPhrase += (currentPhrase ? ' ' : '') + word;
      if (currentPhrase.length > longestPhrase.length) {
        longestPhrase = currentPhrase;
      }
    } else {
      currentPhrase = '';
    }
  }

  return longestPhrase || words.find(w => w.length > 5) || null;
}

const commonWords = new Set([
  'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but', 'his', 'from',
  'they', 'will', 'would', 'there', 'their', 'what', 'about', 'which', 'when', 'because',
  'should', 'could', 'might', 'been', 'also', 'very', 'into', 'other', 'some', 'than'
]);

async function summarizePassageController(req, res) {
  const { passage } = req.body;
  if (!passage) {
    return res.status(400).json({ error: "Passage is required" });
  }

  const wordCount = passage.split(/\s+/).length;
  let summaryReq = "a comprehensive paragraph";
  let bulletReq = "at least 5 bullet points";
  let flashcardReq = "at least 5 flashcards";

  if (wordCount >= 550 && wordCount <= 950) {
    bulletReq = "12-15 detailed bullet points covering all key aspects";
    flashcardReq = "8-10 comprehensive flashcards";
  } else if (wordCount > 950 && wordCount <= 1650) {
    bulletReq = "17-20 detailed bullet points thoroughly covering all content";
    flashcardReq = "12-18 comprehensive flashcards";
  } else if (wordCount > 1650) {
    bulletReq = "22-25 detailed bullet points ensuring no important detail is missed";
    flashcardReq = "20-30 comprehensive flashcards covering all key concepts";
  }

  const prompt = `
You are an expert study assistant. Create study materials from this passage that cover EVERY important piece of information, suitable for last-minute exam preparation.

Requirements:
1. ${summaryReq} summarizing ALL key points
2. ${bulletReq} - make sure to cover ALL concepts, facts, and details
3. ${flashcardReq} - ensure questions cover ALL main ideas and answers are complete

Format exactly as follows:

**Summary:**
<detailed summary covering all main points>

**Bullet Points:**
* Comprehensive point 1 (cover all aspects)
* Thorough point 2 (no detail missed)
...

**Flashcards:**
**Question:** <question covering key concept 1>
**Answer:** <complete answer with all relevant details>

**Question:** <question covering key concept 2>
**Answer:** <complete answer with all relevant details>

Passage:
${passage}
`;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        topK: 40
      }
    });

    const output = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const summaryMatch = output.match(/\*\*Summary:\*\*([\s\S]*?)\n\s*\*\*Bullet Points:/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : passage.slice(0, 500) + "...";

    const bulletsMatch = output.match(/\*\*Bullet Points:\*\*([\s\S]*?)\n\s*\*\*Flashcards:/i);
    const bullet_lines = bulletsMatch ? bulletsMatch[1].split('\n') : [];
    let bullet_points = bullet_lines.map(line => line.trim()).filter(line => line.startsWith("*"));

    const minBullets = wordCount < 500 ? 10 : wordCount < 1000 ? 15 : 20;
    if (bullet_points.length < minBullets) {
      const additionalPoints = passage.split('. ')
        .filter(s => s.length > 30)
        .slice(0, minBullets - bullet_points.length)
        .map(s => `* ${s.trim()}`);
      bullet_points = bullet_points.concat(additionalPoints);
    }

    const questionRegex = /\*\*\s*Question\s*:\s*(.+?)\s*\*\*\s*Answer\s*:/gi;
    const answerRegex = /\*\*\s*Answer\s*:\s*([\s\S]+?)(?=\n\s*\*\*Question:|$)/gi;

    const questions = [];
    const answers = [];
    let match;

    while ((match = questionRegex.exec(output)) !== null) {
      questions.push(match[1].trim());
    }

    while ((match = answerRegex.exec(output)) !== null) {
      answers.push(match[1].trim());
    }

    let flash_cards = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || ""
    }));

    const minFlashcards = wordCount < 500 ? 7 : wordCount < 1000 ? 12 : 20;
    if (flash_cards.length < minFlashcards) {
      const filler = generateFlashcardsFromPassage(passage, minFlashcards - flash_cards.length);
      flash_cards = flash_cards.concat(filler);
    }

    return res.status(200).json({
      summary,
      bullet_points,
      flash_cards,
      coverage_estimate: `${Math.round((bullet_points.length / minBullets + flash_cards.length / minFlashcards) / 2 * 100)}% content covered`
    });

  } catch (error) {
    console.error("Error summarizing passage:", error);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}

module.exports = { summarizePassageController };