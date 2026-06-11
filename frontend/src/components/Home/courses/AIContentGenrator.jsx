/* eslint-disable react/prop-types */
"use client"
import { useState } from "react"
import { Sparkles, FileText, X, Loader2, Check } from "lucide-react"
import { useContentGeneratorByTypeMutation } from "../../../services/AIServices"
import toast from "react-hot-toast"
import { useEffect } from "react"
import PermissionWrapper from "../../../context/PermissionWrapper"

export default function AIContentGenerator({
  contentType,
  onUseGenerated,
  buttonText,
  modalTitle,
  placeholderText,
  requiresPDF = true,
  questionType = "",
  clearContent = false,
  details = {},
  allowMultipleSelection = false
}) {
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [formData, setFormData] = useState({
    pdfFile: null,
    userQuery: "",
  })
  const [generatedItems, setGeneratedItems] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  const [generateContentMutation, { isLoading: isAILoading }] = useContentGeneratorByTypeMutation()
  const [topicType, setTopicType] = useState("");

  // Content type configurations
  const contentConfig = {
    course: {
      title: "Generate Courses with AI",
      placeholder: "Describe what kind of course you want to create based on the PDF content...",
      buttonText: "Generate Courses",
      itemLabel: "Course",
      dataKey: "courses",
    },
    module: {
      title: "Generate Modules with AI",
      placeholder:
        "Describe what kind of modules you want to create based on the PDF content. For example: 'Create comprehensive modules covering core concepts'...",
      buttonText: "Generate Modules",
      itemLabel: "Module",
      dataKey: "modules",
    },
    session: {
      title: "Generate Sessions with AI",
      placeholder:
        "Describe what kind of sessions you want to create based on the PDF content. For example: 'Create beginner-friendly sessions covering basic concepts'...",
      buttonText: "Generate Sessions",
      itemLabel: "Session",
      dataKey: "sessions",
    },
    topic: {
      title: "Generate Topics with AI",
      placeholder:
        "Describe what kind of topics you want to create. For example: 'Create topics for JavaScript fundamentals covering variables, functions, and DOM manipulation'...",
      buttonText: "Generate Topics",
      itemLabel: "Topic",
      dataKey: "topics",
    },
    assignment: {
      title: "Generate Assignments with AI",
      placeholder: "Describe what kind of assignment you want to create based on the PDF content...",
      buttonText: "Generate Assignments",
      itemLabel: "Assignment",
      dataKey: "assignments",
    },
    assignment_questions: {
      title: "Generate Assignment Questions with AI",
      placeholder:
        "Describe what kind of assignment questions you want to create. For example: 'Create comprehensive questions about World War II covering causes, major events, and consequences' or 'Generate science questions about photosynthesis and cellular respiration'...",
      buttonText: "Generate Assignment Questions",
      itemLabel: "Assignment Question",
      dataKey: "assignment-questions",
    },
    quiz: {
      title: "Generate Quizzes with AI",
      placeholder:
        "Describe what kind of quiz you want to create based on the PDF content. For example: 'Create a comprehensive quiz with multiple choice questions focusing on key concepts'...",
      buttonText: "Generate Quizzes",
      itemLabel: "Quiz",
      dataKey: "quizzes",
    },
    faq: {
      title: "Generate FAQs with AI",
      placeholder:
        "Describe what kind of FAQs you want to create based on the PDF content. For example: 'Create frequently asked questions about basic concepts'...",
      buttonText: "Generate FAQs",
      itemLabel: "FAQ",
      dataKey: "faqs",
    },
    "speaking": {
      title: "Generate Speaking Questions with AI",
      placeholder: "Describe what kind of speaking questions you want to create. For example: 'Create speaking practice questions about daily routines' or 'Generate conversational questions for language learning'...",
      buttonText: "Generate Speaking Questions",
      itemLabel: "Speaking Question",
      dataKey: "speakingQuestions",
    },
    "drag-drop": {
      title: "Generate Drag & Drop Questions with AI",
      placeholder:
        "Describe what kind of drag & drop questions you want to create. For example: 'Create programming questions about data structures and algorithms' or 'Generate questions about database normalization concepts'...",
      buttonText: "Generate Drag & Drop Questions",
      itemLabel: "Drag & Drop Question",
      dataKey: "dragDropQuestions",
    },
    "complete-sentence": {
      title: "Generate Complete Sentence Questions with AI",
      placeholder:
        "Describe what kind of complete sentence questions you want to create. For example: 'Create grammar questions about verb tenses and sentence structure' or 'Generate vocabulary questions about scientific terminology'...",
      buttonText: "Generate Complete Sentence Questions",
      itemLabel: "Complete Sentence Question",
      dataKey: "completeSentenceQuestions",
    },
    "mcq": {
      title: "Generate Multiple Choice Questions with AI",
      placeholder:
        "Describe what kind of MCQ questions you want to create. For example: 'Create multiple choice questions about JavaScript fundamentals' or 'Generate quiz questions about world history and geography'...",
      buttonText: "Generate MCQ Questions",
      itemLabel: "MCQ Question",
      dataKey: "mcqQuestions",
    },
    "best-option": {
      title: "Generate Best Option Questions with AI",
      placeholder:
        "Describe what kind of best option fill-in-the-blank questions you want to create. For example: 'Create vocabulary questions about scientific terminology' or 'Generate reading comprehension questions about historical events'...",
      buttonText: "Generate Best Option Questions",
      itemLabel: "Best Option Question",
      dataKey: "bestOptionQuestions",
    },
    "summary-passage": {
      title: "Generate Summary Passage Questions with AI",
      placeholder:
        "Describe what kind of summary passage questions you want to create. For example: 'Create reading comprehension passages about environmental science' or 'Generate passages about technological innovations for summarization practice'...",
      buttonText: "Generate Summary Passage Questions",
      itemLabel: "Summary Passage Question",
      dataKey: "summaryPassageQuestions",
    },
    "audio-script": {
      title: "Generate Audio Script Questions with AI",
      placeholder:
        "Describe what kind of audio script questions you want to create. For example: 'Create listening comprehension scripts about science topics' or 'Generate educational audio content about history and culture'...",
      buttonText: "Generate Audio Script Questions",
      itemLabel: "Audio Script Question",
      dataKey: "audioScriptQuestions",
    },
    "image-script": {
      title: "Generate Image Script Questions with AI",
      placeholder:
        "Describe what kind of image script questions you want to create. For example: 'Create visual comprehension questions about science diagrams' or 'Generate image-based questions about historical artifacts'...",
      buttonText: "Generate Image Script Questions",
      itemLabel: "Image Script Question",
      dataKey: "imageScriptQuestions",
    },
    "arrange-order": {
      title: "Generate Arrange Order Questions with AI",
      placeholder: "Describe what kind of arrange order questions you want to create. For example: 'Create sequencing questions about historical events' or 'Generate logical ordering questions about scientific processes'...",
      buttonText: "Generate Arrange Order Questions",
      itemLabel: "Arrange Order Question",
      dataKey: "arrangeOrderQuestions",
    },
    "real-word": {
      title: "Generate Real Word Questions with AI",
      placeholder:
        "Describe what kind of real word identification questions you want to create. For example: 'Create vocabulary questions about medical terminology' or 'Generate word recognition questions about technical terms in computer science'...",
      buttonText: "Generate Real Word Questions",
      itemLabel: "Real Word Question",
      dataKey: "realWordQuestions",
    },
  }

  const config = contentConfig[contentType]

  useEffect(() => {
    setGeneratedItems(null)
  }, [contentType])

  const handleGenerate = async () => {
    if (requiresPDF && !formData.pdfFile && !formData.userQuery.trim()) {
      toast.error("Please upload a PDF file or User Query")
      return
    }

    setGenerating(true)
    try {
      const formDataToSend = new FormData()
      if (formData.pdfFile) {
        formDataToSend.append("contentPDF", formData.pdfFile)
      }
      if (contentType === "session") {
        formDataToSend.append("details", JSON.stringify(details))
      } else if (contentType === "module") {
        formDataToSend.append("details", JSON.stringify(details))
      }
      formDataToSend.append("userQuery", formData.userQuery + " " + (contentType === "topic" ? topicType : questionType))
      formDataToSend.append("contentType", contentType)

      const response = await generateContentMutation(formDataToSend).unwrap()

      if (response.success) {
        const items = response.data?.[config.dataKey] || response.data?.[contentType]
        setGeneratedItems(items)
        toast.success(`${config.itemLabel}s generated successfully!`, "success")
      } else {
        toast.error(response.error || `Failed to generate ${config.itemLabel.toLowerCase()}s`)
      }
    } catch (error) {
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to delete role';
      toast.error(errorMessage); toast.error(`Failed to generate ${config.itemLabel.toLowerCase()}s`)
    } finally {
      setGenerating(false)
    }
  }

  // To handle multiple selection
  const toggleItemSelection = (index) => {
    setSelectedItems(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  // To handle using multiple selected items
  const handleUseSelectedItems = () => {
    if (selectedItems.length === 0) return;

    const selectedQuestions = selectedItems.map(index => ({
      ...generatedItems[index],
      contentType: contentType, // ✅ add contentType to each question
    }));

    onUseGenerated(selectedQuestions); // Pass array with contentType
    setShowModal(false);
    setSelectedItems([]); // Reset selection
  };

  // To select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.length === generatedItems.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(generatedItems.map((_, index) => index))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setFormData((prev) => ({ ...prev, pdfFile: file }))
    } else {
      toast.error("Please select a valid PDF file")
    }
  }

  const handleUseItem = (item) => {
    onUseGenerated({ ...item, contentType: contentType })
    setShowModal(false)
  }

  const resetModal = () => {
    setShowModal(false)
    if (clearContent) {
      setGeneratedItems(null)
      setFormData({ pdfFile: null, userQuery: "" })
    }
  }

  // Badge component replacement
  const Badge = ({ children, variant = "default", className = "" }) => {
    const variants = {
      default: "bg-lightGreen/20 text-leafGreen",
      secondary: "bg-gray-100 text-gray-800",
      outline: "border border-gray-300 bg-white text-gray-700",
    }
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      >
        {children}
      </span>
    )
  }

  // Render item details based on content type
  const renderItemDetails = (item) => {
    switch (contentType) {
      case "course":
        return (
          <div className="flex justify-between items-start gap-4">
            {/* Left Side - Details */}
            <div className="space-y-2 flex-1">
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                <div>Duration: {item.duration_minutes} minutes</div>
                <div>Price: ₹{item.price}</div>
              </div>
              <div className="text-xs text-gray-500">
                {item.what_you_will_learn?.length} Learning Points
              </div>
            </div>

            {/* Right Side - Thumbnail */}
            {item.thumbnailImage?.data && (
              <img
                src={item.thumbnailImage?.data ? `data:${item.thumbnailImage.type};base64,${item.thumbnailImage.data}` : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                alt={item.thumbnailImage.name || "Course Thumbnail"}
                className="w-24 h-24 object-cover rounded-md border border-gray-200"
              />
            )}
          </div>
        )
      case "module":
        return (
          <div className="space-y-2">
            {item.description && (
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
              </p>
            )}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <Badge variant="secondary">Duration: {item.duration_minutes} mins</Badge>
              <Badge variant={item.status === "active" ? "default" : "secondary"}>
                {item.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        )
      case "session":
        return (
          <div className="space-y-2">
            {item.chapter_description && (
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {item.chapter_description.length > 150
                  ? `${item.chapter_description.substring(0, 150)}...`
                  : item.chapter_description}
              </p>
            )}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <Badge variant="secondary">Duration: {item.min_time_in_minute} minutes</Badge>
              <Badge variant={item.status === "active" ? "default" : "secondary"}>
                {item.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        )
      case "topic":
        return (
          <div className="space-y-2">
            {item.description && (
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {item.description.length > 200 ? `${item.description.substring(0, 200)}...` : item.description}
              </p>
            )}
            {item.learning_objectives && item.learning_objectives.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">Learning Objectives:</p>
                <ul className="text-xs text-gray-600 list-disc list-inside">
                  {item.learning_objectives.slice(0, 2).map((objective, idx) => (
                    <li key={idx}>{objective}</li>
                  ))}
                  {item.learning_objectives.length > 2 && (
                    <li>+ {item.learning_objectives.length - 2} more objectives</li>
                  )}
                </ul>
              </div>
            )}
            <div className="flex gap-2 mb-2">
              <Badge variant="outline">{item.content_type}</Badge>
              <Badge variant="outline">{item.difficulty_level}</Badge>
              <Badge variant="secondary">Duration: {item.estimated_duration} min</Badge>
            </div>
          </div>
        )
      case "assignment":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
            <div className="flex justify-between items-center">
              <Badge variant="outline">{item.category}</Badge>
              <div className="text-xs text-gray-500">Max Score: {item.max_score}</div>
            </div>
          </div>
        )
      case "assignment_questions":
        // Determine question type function
        const getQuestionType = (q) => {
          if (q.MatchingOptions) return "matching";
          if (q.answers) return "fill-in-blanks";
          if (q.hasOwnProperty('correct_answer')) return "true-false";
          if (q.paragraph_prompt) return "paragraph";
          return "unknown";
        };

        const questionType = getQuestionType(item);

        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-gray-50">
              {/* Matching Questions */}
              {questionType === "matching" && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 mb-3">
                    {item.question_text}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Badge variant="outline" className="mb-2">Options</Badge>
                      {item.MatchingOptions.map((option, idx) => (
                        <div key={idx} className="p-2 bg-lightGreen/5 rounded mb-2 text-sm">
                          {option.option_text}
                        </div>
                      ))}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2">Matches</Badge>
                      {item.MatchingOptions.map((option, idx) => (
                        <div key={idx} className="p-2 bg-green-50 rounded mb-2 text-sm">
                          {option.match_text}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Badge variant="secondary">Matching Question</Badge>
                </div>
              )}

              {/* Fill-in-the-blanks Questions */}
              {questionType === "fill-in-blanks" && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 mb-3">
                    <p dangerouslySetInnerHTML={{ __html: item.question_text }}></p>
                  </h4>
                  <div className="bg-lightGreen/5 p-3 rounded">
                    <Badge variant="outline" className="mb-2">Answers</Badge>
                    <div className="flex flex-wrap gap-2">
                      {item.answers.map((answer, idx) => (
                        <span key={idx} className="bg-yellow-200 px-2 py-1 rounded text-sm">
                          {answer}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Badge variant="secondary">Fill in the Blanks</Badge>
                </div>
              )}

              {/* True/False Questions */}
              {questionType === "true-false" && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 mb-3">
                    {item.question_text}
                  </h4>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={item.correct_answer ? "default" : "destructive"}
                      className="text-sm"
                    >
                      Answer: {item.correct_answer ? "True" : "False"}
                    </Badge>
                  </div>
                  <Badge variant="secondary">True/False Question</Badge>
                </div>
              )}

              {/* Paragraph Prompts */}
              {questionType === "paragraph" && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-800 mb-3">Writing Prompt</h4>
                  <div className="bg-lightGreen/5 p-3 rounded">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.paragraph_prompt}
                    </p>
                  </div>
                  <Badge variant="secondary">Paragraph Writing</Badge>
                </div>
              )}
            </div>
          </div >
        )
      case "quiz":
        return (
          <div className="space-y-2">
            {item.description && (
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {item.description.length > 150 ? `${item.description.substring(0, 150)}...` : item.description}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="secondary">Duration: {item.duration_minutes || 30} min</Badge>
              <Badge variant="secondary">Passing: {item.passing_score || 60}%</Badge>
              <Badge variant="secondary">Max Attempts: {item.max_attempts || 1}</Badge>
              <Badge variant="secondary">Type: {item.quizType === "text_based" ? "Text Based" : "Normal"}</Badge>
            </div>
          </div>
        )
      case "faq":
        return (
          <div className="space-y-2">
            {item.options && item.options.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">{item.question}</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {item.options.slice(0, 3).map((option, optIdx) => (
                    <li key={optIdx} className="flex items-start">
                      <span className="text-leafGreen mr-2">•</span>
                      {option.length > 100 ? `${option.substring(0, 100)}...` : option}
                    </li>
                  ))}
                  {item.options.length > 3 && (
                    <li className="text-gray-500 italic">+{item.options.length - 3} more options...</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )
      case "speaking":
        return (
          <div className="space-y-3">
            {/* Question Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Speaking Question:</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-leafGreen">
                {item.speaking_question && item.speaking_question.length > 200
                  ? `${item.speaking_question.substring(0, 200)}...`
                  : item.speaking_question || "No question available"}
              </div>
            </div>

            {/* Sample Answers Preview */}
            {item.speaking_answer && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Sample Answer:
                </p>
                <div className="bg-lightGreen/10 p-2 rounded border border-lightGreen/50">
                  <span className="text-sm text-green-800">
                    {item.speaking_answer}
                  </span>
                </div>
              </div>
            )}

            {/* Audio/Image Files */}
            <div className="flex gap-4 mb-3">
              {item.audioFile && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-lightGreen/20 text-leafGreen px-2 py-1 rounded">
                    Audio File Available
                  </span>
                </div>
              )}
              {item.imageFile && (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-lightGreen/20 text-leafGreen px-2 py-1 rounded">
                    Image File Available
                  </span>
                </div>
              )}
            </div>

            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Marks: {item.marks || 1}</Badge>
              <Badge variant="outline">Speaking Practice</Badge>
              <Badge variant="outline">
                {item.speaking_answer?.length || 0} Sample Answers
              </Badge>
            </div>
          </div>
        )
      case "drag-drop":
        return (
          <div className="space-y-3">
            {/* Question Prompt Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-leafGreen">
                {item.prompt && item.prompt.length > 200
                  ? `${item.prompt.substring(0, 200)}...`
                  : item.prompt || "No prompt available"}
              </div>
            </div>
            {/* Blanks Information */}
            {item.blanks && item.blanks.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Fill-in-the-blanks ({item.blanks.length} blanks):
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.blanks.slice(0, 4).map((blank, idx) => (
                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {blank.position}: {blank.correct}
                    </Badge>
                  ))}
                  {item.blanks.length > 4 && <Badge variant="secondary">+{item.blanks.length - 4} more</Badge>}
                </div>
              </div>
            )}
            {/* Options Preview */}
            {item.options && item.options.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Drag Options ({item.options.length} total):</p>
                <div className="flex flex-wrap gap-1">
                  {item.options.slice(0, 6).map((option, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-lightGreen/20 text-leafGreen text-xs px-2 py-1 rounded border border-lightGreen/20"
                    >
                      {option}
                    </span>
                  ))}
                  {item.options.length > 6 && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{item.options.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Marks: {item.marks || item.blanks?.length || 1}</Badge>
              <Badge variant="outline">Blanks: {item.blanks?.length || 0}</Badge>
              <Badge variant="outline">Options: {item.options?.length || 0}</Badge>
            </div>
          </div>
        )
      case "complete-sentence":
        return (
          <div className="space-y-3">
            {/* Question Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-leafGreen">
                {item.question && item.question.length > 200
                  ? `${item.question.substring(0, 200)}...`
                  : item.question || "No question available"}
              </div>
            </div>
            {/* Blanks Information */}
            {item.blanks && item.blanks.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Answer Blanks ({item.blanks.length} blanks):</p>
                <div className="space-y-2">
                  {item.blanks.slice(0, 4).map((blank, idx) => (
                    <div key={idx} className="bg-green-50 p-2 rounded border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">
                          Blank #{idx + 1}: {blank.word}
                        </span>
                        {blank.hint && <span className="text-xs text-green-600 italic">Hint: {blank.hint}</span>}
                      </div>
                    </div>
                  ))}
                  {item.blanks.length > 4 && (
                    <div className="text-sm text-gray-500 italic">+{item.blanks.length - 4} more blanks...</div>
                  )}
                </div>
              </div>
            )}
            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Blanks: {item.blanks?.length || 0}</Badge>
              <Badge variant="outline">With Hints: {item.blanks?.filter((b) => b.hint).length || 0}</Badge>
            </div>
          </div>
        )
      case "mcq":
        return (
          <div className="space-y-3">
            {/* Question Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-green-400">
                {item.question_text || item.question
                  ? (item.question_text || item.question).length > 200
                    ? `${(item.question_text || item.question).substring(0, 200)}...`
                    : item.question_text || item.question
                  : "No question available"}
              </div>
            </div>
            {/* Options Preview */}
            {item.options && item.options.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Answer Options ({item.options.length} total):</p>
                <div className="space-y-2">
                  {item.options.map((option, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded border text-sm ${option.isCorrect || idx === item.correct_answer
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200 text-gray-700"
                        }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                      <span>{typeof option === "string" ? option : option.text}</span>
                      {(option.isCorrect || idx === item.correct_answer) && (
                        <Badge variant="outline" className="ml-auto bg-green-100 text-green-700 border-green-300">
                          Correct
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Explanation Preview */}
            {item.explanation && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Explanation:</p>
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                  {item.explanation.length > 150 ? `${item.explanation.substring(0, 150)}...` : item.explanation}
                </div>
              </div>
            )}
            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Marks: {item.marks || 1}</Badge>
              <Badge variant="outline">Options: {item.options?.length || 0}</Badge>
              <Badge variant="outline">Type: {item.question_type || "multiple-choice"}</Badge>
            </div>
          </div>
        )
      case "best-option":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 line-clamp-3">{item.passage?.substring(0, 150)}...</p>
            <div className="flex gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {item.selectedWords?.length || 0} blanks
              </span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{item.marks || 0} marks</span>
            </div>
          </div>
        )
      case "summary-passage":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 line-clamp-3">{item.passage?.substring(0, 150)}...</p>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {item.timeLimit || 180}s time limit
            </span>
          </div>
        )
      case "audio-script":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-600 line-clamp-3">{item.script?.substring(0, 150)}...</p>
          </div>
        )
      case "image-script":
        return (
          <div className="space-y-3">
            {/* Generated Image Preview */}
            {item.imagetoscript_image?.dataUrl && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Generated Image:</p>
                <img
                  src={item.imagetoscript_image.dataUrl || `${import.meta.env.VITE_BACKEND_MEDIA_URL}${"/placeholder.png"}`}
                  alt="Generated for image script question"
                  className="w-full max-w-xs h-auto rounded-lg border border-gray-200"
                />
              </div>
            )}

            {/* Image URL/Description Preview */}
            {item.imagetoscript_url && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Image Description:</p>
                <div className="text-sm text-leafGreen bg-lightGreen/5 p-2 rounded border border-lightGreen/20 break-words">
                  {item.imagetoscript_url.length > 100
                    ? `${item.imagetoscript_url.substring(0, 100)}...`
                    : item.imagetoscript_url}
                </div>
              </div>
            )}

            {/* Script Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Script:</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-leafGreen">
                {item.imagetoscript_script && item.imagetoscript_script.length > 200
                  ? `${item.imagetoscript_script.substring(0, 200)}...`
                  : item.imagetoscript_script || "No script available"}
              </div>
            </div>

            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Marks: {item.marks || 1}</Badge>
              <Badge variant="outline">Image-based Question</Badge>
              {item.image_generation_error && (
                <Badge variant="outline" className="bg-red-100 text-red-700">
                  Image Failed
                </Badge>
              )}
            </div>
          </div>
        )
      case "arrange-order":
        return (
          <div className="space-y-3">
            {/* Prompt Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">Prompt:</p>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border-l-4 border-leafGreen">
                {item.prompt && item.prompt.length > 150
                  ? `${item.prompt.substring(0, 150)}...`
                  : item.prompt || "No prompt available"}
              </div>
            </div>

            {/* Sentences Preview */}
            {item.sentences && item.sentences.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Sentences to Arrange ({item.sentences.length} total):
                </p>
                <div className="space-y-2">
                  {item.sentences.slice(0, 4).map((sentence, idx) => (
                    <div key={idx} className="bg-lightGreen/5 p-2 rounded border border-lightGreen/20">
                      <span className="text-sm text-forestGreen">
                        {sentence.length > 100 ? `${sentence.substring(0, 100)}...` : sentence}
                      </span>
                    </div>
                  ))}
                  {item.sentences.length > 4 && (
                    <div className="text-sm text-gray-500 italic">+{item.sentences.length - 4} more sentences...</div>
                  )}
                </div>
              </div>
            )}

            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Marks: {item.marks || 1}</Badge>
              <Badge variant="outline">Sentences: {item.sentences?.length || 0}</Badge>
              <Badge variant="outline">Arrange Order</Badge>
            </div>
          </div>
        );
      case "real-word":
        return (
          <div className="space-y-3">
            {/* Category and Difficulty */}
            <div className="flex gap-2 mb-3">
              <Badge variant="outline" className="bg-lightGreen/20 text-leafGreen border-lightGreen/20">
                {item.category || "Vocabulary"}
              </Badge>
              <Badge variant="outline" className="bg-lightGreen/20 text-leafGreen border-lightGreen/20">
                {item.difficulty || "intermediate"}
              </Badge>
            </div>

            {/* Words Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Words to Identify ({item.words?.length || 0} total):
              </p>
              <div className="flex flex-wrap gap-1">
                {item.words?.slice(0, 8).map((word, idx) => {
                  const isCorrect = item.correct_answers?.includes(word)
                  return (
                    <span
                      key={idx}
                      className={`inline-block text-xs px-2 py-1 rounded border ${isCorrect
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                        }`}
                    >
                      {word}
                    </span>
                  )
                })}
                {item.words?.length > 8 && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    +{item.words.length - 8} more
                  </span>
                )}
              </div>
            </div>

            {/* Correct Answers Preview */}
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Correct Words ({item.correct_answers?.length || 0} correct):
              </p>
              <div className="flex flex-wrap gap-1">
                {item.correct_answers?.slice(0, 6).map((word, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded border border-green-200 font-medium"
                  >
                    ✓ {word}
                  </span>
                ))}
                {item.correct_answers?.length > 6 && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    +{item.correct_answers.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* Question Stats */}
            <div className="flex gap-2">
              <Badge variant="secondary">Marks: {item.marks || item.correct_answers?.length || 1}</Badge>
              <Badge variant="outline">Total Words: {item.words?.length || 0}</Badge>
              <Badge variant="outline">Correct: {item.correct_answers?.length || 0}</Badge>
            </div>
          </div>
        )
      default:
        return <p className="text-sm text-gray-600">{item.description || "No description available"}</p>
    }
  }

  return (
    <PermissionWrapper section="AI Content Generator">
      <>
        {/* Generate Button */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center sm:px-4 p-2 bg-leafGreen   text-white font-medium rounded-md shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2 whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4 sm:mr-1 md:mr-2" />
          <span className="hidden sm:inline">{buttonText || <span>Generate <span className="hidden lg:inline">with AI</span></span>}</span>
        </button>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-4 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                <h2 className="text-xl font-semibold text-gray-900">
                  {modalTitle || config.title}
                  {allowMultipleSelection && generatedItems && (
                    <span className="text-sm font-normal text-gray-600 ml-2">
                      ({selectedItems.length} selected)
                    </span>
                  )}
                </h2>
                <button
                  onClick={resetModal}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {/* PDF Upload Section */}
                {requiresPDF && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload PDF Content {!requiresPDF && "(Optional)"}
                    </label>
                    <div className="border-2 border-dashed border-lightGreen rounded-lg p-6 hover:border-leafGreen transition-colors duration-200">
                      <div className="text-center">
                        <FileText className="w-12 h-12 text-leafGreen mx-auto mb-3" />
                        <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
                        <label
                          htmlFor="pdf-upload"
                          className="cursor-pointer text-leafGreen hover:text-forestGreen font-medium transition-colors duration-200"
                        >
                          Choose PDF file to analyze
                        </label>
                        {formData.pdfFile && (
                          <p className="text-sm text-gray-600 mt-2 bg-lightGreen/10 p-2 rounded">
                            ✓ Selected: {formData.pdfFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Type Selection */}
                {config.dataKey === "topics" && <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={topicType || ""}
                    onChange={(e) => setTopicType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen transition-all duration-300 hover:shadow-md bg-white"
                  >
                    <option value="">All Types (Mixed Content)</option>
                    <option value="video">Video - Visual tutorials and demonstrations</option>
                    <option value="audio">Audio - In-depth narrated content</option>
                    <option value="accordian">Accordians - Expandable sections with practice</option>
                    <option value="slide">Slides - Slide-based with narration</option>
                    <option value="general">General - Documentation and reference materials</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a specific content type to generate 3-5 topics of that type, or leave as "All Types" for variety
                  </p>
                </div>}

                {/* Query Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {config.itemLabel} Requirements & Focus
                  </label>
                  <textarea
                    value={formData.userQuery}
                    onChange={(e) => setFormData((prev) => ({ ...prev, userQuery: e.target.value }))}
                    placeholder={placeholderText || config.placeholder}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-leafGreen/20 focus:border-leafGreen transition-all duration-300 hover:shadow-md resize-none"
                    rows={4}
                  />
                </div>

                {/* Action Buttons */}
                {/* <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {`Generating ${config.itemLabel}s...`}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {config.buttonText}
                    </>
                  )}
                </button>
                <button
                  onClick={resetModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div> */}

                {/* Generated Items */}
                {generatedItems && (
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold text-forestGreen">
                        Generated {config.itemLabel}s ({generatedItems.length})
                      </h4>

                      {/* Select All button - only show when allowMultipleSelection is true */}
                      {allowMultipleSelection && generatedItems.length > 0 && (
                        <button
                          onClick={toggleSelectAll}
                          className="text-sm text-leafGreen hover:text-forestGreen font-medium flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {selectedItems.length === generatedItems.length ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {generatedItems.map((item, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg transition-all duration-200 ${allowMultipleSelection && selectedItems.includes(index)
                            ? 'border-leafGreen bg-lightGreen/5 ring-2 ring-leafGreen/20'
                            : 'border-gray-200 bg-white hover:shadow-md'
                            }`}
                        >
                          <div className="p-4">
                            {/* Selection checkbox - only show when allowMultipleSelection is true */}
                            {allowMultipleSelection && (
                              <div className="flex items-start gap-3 mb-3">
                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex justify-between items-start">
                                      <input
                                        type="checkbox"
                                        checked={selectedItems.includes(index)}
                                        onChange={() => toggleItemSelection(index)}
                                        className="mt-1 w-4 h-4 accent-leafGreen border-gray-300 rounded focus:ring-leafGreen"
                                      />
                                      <h5 className="font-semibold text-gray-900 text-lg ml-2">
                                        {contentType === "drag-drop"
                                          ? `Question ${index + 1}`
                                          : contentType === "best-option"
                                            ? `Best Option Question ${index + 1}`
                                            : contentType === "summary-passage"
                                              ? `Summary Passage ${index + 1}`
                                              : contentType === "audio-script"
                                                ? item.title || `Audio Script ${index + 1}`
                                                : contentType === "real-word"
                                                  ? `Real Word Question ${index + 1}`
                                                  : item.title}
                                      </h5>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${selectedItems.includes(index)
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-gray-100 text-gray-800'
                                      }`}>
                                      {config.itemLabel}
                                    </span>
                                  </div>
                                  {renderItemDetails(item)}
                                </div>
                              </div>
                            )}

                            {/* Original layout when not in multiple selection mode */}
                            {!allowMultipleSelection && (
                              <>
                                <div className="flex justify-between items-start mb-3">
                                  <h5 className="font-semibold text-gray-900 text-lg">
                                    {contentType === "drag-drop"
                                      ? `Question ${index + 1}`
                                      : contentType === "best-option"
                                        ? `Best Option Question ${index + 1}`
                                        : contentType === "summary-passage"
                                          ? `Summary Passage ${index + 1}`
                                          : contentType === "audio-script"
                                            ? item.title || `Audio Script ${index + 1}`
                                            : contentType === "real-word"
                                              ? `Real Word Question ${index + 1}`
                                              : item.title}
                                  </h5>
                                  <span className="px-2 py-1 text-xs bg-lightGreen/20 text-leafGreen rounded-full">
                                    {config.itemLabel}
                                  </span>
                                </div>
                                {renderItemDetails(item)}
                              </>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-end mt-3 gap-2">
                              {allowMultipleSelection ? (
                                // In multiple selection mode, show individual use button
                                <button
                                  onClick={() => {
                                    onUseGenerated([{ ...item, contentType: contentType }]) // Pass as array
                                    setShowModal(false)
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 bg-leafGreen   text-white text-sm font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:ring-offset-2"
                                >
                                  Use This {config.itemLabel}
                                </button>
                              ) : (
                                // Original single use button
                                <button
                                  onClick={() => {
                                    onUseGenerated({ ...item, contentType: contentType });
                                    setShowModal(false);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                  Use This {config.itemLabel}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between item-center p-4 border-t bg-white sticky bottom-0">
                {/* Use Selected Button - only show when allowMultipleSelection is true and there are selected items */}
                <div>
                  {allowMultipleSelection && selectedItems.length > 0 && (
                    // <div className="flex justify-start gap-3 p-4 border-t bg-white sticky bottom-0">
                      <button
                        onClick={handleUseSelectedItems}
                        className="flex px-6 py-2.5 text-sm font-medium text-white bg-leafGreen   rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Use Selected Questions
                      </button>
                    // </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex px-6 py-2.5 text-sm font-medium text-white bg-leafGreen hover:bg-forestGreen hover:to-purple-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {`Generating ${config.itemLabel}s...`}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {config.buttonText}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div >
        )
        }
      </>
    </PermissionWrapper>
  )
}
