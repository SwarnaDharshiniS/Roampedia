import React, { useEffect, useState } from "react";
import "./DaywisePlanner.css";

export default function DaywisePlanner({ destination, departureDate, returnDate }) {
  const [attractions, setAttractions] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate number of days
  const getDaysArray = () => {
    const start = new Date(departureDate);
    const end = new Date(returnDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const arr = [];
    for (let i = 0; i < diff; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      arr.push({
        day: i + 1,
        date: d.toISOString().split("T")[0],
        items: []
      });
    }
    return arr;
  };

  // Fetch attractions
  const loadAttractions = async () => {
    if (!destination) return;

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/attractions/country/${encodeURIComponent(destination)}`
      );

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      console.log("Fetched attractions:", data);
      setAttractions(data);

      // Assign attractions day-wise
      const daysArr = getDaysArray();
      let index = 0;

      data.forEach((a) => {
        daysArr[index].items.push(a);
        index = (index + 1) % daysArr.length;
      });

      setDays(daysArr);

    } catch (err) {
      console.error("❌ Failed to load attractions:", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (destination && departureDate && returnDate) {
      loadAttractions();
    }
  }, [destination, departureDate, returnDate]);

  if (loading) return <p className="planner-loading">Loading attractions...</p>;

  return (
    <div className="planner-wrapper">
      <h2 className="planner-title">Day-wise Itinerary</h2>

      {days.length === 0 ? (
        <p className="planner-empty">No attractions found for {destination}.</p>
      ) : (
        <div className="planner-days">
          {days.map((day) => (
            <div key={day.day} className="planner-day-card">
              <h3 className="planner-day-title">
                Day <span>{day.day}</span> • {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </h3>

              {day.items.length === 0 ? (
                <p className="planner-empty">No attractions for this day.</p>
              ) : (
                <div className="planner-activity-list">
                  {day.items.map((a) => (
                    <div key={a._id} className="planner-activity">
                      <div className="slot">
                        {a.site_name}
                      </div>
                      <div className="place">
                        {a.location && <span>📍 {a.location}</span>}
                        {a.short_description && (
                          <small>{a.short_description}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}