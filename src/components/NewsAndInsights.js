import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewsAndInsights.css";
import notificationBellIcon from "../assets/notification-bell.png";
import dashboardIcon from "../assets/dashboard.png";
import userIcon from "../assets/user.png";
import activityTrackerIcon from "../assets/activity-tracker.png";
import sendIcon from "../assets/send.png";
import logo from "../assets/logo.png";
import logout from "../assets/logout.png";
import calculater from "../assets/calculater.png";
import axios from "axios";

const NEWS_API_KEY = "7574195e62c64542bdd5f4bb5e8f69af"; // Replace with your NewsAPI key

function NewsAndInsights() {
  const [newsArticles, setNewsArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSureModal, setShowSureModal] = useState(false);
  const navigate = useNavigate(); // React Router hook for navigation

  const handleCloseSureModal = () => {
    setShowSureModal(false);
  };

  useEffect(() => {
    // Fetch news from the NewsAPI
    const fetchNews = async () => {
      try {
        const response = await axios.get("https://newsapi.org/v2/everything", {
          params: {
            q: "stocks OR finance OR market", // Search query for stock/financial news
            pageSize: 5, // Limit the number of articles displayed
            apiKey: NEWS_API_KEY,
          },
        });
        setNewsArticles(response.data.articles);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Failed to fetch news.");
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleAlertClick = () => {
    alert("Notification button clicked!");
  };

  const handleStockBoardClick = () => {
    navigate("/UserProfiles");
  };
  const handleInteractiveToolsClick = () => {
    navigate("/InteractiveTools");
  };
  const handleContactClick = () => {
    navigate("/Contact-Us");
  };
  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("stockData");
    localStorage.removeItem("priceBuy");
    navigate("/");
  };

  if (loading) {
    return <div>Loading news...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      {showSureModal && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <span className="close-modal" onClick={handleCloseSureModal}>
              &times;
            </span>
            <div className="form-container">
              <div>
                <h2>Are you sure?</h2>
                <button
                  onClick={handleLogoutClick}
                  className="button-formal-delete-yes"
                >
                  Yes
                </button>
                <button
                  onClick={handleCloseSureModal}
                  className="button-formal-delete-no"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <header className="header">
        <div className="left-section">
          <img src={logo} alt="InsightPredict Logo" className="site-logo" />
        </div>
        <div className="right-section">
          <button className="alert-button" onClick={handleAlertClick}>
            <img
              src={notificationBellIcon}
              alt="Notification Bell"
              className="alert-icon"
            />
          </button>
          <div className="user-info">
            <span className="user-name">User User</span>
          </div>
        </div>
      </header>
      <div className="container">
        <aside className="sidebar">
          <nav className="menu">
            <a href="#" onClick={handleStockBoardClick}>
              <img src={dashboardIcon} alt="Dashboard" className="menu-icon" />
              Dashboard
            </a>
            <a href="#">
              <img
                src={activityTrackerIcon}
                alt="NewsAndInsights"
                className="menu-icon"
              />
              News And Insights
            </a>
            <a href="#" onClick={handleInteractiveToolsClick}>
              <img
                src={calculater}
                alt="InteractiveTools"
                className="menu-icon"
              />
              Interactive Tools
            </a>
            <a href="#" onClick={handleContactClick}>
              <img src={sendIcon} alt="Contact Us" className="menu-icon" />
              Contact Us
            </a>
            <a href="#" onClick={() => setShowSureModal(true)}>
              <img src={logout} alt="Logout" className="menu-icon" />
              Logout
            </a>
          </nav>
        </aside>
        <main className="content">
          <h2 className="title">Latest News and Insights</h2>
          <div className="news-list">
            {newsArticles.map((article, index) => (
              <div className="news-item" key={index}>
                <h3>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {article.title}
                  </a>
                </h3>
                <p>{article.description}</p>
                <small>
                  Source: {article.source.name} | Published:{" "}
                  {new Date(article.publishedAt).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default NewsAndInsights;
