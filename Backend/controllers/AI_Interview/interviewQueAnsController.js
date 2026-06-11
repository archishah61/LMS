const dotenv = require("dotenv");
dotenv.config();

async function generateInterviewController(req, res) {
  const { category, role } = req.body;

  if (!category || !role) {
    return res.status(400).json({ error: "Both category and role are required" });
  }

  const prompt = `
You are a professional interview coach and HR expert. Generate a list of interview questions and ideal answers for the following role:

**Category**: ${category}
**Role**: ${role}

Instructions:
- If the category or role is invalid, unclear, or not a real job role, respond ONLY with:
  INVALID_INPUT
- Generate 7 to 10 realistic and relevant interview questions.
- Include the following 3 common questions first:
  1. Tell me about yourself
  2. Why do you want this ${role} job?
  3. What are your strengths?
- The remaining questions should reflect common HR or technical assessments based on the category.
- Provide thoughtful and concise answers that would impress an interviewer.
- Use STRICT formatting with exactly this pattern for each Q&A pair:
  
  **Question:** [question text here]
  **Answer:** [answer text here]

Do not deviate from this format. Do not include any additional commentary or notes outside the Q&A pairs.
`;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_INTERVIEW_MODEL || "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40
      }
    });

    const output = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!output) {
      throw new Error("Empty response from AI");
    }

    // AI-based invalid input detection
    if (output.trim().startsWith("INVALID_INPUT")) {
      return res.status(200).json({
        category,
        role,
        is_valid: false
      });
    }

    // More robust parsing that handles various markdown formats
    const qaPairs = [];
    const qaBlocks = output.split(/\*\*Question:\*\*/i).slice(1); // Split by Question marker

    for (const block of qaBlocks) {
      const [questionPart, answerPart] = block.split(/\*\*Answer:\*\*/i);

      if (!questionPart || !answerPart) continue;

      const cleanQuestion = questionPart
        .replace(/^\*+\s*/, '')
        .replace(/\s*\*+$/, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const cleanAnswer = answerPart
        .replace(/^\*+\s*/, '')
        .replace(/\s*\*+$/, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanQuestion && cleanAnswer) {
        qaPairs.push({
          question: cleanQuestion,
          answer: cleanAnswer
        });
      }
    }

    // Fallback parsing if primary method fails
    if (qaPairs.length === 0) {
      const fallbackMatches = output.match(/\*\*Question:\*\*([\s\S]+?)\*\*Answer:\*\*([\s\S]+?)(?=\*\*Question:|$)/gi);
      if (fallbackMatches) {
        for (const match of fallbackMatches) {
          const [, question, answer] = match.match(/\*\*Question:\*\*([\s\S]+?)\*\*Answer:\*\*([\s\S]+)/i) || [];
          if (question && answer) {
            qaPairs.push({
              question: question.trim().replace(/\s+/g, ' '),
              answer: answer.trim().replace(/\s+/g, ' ')
            });
          }
        }
      }
    }

    // Final validation - if we still have no questions, throw error
    if (qaPairs.length === 0) {
      console.error("Failed to parse any questions from AI output:", output);
      throw new Error("No questions could be parsed from the AI response");
    }

    return res.status(200).json({
      category,
      role,
      is_valid: true,
      interview_questions: qaPairs
    });

  } catch (error) {
    console.error("Error generating interview questions:", error);
    return res.status(500).json({
      error: "Failed to generate interview questions",
      details: error.message
    });
  }
}


