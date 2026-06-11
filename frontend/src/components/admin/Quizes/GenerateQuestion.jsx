/* eslint-disable no-unused-vars */
import { useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useGetTextBasedQuizTextByIdQuery } from "../../../services/Course_Management/textBasedQuizTextApi"
import { HfInference } from "@huggingface/inference"
import { useCreateMCQMutation, useDeleteMCQMutation } from "../../../services/Content_Management/genrated_quiz/mcqApi"
import {
    useCreateFillBlankMutation,
    useDeleteFillBlankMutation,
} from "../../../services/Content_Management/genrated_quiz/fillBlankApi"
import {
    useCreateTrueFalseMutation,
    useDeleteTrueFalseMutation,
} from "../../../services/Content_Management/genrated_quiz/trueFalseApi"
import { useContentGeneratorByTypeMutation } from "../../../services/AIServices"
import { getAdminToken } from "../../../services/CookieService"
import GeneratedQuestionDisplay from "./GeneratedQuestionDisplay"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css";
import PermissionWrapper, { usePermissions } from "../../../context/PermissionWrapper";
import { ArrowLeft } from "lucide-react"


// Initialize Hugging Face client with API key from environment variable
const hf = new HfInference(import.meta.env.VITE_APP_HF_API_KEY)

export default function GenerateQuestion() {
    const { quizId } = useLocation().state

    const navigate = useNavigate();

    const [generatedQuestions, setGeneratedQuestions] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [showConfigModal, setShowConfigModal] = useState(false)

    // Question generation configuration
    const [totalQuestions, setTotalQuestions] = useState(10)
    const [mcqCount, setMcqCount] = useState(4)
    const [fillBlankCount, setFillBlankCount] = useState(3)
    const [trueFalseCount, setTrueFalseCount] = useState(3)

    const { access_token } = getAdminToken();
    const { hasPermission } = usePermissions()

    const [createMCQ] = useCreateMCQMutation()
    const [deleteMCQ] = useDeleteMCQMutation()
    const [createFillBlank] = useCreateFillBlankMutation()
    const [deleteFillBlank] = useDeleteFillBlankMutation()
    const [createTrueFalse] = useCreateTrueFalseMutation()
    const [deleteTrueFalse] = useDeleteTrueFalseMutation()

    const { data: fetchedTextBasedQuestions, isLoading, error } = useGetTextBasedQuizTextByIdQuery({ id: quizId, access_token })

    // Simple tokenization function (for fallback and preprocessing)
    const tokenizeSentences = (text) => {
        // Split text into sentences (basic implementation)
        return text.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0)
    }

    // Inside your component, add this hook
    const [generateContentMutation] = useContentGeneratorByTypeMutation()

    // Add this function to your component
    const generateQuestionsViaAPI = async () => {
        if (!fetchedTextBasedQuestions || fetchedTextBasedQuestions.length === 0) {
            toast.error("No text content available to generate questions from.")
            return
        }

        setIsGenerating(true)

        try {
            // Combine all available text content
            const allText = fetchedTextBasedQuestions.map((q) => q.text).join(". ")

            // Prepare configuration
            const config = {
                totalQuestions,
                mcqCount,
                fillBlankCount,
                trueFalseCount,
                quizId: quizId,
                quizTextId: fetchedTextBasedQuestions[0]?.id // Use the first quiz text ID
            }

            // Call the backend API
            const response = await generateContentMutation({
                userQuery: allText,
                details: JSON.stringify(config),
                contentType: "text-based-quiz"
            }).unwrap()

            // Update state with generated questions
            if (response.success) {
                setGeneratedQuestions(response.data?.questions || [])
                await saveQuestionsToDatabase(response.data?.questions)
            }

            toast.success("Questions generated successfully!")

        } catch (error) {
            console.error("Error generating questions via API:", error)
            toast.error(error?.data?.error || "Failed to generate questions")

            // Fallback to local generation if API fails
            const allText = fetchedTextBasedQuestions.map((q) => q.text).join(". ")
            fallbackQuestionGeneration(allText, totalQuestions)
        } finally {
            setIsGenerating(false)
        }
    }

    // Generate different types of questions from text
    const generateQuestionsFromText = async (text) => {
        setIsGenerating(true)

        try {
            // Extract key sentences for question generation
            const sentences = tokenizeSentences(text)
            const selectedSentences = sentences
                .filter((s) => s.trim().length > 20) // Only use substantial sentences
                .slice(0, totalQuestions * 2) // Increase number of sentences to have enough material

            const newQuestions = []

            // Distribute question types based on user configuration
            await Promise.all([
                // Generate multiple choice questions
                generateMultipleChoiceQuestions(text, selectedSentences.slice(0, mcqCount), newQuestions, mcqCount),
                // Generate true/false questions
                generateTrueFalseQuestions(
                    selectedSentences.slice(mcqCount, mcqCount + trueFalseCount),
                    newQuestions,
                    trueFalseCount,
                ),
                // Generate fill-in-blank questions
                generateFillInBlankQuestions(
                    selectedSentences.slice(mcqCount + trueFalseCount, mcqCount + trueFalseCount + fillBlankCount),
                    newQuestions,
                    fillBlankCount,
                ),
            ])

            // If we have less than totalQuestions after API calls, fill in with basic questions
            if (newQuestions.length < totalQuestions) {
                const remainingCount = totalQuestions - newQuestions.length
                fillRemainingQuestions(text, selectedSentences, newQuestions, remainingCount)
            }

            // Limit to exactly totalQuestions if we somehow got more
            const finalQuestions = newQuestions.slice(0, totalQuestions)

            // Add the generated questions to state
            setGeneratedQuestions(finalQuestions)

            // Save the generated questions to the database
            await saveQuestionsToDatabase(finalQuestions)
        } catch (error) {
            console.error("Error generating questions:", error)
            // Fallback to basic generation if API fails
            fallbackQuestionGeneration(text, totalQuestions)
        } finally {
            setIsGenerating(false)
        }
    }

    const saveQuestionsToDatabase = async (questions) => {
        try {
            // Ensure fetchedTextBasedQuestions is an array and has at least one item
            if (!Array.isArray(fetchedTextBasedQuestions) || fetchedTextBasedQuestions.length === 0) {
                console.error("No quiz data available to extract quiz ID.")
                return
            }

            // Use the quizId from the first item in fetchedTextBasedQuestions
            const quizTextId = fetchedTextBasedQuestions[0].id

            for (const question of questions) {
                if (question.type === "multiple_choice") {
                    await createMCQ({
                        mcq: {
                            quizTextId: quizTextId,
                            text: question.text,
                            marks: question.marks || 2,
                            correctAnswer: question.correctAnswer,
                            options: question.options,
                        },
                        access_token, // Replace with actual access token
                    }).unwrap();
                } else if (question.type === "true_false") {
                    await createTrueFalse({
                        tf: {
                            quizTextId: quizTextId,
                            text: question.text,
                            marks: question.marks || 1,
                            correctAnswer: question.correctAnswer === "True",
                        },
                        access_token, // Replace with actual access token
                    }).unwrap();
                } else if (question.type === "fill_in_blank") {
                    await createFillBlank({
                        fillBlank: {
                            quizTextId: quizTextId,
                            text: question.text,
                            marks: question.marks || 1,
                            correctAnswer: question.correctAnswer,
                        },
                        access_token, // Replace with actual access token
                    }).unwrap();
                }
            }
        } catch (error) {
            toast.error(error?.data?.error || "Failed To save generated question")
        }
    }

    // Fill in remaining questions to reach totalQuestions total
    const fillRemainingQuestions = (text, sentences, questionsArray, count) => {
        for (let i = 0; i < count && i < sentences.length; i++) {
            const sentence = sentences[i + totalQuestions] || sentences[i] // Use different sentences or cycle through

            // Distribute question types evenly
            if (i % 3 === 0) {
                const mcq = generateBasicMultipleChoiceQuestion(sentence, text)
                if (mcq) questionsArray.push(mcq)
            } else if (i % 3 === 1) {
                const tfq = generateBasicTrueFalseQuestion(sentence)
                if (tfq) questionsArray.push(tfq)
            } else {
                const fibq = generateBasicFillInBlankQuestion(sentence)
                if (fibq) questionsArray.push(fibq)
            }
        }
    }

    // Generate multiple choice questions using Hugging Face models
    const generateMultipleChoiceQuestions = async (fullText, sentences, questionsArray, count) => {
        try {
            // Use up to count sentences for multiple choice questions
            const mcqSentences = sentences.slice(0, count)

            for (const sentence of mcqSentences) {
                // Use the T5 model with improved prompt for complete questions
                const response = await hf.textGeneration({
                    model: "google/flan-t5-base",
                    inputs: `Generate a complete multiple choice question (not a fill-in-the-blank) about this text: "${sentence}"
                Format:
                Question: [Complete question with no blanks]
                A. [Option A]
                B. [Option B]
                C. [Option C]
                D. [Option D]
                Correct Answer: [A, B, C, or D]
                Marks: [1, 2, or 3]`,
                    parameters: {
                        max_new_tokens: 250,
                        temperature: 0.7,
                    },
                })


                // Process the generated question to extract options
                const generatedText = response.generated_text

                // Parse the question text and options properly
                let questionText = ""
                let options = []
                let correctAnswer = ""
                let marks = 2 // Default fallback

                // Extract marks
                const marksMatch = generatedText.match(/Marks:\s*([1-3])/i)
                if (marksMatch && marksMatch[1]) {
                    marks = parseInt(marksMatch[1])
                }

                // Extract question text
                const questionMatch = generatedText.match(/Question:\s*(.*?)(?=A\.|$)/s)
                if (questionMatch && questionMatch[1]) {
                    questionText = questionMatch[1].trim()

                    // Check if question has blanks and skip if it does
                    if (questionText.includes("_____") || questionText.includes("...") || questionText.includes("[blank]")) {
                        // Try again with a more specific instruction
                        const fallbackResponse = await hf.textGeneration({
                            model: "google/flan-t5-base",
                            inputs: `Create a factual multiple choice question about this text: "${sentence}"
                        The question must be a complete sentence with no blanks or fill-ins.
                        Format:
                        Question: [Complete question like "What is the main function of X?" or "Which statement best describes Y?"]
                        A. [Option A]
                        B. [Option B]
                        C. [Option C]
                        D. [Option D]
                        Correct Answer: [A, B, C, or D]
                        Marks: [1, 2, or 3]`,
                            parameters: {
                                max_new_tokens: 250,
                                temperature: 0.7,
                            },
                        })

                        let marks = 2 // Default fallback

                        // Extract marks
                        const marksMatch = generatedText.match(/Marks:\s*([1-3])/i)
                        if (marksMatch && marksMatch[1]) {
                            marks = parseInt(marksMatch[1])
                        }

                        // Process this new response instead
                        const newQuestionMatch = fallbackResponse.generated_text.match(/Question:\s*(.*?)(?=A\.|$)/s)
                        if (newQuestionMatch && newQuestionMatch[1]) {
                            questionText = newQuestionMatch[1].trim()
                        } else {
                            const basicMCQ = generateBasicMultipleChoiceQuestion(sentence, fullText, true)
                            if (basicMCQ) questionsArray.push(basicMCQ)
                            continue
                        }
                    }
                } else {
                    // If we can't extract a properly formatted question, use a basic version
                    const basicMCQ = generateBasicMultipleChoiceQuestion(sentence, fullText, true)
                    if (basicMCQ) questionsArray.push(basicMCQ)
                    continue
                }

                // Extract options
                const optionMatches = generatedText.match(/([A-D])\.?\s*([^\n]*)/g)
                if (optionMatches && optionMatches.length > 0) {
                    options = optionMatches.map((opt) => {
                        const optionText = opt.replace(/^[A-D]\.?\s*/, "").trim()
                        return optionText || "Option"
                    })

                    // Ensure we have exactly 4 options
                    while (options.length < 4) {
                        options.push(`Option ${options.length + 1}`)
                    }
                } else {
                    // If options extraction fails, use default options
                    options = ["Option A", "Option B", "Option C", "Option D"]
                }

                // Extract correct answer
                const correctAnswerMatch = generatedText.match(/Correct Answer:\s*([A-D])/i)
                if (correctAnswerMatch && correctAnswerMatch[1]) {
                    const answerLetter = correctAnswerMatch[1]
                    const answerIndex = answerLetter.charCodeAt(0) - 65 // A=0, B=1, etc.
                    correctAnswer = options[answerIndex] || options[0]
                } else {
                    // If no correct answer is identified, use the first option
                    correctAnswer = options[0]
                }

                questionsArray.push({
                    id: `gen_mcq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    text: questionText,
                    type: "multiple_choice",
                    correctAnswer,
                    marks: marks,
                    options,
                })
            }
        } catch (error) {
            console.error("Error generating multiple choice questions:", error)
            // Fall back to basic question generation
            for (let i = 0; i < count && i < sentences.length; i++) {
                const basicMCQ = generateBasicMultipleChoiceQuestion(sentences[i], fullText, true)
                if (basicMCQ) questionsArray.push(basicMCQ)
            }
        }
    }

    // Helper function for basic question generation (modified to avoid blanks)
    const generateBasicMultipleChoiceQuestion = (sentence, fullText, avoidBlanks = true) => {
        try {
            // Create a question from the sentence
            let questionText = ""

            if (avoidBlanks) {
                // Extract key subjects or concepts from the sentence
                const words = sentence.split(" ")
                const keyWords = words.filter(
                    (word) =>
                        word.length > 4 && !["about", "there", "their", "would", "could", "should"].includes(word.toLowerCase()),
                )

                if (keyWords.length > 0) {
                    const keyWord = keyWords[Math.floor(Math.random() * keyWords.length)]
                    questionText = `What best describes the concept of "${keyWord}" in the given context?`
                } else {
                    questionText = "Which of the following statements is true based on the text?"
                }
            } else {
                // Legacy blank-based question (kept for backward compatibility)
                const words = sentence.split(" ")
                if (words.length < 5) return null

                const randomIndex = Math.floor(Math.random() * (words.length - 1)) + 1
                const blankWord = words[randomIndex]
                words[randomIndex] = "_______"
                questionText = words.join(" ")
            }

            // Generate options including the correct answer
            let correctAnswer = ""
            let options = []

            if (avoidBlanks) {
                // For non-blank questions, use the sentence as the correct answer
                correctAnswer = sentence

                // Generate plausible but incorrect options
                options = [
                    sentence,
                    `The opposite of what is stated in the text.`,
                    `A concept not mentioned in the provided text.`,
                    `An unrelated statement to the context.`,
                ]
            } else {
                // Legacy code for blank-based questions
                const words = sentence.split(" ")
                if (words.length < 5) return null

                const randomIndex = Math.floor(Math.random() * (words.length - 1)) + 1
                const blankWord = words[randomIndex]
                correctAnswer = blankWord

                // Generate incorrect options
                const otherOptions = [
                    blankWord + "s",
                    blankWord.charAt(0).toUpperCase() + blankWord.slice(1),
                    blankWord.replace(/ing$/, "ed").replace(/ed$/, "ing"),
                ]

                options = [blankWord, ...otherOptions]
            }

            // Shuffle options
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                    ;[options[i], options[j]] = [options[j], options[i]]
            }

            return {
                id: `basic_mcq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                text: questionText,
                type: "multiple_choice",
                correctAnswer,
                marks: 2,
                options,
            }
        } catch (error) {
            console.error("Error in basic MCQ generation:", error)
            return null
        }
    }

    // Generate true/false questions using Hugging Face models
    const generateTrueFalseQuestions = async (sentences, questionsArray, count) => {
        try {
            // Use up to count sentences for true/false questions
            const tfSentences = sentences.slice(0, count)

            for (const sentence of tfSentences) {
                // Use the T5 model for question generation
                const response = await hf.textGeneration({
                    model: "google/flan-t5-base",
                    inputs: `Generate a true or false question about this text: "${sentence}"
                Format:
                Question: [True or False: statement]
                Answer: [True or False]
                Marks: [1, 2, or 3]`,
                    parameters: {
                        max_new_tokens: 100,
                        temperature: 0.7,
                    },
                })

                let questionText = ""
                let isTrue = false
                let marks = 1 // Default fallback

                const marksMatch = response.generated_text.match(/Marks:\s*([1-3])/i)
                if (marksMatch && marksMatch[1]) {
                    marks = parseInt(marksMatch[1])
                }

                // Extract question
                const questionMatch = response.generated_text.match(/Question:\s*(.*?)(?=Answer:|$)/s)
                if (questionMatch && questionMatch[1]) {
                    questionText = questionMatch[1].trim()

                    // Ensure it starts with "True or False:"
                    if (!questionText.toLowerCase().startsWith("true or false")) {
                        questionText = `True or False: ${questionText}`
                    }
                } else {
                    // Fallback to basic true/false question
                    const basicTF = generateBasicTrueFalseQuestion(sentence)
                    if (basicTF) questionsArray.push(basicTF)
                    continue
                }

                // Extract answer
                const answerMatch = response.generated_text.match(/Answer:\s*(true|false)/i)
                if (answerMatch && answerMatch[1]) {
                    isTrue = answerMatch[1].toLowerCase() === "true"
                } else {
                    // Random answer if not specified
                    isTrue = Math.random() < 0.5
                }

                questionsArray.push({
                    id: `gen_tf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    text: questionText,
                    type: "true_false",
                    correctAnswer: isTrue ? "True" : "False",
                    options: ["True", "False"],
                    marks: marks
                })
            }
        } catch (error) {
            console.error("Error generating true/false questions:", error)
            // Fall back to basic question generation
            for (let i = 0; i < count && i < sentences.length; i++) {
                const basicTF = generateBasicTrueFalseQuestion(sentences[i])
                if (basicTF) questionsArray.push(basicTF)
            }
        }
    }

    // Generate fill-in-the-blank questions using Hugging Face
    const generateFillInBlankQuestions = async (sentences, questionsArray, count) => {
        try {
            // Use up to count sentences for fill-in-blank questions
            const fibSentences = sentences.slice(0, count)

            for (const sentence of fibSentences) {
                // Use T5 model for fill-in-the-blank generation
                const response = await hf.textGeneration({
                    model: "google/flan-t5-base",
                    inputs: `Create a fill-in-the-blank question from this text: "${sentence}"
                Format:
                Question: [Sentence with _____ for the blank]
                Answer: [Word that goes in the blank]
                Marks: [1, 2, or 3]`,
                    parameters: {
                        max_new_tokens: 100,
                        temperature: 0.7,
                    },
                })

                let questionText = ""
                let answer = ""
                let marks = 1 // Default fallback

                const marksMatch = response.generated_text.match(/Marks:\s*([1-3])/i)
                if (marksMatch && marksMatch[1]) {
                    marks = parseInt(marksMatch[1])
                }

                // Extract question
                const questionMatch = response.generated_text.match(/Question:\s*(.*?)(?=Answer:|$)/s)
                if (questionMatch && questionMatch[1]) {
                    questionText = questionMatch[1].trim()

                    // Make sure it includes a blank
                    if (!questionText.includes("_")) {
                        questionText = questionText.replace(/\b\w{5,}\b/, "________")
                    }

                    // Ensure it starts appropriately
                    if (!questionText.toLowerCase().startsWith("fill in")) {
                        questionText = `Fill in the blank: ${questionText}`
                    }
                } else {
                    // Fallback to basic method
                    const basicFIB = generateBasicFillInBlankQuestion(sentence)
                    if (basicFIB) questionsArray.push(basicFIB)
                    continue
                }

                // Extract answer
                const answerMatch = response.generated_text.match(/Answer:\s*(.*?)(?=$)/s)
                if (answerMatch && answerMatch[1]) {
                    answer = answerMatch[1].trim()
                } else {
                    // If no answer is provided, use a placeholder
                    answer = "See original text"
                }

                questionsArray.push({
                    id: `gen_fib_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    text: questionText,
                    type: "fill_in_blank",
                    correctAnswer: answer,
                    marks: marks
                })
            }
        } catch (error) {
            console.error("Error generating fill-in-blank questions:", error)
            // Fall back to basic question generation
            for (let i = 0; i < count && i < sentences.length; i++) {
                const basicFIB = generateBasicFillInBlankQuestion(sentences[i])
                if (basicFIB) questionsArray.push(basicFIB)
            }
        }
    }

    // Fallback to basic generation if API fails
    const fallbackQuestionGeneration = (text, count = 10) => {
        const sentences = tokenizeSentences(text)
        const selectedSentences = sentences.filter((s) => s.split(" ").length >= 5).slice(0, count * 2)
        const newQuestions = []

        // Calculate how many of each type to generate based on user configuration
        const mcqToGenerate = Math.min(mcqCount, selectedSentences.length)
        const tfToGenerate = Math.min(trueFalseCount, selectedSentences.length)
        const fibToGenerate = Math.min(fillBlankCount, selectedSentences.length)

        let sentenceIndex = 0

        // Generate MCQs
        for (let i = 0; i < mcqToGenerate; i++) {
            if (sentenceIndex >= selectedSentences.length) break
            const mcq = generateBasicMultipleChoiceQuestion(selectedSentences[sentenceIndex], text)
            if (mcq) newQuestions.push(mcq)
            sentenceIndex++
        }

        // Generate True/False
        for (let i = 0; i < tfToGenerate; i++) {
            if (sentenceIndex >= selectedSentences.length) break
            const tfq = generateBasicTrueFalseQuestion(selectedSentences[sentenceIndex])
            if (tfq) newQuestions.push(tfq)
            sentenceIndex++
        }

        // Generate Fill-in-Blank
        for (let i = 0; i < fibToGenerate; i++) {
            if (sentenceIndex >= selectedSentences.length) break
            const fibq = generateBasicFillInBlankQuestion(selectedSentences[sentenceIndex])
            if (fibq) newQuestions.push(fibq)
            sentenceIndex++
        }

        // Make sure we have exactly 'count' questions by adding more if needed
        if (newQuestions.length < count) {
            const remaining = count - newQuestions.length
            for (let i = 0; i < remaining && i < selectedSentences.length; i++) {
                const sentence = selectedSentences[i + count]
                if (!sentence) continue

                // Determine which type of question to generate based on what we're missing
                const mcqNeeded = mcqCount - newQuestions.filter((q) => q.type === "multiple_choice").length
                const tfNeeded = trueFalseCount - newQuestions.filter((q) => q.type === "true_false").length
                const fibNeeded = fillBlankCount - newQuestions.filter((q) => q.type === "fill_in_blank").length

                if (mcqNeeded > 0) {
                    const mcq = generateBasicMultipleChoiceQuestion(sentence, text)
                    if (mcq) newQuestions.push(mcq)
                } else if (tfNeeded > 0) {
                    const tfq = generateBasicTrueFalseQuestion(sentence)
                    if (tfq) newQuestions.push(tfq)
                } else if (fibNeeded > 0) {
                    const fibq = generateBasicFillInBlankQuestion(sentence)
                    if (fibq) newQuestions.push(fibq)
                }
            }
        }

        setGeneratedQuestions(newQuestions.slice(0, count))

        // Save the generated questions to the database
        saveQuestionsToDatabase(newQuestions.slice(0, count))
    }

    // Basic question generation methods (for fallback)

    const generateBasicTrueFalseQuestion = (sentence) => {
        // 50% chance of creating a true statement (original sentence)
        // 50% chance of creating a false statement (negated or modified)
        const isTrueStatement = Math.random() < 0.5

        let question
        if (isTrueStatement) {
            question = `True or False: ${sentence}`
        } else {
            // Create a negated version of the sentence
            if (sentence.includes("is ")) {
                question = `True or False: ${sentence.replace("is ", "is not ")}`
            } else if (sentence.includes("are ")) {
                question = `True or False: ${sentence.replace("are ", "are not ")}`
            } else if (sentence.includes("was ")) {
                question = `True or False: ${sentence.replace("was ", "was not ")}`
            } else if (sentence.includes("were ")) {
                question = `True or False: ${sentence.replace("were ", "were not ")}`
            } else if (sentence.includes("will ")) {
                question = `True or False: ${sentence.replace("will ", "will not ")}`
            } else {
                // If no simple pattern is found, just add "not" somewhere
                const words = sentence.split(" ")
                if (words.length > 3) {
                    const insertPosition = Math.floor(words.length / 2)
                    words.splice(insertPosition, 0, "not")
                    question = `True or False: ${words.join(" ")}`
                } else {
                    question = `True or False: It is not true that ${sentence.toLowerCase()}`
                }
            }
        }

        return {
            id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            text: question,
            type: "true_false",
            correctAnswer: isTrueStatement ? "True" : "False",
            options: ["True", "False"],
            marks: 1
        }
    }

    const generateBasicFillInBlankQuestion = (sentence) => {
        const words = sentence.split(/\s+/).filter((word) => {
            const cleaned = word.replace(/[,.;:'"!?()]/g, "")
            return cleaned.length > 3
        })

        if (words.length === 0) return null

        // Choose a random substantial word to blank out
        const wordToBlank = words[Math.floor(Math.random() * words.length)]

        // Create the question with a blank
        const questionText = sentence.replace(wordToBlank, "_______")

        return {
            id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            text: `Fill in the blank: ${questionText}`,
            type: "fill_in_blank",
            correctAnswer: wordToBlank,
            marks: 1
        }
    }

    const handleGenerateQuestions = () => {
        if (!fetchedTextBasedQuestions || fetchedTextBasedQuestions.length === 0) {
            toast.error("No text content available to generate questions from.")
            return
        }

        // Check if all question types are null or empty
        const hasQuestions = fetchedTextBasedQuestions.some(
            (quiz) =>
                quiz.TrueFalseQuestions?.length > 0 ||
                quiz.MultipleChoiceQuestions?.length > 0 ||
                quiz.FillInBlankQuestions?.length > 0,
        )

        if (hasQuestions) {
            setShowModal(true)
        } else {
            // Show configuration modal
            setShowConfigModal(true)
        }
    }

    const handleConfirmRegenerate = () => {
        // Close the confirmation modal
        setShowModal(false)

        // Show configuration modal
        setShowConfigModal(true)
    }

    const handleCancel = () => {
        // Close the modal
        setShowModal(false)
    }

    const handleConfigCancel = () => {
        // Close the config modal
        setShowConfigModal(false)
    }

    const handleConfigSubmit = () => {
        // Validate that the sum of question types equals total questions
        if (mcqCount + fillBlankCount + trueFalseCount !== totalQuestions) {
            toast.error(
                `The sum of all question types (${mcqCount + fillBlankCount + trueFalseCount}) must equal the total number of questions (${totalQuestions}).`,
            )
            return
        }

        // Validate that all counts are non-negative
        if (mcqCount < 0 || fillBlankCount < 0 || trueFalseCount < 0 || totalQuestions <= 0) {
            toast.error("All question counts must be non-negative and total questions must be greater than zero.")
            return
        }

        // Close the config modal
        setShowConfigModal(false)

        // Clear previous questions
        setGeneratedQuestions([])

        // Delete existing questions if needed
        if (
            fetchedTextBasedQuestions.some(
                (quiz) =>
                    quiz.TrueFalseQuestions?.length > 0 ||
                    quiz.MultipleChoiceQuestions?.length > 0 ||
                    quiz.FillInBlankQuestions?.length > 0,
            )
        ) {
            deleteExistingQuestions()
        }


        // Use the API-based generation instead
        generateQuestionsViaAPI()

        // // Combine all available text content for question generation
        // const allText = fetchedTextBasedQuestions.map((q) => q.text).join(". ")
        // generateQuestionsFromText(allText)
    }

    const deleteExistingQuestions = async () => {
        try {
            // Ensure fetchedTextBasedQuestions is an array and has at least one item
            if (!Array.isArray(fetchedTextBasedQuestions) || fetchedTextBasedQuestions.length === 0) {
                console.error("No quiz data available to extract quiz ID.")
                return
            }

            // Use the quizId from the first item in fetchedTextBasedQuestions
            const quizTextId = fetchedTextBasedQuestions[0].id

            // Delete existing questions
            await deleteMCQ({ id: quizTextId, access_token }).unwrap();
            await deleteFillBlank({ id: quizTextId, access_token }).unwrap();
            await deleteTrueFalse({ id: quizTextId, access_token }).unwrap();
        } catch (error) {
            toast.error(error?.data?.error || "Failed to remove existing questions")
        }
    }

    // Helper function to handle input changes
    const handleInputChange = (e, setter) => {
        const value = Number.parseInt(e.target.value) || 0
        setter(value)
    }

    if (isLoading) return <p>Loading questions...</p>
    if (error) return <p>Something went wrong!</p>

    return (
        <>
            {hasPermission("Multiple Choice Generated", "create") ||
                hasPermission("Fill-in-the-Blank Generated", "create") ||
                hasPermission("True/False Generated", "create") ? (
                <div className="flex flex-col h-screen bg-gray-50">
                    <div className="bg-white border-b border-gray-200 flex-shrink-0">
                        <div className="w-full p-4">
                            <div className="flex items-center justify-between">
                                <div className="grid flex-1 mx-2">
                                    <h1 className="text-2xl font-bold  text-forestGreen">Manage Questions</h1>
                                    <p className="text-gray-600 mt-1">Manage Text Based Questions</p>
                                </div>

                                <div className="flex items-center gap-4 ">
                                    {/* Generate Question Button */}
                                    <PermissionWrapper section="Fill-in-the-Blank Generated|Multiple Choice Generated|True/False Generated">
                                        <button
                                            onClick={handleGenerateQuestions}
                                            disabled={isGenerating}
                                            className=" bg-forestGreen    hover: text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
                                        >
                                            {isGenerating ? "Generating..." : "Generate Questions"}
                                        </button>
                                    </PermissionWrapper>

                                    <button
                                        onClick={() => navigate(-1)}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                        <span className="font-medium">Back</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="w-full flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="w-full mx-auto">
                            {/* Original Content */}
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold mb-3">Original Content:</h2>
                                {fetchedTextBasedQuestions && fetchedTextBasedQuestions.length > 0 ? (
                                    fetchedTextBasedQuestions.map((question) => (
                                        <div key={question.id} className="border p-3 rounded-lg mb-3 shadow-sm">
                                            <p className="font-medium prose leading-relaxed text-justify">{question.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No content found for this quiz.</p>
                                )}
                            </div>

                            {/* Generated Questions */}
                            {generatedQuestions.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold mb-3">Generated Questions ({generatedQuestions.length}):</h2>
                                    {generatedQuestions.map((question) => (
                                        <div key={question.id} className="border p-3 rounded-lg mb-3 shadow-sm bg-lightGreen">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-medium text-slate-800">{question.text}</p>
                                                <span className="text-sm font-semibold bg-lightGreen text-forestGreen px-2 py-1 rounded">
                                                    {question.marks} Marks
                                                </span>
                                            </div>

                                            {question.type === "multiple_choice" && (
                                                <div className="mt-2 pl-4">
                                                    <p className="text-sm text-gray-500 mb-1">Options:</p>
                                                    <ul className="list-disc pl-5">
                                                        {question.options.map((option, idx) => (
                                                            <li key={idx} className={option === question.correctAnswer ? "text-green-600 font-medium" : ""}>
                                                                {option} {option === question.correctAnswer && "(Correct)"}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {question.type === "true_false" && (
                                                <div className="mt-2 pl-4">
                                                    <p className="text-sm text-gray-500">
                                                        Correct Answer: <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                                                    </p>
                                                </div>
                                            )}

                                            {question.type === "fill_in_blank" && (
                                                <div className="mt-2 pl-4">
                                                    <p className="text-sm text-gray-500">
                                                        Answer: <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Display the GeneratedQuestionDisplay component */}
                            <GeneratedQuestionDisplay quizId={quizId} />
                        </div>
                    </div>

                    {/* Confirmation Modal */}
                    {showModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                                <h3 className="text-lg font-semibold mb-4">Questions Already Exist</h3>
                                <p className="mb-4">Do you want to regenerate the questions?</p>
                                <div className="flex justify-end">
                                    <button
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-red-600 transition"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                                        onClick={handleConfirmRegenerate}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Configuration Modal */}
                    {showConfigModal && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                                <h3 className="text-lg font-semibold mb-4">Configure Question Generation</h3>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={totalQuestions}
                                        onChange={(e) => handleInputChange(e, setTotalQuestions)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <PermissionWrapper section="Multiple Choice Generated" action="create">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Multiple Choice Questions</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalQuestions}
                                            value={mcqCount}
                                            onChange={(e) => handleInputChange(e, setMcqCount)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </PermissionWrapper>

                                <PermissionWrapper section="Fill-in-the-Blank Generated" action="create">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fill in the Blank Questions</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalQuestions}
                                            value={fillBlankCount}
                                            onChange={(e) => handleInputChange(e, setFillBlankCount)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </PermissionWrapper>

                                <PermissionWrapper section="True/False Generated" action="create">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">True/False Questions</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={totalQuestions}
                                            value={trueFalseCount}
                                            onChange={(e) => handleInputChange(e, setTrueFalseCount)}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </PermissionWrapper>

                                <div className="text-sm text-gray-500 mb-4">
                                    Note: The sum of all question types should equal the total number of questions (
                                    {mcqCount + fillBlankCount + trueFalseCount}/{totalQuestions})
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2 hover:bg-red-600 transition"
                                        onClick={handleConfigCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                                        onClick={handleConfigSubmit}
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}
        </>
    )
}

