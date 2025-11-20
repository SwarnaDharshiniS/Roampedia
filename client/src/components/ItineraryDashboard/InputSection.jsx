import React, { useEffect, useRef, useState } from "react";
import { Calendar, Users, MapPin, DollarSign, ChevronDown } from "lucide-react";
import "./InputSection.css";

// export default function InputSection()
export default function InputSection({ onSubmit, initialValues }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    destination: "",
    homeCountry: "",
    departureDate: "",
    returnDate: "",
    adults: 1,
    children: 0,
    infants: 0,
    budgetMin: "",
    budgetMax: "",
    currency: "USD",
  });

  const [errors, setErrors] = useState({});

  // ======================
  // FETCH COUNTRY LIST
  // ======================
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/countries`);
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      setCountries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching countries:", err);
      setCountries(["India", "Japan", "Australia", "France", "Italy"]);
    }
    setLoading(false);
  };

  // ======================
  // SEARCHABLE DROPDOWN
  // ======================
  const CountrySelect = ({ label, name, icon }) => {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
      if (formData[name]) setQuery(formData[name]);
    }, [formData[name]]);

    // Close dropdown when clicked outside
    useEffect(() => {
      const handler = (e) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered =
      query.trim() === ""
        ? countries
        : countries.filter((c) =>
            c.toLowerCase().includes(query.toLowerCase())
          );

    const selectItem = (c) => {
      setFormData((prev) => ({ ...prev, [name]: c }));
      setQuery(c);
      setOpen(false);
    };

    return (
      <div className="mb-6 relative" ref={wrapperRef}>
        <label className="flex items-center text-lg font-semibold mb-2">
          {icon}
          {label}
        </label>

        <div
          className={`flex items-center border rounded-lg px-4 py-3 bg-white cursor-text ${
            errors[name] ? "border-red-500" : "border-gray-300"
          }`}
          onClick={() => setOpen(true)}
        >
          <input
            className="flex-1 outline-none bg-transparent"
            placeholder="Type to search..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
          />
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </div>

        {open && (
          <div className="absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-56 overflow-y-auto z-20 mt-1">
            {filtered.length > 0 ? (
              filtered.map((c) => (
                <div
                  key={c}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onMouseDown={() => selectItem(c)}
                >
                  {c}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500">No matches</div>
            )}
          </div>
        )}

        {errors[name] && <p className="text-red-500 text-sm">{errors[name]}</p>}
      </div>
    );
  };

  // ======================
  // HANDLE INPUTS
  // ======================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      const updated = { ...errors };
      delete updated[name];
      setErrors(updated);
    }
  };

  // ======================
  // VALIDATION
  // ======================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.destination) newErrors.destination = "Select destination";
    if (!formData.homeCountry) newErrors.homeCountry = "Select home country";
    if (!formData.departureDate) newErrors.departureDate = "Choose date";
    if (!formData.returnDate) newErrors.returnDate = "Choose date";

    if (formData.departureDate && formData.returnDate) {
      if (new Date(formData.returnDate) <= new Date(formData.departureDate))
        newErrors.returnDate = "Return must be after departure";
    }

    const total =
      Number(formData.adults) +
      Number(formData.children) +
      Number(formData.infants);

    if (total < 1) newErrors.travelers = "At least 1 traveler required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const today = () => new Date().toISOString().split("T")[0];

  // ======================
  // SUBMIT FORM (SAVE TO MONGO)
  // ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/itinerary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        });

        const saved = await res.json();
        console.log("Saved itinerary ID:", saved._id);

        if (res.ok) {
        console.log("Saved:", saved);
        onSubmit(saved);
        } else {
        alert("Failed to save itinerary");
        }
    } catch (err) {
        console.error(err);
        alert("Backend error");
    }
    };

  // ======================
  // UI
  // ======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-5">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Plan Your Trip
        </h1>
        <p className="text-gray-600 mb-8">
          Enter your travel details to generate the perfect itinerary
        </p>

        <form onSubmit={handleSubmit} className="space-y-10">

          {/* DESTINATION */}
          <CountrySelect
            label="Destination Country"
            name="destination"
            icon={<MapPin className="w-5 h-5 mr-2 text-indigo-600" />}
          />

          {/* HOME COUNTRY */}
          <CountrySelect
            label="Home Country"
            name="homeCountry"
            icon={<MapPin className="w-5 h-5 mr-2 text-indigo-600" />}
          />

          {/* TRAVEL DATES */}
          <div>
            <label className="flex items-center text-lg font-semibold mb-2">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Travel Dates
            </label>

            <div className="grid grid-cols-2 gap-6">

              <div>
                <label className="text-sm">Departure *</label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  min={today()}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    errors.departureDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm">Return *</label>
                <input
                  type="date"
                  name="returnDate"
                  value={formData.returnDate}
                  min={formData.departureDate || today()}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    errors.returnDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

            </div>

            {errors.returnDate && (
              <p className="text-red-500 text-sm mt-1">{errors.returnDate}</p>
            )}
          </div>

          {/* TRAVELERS */}
          <div>
            <label className="flex items-center text-lg font-semibold mb-2">
              <Users className="w-5 h-5 mr-2 text-indigo-600" />
              Travelers
            </label>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm">Adults *</label>
                <input
                  type="number"
                  name="adults"
                  min="1"
                  value={formData.adults}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg border-gray-300"
                />
              </div>

              <div>
                <label className="text-sm">Children</label>
                <input
                  type="number"
                  name="children"
                  min="0"
                  value={formData.children}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg border-gray-300"
                />
              </div>

              <div>
                <label className="text-sm">Infants</label>
                <input
                  type="number"
                  name="infants"
                  min="0"
                  value={formData.infants}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg border-gray-300"
                />
              </div>
            </div>

            {errors.travelers && (
              <p className="text-red-500 text-sm">{errors.travelers}</p>
            )}
          </div>

          {/* BUDGET */}
          <div>
            <label className="flex items-center text-lg font-semibold mb-2">
              <DollarSign className="w-5 h-5 mr-2 text-indigo-600" />
              Budget (Optional)
            </label>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <label className="text-sm">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border rounded-lg border-gray-300"
                >
                  <option>USD</option><option>EUR</option><option>GBP</option>
                  <option>JPY</option><option>INR</option><option>AUD</option>
                </select>
              </div>

              <div>
                <label className="text-sm">Min Budget</label>
                <input
                  type="number"
                  name="budgetMin"
                  value={formData.budgetMin}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    errors.budgetMin ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>

              <div>
                <label className="text-sm">Max Budget</label>
                <input
                  type="number"
                  name="budgetMax"
                  value={formData.budgetMax}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    errors.budgetMax ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
            </div>

            {errors.budgetMin && <p className="text-red-500 text-sm">{errors.budgetMin}</p>}
            {errors.budgetMax && <p className="text-red-500 text-sm">{errors.budgetMax}</p>}
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700"
          >
            Generate My Itinerary
          </button>

        </form>
      </div>
    </div>
  );
}