async function evaluateInterviewController(req, res) {
  const { questionAnswers } = req.body;

  if (!questionAnswers || !Array.isArray(questionAnswers)) {
    return res.status(400).json({ error: "Question-answer objects are required and must be in an array format." });
  }

  const isValid = questionAnswers.every(q => q.question && typeof q.originalAnswer === 'string' && typeof q.userAnswer === 'string');
  if (!isValid) {
    return res.status(400).json({ error: "Each question-answer object must contain a question, originalAnswer (string), and userAnswer (string)." });
  }

  const prompt = `
You are a professional interview evaluator. Evaluate the user's answers to the following interview questions and provide a detailed structured assessment.

**Evaluation Criteria:**
1. **Accuracy:** How correct is the answer?
2. **Completeness:** Does it cover all key points?
3. **Clarity:** Is the answer well-structured and easy to understand?
4. **Relevance:** Does it directly address the question?

**Scoring Guidelines:**
- If the user's answer is completely accurate, comprehensive, clear, and relevant, award a score of 100.
- If the user's answer is mostly accurate, comprehensive, clear, and relevant but has minor issues, award a score between 80-99.
- If the user's answer has significant inaccuracies, omissions, lack of clarity, or irrelevance, award a score between 50-79.
- If the user's answer is largely incorrect, incomplete, unclear, or irrelevant, award a score between 10-49.
- If the user's answer is "I don't know", empty, or completely unrelated, award a score of 0.

**Response Schema Requirements:**
Respond EXACTLY with the following JSON structure, with no extra text or markdown outside of the JSON block. Do NOT use markdown code blocks (\`\`\`json) for the entire response, simply return the raw JSON string:
{
  "overallScore": number (0-100, the average of all question scores),
  "overallAssessment": "Summary of performance with key strengths and areas to improve",
  "questionEvaluations": [
    {
      "question": "The original question text",
      "originalAnswer": "The ideal answer text",
      "userAnswer": "The user's answer",
      "score": number (0-100),
      "feedback": "Detailed analysis of strengths and areas for improvement",
      "suggestedFeedback": "Specific actionable advice for a better answer"
    }
  ]
}

**Questions and Answers to Evaluate:**
${JSON.stringify(questionAnswers, null, 2)}
`;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_INTERVIEW_MODEL || "gemini-2.5-flash",
      contents: prompt,
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        topK: 40,
        responseMimeType: "application/json"
      }
    });

    const output = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let evaluationData;
    try {
      evaluationData = JSON.parse(output);
    } catch (e) {
      console.error("Failed to parse evaluation JSON:", output);
      evaluationData = {
        overallScore: 0,
        overallAssessment: "Evaluation failed due to parsing error.",
        questionEvaluations: questionAnswers.map(qa => ({
          question: qa.question,
          originalAnswer: qa.originalAnswer,
          userAnswer: qa.userAnswer,
          score: 0,
          feedback: "Error occurred while evaluating this question.",
          suggestedFeedback: ""
        }))
      };
    }

    let overallScore = evaluationData.overallScore || 0;

    // Fallback: If overall score is still 0, calculate average from questions
    if (!overallScore || overallScore === 0) {
      if (evaluationData.questionEvaluations && evaluationData.questionEvaluations.length > 0) {
        const total = evaluationData.questionEvaluations.reduce((sum, q) => sum + (q.score || 0), 0);
        overallScore = Math.round((total / evaluationData.questionEvaluations.length) * 100) / 100;
      }
    }

    const evaluation = {
      overallScore,
      overallAssessment: evaluationData.overallAssessment?.trim() || "Evaluation completed.",
      questionEvaluations: (evaluationData.questionEvaluations || []).map(qe => ({
        question: qe.question || "",
        originalAnswer: qe.originalAnswer || "",
        userAnswer: qe.userAnswer || "",
        score: parseInt(qe.score) || 0,
        feedback: qe.feedback?.trim() || "",
        suggestedFeedback: qe.suggestedFeedback?.trim() || ""
      })),
      fullResponse: output
    };
    return res.status(200).json({ evaluation });
  } catch (error) {
    console.error("Error evaluating interview answers:", error);
    return res.status(500).json({ error: "Failed to evaluate interview answers" });
  }
}

module.exports = { generateInterviewController, evaluateInterviewController };