import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import logout from "../assets/logout.png";
import notificationBellIcon from "../assets/notification-bell.png";
import dashboardIcon from "../assets/dashboard.png";
import userIcon from "../assets/user.png";
import activityTrackerIcon from "../assets/activity-tracker.png";
import sendIcon from "../assets/send.png";
import axios from "axios";
import calculater from "../assets/calculater.png";

function ContactUs() {
  const navigate = useNavigate();
  const [showSureModal, setShowSureModal] = React.useState(false);

  const handleAlertClick = () => {
    alert("Notification button clicked!");
  };

  const handleDashBoardClick = () => {
    navigate("/UserProfiles");
  };
  const handleInteractiveToolsClick = () => {
    navigate("/InteractiveTools");
  };
  const handleContactClick = () => {
    navigate("/contact-us");
  };
  const handleNewsAndInsightsClick = () => {
    navigate("/NewsAndInsights");
  };

  const handleCloseSureModal = () => {
    setShowSureModal(false);
  };

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("stockData");
    localStorage.removeItem("priceBuy");
    navigate("/");
  };
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
      {/* Header Section */}
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

      {/* Main Container */}
      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="menu">
            <a href="#" onClick={handleDashBoardClick}>
              <img src={dashboardIcon} alt="Dashboard" className="menu-icon" />
              Dashboard
            </a>
            <a href="#" onClick={handleNewsAndInsightsClick}>
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

        {/* Content Section */}
        <main className="content">
          <h2>Contact Us</h2>
          <br />

          <p>If you have any questions, feel free to reach out to us!</p>
          <br />
          <br />
          <div>
            <h3>Our Information</h3>
            <br />
            <p>
              <strong>Bayan Yahia</strong> - bayan@example.com - 123456789
            </p>
            <br />
            <p>
              <strong>Adeeb Ganadry</strong> - adeeb@example.com - 987654321
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ContactUs;
