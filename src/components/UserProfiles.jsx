import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import logo from "../assets/logo.png";
import logout from "../assets/logout.png";
import notificationBellIcon from "../assets/notification-bell.png";
import dashboardIcon from "../assets/dashboard.png";
import userIcon from "../assets/user.png";
import activityTrackerIcon from "../assets/activity-tracker.png";
import sendIcon from "../assets/send.png";
import calculater from "../assets/calculater.png";
import signImage from "../assets/sign.png";
import "./UserProfiles.css"; // Add styling here

const ProfileCard = ({
  email,
  id,
  hasPortfolio,
  onViewPortfolio,
  onCreatePortfolio,
  isPlaceholder = false,
  onCreateUser, // New prop for creating a user
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: isPlaceholder ? "none" : CSS.Transform.toString(transform),
    transition,
    background: isPlaceholder
      ? "#f0f0f0"
      : hasPortfolio
      ? "#ffffff"
      : "#f8d7da",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    marginBottom: "10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: isPlaceholder ? "pointer" : "grab", // Ensure normal cards are draggable
    width: "250px",
    height: "150px",
    border: isPlaceholder
      ? "2px dashed #4caf50"
      : hasPortfolio
      ? "2px solid #4caf50"
      : "2px solid #dc3545",
  };

  if (isPlaceholder) {
    return (
      <div ref={setNodeRef} style={style} onClick={onCreateUser}>
        <h3 style={{ margin: "10px 0", textAlign: "center", color: "#4caf50" }}>
          + Create New User
        </h3>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <h3 style={{ margin: "10px 0", textAlign: "center" }}>
        {email.split("@")[0]}
      </h3>
      {!hasPortfolio && (
        <p style={{ color: "#dc3545", fontSize: "12px", marginBottom: "10px" }}>
          No Portfolio
        </p>
      )}

      {/* Button logic */}
      {hasPortfolio ? (
        <button
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
          onPointerUp={(e) => {
            e.stopPropagation(); // Prevent dragging
            onViewPortfolio(email); // Call the correct function
          }}
        >
          View Portfolio
        </button>
      ) : (
        <button
          style={{
            background: "#dc3545",
            color: "white",
            border: "none",
            padding: "8px 12px",
            cursor: "pointer",
            borderRadius: "5px",
          }}
          onPointerUp={(e) => {
            e.stopPropagation(); // Prevent dragging
            onCreatePortfolio(email); // Call the correct function
          }}
        >
          Create Portfolio
        </button>
      )}
    </div>
  );
};

const UserProfiles = () => {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [showSureModal, setShowSureModal] = React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const handleProfileClick = (email) => {
    navigate(`/stockboard/${encodeURIComponent(email)}`); // Navigate to StockBoard with email
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Invalid Email.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.message === "This email is already active.") {
        setError(data.message);
      } else {
        setError("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setError("Failed to create an account.");
    }
  };

  const handleCloseRegisterModal = () => {
    setShowRegisterModal(false);
  };

  const handleCreatePortfolioClick = (email) => {
    navigate(`/user-preferences/${encodeURIComponent(email)}`); // Create Portfolio
  };

  const handleCreateUserClick = () => {
    setShowRegisterModal(true);
  };

  const handleAlertClick = () => {
    alert("Notification button clicked!");
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

  useEffect(() => {
    axios
      .get("http://localhost:3001/all-users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then((response) => setUsers(response.data))
      .catch((error) => console.error("Error fetching users:", error));
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = users.findIndex((user) => user.email === active.id);
    const newIndex = users.findIndex((user) => user.email === over.id);

    if (oldIndex === -1 || newIndex === -1) return; // Ensure valid indexes

    const newUsers = arrayMove(users, oldIndex, newIndex); // ✅ Correctly reorders the array

    setUsers(newUsers); // ✅ Updates state correctly
  };

  return (
    <div>
      {showSureModal && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <div style={{ display: "flex", flexDirection: "row" }}>
              <span className="close-modal" onClick={handleCloseSureModal}>
                &times;
              </span>
            </div>
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
      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="form-container">
              <h2 style={{ marginBottom: "15px" }}>Create New User</h2>
              <input
                type="email"
                placeholder="Email"
                className="text-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="text-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="text-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {error && <p className="error-message">{error}</p>}
              <button onClick={handleSignup} className="button-formal">
                Sign Up
              </button>
            </div>
            <div className="image-container">
              <img src={signImage} alt="Sign Illustration" />
            </div>
            <span
              className="home-close-modal"
              style={{ alignSelf: "start", fontSize: "24px" }}
              onClick={handleCloseRegisterModal}
            >
              &times;
            </span>
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
            <span className="user-name">
              User {"" + localStorage.getItem("email")}
            </span>
          </div>
        </div>
      </header>
      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="menu">
            <a href="#">
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
        <div className="profile-container">
          <h2>User Profiles</h2>
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={users.map((user) => user.email)}
              strategy={rectSortingStrategy}
            >
              <div className="grid-container">
                {users.map((user) => (
                  <ProfileCard
                    key={user.email}
                    id={user.email}
                    email={user.email}
                    hasPortfolio={user.hasPortfolio}
                    onViewPortfolio={handleProfileClick}
                    onCreatePortfolio={handleCreatePortfolioClick}
                  />
                ))}
                <ProfileCard
                  isPlaceholder
                  onCreateUser={handleCreateUserClick}
                />
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};

export default UserProfiles;
