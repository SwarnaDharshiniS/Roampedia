import React, { useEffect, useState } from "react";
import apiClient from "../../utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/**
 * TravelInsights Component
 * Shows aggregated data from all users for a specific country
 * - Total visitors count
 * - Total wishlist count
 * - Popular travel themes
 * - Average ratings from experiences
 */

const TravelInsights = ({ countryCode, countryName }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!countryCode && !countryName) return;

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch country-specific insights from backend
        const response = await apiClient.get(
          `/api/country-insights/${countryCode || countryName}`
        );
        
        setInsights(response.data);
      } catch (err) {
        console.error("Error fetching travel insights:", err);
        setError("Unable to load travel insights");
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [countryCode, countryName]);

  if (loading) {
    return (
      <div className="card travel-insights-card">
        <div className="card-header">📊 Travel Insights</div>
        <div className="card-body">
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
            Loading insights...
          </div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="card travel-insights-card">
        <div className="card-header">📊 Travel Insights</div>
        <div className="card-body">
          <div className="muted" style={{ textAlign: 'center', padding: '20px' }}>
            {error || "No insights available for this country"}
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ["#4C9AFF", "#FFB347", "#7AE582", "#FF6B9D", "#C77DFF"];

  // Prepare theme data for chart
  const themeData = Object.entries(insights.popularThemes || {})
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 themes

  return (
    <div className="card travel-insights-card">
      <div className="card-header">📊 Travel Insights</div>
      <div className="card-body">
        {/* Summary Stats */}
        <div className="insights-summary">
          <div className="insight-stat">
            <div className="stat-icon">✈️</div>
            <div className="stat-content">
              <div className="stat-value">{insights.totalVisitors || 0}</div>
              <div className="stat-label">Travelers Visited</div>
            </div>
          </div>

          <div className="insight-stat">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-value">{insights.totalWishlisted || 0}</div>
              <div className="stat-label">On Wishlists</div>
            </div>
          </div>

          <div className="insight-stat">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-value">{insights.totalExperiences || 0}</div>
              <div className="stat-label">Experiences Shared</div>
            </div>
          </div>

          {insights.averageRating > 0 && (
            <div className="insight-stat">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <div className="stat-value">{insights.averageRating}/10</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </div>
          )}
        </div>

        {/* Popular Travel Themes Chart */}
        {themeData.length > 0 && (
          <div className="insights-chart-section">
            <h4 className="chart-title">Popular Travel Themes</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={themeData}>
                <XAxis 
                  dataKey="theme" 
                  tick={{ fill: '#CBD5E1', fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: '#CBD5E1', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(96, 165, 250, 0.2)',
                    borderRadius: '8px',
                    color: '#E0E7FF'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#4C9AFF" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Best Rated Experiences Preview */}
        {insights.topRatedExperiences && insights.topRatedExperiences.length > 0 && (
          <div className="insights-experiences">
            <h4 className="chart-title">Top Rated Experiences</h4>
            <div className="experiences-list">
              {insights.topRatedExperiences.slice(0, 3).map((exp, index) => (
                <div key={index} className="experience-preview">
                  <div className="exp-header">
                    <span className="exp-rating">⭐ {exp.rating}/10</span>
                    <span className="exp-themes">{exp.themes?.slice(0, 2).join(', ')}</span>
                  </div>
                  <p className="exp-snippet">
                    "{exp.experience.slice(0, 120)}..."
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Stats Footer */}
        <div className="insights-footer">
          <p className="muted small">
            💡 Data from {insights.totalVisitors + insights.totalWishlisted} travelers in the Roampedia community
          </p>
        </div>
      </div>
    </div>
  );
};

export default TravelInsights;