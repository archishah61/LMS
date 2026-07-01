import React, { useState } from "react";

export default function UniversityForm({ onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    institute_name: "",
    emails: [""],
    mobile_numbers: [""],
    institute_type: "",
    department: "",
    website: "",
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">University Partner Form</h3>

      {/* Institute Name */}
      <input
        type="text"
        name="institute_name"
        value={formData.institute_name}
        onChange={handleChange}
        placeholder="Institute Name"
        required
        className="p-2 border w-full"
      />

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

      {/* Institute Type */}
      <input
        type="text"
        name="institute_type"
        value={formData.institute_type}
        onChange={handleChange}
        placeholder="Institute Type"
        required
        className="p-2 border w-full"
      />

      {/* Department */}
      <input
        type="text"
        name="department"
        value={formData.department}
        onChange={handleChange}
        placeholder="Department (Optional)"
        className="p-2 border w-full"
      />

      {/* Website */}
      <input
        type="url"
        name="website"
        value={formData.website}
        onChange={handleChange}
        placeholder="Website URL (Optional)"
        className="p-2 border w-full"
      />

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
