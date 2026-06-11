"use client"

import { useState, useEffect } from "react"
import AdminLoader from "../../../components/admin/AdminLoader"
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  X,
  ArrowLeft,
  TestTube,
  Eye,
  EyeOff,
  Languages,
  Minus,
  Clock,
  MemoryStick,
  ChevronRight,
  Maximize2,
} from "lucide-react"
import {
  useCreateContestCodingMutation,
  useUpdateContestCodingMutation,
  useGetContestCodingByIdQuery,
} from "../../../services/Contest/contestCodingAPI"
import {
  useGetTestCasesQuery,
  useCreateTestCaseMutation,
  useUpdateTestCaseMutation,
  useDeleteTestCaseMutation,
  useToggleTestCaseStatusMutation,
} from "../../../services/Contest/contestCodingTestCaseAPI"
import { useLocation, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import PermissionWrapper from "../../../context/PermissionWrapper"
import CodeEditor from "../../../components/contest/Code"

const CodingActivityPage = () => {
  const { coding_id, activity_id } = useLocation()?.state
  const navigate = useNavigate()

  const [currentCodingId, setCurrentCodingId] = useState(coding_id)

  // Contest Coding API calls
  const {
    data: codingResponse,
    isLoading: codingLoading,
    error: codingError,
    refetch: refetchCoding,
  } = useGetContestCodingByIdQuery(currentCodingId, { skip: !currentCodingId })

  const contestCoding = codingResponse?.coding || null

  const [createContestCoding] = useCreateContestCodingMutation()
  const [updateContestCoding] = useUpdateContestCodingMutation()

  // Test Cases API calls
  const {
    data: testCasesResponse,
    isLoading: testCasesLoading,
    refetch: refetchTestCases,
  } = useGetTestCasesQuery(contestCoding?.id, {
    skip: !contestCoding?.id,
  })
  const testCases = testCasesResponse?.testCases || []

  const [codingFormData, setCodingFormData] = useState({
    title: "",
    points_reward: null,
    max_attempts: null,
    is_warning: false,
    no_of_warning: 3,
    problem_statement: "",
    constraints: "",
    sample_inputs_outputs: [], // Changed to array to match backend JSON field
    time_limit_seconds: 120, // Changed to match backend field name
    memory_limit_mb: 256, // Changed to match backend field name
    difficulty_level: "easy", // Changed to match backend field name
    allowed_languages: [],
    starter_code: {}, // Object to store starter code for each language
  })

  const availableLanguages = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "c", label: "C" },
    // { value: "csharp", label: "C#" },
    // { value: "go", label: "Go" },
    // { value: "rust", label: "Rust" },
    // { value: "php", label: "PHP" },
    // { value: "ruby", label: "Ruby" },
  ]

  const [selectedLanguageForCode, setSelectedLanguageForCode] = useState("")
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isTestCasesCollapsed, setIsTestCasesCollapsed] = useState(true)

  const [showTestCaseForm, setShowTestCaseForm] = useState(false)
  const [testCaseFormData, setTestCaseFormData] = useState({
    input: "",
    expected_output: "",
    is_public: true,
    order: 1,
  })
  const [editingTestCase, setEditingTestCase] = useState(null)

  const [createTestCase] = useCreateTestCaseMutation()
  const [updateTestCase] = useUpdateTestCaseMutation()
  const [deleteTestCase] = useDeleteTestCaseMutation()
  const [toggleTestCaseStatus] = useToggleTestCaseStatusMutation()

  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, type: "", id: null, title: "" })
  const [showStarterCodeModal, setShowStarterCodeModal] = useState(false)

  // Initialize form data when contest coding loads
  useEffect(() => {
    if (contestCoding) {
      let starterCodes = {}
      let allowedLanguages = []
      let sampleInputsOutputs = []

      try {
        if (contestCoding.starter_code) {
          starterCodes =
            typeof contestCoding.starter_code === "string"
              ? JSON.parse(contestCoding.starter_code)
              : contestCoding.starter_code
        }
        if (contestCoding.allowed_languages) {
          allowedLanguages =
            typeof contestCoding.allowed_languages === "string"
              ? JSON.parse(contestCoding.allowed_languages)
              : contestCoding.allowed_languages
        }
        if (contestCoding.sample_inputs_outputs) {
          sampleInputsOutputs =
            typeof contestCoding.sample_inputs_outputs === "string"
              ? JSON.parse(contestCoding.sample_inputs_outputs)
              : contestCoding.sample_inputs_outputs
        }
      } catch (error) {
        console.error("Error parsing JSON data:", error)
      }

      setCodingFormData({
        title: contestCoding.title || "",
        points_reward: contestCoding.points_reward || null,
        max_attempts: contestCoding.max_attempts || null,
        is_warning: contestCoding.is_warning || false,
        no_of_warning: contestCoding.no_of_warning || 3,
        problem_statement: contestCoding.problem_statement || "",
        constraints: contestCoding.constraints || "",
        sample_inputs_outputs: sampleInputsOutputs,
        time_limit_seconds: contestCoding.time_limit_seconds || 120,
        memory_limit_mb: contestCoding.memory_limit_mb || 256,
        difficulty_level: contestCoding.difficulty_level || "easy",
        allowed_languages: allowedLanguages,
        starter_code: starterCodes,
      })

      // Set default language for starter code editing
      if (allowedLanguages.length > 0) {
        setSelectedLanguageForCode(allowedLanguages[0])
      }
    }
  }, [contestCoding])

  const handleCodingInputChange = (e) => {
    const { name, value, checked } = e.target
    setCodingFormData((prev) => ({
      ...prev,
      [name]: name === "time_limit_seconds" || name === "memory_limit_mb" || name === "max_attempts" || name === "points_reward" || name === "no_of_warning" ? Number.parseInt(value) || 0 : name === 'is_warning' ? checked : value,
    }))
  }

  const handleLanguageChange = (selectedLanguages) => {
    setCodingFormData((prev) => {
      // Remove starter codes for unselected languages
      const newStarterCodes = { ...prev.starter_code }
      Object.keys(newStarterCodes).forEach((lang) => {
        if (!selectedLanguages.includes(lang)) {
          delete newStarterCodes[lang]
        }
      })

      return {
        ...prev,
        allowed_languages: selectedLanguages,
        starter_code: newStarterCodes,
      }
    })

    // Update selected language for code editing if current selection is no longer available
    if (!selectedLanguages.includes(selectedLanguageForCode) && selectedLanguages.length > 0) {
      setSelectedLanguageForCode(selectedLanguages[0])
    }
  }

  const handleStarterCodeChange = (language, code) => {
    setCodingFormData((prev) => ({
      ...prev,
      starter_code: {
        ...prev.starter_code,
        [language]: code,
      },
    }))
  }

  const addSampleInputOutput = () => {
    setCodingFormData((prev) => ({
      ...prev,
      sample_inputs_outputs: [...prev.sample_inputs_outputs, { input: "", output: "" }],
    }))
  }

  const removeSampleInputOutput = (index) => {
    setCodingFormData((prev) => ({
      ...prev,
      sample_inputs_outputs: prev.sample_inputs_outputs.filter((_, i) => i !== index),
    }))
  }

  const updateSampleInputOutput = (index, field, value) => {
    setCodingFormData((prev) => ({
      ...prev,
      sample_inputs_outputs: prev.sample_inputs_outputs.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const handleTestCaseInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setTestCaseFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "order" ? Number.parseInt(value) || 1 : value,
    }))
  }

  const handleSaveCoding = async (e) => {
    e?.preventDefault()  // Add this line

    try {
      const dataToSave = {
        title: codingFormData.title,
        points_reward: codingFormData.points_reward,
        max_attempts: codingFormData.max_attempts,
        is_warning: codingFormData.is_warning || false,
        no_of_warning: codingFormData.no_of_warning || 3,
        problem_statement: codingFormData.problem_statement,
        constraints: codingFormData.constraints,
        sample_inputs_outputs: codingFormData.sample_inputs_outputs,
        time_limit_seconds: codingFormData.time_limit_seconds,
        memory_limit_mb: codingFormData.memory_limit_mb,
        difficulty_level: codingFormData.difficulty_level,
        allowed_languages: codingFormData.allowed_languages,
        starter_code: codingFormData.starter_code,
      }

      if (contestCoding) {
        await updateContestCoding({
          id: contestCoding.id,
          ...dataToSave,
        }).unwrap()
        refetchCoding()
        navigate(-1)
      } else {
        const res = await createContestCoding({
          ...dataToSave,
          activity_id: Number.parseInt(activity_id),
        }).unwrap()
        setCurrentCodingId(res.coding.id)
      }
    } catch (error) {
      console.error("Failed to save coding activity:", error)
      toast.error(error?.data?.error || "Failed to save coding activity. Please try again.")
    }
  }

  const handleConfirmDelete = async () => {
    try {
      if (deleteConfirmation.type === "testcase") {
        await deleteTestCase(deleteConfirmation.id).unwrap()
        refetchTestCases()
      }
      setDeleteConfirmation({ show: false, type: "", id: null, title: "" })
    } catch (error) {
      console.error("Failed to delete:", error)
      toast.error(error?.data?.error || "Failed to delete. Please try again.")
    }
  }

  const handleAddTestCase = async () => {
    if (!contestCoding) {
      await handleSaveCoding()
    }
    setEditingTestCase(null)
    setTestCaseFormData({
      input: "",
      expected_output: "",
      is_public: true,
      order: testCases.length + 1,
    })
    setShowTestCaseForm(true)
  }

  const handleEditTestCase = (testCase) => {
    setEditingTestCase(testCase)
    setTestCaseFormData({
      input: testCase.input,
      expected_output: testCase.expected_output,
      is_public: testCase.is_public,
      order: testCase.order,
    })
    setShowTestCaseForm(true)
  }

  const handleDeleteTestCase = (testCase) => {
    setDeleteConfirmation({
      show: true,
      type: "testcase",
      id: testCase.id,
      title: `Test Case #${testCase.order + 1}`,
    })
  }

  const handleToggleTestCaseStatus = async (testCaseId) => {
    try {
      await toggleTestCaseStatus(testCaseId).unwrap()
      refetchTestCases()
    } catch (error) {
      console.error("Failed to toggle test case status:", error)
      toast.error(error?.data?.error || "Failed to update test case status. Please try again.")
    }
  }

  const handleSubmitTestCase = async (e) => {
    e.preventDefault()
    if (!contestCoding) return

    try {
      if (editingTestCase) {
        await updateTestCase({
          id: editingTestCase.id,
          ...testCaseFormData,
        }).unwrap()
      } else {
        await createTestCase({
          ...testCaseFormData,
          coding_id: contestCoding.id,
        }).unwrap()
      }
      setShowTestCaseForm(false)
      setIsTestCasesCollapsed(false)
      setEditingTestCase(null)
      refetchTestCases()
    } catch (error) {
      console.error("Failed to save test case:", error)
      toast.error(error?.data?.error || "Failed to save test case. Please try again.")
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (codingLoading) {
    return <AdminLoader fullScreen={true} message="Loading coding activity..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full p-4 sm:px-6">
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex-1 grid min-w-0">
              <h1 className="text-2xl font-bold  text-forestGreen">
                CodeContest
              </h1>
            </div>

            <div className="flex items-center gap-3 sm:gap-2 md:gap-3">
              <PermissionWrapper section="Contest Coding" action="create|update">
                <button
                  type="submit"
                  form="codingForm"
                  className=" bg-leafGreen   text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm sm:px-4"
                >
                  Save
                  <ChevronRight size={14} />
                </button>
              </PermissionWrapper>

              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-lightGreen/20 transition-colors border border-gray-300 rounded-lg shadow-sm sm:px-3"
              >
                <ArrowLeft size={18} />
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8"></div>
              <div className="flex-1 grid text-center">
                <h1 className="text-xl font-bold  text-forestGreen">
                  CodeContest
                </h1>
              </div>
              <button
                onClick={() => navigate(-1)}
                className="flex border items-center justify-center w-8 h-8 text-gray-600 hover:text-gray-900 hover:bg-lightGreen/20 transition-colors rounded-lg"
              >
                <ArrowLeft size={18} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <PermissionWrapper section="Contest Coding" action="create|update">
                <button
                  type="submit"
                  form="codingForm"
                  className=" bg-leafGreen   text-white px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-medium shadow-sm flex-1 justify-center text-sm"
                >
                  <Plus size={16} />
                  <span>Save</span>
                </button>
              </PermissionWrapper>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-74px)]">
        {/* Left Panel - Problem Configuration */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <form id="codingForm" onSubmit={handleSaveCoding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title*</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={codingFormData.title}
                  onChange={handleCodingInputChange}
                  placeholder="Enter Problem Title..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                />
              </div>

              {/* Problem Statement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Problem Statement*</label>
                <textarea
                  name="problem_statement"
                  value={codingFormData.problem_statement}
                  onChange={handleCodingInputChange}
                  required
                  rows={5}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none"
                  placeholder="Describe the coding problem in detail..."
                />
              </div>

              {/* Constraints */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Constraints</label>
                <textarea
                  name="constraints"
                  value={codingFormData.constraints}
                  onChange={handleCodingInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent resize-none"
                  placeholder="Enter problem constraints..."
                />
              </div>

              {/* Configuration Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty*</label>
                  <select
                    name="difficulty_level"
                    value={codingFormData.difficulty_level}
                    required
                    onChange={handleCodingInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Time Limit (sec)*
                  </label>
                  <input
                    type="number"
                    required
                    name="time_limit_seconds"
                    min={1}
                    value={codingFormData.time_limit_seconds}
                    onChange={handleCodingInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Max Attempts*
                  </label>
                  <input
                    type="number"
                    name="max_attempts"
                    min={1}
                    required
                    value={codingFormData.max_attempts}
                    onChange={handleCodingInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    Points Reward*
                  </label>
                  <input
                    type="number"
                    name="points_reward"
                    required
                    min={1}
                    value={codingFormData.points_reward}
                    onChange={handleCodingInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_warning"
                    name="is_warning"
                    checked={codingFormData.is_warning}
                    onChange={handleCodingInputChange}
                    className="h-4 w-4 accent-leafGreen text-leafGreen focus:ring-leafGreen border-gray-300 rounded"
                  />
                  <label htmlFor="is_warning" className="ml-2 block text-sm text-gray-700">
                    Restrict Full Screen
                  </label>
                </div>

                {Boolean(codingFormData.is_warning) && <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number Of Warning</label>
                  <input
                    type="number"
                    name="no_of_warning"
                    value={codingFormData.no_of_warning}
                    onChange={handleCodingInputChange}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-leafGreen focus:border-transparent text-sm sm:text-base"
                  />
                </div>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Sample Input/Output</label>
                  <button
                    type="button"
                    onClick={addSampleInputOutput}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-leafGreen text-white rounded   transition-colors"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
                <div className="space-y-3">
                  {codingFormData.sample_inputs_outputs.map((sample, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Sample {index + 1}:</span>
                        <button
                          type="button"
                          onClick={() => removeSampleInputOutput(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Sample input:</div>
                          <div className="font-mono text-xs bg-white border rounded p-2">
                            <textarea
                              value={sample.input || ""}
                              onChange={(e) => updateSampleInputOutput(index, "input", e.target.value)}
                              rows={2}
                              className="w-full bg-transparent resize-none outline-none"
                              placeholder="Enter input..."
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Sample output:</div>
                          <div className="font-mono text-xs bg-white border rounded p-2">
                            <textarea
                              value={sample.output || ""}
                              onChange={(e) => updateSampleInputOutput(index, "output", e.target.value)}
                              rows={2}
                              className="w-full bg-transparent resize-none outline-none"
                              placeholder="Enter output..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  Memory Limit (MB)
                </label>
                <input
                  type="number"
                  name="memory_limit_mb"
                  min={1}
                  value={codingFormData.memory_limit_mb}
                  onChange={handleCodingInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                />
              </div> */}
            </form>
          </div>
        </div>

        {/* Right Panel - Code Editor & Test Cases */}
        <div className="w-2/3 bg-white flex flex-col min-h-0 overflow-hidden">
          <div className="border-b border-gray-200 flex flex-col flex-1 min-h-0">
            <div className="px-6 py-3 bg-lightGreen/30 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages size={16} className="text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Starter Code Template</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLanguageModal(true)}
                    className="text-sm shrink-0 px-3 py-1 bg-leafGreen text-white rounded-lg  "
                  >
                    Select
                  </button>

                  {codingFormData.allowed_languages.length > 0 && (
                    <select
                      value={selectedLanguageForCode}
                      onChange={(e) => setSelectedLanguageForCode(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                    >
                      {codingFormData.allowed_languages.map((lang) => (
                        <option key={lang} value={lang}>
                          {availableLanguages.find((l) => l.value === lang)?.label || lang}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => setShowStarterCodeModal(true)}
                    className="p-1 hover:bg-lightGreen/20 rounded text-gray-600 transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {codingFormData.allowed_languages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Languages size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Select allowed languages first</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 overflow-hidden">
                  <CodeEditor
                    value={codingFormData.starter_code[selectedLanguageForCode] || ""}
                    onChange={(val) => handleStarterCodeChange(selectedLanguageForCode, val)}
                    language={availableLanguages.find((l) => l.value === selectedLanguageForCode)?.label || selectedLanguageForCode}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between px-4 py-2">
              <button
                onClick={() => setIsTestCasesCollapsed(!isTestCasesCollapsed)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-lightGreen/20 p-1 rounded-lg"
              >
                <ChevronRight
                  size={16}
                  className={`transform transition-transform duration-200 ${!isTestCasesCollapsed ? 'rotate-90' : ''}`}
                />
                <span>Test Cases ({testCases.length})</span>
              </button>
              {/* {contestCoding && ( */}
              <button
                onClick={handleAddTestCase}
                className="flex items-center gap-1 px-3 py-1 text-green-600 border border-green-600 rounded hover:bg-green-50 text-sm"
              >
                <Plus size={14} />
                <span>Add Test Case</span>
              </button>
              {/* )} */}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${isTestCasesCollapsed ? 'hidden' : 'p-6'}`}>
            {testCasesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-leafGreen mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading test cases...</p>
              </div>
            ) : testCases.length === 0 ? (
              <div className="text-center py-8">
                <TestTube size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No test cases added yet</p>
                {contestCoding && <p className="text-gray-400 text-xs mt-1">Add test cases to validate solutions</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {testCases.map((testCase, index) => (
                  <div key={testCase.id} className="border border-gray-200 rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">Test Case #{index + 1}</span>
                        <div className="flex items-center gap-1">
                          {testCase.is_public ? (
                            <Eye size={12} className="text-green-600" />
                          ) : (
                            <EyeOff size={12} className="text-gray-400" />
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${testCase.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                          >
                            {testCase.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditTestCase(testCase)}
                          className="p-1 hover:bg-lightGreen rounded text-forestGreen transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleTestCaseStatus(testCase.id)}
                          className="p-1 hover:bg-yellow-100 rounded text-yellow-600 transition-colors"
                          title={testCase.is_active ? "Deactivate" : "Activate"}
                        >
                          {testCase.is_active ? <Pause size={12} /> : <Play size={12} />}
                        </button>
                        <button
                          onClick={() => handleDeleteTestCase(testCase)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-600 mb-1">Input:</div>
                        <div className="bg-gray-50 rounded p-2 font-mono max-h-16 overflow-y-auto">
                          {testCase.input || "No input"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Expected Output:</div>
                        <div className="bg-gray-50 rounded p-2 font-mono max-h-16 overflow-y-auto">
                          {testCase.expected_output || "No output"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showStarterCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-6xl h-5/6 mx-4 shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Languages size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Starter Code Template</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowLanguageModal(true)}
                  className="text-sm shrink-0 px-3 py-1 bg-leafGreen text-white rounded-lg  "
                >
                  Select
                </button>

                {codingFormData.allowed_languages.length > 0 && (
                  <select
                    value={selectedLanguageForCode}
                    onChange={(e) => setSelectedLanguageForCode(e.target.value)}
                    className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-leafGreen"
                  >
                    {codingFormData.allowed_languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {availableLanguages.find((l) => l.value === lang)?.label || lang}
                      </option>
                    ))}
                  </select>
                )}

                <button onClick={() => setShowStarterCodeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
            </div>
            {codingFormData.allowed_languages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Languages size={32} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Select allowed languages first</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                <CodeEditor
                  value={codingFormData.starter_code[selectedLanguageForCode] || ""}
                  onChange={(val) => handleStarterCodeChange(selectedLanguageForCode, val)}
                  language={availableLanguages.find((l) => l.value === selectedLanguageForCode)?.label || selectedLanguageForCode}
                />
              </div>
            )}

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowStarterCodeModal(false)}
                className="px-4 py-2 bg-leafGreen text-white rounded   transition-colors font-medium text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showTestCaseForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh] md:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {editingTestCase ? "Edit Test Case" : "Add New Test Case"}
              </h2>
              <button
                onClick={() => {
                  setShowTestCaseForm(false)
                  setEditingTestCase(null)
                }}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <form id="testCaseForm" onSubmit={handleSubmitTestCase} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                    <input
                      type="number"
                      name="order"
                      value={testCaseFormData.order}
                      onChange={handleTestCaseInputChange}
                      min="1"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-leafGreen"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="is_public"
                        checked={testCaseFormData.is_public}
                        onChange={handleTestCaseInputChange}
                        className="rounded accent-leafGreen border-gray-300 text-forestGreen focus:ring-leafGreen"
                      />
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        {testCaseFormData.is_public ? <Eye size={14} /> : <EyeOff size={14} />}
                        {testCaseFormData.is_public ? "Public" : "Hidden"}
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Input</label>
                  <textarea
                    name="input"
                    value={testCaseFormData.input}
                    onChange={handleTestCaseInputChange}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-leafGreen"
                    placeholder="Enter test case input..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Output</label>
                  <textarea
                    name="expected_output"
                    value={testCaseFormData.expected_output}
                    onChange={handleTestCaseInputChange}
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-leafGreen"
                    placeholder="Enter expected output..."
                  />
                </div>
              </form>
            </div>

            <div className="flex flex-row gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white sticky bottom-0 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  setShowTestCaseForm(false)
                  setEditingTestCase(null)
                }}
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg transition-all duration-200 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="testCaseForm"
                className="flex-1 px-4 py-2.5 sm:py-2 text-sm font-medium text-white  bg-leafGreen   active:bg-leafGreen active: rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {editingTestCase ? "Update" : "Add"} Test Case
              </button>
            </div>
          </div>
        </div>
      )}

      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white w-96 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Select Languages</h2>

            <div className="grid max-h-64 overflow-y-auto">
              {availableLanguages.map((lang) => (
                <label key={lang.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codingFormData.allowed_languages.includes(lang.value)}
                    onChange={(e) => {
                      const newLanguages = e.target.checked
                        ? [...codingFormData.allowed_languages, lang.value]
                        : codingFormData.allowed_languages.filter((l) => l !== lang.value)
                      handleLanguageChange(newLanguages)
                    }}
                    className="rounded accent-leafGreen border-gray-300 text-forestGreen focus:ring-leafGreen"
                  />
                  <span className="text-gray-700">{lang.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 bg-leafGreen text-white rounded-lg  "
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {deleteConfirmation.type === "coding" ? "Coding Activity" : "Test Case"}
                </h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "<span className="font-medium">{deleteConfirmation.title}</span>"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false, type: "", id: null, title: "" })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodingActivityPage
