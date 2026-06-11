/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Edit2,
    Save,
    X,
    CheckCircle,
    AlertTriangle
} from 'lucide-react';

const UpdateCheatSheetForm = ({
    item,
    type,
    onSubmit,
    onCancel
}) => {
    // State for form fields
    const [formData, setFormData] = useState({
        mainTitle: type === 'main' ? item.mainTitle : '',
        title: type === 'section' ? item.title : '',
        content: type === 'section' ? item.content : '',
        contentType: type === 'section' ? item.contentType : 'text'
    });

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (type === 'section' && (!formData.title || !formData.content)) {
            alert('Title and content are required for sections');
            return;
        }

        if (type === 'main' && !formData.mainTitle) {
            alert('Main title is required');
            return;
        }

        // Call the onSubmit prop with form data
        onSubmit(formData);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
            <motion.div
                className="bg-white rounded-lg shadow-2xl w-96 p-6"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">
                        {type === 'main'
                            ? 'Update Main Section'
                            : 'Update Section'
                        }
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {type === 'section' && (
                        <div className="mb-4">
                            <label
                                className="block text-sm font-medium text-gray-700 mb-2"
                                htmlFor="title"
                            >
                                Section Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                                placeholder="Enter section title"
                                required
                            />
                        </div>
                    )}

                    {type === 'section' && (
                        <div className="mb-4">
                            <label
                                className="block text-sm font-medium text-gray-700 mb-2"
                                htmlFor="contentType"
                            >
                                Content Type
                            </label>
                            <select
                                id="contentType"
                                name="contentType"
                                value={formData.contentType}
                                onChange={handleChange}
                                className="w-full border rounded p-2"
                            >
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                            </select>
                        </div>
                    )}

                    <div className="mb-4">
                        <label
                            className="block text-sm font-medium text-gray-700 mb-2"
                            htmlFor="content"
                        >
                            {type === 'main'
                                ? 'Main Section Title'
                                : 'Section Content'
                            }
                        </label>
                        <textarea
                            id="content"
                            name={type === 'main' ? 'mainTitle' : 'content'}
                            value={type === 'main' ? formData.mainTitle : formData.content}
                            onChange={handleChange}
                            className="w-full border rounded p-2 h-40"
                            placeholder={type === 'main'
                                ? "Enter main section title"
                                : "Enter section content"
                            }
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <motion.button
                            type="button"
                            onClick={onCancel}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </motion.button>
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-leafGreen text-white rounded   flex items-center"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Save
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default UpdateCheatSheetForm;