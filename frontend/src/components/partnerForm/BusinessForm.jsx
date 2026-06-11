import React, { useState } from "react";
import { useCreatePartnerBusinessMutation } from "../../services/Partner/partnerBuissnessAPI"; // Import the mutation hook
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

export default function BusinessForm({ onSubmit, onBack, access_token }) {
  const [formData, setFormData] = useState({
    company_name: "",
    emails: [""],
    mobile_numbers: [""],
    public_organization: false,
    company_size: "",
    expected_learners: "",
    website: "",
    description: "",
  });

  // RTK Query Hook
  const [createPartnerBusiness, { isLoading, isError, error }] =
    useCreatePartnerBusinessMutation();

  // Handle field change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle email and mobile arrays
  const handleArrayChange = (index, value, field) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData((prev) => ({ ...prev, [field]: updatedArray }));
  };

  // Add email or mobile number field
  const addField = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  // Remove email or mobile number field
  const removeField = (index, field) => {
    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1);
    setFormData((prev) => ({ ...prev, [field]: updatedArray }));
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await createPartnerBusiness({
        data: formData,
        access_token, // Pass the token correctly
      }).unwrap();

      // Show success message
      toast.success("Business partner created successfully!");
      onSubmit(result);
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error(err?.data?.message || "Error creating business partner.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">Business Partner Form</h3>

      {/* Company Name */}
      <input
        type="text"
        name="company_name"
        value={formData.company_name}
        onChange={handleChange}
        placeholder="Company Name"
        required
        className="p-2 border w-full"
      />

      {/* Email Inputs */}
      <div>
        {formData.emails.map((email, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="email"
              value={email}
              onChange={(e) =>
                handleArrayChange(index, e.target.value, "emails")
              }
              placeholder="Email"
              required
              className="p-2 border w-full"
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeField(index, "emails")}
                className="text-red-500"
              >
                ✖️
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField("emails")}
          className="mt-2 text-blue-500 underline"
        >
          + Add Another Email
        </button>
      </div>

      {/* Mobile Number Inputs */}
      <div>
        {formData.mobile_numbers.map((number, index) => (
          <div key={index} className="flex gap-2 items-center">
            <input
              type="text"
              value={number}
              onChange={(e) =>
                handleArrayChange(index, e.target.value, "mobile_numbers")
              }
              placeholder="Mobile Number"
              required
              className="p-2 border w-full"
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeField(index, "mobile_numbers")}
                className="text-red-500"
              >
                ✖️
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addField("mobile_numbers")}
          className="mt-2 text-blue-500 underline"
        >
          + Add Another Mobile Number
        </button>
      </div>

      {/* Public Organization Checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="public_organization"
          checked={formData.public_organization}
          onChange={handleChange}
        />
        <label htmlFor="public_organization">Public Organization</label>
      </div>

      {/* Company Size */}
      <input
        type="text"
        name="company_size"
        value={formData.company_size}
        onChange={handleChange}
        placeholder="Company Size"
        className="p-2 border w-full"
      />

      {/* Expected Learners */}
      <input
        type="number"
        name="expected_learners"
        value={formData.expected_learners}
        onChange={handleChange}
        placeholder="Expected Learners"
        className="p-2 border w-full"
      />

      {/* Website URL */}
      <input
        type="url"
        name="website"
        value={formData.website}
        onChange={handleChange}
        placeholder="Website URL"
        className="p-2 border w-full"
      />

      {/* Description */}
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
        className="p-2 border w-full"
      />

      {/* Action Buttons */}
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
          disabled={isLoading}
        >
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* Show error if API call fails */}
      {isError && (
        <div className="text-red-500">Error: {error?.data?.message}</div>
      )}
    </form>
  );
}
