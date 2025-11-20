import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../utils/api";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from "chart.js";
import { Pie, Bar, Line, Radar, Doughnut } from "react-chartjs-2";
import "./UserProfile.css";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [itineraryStats, setItineraryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [statsRes, profileRes, itineraryStatsRes] = await Promise.all([
        apiClient.get("/api/user-stats/stats"),
        apiClient.get("/api/user-stats/profile-data"),
        apiClient.get("/api/itineraries/analytics/stats"),
      ]);

      setStats(statsRes.data);
      setProfileData(profileRes.data);
      setItineraryStats(itineraryStatsRes.data);
      setFormData({
        firstName: profileRes.data.user.firstName || "",
        lastName: profileRes.data.user.lastName || "",
        displayName: profileRes.data.user.displayName || "",
      });
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setEditMode(false);
      fetchProfileData();
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile: " + error.message);
    }
  };

  const handleDownloadReport = async (reportType) => {
    try {
      const response = await apiClient.get(`/api/reports/${reportType}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Failed to download report");
    }
  };

  const handleExportCSV = () => {
    if (!profileData) return;

    const csvData = [
      ["Country", "Region", "Date Visited"],
      ...profileData.visited.map((v) => [
        v.countryName,
        v.region,
        new Date(v.dateVisited).toLocaleDateString(),
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `visited-countries-${Date.now()}.csv`;
    link.click();
  };

  if (loading) {
    return <div className="profile-loading">Loading your travel profile...</div>;
  }

  if (!stats || !profileData) {
    return <div className="profile-error">Failed to load profile data</div>;
  }

  // Prepare chart data for travel experiences
  const regionChartData = {
    labels: Object.keys(stats.visitedByRegion),
    datasets: [
      {
        label: "Countries Visited by Region",
        data: Object.values(stats.visitedByRegion),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  const ratingDistributionData = {
    labels: Object.keys(stats.ratingDistribution),
    datasets: [
      {
        label: "Number of Experiences",
        data: Object.values(stats.ratingDistribution),
        backgroundColor: "#4A90E2",
      },
    ],
  };

  const timelineData = {
    labels: Object.keys(stats.visitTimeline).sort(),
    datasets: [
      {
        label: "Countries Visited",
        data: Object.keys(stats.visitTimeline)
          .sort()
          .map((k) => stats.visitTimeline[k]),
        borderColor: "#4A90E2",
        backgroundColor: "rgba(74, 144, 226, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const themeData = {
    labels: Object.keys(stats.themePreferences),
    datasets: [
      {
        label: "Theme Preferences",
        data: Object.values(stats.themePreferences),
        backgroundColor: "rgba(74, 144, 226, 0.2)",
        borderColor: "#4A90E2",
        borderWidth: 2,
      },
    ],
  };

  // Prepare chart data for itineraries
  const itineraryExpenseData = itineraryStats
    ? {
        labels: Object.keys(itineraryStats.expenseBreakdown),
        datasets: [
          {
            label: "Total Expenses by Category (USD)",
            data: Object.values(itineraryStats.expenseBreakdown),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      }
    : null;

  const itineraryDestinationData = itineraryStats
    ? {
        labels: Object.keys(itineraryStats.destinationBreakdown),
        datasets: [
          {
            label: "Trips by Destination",
            data: Object.values(itineraryStats.destinationBreakdown),
            backgroundColor: "#10b981",
          },
        ],
      }
    : null;

  const itineraryStatusData = itineraryStats
    ? {
        labels: Object.keys(itineraryStats.statusBreakdown),
        datasets: [
          {
            label: "Itineraries by Status",
            data: Object.values(itineraryStats.statusBreakdown),
            backgroundColor: ["#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"],
          },
        ],
      }
    : null;

  const itineraryMonthlyData = itineraryStats
    ? {
        labels: Object.keys(itineraryStats.monthlyDistribution),
        datasets: [
          {
            label: "Trips per Month",
            data: Object.values(itineraryStats.monthlyDistribution),
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.2)",
            tension: 0.4,
          },
        ],
      }
    : null;

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user?.firstName?.[0] || user?.email?.[0] || "U"}
          </div>
        </div>
        <div className="profile-info">
          {editMode ? (
            <form onSubmit={handleUpdateProfile} className="profile-edit-form">
              <input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Display Name"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
              <div className="edit-buttons">
                <button type="submit" className="btn-save">
                  Save
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1>
                {profileData.user.displayName ||
                  `${profileData.user.firstName} ${profileData.user.lastName}`}
              </h1>
              <p className="profile-email">{profileData.user.email}</p>
              <p className="profile-member-since">
                Member since{" "}
                {new Date(profileData.user.createdAt).toLocaleDateString()}
              </p>
              <button className="btn-edit" onClick={() => setEditMode(true)}>
                Edit Profile
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Stats - Updated with Itinerary Stats */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-number">{stats.visitedCount}</div>
          <div className="stat-label">Countries Visited</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.wishlistCount}</div>
          <div className="stat-label">Countries on Wishlist</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.experiencesCount}</div>
          <div className="stat-label">Travel Experiences</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {itineraryStats?.totalItineraries || 0}
          </div>
          <div className="stat-label">Planned Itineraries</div>
        </div>
      </div>

      {/* Travel Profile Summary */}
      <div className="travel-profile-card">
        <h2>Your Travel Profile</h2>
        <div className="travel-profile-grid">
          <div className="profile-item">
            <span className="profile-label">Favorite Region:</span>
            <span className="profile-value">
              {stats.travelProfile.favoriteRegion}
            </span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Favorite Themes:</span>
            <span className="profile-value">
              {stats.travelProfile.favoriteThemes.join(", ") || "None yet"}
            </span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Total Trip Days Planned:</span>
            <span className="profile-value">
              {itineraryStats?.totalTripDays || 0} days
            </span>
          </div>
          <div className="profile-item">
            <span className="profile-label">Total Budget Planned:</span>
            <span className="profile-value">
              ${itineraryStats?.totalBudget || 0}
            </span>
          </div>
        </div>
      </div>

      {/* NEW: Itinerary Planning Statistics Section */}
      {itineraryStats && itineraryStats.totalItineraries > 0 && (
        <div className="itinerary-section">
          <h2>🗺️ Trip Planning Analytics</h2>

          <div className="itinerary-stats-cards">
            <div className="stat-card-small">
              <div className="stat-icon">✈️</div>
              <div className="stat-content">
                <div className="stat-value">
                  {itineraryStats.totalItineraries}
                </div>
                <div className="stat-title">Total Itineraries</div>
              </div>
            </div>
            <div className="stat-card-small">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value">{itineraryStats.totalTripDays}</div>
                <div className="stat-title">Total Days Planned</div>
              </div>
            </div>
            <div className="stat-card-small">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-value">
                  ${itineraryStats.totalBudget.toLocaleString()}
                </div>
                <div className="stat-title">Total Budget</div>
              </div>
            </div>
            <div className="stat-card-small">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">
                  ${itineraryStats.avgBudgetPerTrip}
                </div>
                <div className="stat-title">Avg Budget/Trip</div>
              </div>
            </div>
            <div className="stat-card-small">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-value">
                  {itineraryStats.avgTripDuration} days
                </div>
                <div className="stat-title">Avg Trip Duration</div>
              </div>
            </div>
            <div className="stat-card-small">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-value">{itineraryStats.upcomingTrips}</div>
                <div className="stat-title">Upcoming Trips</div>
              </div>
            </div>
          </div>

          {/* Itinerary Charts */}
          <div className="charts-grid">
            {/* Expense Breakdown */}
            {itineraryExpenseData && (
              <div className="chart-container">
                <h3>💸 Total Expenses by Category</h3>
                <Doughnut
                  data={itineraryExpenseData}
                  options={{
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            )}

            {/* Destination Breakdown */}
            {itineraryDestinationData && (
              <div className="chart-container">
                <h3>🌍 Trips by Destination</h3>
                <Bar
                  data={itineraryDestinationData}
                  options={{
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                      },
                    },
                  }}
                />
              </div>
            )}

            {/* Status Breakdown */}
            {itineraryStatusData && (
              <div className="chart-container">
                <h3>📋 Itineraries by Status</h3>
                <Pie
                  data={itineraryStatusData}
                  options={{
                    maintainAspectRatio: true,
                    plugins: {
                      legend: { position: "bottom" },
                    },
                  }}
                />
              </div>
            )}

            {/* Monthly Distribution */}
            {itineraryMonthlyData && (
              <div className="chart-container full-width">
                <h3>📆 Trip Planning Timeline</h3>
                <Line
                  data={itineraryMonthlyData}
                  options={{
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Travel Experience Visualizations */}
      <div className="visualizations-section">
        <h2>📊 Your Travel Analytics</h2>

        <div className="charts-grid">
          {/* Chart 1: Regional Distribution */}
          {Object.keys(stats.visitedByRegion).length > 0 && (
            <div className="chart-container">
              <h3>Countries by Region</h3>
              <Pie
                data={regionChartData}
                options={{ maintainAspectRatio: true }}
              />
            </div>
          )}

          {/* Chart 2: Rating Distribution */}
          {stats.experiencesCount > 0 && (
            <div className="chart-container">
              <h3>Rating Distribution</h3>
              <Bar
                data={ratingDistributionData}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                    },
                  },
                }}
              />
            </div>
          )}

          {/* Chart 3: Visit Timeline */}
          {Object.keys(stats.visitTimeline).length > 0 && (
            <div className="chart-container full-width">
              <h3>Travel Timeline</h3>
              <Line
                data={timelineData}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                    },
                  },
                }}
              />
            </div>
          )}

          {/* Chart 4: Theme Preferences */}
          {Object.keys(stats.themePreferences).length > 0 && (
            <div className="chart-container">
              <h3>Travel Theme Preferences</h3>
              <Radar
                data={themeData}
                options={{
                  maintainAspectRatio: true,
                  scales: {
                    r: {
                      beginAtZero: true,
                      ticks: { stepSize: 1 },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Download Reports Section - Updated */}
      <div className="reports-section">
        <h2>📥 Download Your Travel Reports</h2>
        <div className="reports-grid">
          <button
            className="report-btn"
            onClick={() => handleDownloadReport("travel-summary")}
          >
            📄 Travel Summary PDF
          </button>
          <button
            className="report-btn"
            onClick={() => handleDownloadReport("experience-journal")}
          >
            📖 Experience Journal PDF
          </button>
          <button
            className="report-btn"
            onClick={() => handleDownloadReport("statistics")}
          >
            📈 Statistics Report PDF
          </button>
          <button
            className="report-btn"
            onClick={() => handleDownloadReport("itinerary-report")}
          >
            🗺️ Itinerary Planning Report PDF
          </button>
          <button className="report-btn" onClick={handleExportCSV}>
            📊 Countries CSV Export
          </button>
        </div>
      </div>

      {/* Visited Countries List */}
      <div className="countries-section">
        <h2>Visited Countries ({stats.visitedCount})</h2>
        <div className="countries-grid">
          {profileData.visited.map((country) => (
            <div key={country._id} className="country-card">
              <img
                src={country.flagUrl}
                alt={country.countryName}
                className="country-flag"
              />
              <div className="country-info">
                <h4>{country.countryName}</h4>
                <p>{country.region}</p>
                <p className="visit-date">
                  {new Date(country.dateVisited).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wishlist */}
      <div className="countries-section">
        <h2>Wishlist ({stats.wishlistCount})</h2>
        <div className="countries-grid">
          {profileData.wishlist.map((country) => (
            <div key={country._id} className="country-card wishlist">
              <img
                src={country.flagUrl}
                alt={country.countryName}
                className="country-flag"
              />
              <div className="country-info">
                <h4>{country.countryName}</h4>
                <p>{country.region}</p>
                <p className="added-date">
                  Added {new Date(country.addedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experiences */}
      <div className="experiences-section">
        <h2>Travel Experiences ({stats.experiencesCount})</h2>
        <div className="experiences-list">
          {profileData.experiences.map((exp) => (
            <div key={exp._id} className="experience-card">
              <div className="experience-header">
                <h3>{exp.country}</h3>
                <div className="experience-rating">⭐ {exp.rating}/10</div>
              </div>
              <p className="experience-text">{exp.experience}</p>
              <div className="experience-meta">
                <span className="experience-themes">
                  {exp.themes.join(", ")}
                </span>
                <span className="experience-dates">
                  {new Date(exp.fromDate).toLocaleDateString()} -{" "}
                  {new Date(exp.toDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Rated Countries */}
      {stats.topRatedCountries.length > 0 && (
        <div className="top-rated-section">
          <h2>Your Top Rated Countries</h2>
          <div className="top-rated-list">
            {stats.topRatedCountries.map((country, index) => (
              <div key={index} className="top-rated-item">
                <span className="rank">#{index + 1}</span>
                <span className="country-name">{country.country}</span>
                <span className="rating">⭐ {country.averageRating}/10</span>
                <span className="count">
                  ({country.count} experience{country.count > 1 ? "s" : ""})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;