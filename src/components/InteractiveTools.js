import React, { useState } from "react";
import "./InteractiveTools.css";
import { useNavigate } from "react-router-dom";
import notificationBellIcon from "../assets/notification-bell.png";
import dashboardIcon from "../assets/dashboard.png";
import userIcon from "../assets/user.png";
import activityTrackerIcon from "../assets/activity-tracker.png";
import sendIcon from "../assets/send.png";
import logo from "../assets/logo.png"; // Import the logo image
import logout from "../assets/logout.png"; // Import the logo image
import StockCalculator from "./StockCalculator"; // Import the StockCalculator component
import StockComparison from "./StockComparison"; // Import the StockComparison component
import InvestmentSimulator from "./InvestmentSimulator"; // Import the InvestmentSimulator component
import calculater from "../assets/calculater.png";
import axios from "axios";

function InteractiveTools() {
  const [currentTool, setCurrentTool] = useState("calculator"); // Default tool is stock calculator
  const [showSureModal, setShowSureModal] = useState(false);

  // Functions to switch between tools
  const handleCalculatorClick = () => setCurrentTool("calculator");
  const handleComparisonClick = () => setCurrentTool("comparison");
  const handleSimulatorClick = () => setCurrentTool("simulator");
  const navigate = useNavigate();

  // Handle notification click (optional)
  const handleAlertClick = () => {
    alert("Notification button clicked!");
  };

  const handleStockBoardClick = () => {
    navigate("/UserProfiles");
  };

  const handleNewsAndInsightsClick = () => {
    navigate("/NewsAndInsights");
  };

  const handleInteractiveToolsClick = () => {
    navigate("/InteractiveTools");
  };

  const handleContactClick = () => {
    navigate("/contact-us");
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

      <div className="container">
        {/* Sidebar Menu */}
        <aside className="sidebar">
          <nav className="menu">
            <a href="#" onClick={handleStockBoardClick}>
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

        {/* Main Content */}
        <main className="content">
          <h2>Interactive Tools</h2>

          {/* Tool Selection */}
          <div className="button-container">
            <button onClick={handleCalculatorClick}>Stock Calculator</button>
            <button onClick={handleComparisonClick}>
              Stock Comparison Tool
            </button>
            <button onClick={handleSimulatorClick}>Investment Simulator</button>
          </div>

          {/* Conditional Rendering Based on Tool */}
          <div>
            {currentTool === "calculator" && <StockCalculator />}
            {currentTool === "comparison" && <StockComparison />}
            {currentTool === "simulator" && <InvestmentSimulator />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default InteractiveTools;
