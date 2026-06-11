/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import {
    useDeleteWordFromRealWordQuestionMutation
} from '../../../services/Content_Management/quizType/realWordQuestionApi';
import { getAdminToken } from '../../../services/CookieService';
import { toast } from 'react-hot-toast';
import {
    Trash2, FileText, CheckCircle, XCircle, AlertCircle, Loader2, AlertTriangle
} from 'lucide-react';
import PermissionWrapper from "../../../context/PermissionWrapper";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isDeleting, itemType, word }) => {
    if (!isOpen) return null;

    return (
        <PermissionWrapper section="Real Word Question" action="delete">
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all">
                    <div className="flex items-center text-red-600 mb-4">
                        <AlertTriangle size={24} className="mr-2" />
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <p className="mb-6 text-gray-600">{message}</p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-300"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all duration-300"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} />
                                    Delete {itemType}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </PermissionWrapper>
    );
};

const RealWordQuestionDisplay = ({ realWordData, quizId, createdBy }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const { access_token } = getAdminToken();

    const [deleteWordFromQuestion] = useDeleteWordFromRealWordQuestionMutation();

    // Flatten and validate data
    const flatRealWordItems = Array.isArray(realWordData)
        ? realWordData.flatMap((question) => {
            const words = Array.isArray(question.words) ? question.words : [];
            const correct_answers = Array.isArray(question.correct_answers) ? question.correct_answers : [];

            return words.map((word, index) => ({
                key: `${question.id}_${index}`,
                questionId: question.id,
                index,
                word,
                correct_answer: correct_answers[index] || 'no',
            }));
        })
        : [];


    const openDeleteModal = (questionId, index, word) => {
        setItemToDelete({ questionId, index, word });
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const confirmDeleteWord = async () => {
        if (!itemToDelete) return;

        const { questionId, index } = itemToDelete;
        setDeletingId(`${questionId}_${index}`);

        try {
            const res = await deleteWordFromQuestion({
                id: questionId,
                wordIndex: index,
                updated_by: createdBy,
                access_token,
            }).unwrap();

            toast.success(res.message || 'Word deleted successfully', {
                icon: '🗑️',
                duration: 3000
            });
            closeDeleteModal();
        } catch (err) {
            const errorMessage = err?.data?.error ||
                err?.data?.message ||
                err?.error ||
                err?.message ||
                'Failed to delete role';
            toast.error(errorMessage);
        } finally {
            setDeletingId(null);
        }
    };

    if (!flatRealWordItems.length) {
        return (
            <div className="text-center text-gray-500 mt-6 p-8 bg-lightGreen rounded-lg border border-leafGreen/30 flex flex-col items-center justify-center">
                <AlertCircle size={48} className="text-leafGreen mb-2" />
                <p className="text-lg font-medium">No Real Word Questions found for this quiz.</p>
            </div>
        );
    }

    return (
        <PermissionWrapper section="Real Word Question" action="view|delete|edit|toggle">
            <div className="space-y-6 mt-7 bg-white p-6 rounded-lg shadow-md">
                <DeleteConfirmationModal
                    isOpen={deleteModalOpen}
                    onClose={closeDeleteModal}
                    onConfirm={confirmDeleteWord}
                    title="Delete Word"
                    message={`Are you sure you want to delete this word "${itemToDelete?.word || ''}"? This action cannot be undone.`}
                    isDeleting={itemToDelete && deletingId === `${itemToDelete.questionId}_${itemToDelete.index}`}
                    itemType="Word"
                    word={itemToDelete?.word || ''}
                />
                <div className="flex items-center mb-6">
                    <FileText size={24} className="text-leafGreen mr-2" />
                    <h3 className="text-xl font-semibold text-gray-800">Real Word Questions</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {flatRealWordItems.map((item) => (
                        <div
                            key={item.key}
                            className="bg-white border border-leafGreen/20 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                        >
                            <div className={`w-full h-2 ${item.correct_answer === 'yes' ? ' from-green-400 to-green-600' : ' from-red-400 to-red-600'}`}></div>
                            <div className="p-4 flex-grow">
                                <div className="flex justify-between items-start mb-3">
                                    <p className="text-lg font-medium text-gray-800 truncate" title={item.word}>
                                        {item.word}
                                    </p>
                                    {item.correct_answer === 'yes' ? (
                                        <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                                    ) : (
                                        <XCircle size={20} className="text-red-500 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    Status: <span className={`font-semibold ${item.correct_answer === 'yes' ? 'text-green-600' : 'text-red-500'}`}>
                                        {item.correct_answer === 'yes' ? 'Real' : 'Fake'}
                                    </span>
                                </p>
                            </div>
                            <PermissionWrapper section="Real Word Question" action="delete">
                                <div className="p-3 flex justify-end">
                                    <button
                                        onClick={() => openDeleteModal(item.questionId, item.index, item.word)}
                                        className="text-red-500 hover:text-red-700 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </PermissionWrapper>
                        </div>
                    ))}
                </div>
            </div>
        </PermissionWrapper>
    );
};

export default RealWordQuestionDisplay;
