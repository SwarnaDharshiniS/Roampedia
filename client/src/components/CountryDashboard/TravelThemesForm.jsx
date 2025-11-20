import React, { useState, useEffect } from "react";
import axios from "axios";

const TravelThemesForm = () => {
  const [themes, setThemes] = useState([]);
  const [newTheme, setNewTheme] = useState({ themeId: "", themeName: "", description: "" });

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/travel-themes`).then(res => setThemes(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/travel-themes/add`, newTheme);
    setNewTheme({ themeId: "", themeName: "", description: "" });
    const updated = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/travel-themes`);
    setThemes(updated.data);
  };

  return (
    <div className="theme-form">
      <h3>Travel Themes (Master Form)</h3>
      <form onSubmit={handleSubmit}>
        <input placeholder="Theme ID" value={newTheme.themeId} onChange={e => setNewTheme({ ...newTheme, themeId: e.target.value })} required />
        <input placeholder="Theme Name" value={newTheme.themeName} onChange={e => setNewTheme({ ...newTheme, themeName: e.target.value })} required />
        <textarea placeholder="Description" value={newTheme.description} onChange={e => setNewTheme({ ...newTheme, description: e.target.value })} />
        <button type="submit">Add Theme</button>
      </form>

      <ul>
        {themes.map(t => (
          <li key={t._id}>{t.themeId} — {t.themeName}</li>
        ))}
      </ul>
    </div>
  );
};

export default TravelThemesForm;
