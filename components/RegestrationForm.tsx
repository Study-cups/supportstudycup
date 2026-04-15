import React, { useState, ChangeEvent, FormEvent } from "react";
import type { FormData } from "../types";


interface RegistrationFormProps {
  onSubmit: (name: string, event: string) => void;
}

const initialFormData: FormData = {
  studyLocation: [],
  studentName: "",
  gender: "Male",
  mobileNumber: "",
  whatsappNumber: "",
  parentMobileNumber: "",
  email: "",
  city: "",
  courses: [],
  event: "",
  referral1Name: "",
  referral1Mobile: "",
  referral2Name: "",
  referral2Mobile: "",
  source: "",
};


const InputField: React.FC<{
  id: keyof FormData | string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
}> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  error,
}) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border ${error ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
      />

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );

// CheckboxGroup कंपोनेंट (कोई बदलाव नहीं)
const CheckboxGroup: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}> = ({ label, options, selected, onChange }) => {
  const handleChange = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];

    onChange(newSelected);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center">
            <input
              type="checkbox"
              id={option}
              name={label}
              value={option}
              checked={selected.includes(option)}
              onChange={() => handleChange(option)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor={option} className="ml-2 block text-sm text-gray-900">
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // -------------------------
  // VALIDATION HELPERS (कोई बदलाव नहीं)
  // -------------------------
  const validateNumber = (value: string) => {
    if (!/^[0-9]*$/.test(value)) return "Only digits allowed";
    if (value.length !== 10) return "Must be exactly 10 digits";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value.trim()))
      return "Only @gmail.com email allowed";
    return "";
  };

  // -------------------------
  // HANDLE INPUT CHANGES (कोई बदलाव नहीं)
  // -------------------------
  const handleChange = (e: ChangeEvent<any>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    let errorMsg = "";

    if (value.trim() === "") {
      errorMsg = `${name.replace(/([A-Z])/g, " $1")} is required`;
    }

    if (
      [
        "mobileNumber",
        "whatsappNumber",
        "parentMobileNumber",
        "referral1Mobile",
        "referral2Mobile",
      ].includes(name)
    ) {
      errorMsg = validateNumber(value.trim());
    }

    if (name === "email") {
      errorMsg = validateEmail(value.trim());
    }

    setErrors((prev) => ({ ...prev, [name]: errorMsg }));
  };

  const handleCheckboxChange =
    (name: "studyLocation" | "courses") => (selected: string[]) => {
      setFormData((prev) => ({ ...prev, [name]: selected }));
    };

  // -------------------------
  // HANDLE SUBMIT (यह खंड अपडेट किया गया है)
  // -------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let newErrors: { [key: string]: string } = {};

    // Required validation
    Object.entries(formData).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() === "") {
        newErrors[key] = `${key.replace(/([A-Z])/g, " $1")} is required`;
      }
    });

    // Mobile validation (Frontend Validation)
    [
      "mobileNumber",
      "whatsappNumber",
      "parentMobileNumber",
      "referral1Mobile",
      "referral2Mobile",
    ].forEach((field) => {
      const err = validateNumber(formData[field].trim());
      if (err) newErrors[field] = err;
    });

    // Email validation
    const emailErr = validateEmail(formData.email.trim());
    if (emailErr) newErrors.email = emailErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    // -------------------------
    // SEND DATA TO BACKEND 
    // -------------------------
    try {
      const res = await fetch(
        "https://studycupsbackend-wb8p.onrender.com/api/student",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();
      console.log("Server Response:", data);

     
      if (!res.ok) {
        if (res.status === 400 && data.message.includes("registered")) {

          if (data.message.includes("Mobile")) {
         
            setErrors({ mobileNumber: data.message });
          }

          else if (data.message.includes("WhatsApp")) {
            // whatsapp number duplicate
            setErrors({ whatsappNumber: data.message });
          }

        } else {
          alert(`Submission Error: ${data.message || "Something went wrong."}`);
        }

        setLoading(false);
        return;
      }


    
      onSubmit(formData.studentName.trim(), formData.event);

   
      setLoading(false);

    } catch (err) {
      
      console.error("Submit Error:", err);
      alert("A network error occurred. Please try again.");
      setLoading(false);
    }
  };

  const courseOptions = [
    "BBA",
    "BCA",
    "B.Tech",
    "Fashion Designing",
    "MBBS",
    "Law",
    "MBA",
    "PGDM",
  ];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
      
      <div className="text-center mb-8">
        <div className="mx-auto h-15 w-16">
         
          <img
            src="/logos/StudyCups.png"
            alt="StudyCups Education"
            className="h-15 w-auto select-none"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mt-4">
          Students Registration Form
        </h1>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... (अन्य फ़ॉर्म फ़ील्ड) ... */}

        <CheckboxGroup
          label="Interested In"
          options={["Study in India", "Study Abroad"]}
          selected={formData.studyLocation}
          onChange={handleCheckboxChange("studyLocation")}
        />

        {/* NAME + GENDER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="studentName"
            label="Student Name"
            placeholder="Enter full name"
            value={formData.studentName}
            onChange={handleChange}
            required
            error={errors.studentName}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>

            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={formData.gender === "Male"}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Male</span>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={formData.gender === "Female"}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="ml-2">Female</span>
              </label>
            </div>
          </div>
        </div>

        {/* CONTACT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="mobileNumber"
            label="Mobile Number"
            placeholder="Enter phone number"
            value={formData.mobileNumber}
            onChange={handleChange}
            type="tel"
            // **यह महत्वपूर्ण है: एरर यहाँ दिखेगा**
            error={errors.mobileNumber}
          />

          <InputField
            id="whatsappNumber"
            label="WhatsApp Number"
            placeholder="Enter WhatsApp number"
            value={formData.whatsappNumber}
            onChange={handleChange}
            type="tel"
            error={errors.whatsappNumber}
          />

          <InputField
            id="parentMobileNumber"
            label="Parent's Mobile Number"
            placeholder="Enter parent's mobile"
            value={formData.parentMobileNumber}
            onChange={handleChange}
            type="tel"
            error={errors.parentMobileNumber}
          />

          <InputField
            id="email"
            label="Email ID"
            placeholder="Enter email address"
            value={formData.email}
            onChange={handleChange}
            type="email"
            error={errors.email}
          />
        </div>

        <InputField
          id="city"
          label="City"
          placeholder="Enter city"
          value={formData.city}
          onChange={handleChange}
          error={errors.city}
        />

        {/* COURSE */}
        <CheckboxGroup
          label="Course"
          options={courseOptions}
          selected={formData.courses}
          onChange={handleCheckboxChange("courses")}
        />

        {/* EVENT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interested to Attend our Event in
          </label>
          <select
            id="event"
            name="event"
            value={formData.event}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select location...</option>
            <option value="kanpur">Kanpur, Uttar Pradesh</option>
            <option value="lucknow">Lucknow, Uttar Pradesh</option>
          </select>
          {errors.event && (
            <p className="text-red-500 text-sm">{errors.event}</p>
          )}
        </div>

        {/* REFERRALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="referral1Name"
            label="First Referral Name"
            placeholder="Friend's name"
            value={formData.referral1Name}
            onChange={handleChange}
            error={errors.referral1Name}
          />
          <InputField
            id="referral1Mobile"
            label="Mobile"
            placeholder="Friend's mobile"
            value={formData.referral1Mobile}
            onChange={handleChange}
            type="tel"
            error={errors.referral1Mobile}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="referral2Name"
            label="Second Referral Name"
            placeholder="Friend's name"
            value={formData.referral2Name}
            onChange={handleChange}
            error={errors.referral2Name}
          />
          <InputField
            id="referral2Mobile"
            label="Mobile"
            placeholder="Friend's mobile"
            value={formData.referral2Mobile}
            onChange={handleChange}
            type="tel"
            error={errors.referral2Mobile}
          />
        </div>

        {/* SOURCE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How you came to know about the event?
          </label>

          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select...</option>
            <option value="Ayushi">Ayushi</option>
            <option value="Saniya">Saniya</option>
            <option value="Pallavi">Pallavi</option>
            <option value="Farhan">Farhan</option>
            <option value="Kaushiki">Kaushiki</option>
          </select>

          {errors.source && (
            <p className="text-red-500 text-sm">{errors.source}</p>
          )}
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-md text-sm font-medium text-white 
                        ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                ></path>
              </svg>
              Submitting...
            </div>
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;