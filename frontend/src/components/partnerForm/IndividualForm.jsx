import React, { useState } from "react";

export default function IndividualForm({ onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    emails: [""],
    mobile_numbers: [""],
    education: [
      {
        degree: "",
        institution: "",
        year: "",
      },
    ],
    description: "",
  });

  // Handle field change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle array changes for emails and mobile_numbers
  const handleArrayChange = (index, value, field) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: updatedArray }));
  };

  // Add new field for emails or mobile_numbers
  const addField = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  // Handle education changes
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      education: updatedEducation,
    }));
  };

  // Add a new education entry
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          institution: "",
          year: "",
        },
      ],
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">Individual Partner Form</h3>

      {/* Emails */}
      <div>
        {formData.emails.map((email, index) => (
          <input
            key={index}
            type="email"
            value={email}
            onChange={(e) => handleArrayChange(index, e.target.value, "emails")}
            placeholder="Email"
            required
            className="p-2 border w-full mt-2"
          />
        ))}
        <button
          type="button"
          onClick={() => addField("emails")}
          className="mt-2 text-blue-500 underline"
        >
          + Add Another Email
        </button>
      </div>

      {/* Mobile Numbers */}
      <div>
        {formData.mobile_numbers.map((number, index) => (
          <input
            key={index}
            type="text"
            value={number}
            onChange={(e) =>
              handleArrayChange(index, e.target.value, "mobile_numbers")
            }
            placeholder="Mobile Number"
            required
            className="p-2 border w-full mt-2"
          />
        ))}
        <button
          type="button"
          onClick={() => addField("mobile_numbers")}
          className="mt-2 text-blue-500 underline"
        >
          + Add Another Mobile Number
        </button>
      </div>

      {/* Education */}
      <div>
        {formData.education.map((edu, index) => (
          <div key={index} className="space-y-2 border p-4 rounded">
            <input
              type="text"
              value={edu.degree}
              onChange={(e) =>
                handleEducationChange(index, "degree", e.target.value)
              }
              placeholder="Degree"
              required
              className="p-2 border w-full"
            />
            <input
              type="text"
              value={edu.institution}
              onChange={(e) =>
                handleEducationChange(index, "institution", e.target.value)
              }
              placeholder="Institution"
              required
              className="p-2 border w-full"
            />
            <input
              type="text"
              value={edu.year}
              onChange={(e) =>
                handleEducationChange(index, "year", e.target.value)
              }
              placeholder="Year"
              required
              className="p-2 border w-full"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addEducation}
          className="mt-2 text-blue-500 underline"
        >
          + Add Another Education
        </button>
      </div>

      {/* Description */}
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description (Optional)"
        className="p-2 border w-full"
      />

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="bg-gray-500 text-white p-2 rounded"
        >
          Back
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
