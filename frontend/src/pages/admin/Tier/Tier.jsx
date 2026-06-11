"use client"

import { useState } from "react"
import AdminLoader from "../../../components/admin/AdminLoader"
import {
  Plus, Edit2, Trash2, X, DollarSign, Package, Users, BookOpen,
  HelpCircle, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Calendar, Crown, Star, ArrowLeft, MoreVertical, Layers, Eye,
} from "lucide-react"
import {
  useGetAllTiersQuery, useCreateTierMutation, useUpdateTierMutation,
  useDeleteTierMutation, useToggleTierStatusMutation,
} from "../../../services/Tier/tierAPI"
import {
  useGetAllDifficultyLevelsQuery, useCreateDifficultyLevelMutation,
  useUpdateDifficultyLevelMutation, useDeleteDifficultyLevelMutation,
  useToggleDifficultyLevelStatusMutation, useGetTiersByDifficultyLevelQuery,
} from "../../../services/Tier/difficultyLevelAPI"
import { getAdminToken } from "../../../services/CookieService"
import { useNavigate } from "react-router-dom"
import PermissionWrapper from "../../../context/PermissionWrapper"
import toast from "react-hot-toast"

/* ─────────────── Tier List inside a difficulty level ─────────────── */
const TierList = ({ difficultyLevelId, access_token }) => {
  const { data: tiersData, isLoading, refetch } = useGetTiersByDifficultyLevelQuery(
    { id: difficultyLevelId, access_token }, { skip: !difficultyLevelId }
  )
  const [createTier] = useCreateTierMutation()
  const [updateTier] = useUpdateTierMutation()
  const [deleteTier] = useDeleteTierMutation()
  const [toggleTierStatus] = useToggleTierStatusMutation()

  const tiers = tiersData?.data || []
  const [showForm, setShowForm] = useState(false)
  const [editingTier, setEditingTier] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, tierId: null, tierName: "" })
  const [formData, setFormData] = useState({
    name: "basic", price: "", max_sessions: "", max_modules_per_session: "",
    max_topics_per_module: "", max_assignments_per_module: "", max_quizzes_per_module: "",
  })

  const resetForm = () => setFormData({
    name: "basic", price: "", max_sessions: "", max_modules_per_session: "",
    max_topics_per_module: "", max_assignments_per_module: "", max_quizzes_per_module: "",
  })

  const handleAddTier = () => { setEditingTier(null); resetForm(); setShowForm(true) }

  const handleEditTier = (tier) => {
    setEditingTier(tier)
    setFormData({
      name: tier.name, price: tier.price, max_sessions: tier.max_sessions || "",
      max_modules_per_session: tier.max_modules_per_session || "",
      max_topics_per_module: tier.max_topics_per_module || "",
      max_assignments_per_module: tier.max_assignments_per_module || "",
      max_quizzes_per_module: tier.max_quizzes_per_module || "",
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        max_sessions: formData.max_sessions ? Number.parseInt(formData.max_sessions) : null,
        max_modules_per_session: formData.max_modules_per_session ? Number.parseInt(formData.max_modules_per_session) : null,
        max_topics_per_module: formData.max_topics_per_module ? Number.parseInt(formData.max_topics_per_module) : null,
        max_assignments_per_module: formData.max_assignments_per_module ? Number.parseInt(formData.max_assignments_per_module) : null,
        max_quizzes_per_module: formData.max_quizzes_per_module ? Number.parseInt(formData.max_quizzes_per_module) : null,
        difficulty_level_id: difficultyLevelId,
      }
      if (editingTier) {
        await updateTier({ id: editingTier.id, access_token, ...submitData }).unwrap()
      } else {
        await createTier({ data: submitData, access_token }).unwrap()
      }
      setShowForm(false); refetch()
      toast.success(editingTier ? "Tier Updated" : "Tier Created")
    } catch (error) {
      toast.error(error?.data?.error || "Failed to save tier")
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteTier({ id: deleteConfirmation.tierId, access_token }).unwrap()
      refetch(); setDeleteConfirmation({ show: false, tierId: null, tierName: "" })
      toast.success("Tier Deleted")
    } catch (error) { toast.error(error?.data?.error || "Failed to delete tier") }
  }

  const handleToggleStatus = async (tierId) => {
    try {
      await toggleTierStatus({ id: tierId, access_token }).unwrap()
      refetch(); toast.success("Tier Status Updated")
    } catch (error) { toast.error(error?.data?.error || "Failed to toggle status") }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const getTierIcon = (name) => {
    switch (name) {
      case "basic": return <Package size={14} />
      case "standard": return <Star size={14} />
      case "premium": return <Crown size={14} />
      default: return <HelpCircle size={14} />
    }
  }

  if (isLoading) return <div className="py-4 text-center text-gray-500 text-sm">Loading tiers...</div>

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Layers size={14} className="text-leafGreen" /> Tiers ({tiers.length})
        </h4>
        <PermissionWrapper section="Tier" action="create">
          <button onClick={handleAddTier}
            className="bg-leafGreen text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-300 font-medium shadow-sm text-xs">
            <Plus size={12} /> Add Tier
          </button>
        </PermissionWrapper>
      </div>

      {tiers.length === 0 && !showForm && (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Package size={20} className="mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">No tiers yet. Add your first tier.</p>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="space-y-2">
          {tiers.map((tier) => (
            <div key={tier.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-lightGreen/20 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-lightGreen rounded-lg flex items-center justify-center text-forestGreen">{getTierIcon(tier.name)}</div>
                  <div>
                    <h5 className="font-semibold text-gray-900 capitalize text-sm">{tier.name}</h5>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="font-medium text-gray-800">₹{tier.price}</span>
                      <span>Sessions: {tier.max_sessions || "∞"}</span>
                      <span>Modules: {tier.max_modules_per_session || "∞"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tier.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {tier.is_active ? "Active" : "Inactive"}
                  </span>
                  <PermissionWrapper section="Tier" action="toggle">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={tier.is_active} onChange={() => handleToggleStatus(tier.id)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </label>
                  </PermissionWrapper>
                  <PermissionWrapper section="Tier" action="edit">
                    <button onClick={() => handleEditTier(tier)} className="h-7 w-7 hover:bg-lightGreen rounded-lg flex items-center justify-center text-leafGreen transition-colors" title="Edit">
                      <Edit2 size={13} />
                    </button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Tier" action="delete">
                    <button onClick={() => setDeleteConfirmation({ show: true, tierId: tier.id, tierName: tier.name })}
                      className="h-7 w-7 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </PermissionWrapper>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tier Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-3xl mx-auto shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-gray-900">{editingTier ? "Edit Tier" : "Add New Tier"}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <form onSubmit={handleSubmit} id="tierForm" className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tier Name *</label>
                    <select name="name" value={formData.name} onChange={handleInputChange} required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen">
                      <option value="basic">Basic</option><option value="standard">Standard</option><option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen" placeholder="Enter price" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Tier Limits</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {[
                      { label: "Max Sessions", name: "max_sessions" },
                      { label: "Max Modules per Session", name: "max_modules_per_session" },
                      { label: "Max Topics per Module", name: "max_topics_per_module" },
                      { label: "Max Assignments per Module", name: "max_assignments_per_module" },
                      { label: "Max Quizzes per Module", name: "max_quizzes_per_module" },
                    ].map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                        <input type="number" name={field.name} value={formData[field.name]} onChange={handleInputChange} min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen" placeholder="Leave empty for unlimited" />
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 p-4 border-t bg-white sticky bottom-0">
              <button type="button" onClick={() => setShowForm(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" form="tierForm" className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-300">
                {editingTier ? "Update Tier" : "Create Tier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={16} className="text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Tier</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to delete the "<span className="font-medium capitalize">{deleteConfirmation.tierName}</span>" tier?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmation({ show: false, tierId: null, tierName: "" })} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={handleConfirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────── Main Component ─────────────── */
const Tiers = () => {
  const { access_token } = getAdminToken()
  const navigate = useNavigate()

  const { data: apiResponse, isLoading, error, refetch } = useGetAllDifficultyLevelsQuery({
    search_term: "", limit: "ALL", offset: 0, access_token,
  })

  const [createDifficultyLevel] = useCreateDifficultyLevelMutation()
  const [updateDifficultyLevel] = useUpdateDifficultyLevelMutation()
  const [deleteDifficultyLevel] = useDeleteDifficultyLevelMutation()
  const [toggleDifficultyLevelStatus] = useToggleDifficultyLevelStatusMutation()

  const difficultyLevels = apiResponse?.data?.difficultyLevels || []

  const [showDLForm, setShowDLForm] = useState(false)
  const [editingDL, setEditingDL] = useState(null)
  const [dlFormData, setDlFormData] = useState({ name: "", description: "" })
  const [deleteDLConfirmation, setDeleteDLConfirmation] = useState({ show: false, id: null, name: "" })
  const [expandedLevels, setExpandedLevels] = useState({})

  const toggleExpand = (id) => setExpandedLevels(prev => ({ ...prev, [id]: !prev[id] }))

  const handleAddDL = () => { setEditingDL(null); setDlFormData({ name: "", description: "" }); setShowDLForm(true) }

  const handleEditDL = (dl) => {
    setEditingDL(dl)
    setDlFormData({ name: dl.name, description: dl.description || "" })
    setShowDLForm(true)
  }

  const handleSubmitDL = async (e) => {
    e.preventDefault()
    try {
      if (editingDL) {
        await updateDifficultyLevel({ id: editingDL.id, access_token, ...dlFormData }).unwrap()
      } else {
        await createDifficultyLevel({ data: dlFormData, access_token }).unwrap()
      }
      setShowDLForm(false); refetch()
      toast.success(editingDL ? "Difficulty Level Updated" : "Difficulty Level Created")
    } catch (error) { toast.error(error?.data?.error || "Failed to save difficulty level") }
  }

  const handleConfirmDeleteDL = async () => {
    try {
      await deleteDifficultyLevel({ id: deleteDLConfirmation.id, access_token }).unwrap()
      refetch(); setDeleteDLConfirmation({ show: false, id: null, name: "" })
      toast.success("Difficulty Level Deleted")
    } catch (error) { toast.error(error?.data?.error || "Failed to delete difficulty level") }
  }

  const handleToggleDLStatus = async (id) => {
    try {
      await toggleDifficultyLevelStatus({ id, access_token }).unwrap()
      refetch(); toast.success("Status Updated")
    } catch (error) { toast.error(error?.data?.error || "Failed to toggle status") }
  }

  if (isLoading) {
    return <AdminLoader message="Loading tiers..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <X size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 mb-4">Failed to load data</p>
          <button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b pl-0 sm:pl-8 lg:pl-0 border-gray-200 flex-shrink-0">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-forestGreen bg-clip-text text-transparent">Tier Management</h1>
              <p className="text-gray-600 mt-1 text-sm">Manage difficulty levels and their tiers</p>
            </div>
            <div className="flex items-center gap-3">
              <PermissionWrapper section="Tier" action="create">
                <button onClick={handleAddDL}
                  className="bg-leafGreen text-white md:px-6 px-4 p-2 rounded-lg flex items-center gap-1 transition-all duration-300 font-medium shadow-sm text-sm">
                  <Plus size={18} /> Add <span className="hidden lg:inline-flex">Difficulty Level</span>
                </button>
              </PermissionWrapper>
              <button onClick={() => navigate("/admin/dashboard")}
                className="flex items-center gap-2 md:px-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-300 rounded-lg shadow-sm transition-colors">
                <ArrowLeft size={18} /><span className="font-medium hidden md:inline-flex">Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6">
        {difficultyLevels.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers size={24} className="text-gray-400" />
            </div>
            <div className="text-gray-500 text-lg font-medium mb-2">No difficulty levels found</div>
            <p className="text-gray-400">Create a difficulty level first, then add tiers within it.</p>
          </div>
        )}

        <div className="space-y-4">
          {difficultyLevels.map((dl) => (
            <div key={dl.id} className="bg-white hover:bg-lightGreen/20 rounded-lg border border-gray-200 overflow-hidden">
              {/* Difficulty Level Header */}
              <div className="px-4 sm:px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-lightGreen/10 transition-colors" onClick={() => toggleExpand(dl.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-leafGreen rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {dl.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-base">{dl.name}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dl.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {dl.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    {dl.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{dl.description}</p>}
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <Calendar size={11} /> {new Date(dl.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <PermissionWrapper section="Tier" action="toggle">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={dl.is_active} onChange={() => handleToggleDLStatus(dl.id)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                    </label>
                  </PermissionWrapper>
                  <PermissionWrapper section="Tier" action="edit">
                    <button onClick={() => handleEditDL(dl)} className="h-8 w-8 hover:bg-lightGreen rounded-lg flex items-center justify-center text-leafGreen transition-colors" title="Edit"><Edit2 size={14} /></button>
                  </PermissionWrapper>
                  <PermissionWrapper section="Tier" action="delete">
                    <button onClick={() => setDeleteDLConfirmation({ show: true, id: dl.id, name: dl.name })}
                      className="h-8 w-8 hover:bg-red-100 rounded-lg flex items-center justify-center text-red-600 transition-colors" title="Delete"><Trash2 size={14} /></button>
                  </PermissionWrapper>
                  <button className="h-8 w-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 transition-colors" onClick={(e) => { e.stopPropagation(); toggleExpand(dl.id) }}>
                    {expandedLevels[dl.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Tiers List (Expandable) */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedLevels[dl.id] ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-4 sm:px-6 pb-4 border-t border-gray-100 pt-3">
                  <TierList difficultyLevelId={dl.id} access_token={access_token} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Difficulty Level Form Modal */}
      {showDLForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl overflow-hidden w-full max-w-lg mx-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{editingDL ? "Edit Difficulty Level" : "Add Difficulty Level"}</h2>
              <button onClick={() => setShowDLForm(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <div className="px-4 py-4">
              <form onSubmit={handleSubmitDL} id="dlForm" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={dlFormData.name} onChange={(e) => setDlFormData(prev => ({ ...prev, name: e.target.value }))} required maxLength={100}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-lightGreen/50 focus:border-leafGreen" placeholder="e.g. Beginner, Intermediate, Advanced" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={dlFormData.description} onChange={(e) => setDlFormData(prev => ({ ...prev, description: e.target.value }))} rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional description..." />
                </div>
              </form>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 p-4 border-t">
              <button type="button" onClick={() => setShowDLForm(false)} className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" form="dlForm" className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-leafGreen rounded-lg transition-all duration-300">
                {editingDL ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete DL Confirmation Modal */}
      {deleteDLConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><Trash2 size={16} className="text-red-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Difficulty Level</h3>
                <p className="text-sm text-gray-600">This will also delete all tiers within it</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">Are you sure you want to delete "<span className="font-medium">{deleteDLConfirmation.name}</span>"?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteDLConfirmation({ show: false, id: null, name: "" })} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm">Cancel</button>
              <button onClick={handleConfirmDeleteDL} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tiers