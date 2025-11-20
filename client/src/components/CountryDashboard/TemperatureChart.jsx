// TemperatureChart.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Props:
 * - weather: open-meteo forecast object (may include daily arrays)
 * - latlng: [lat, lon] (optional) - used to fetch if weather.daily not present
 *
 * Renders a 5-day line chart with max and min temperatures.
 */
export default function TemperatureChart({ weather, latlng }) {
  const [fetching, setFetching] = useState(false);
  const [fiveday, setFiveday] = useState(null);
  const [error, setError] = useState(null);

  // If parent already provided daily data, use it.
  useEffect(() => {
    let mounted = true;
    async function ensureData() {
      setError(null);

      if (weather && weather.daily && weather.daily.time) {
        const days = weather.daily.time.slice(0, 6);
        const max = weather.daily.temperature_2m_max
          ? weather.daily.temperature_2m_max.slice(0, 6)
          : [];
        const min = weather.daily.temperature_2m_min
          ? weather.daily.temperature_2m_min.slice(0, 6)
          : [];
        if (mounted) setFiveday({ dates: days, max, min });
        return;
      }

      // Fetch forecast using lat/lon if needed
      if (latlng && latlng.length === 2) {
        try {
          setFetching(true);
          const [lat, lon] = latlng;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=UTC&forecast_days=6`;
          const resp = await axios.get(url);
          const d = resp.data;

          const days = d.daily?.time || [];
          const max = d.daily?.temperature_2m_max || [];
          const min = d.daily?.temperature_2m_min || [];

          if (mounted) setFiveday({ dates: days, max, min });
        } catch (e) {
          console.warn("TemperatureChart fetch error:", e);
          if (mounted) setError("Unable to fetch forecast");
        } finally {
          if (mounted) setFetching(false);
        }
      } else {
        setFiveday(null);
      }
    }

    ensureData();
    return () => {
      mounted = false;
    };
  }, [weather, latlng]);

  // Chart data
  const chartData = useMemo(() => {
    if (!fiveday) return null;

    const labels = fiveday.dates.map((d) => {
      try {
        return new Date(d).toLocaleDateString();
      } catch {
        return d;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: "Max °C",
          data: fiveday.max.map((v) => (v == null ? null : Number(v))),
          tension: 0.3,
          fill: false,
          borderColor: "#f80606ff",     // WHITE trend line
          backgroundColor: "#ff0000ff",
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          label: "Min °C",
          data: fiveday.min.map((v) => (v == null ? null : Number(v))),
          tension: 0.3,
          fill: false,
          borderColor: "#0421fcff",     // WHITE trend line
          backgroundColor: "#2605faff",
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    };
  }, [fiveday]);

  // Chart options (white text everywhere)
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#FFFFFF" },
      },
      title: { display: false },
      tooltip: {
        bodyColor: "#FFFFFF",
        titleColor: "#FFFFFF",
      },
    },
    scales: {
      x: {
        ticks: { color: "#FFFFFF" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        title: { display: true, text: "°C", color: "#FFFFFF" },
        ticks: { beginAtZero: false, color: "#FFFFFF" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  return (
    <div className="card">
      <div className="card-header">5-Day Temperatures</div>
      <div className="card-body" style={{ height: 220 }}>
        {fetching && <div className="muted">Loading chart…</div>}
        {error && <div className="cd-error">{error}</div>}
        {!chartData && !fetching && !error && (
          <div className="muted">No forecast data available</div>
        )}
        {chartData && <Line data={chartData} options={options} />}
      </div>
    </div>
  );
}
