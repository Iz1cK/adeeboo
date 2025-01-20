import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./StockBoard.css";
import axios from "axios";
import { RotatingLines } from "react-loader-spinner";
import notificationBellIcon from "../assets/notification-bell.png";
import dashboardIcon from "../assets/dashboard.png";
import userIcon from "../assets/user.png";
import activityTrackerIcon from "../assets/activity-tracker.png";
import sendIcon from "../assets/send.png";
import logo from "../assets/logo.png";
import logout from "../assets/logout.png";
import calculater from "../assets/calculater.png";

function StockBoard({ userEmail }) {
  const { email } = useParams(); // Extract email from URL
  const [showModal, setShowModal] = useState(false);
  const [showSureModal, setShowSureModal] = useState(false);
  const [data, setData] = useState([]); // Stock data
  const [priceBuy, setPriceBuy] = useState({});
  const [initialInvestment, setInitialInvestment] = useState(0);

  useEffect(() => {
    if (!email) return;

    const fetchInitialInvestment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token is missing.");

        const response = await axios.get(
          "http://localhost:3001/user-preferences",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { email },
          }
        );

        if (response.data && response.data["Initial Investment"]) {
          setInitialInvestment(parseFloat(response.data["Initial Investment"]));
        } else {
          console.error("Initial Investment not found.");
        }
      } catch (error) {
        console.error("Error fetching initial investment:", error.message);
      }
    };

    fetchInitialInvestment();
  }, [email]);

  useEffect(() => {
    if (initialInvestment === null) return; // Ensure we wait for initialInvestment

    if (localStorage.getItem("storedFor") !== email) {
      localStorage.removeItem("stockData");
      localStorage.removeItem("priceBuy");
    } else {
      if (localStorage.getItem("stockData")) {
        let stockDataLoad = JSON.parse(localStorage.getItem("stockData")) || [];
        let unitsStockData = stockDataLoad.map((stock) => {
          const weight = parseFloat(stock.weightInPortfolio);
          const currentPrice = parseFloat(stock.price);
          const unitsOwned = (initialInvestment * weight) / currentPrice;

          return {
            ...stock,
            unitsOwned: isNaN(unitsOwned) ? "N/A" : unitsOwned.toFixed(2),
          };
        });

        setData(unitsStockData);
      }

      if (localStorage.getItem("priceBuy")) {
        setPriceBuy(JSON.parse(localStorage.getItem("priceBuy")) || {});
      }

      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token is missing.");

        const response = await axios.get(
          `http://localhost:3001/get-portfolio`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { email },
          }
        );

        if (!response.data)
          throw new Error("No portfolio found for this user.");

        setTickers(response.data.selected_assets || []);
        setWeights(response.data.weights || []);
      } catch (error) {
        console.error("Error fetching portfolio:", error.message);
        setError("Failed to fetch portfolio.");
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [initialInvestment, email]);

  useEffect(() => {
    const fetchInitialInvestment = async () => {
      if (!email) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Authentication token is missing.");

        const response = await axios.get(
          "http://localhost:3001/user-preferences",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { email },
          }
        );

        if (response.data && response.data["Initial Investment"]) {
          const initialInvestment = parseFloat(
            response.data["Initial Investment"]
          );
          setInitialInvestment(initialInvestment);
          // // Perform necessary calculations:
        } else {
          console.error("Initial Investment not found.");
        }
      } catch (error) {
        console.error("Error fetching initial investment:", error.message);
      }
    };

    fetchInitialInvestment();
  }, [email]);

  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // Sorting configuration
  const [tickers, setTickers] = useState([]);
  const [weights, setWeights] = useState([]);
  const navigate = useNavigate(); // React Router hook for navigation
  const handleRowClick = (symbol) => {
    navigate(`/stock-details/${symbol}`); // Ensure the route matches App.js
  };

  const FINNHUB_API_KEY1 = "ctjbr29r01quipmtn8mgctjbr29r01quipmtn8n0"; // Replace with your Finnhub API Key
  const FINNHUB_API_KEY2 = "cttf39pr01qqhvb0f4r0cttf39pr01qqhvb0f4rg"; // Replace with your Finnhub API Key

  const handleDeleteClick = () => {
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleCloseSureModal = () => {
    setShowSureModal(false);
  };

  const deletePortfolio = async () => {
    try {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      if (!token) {
        alert("Authentication token is missing. Please log in again.");
        return;
      }

      const response = await axios.delete(
        "http://localhost:3001/delete-portfolio",
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
          },
          params: { email },
        }
      );

      if (response.status === 200) {
        alert("Portfolio deleted successfully!");
        setData([]); // Clear the table data
        localStorage.removeItem("priceBuy"); // Remove stored data
        localStorage.removeItem("stockData");
        localStorage.removeItem("storedFor");
      } else {
        alert("Failed to delete portfolio.");
      }
    } catch (error) {
      console.error("Error deleting portfolio:", error);
      alert("An error occurred while deleting the portfolio.");
    } finally {
      setShowModal(false);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Refreshing page...");
      window.location.reload(); // Refresh the entire page every minute
    }, 60000); // 60000ms = 1 minute

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    if (tickers.length === 0 || weights.length === 0) return; // Avoid unnecessary API calls

    const fetchStockData = async () => {
      try {
        let stockData = [];
        setLoading(true);
        for (let i = 0; i < tickers.length; i++) {
          const symbol = tickers[i];
          try {
            const [quoteResponse, profileResponse] = await Promise.all([
              axios.get(
                `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY1}`
              ),
              axios.get(
                `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY1}`
              ),
            ]);

            const currentPrice = quoteResponse.data.c;

            // Set price buy if not already set
            if (!priceBuy[symbol]) {
              priceBuy[symbol] = currentPrice;
              localStorage.setItem("priceBuy", JSON.stringify(priceBuy));
            }

            stockData.push({
              symbol,
              companyName: profileResponse.data.name || symbol,
              price: currentPrice,
              changePercent: quoteResponse.data.dp,
              weightInPortfolio: weights[i],
              marketCap: profileResponse.data.marketCapitalization || "N/A",
              weightedChangeUSD: "N/A",
              unitsOwned: (
                (initialInvestment * weights[i]) /
                currentPrice
              ).toFixed(2),
            });
          } catch (error) {
            console.error(
              `Failed to fetch data for ticker: ${symbol}`,
              error.message
            );
          }

          // Add a debounce delay (e.g., 300ms between each request)
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
        setLoading(false);
        setData(stockData);
        localStorage.setItem("stockData", JSON.stringify(stockData));
        localStorage.setItem("storedFor", email);
      } catch (error) {
        console.error("Error fetching stock data:", error.message);
        setError("Failed to fetch stock data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [tickers]);

  const handleLogoutClick = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("stockData");
    localStorage.removeItem("priceBuy");
    localStorage.removeItem("storedFor");
    navigate("/");
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null; // Reset to original (unsorted)
      }
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const sortedData = React.useMemo(() => {
    console.log(data);
    if (!sortConfig.direction) {
      return data; // Return original data if unsorted
    }

    return [...data].sort((a, b) => {
      const aValue =
        sortConfig.key === "priceBuy" ? priceBuy[a.symbol] : a[sortConfig.key];
      const bValue =
        sortConfig.key === "priceBuy" ? priceBuy[b.symbol] : b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, priceBuy]);

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") return "▲";
      if (sortConfig.direction === "desc") return "▼";
    }
    return " "; // No arrow for unsorted
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {loading && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <RotatingLines
              visible={true}
              height="96"
              width="96"
              color="grey"
              strokeWidth="5"
              animationDuration="0.75"
              ariaLabel="rotating-lines-loading"
              wrapperStyle={{}}
              wrapperClass=""
            />
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-delete">
            <span className="close-modal" onClick={handleCloseModal}>
              &times;
            </span>
            <div className="form-container">
              <div>
                <h2>Are you sure?</h2>
                <button
                  onClick={deletePortfolio}
                  className="button-formal-delete-yes"
                >
                  Yes
                </button>
                <button
                  onClick={handleCloseModal}
                  className="button-formal-delete-no"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
          <button
            className="alert-button"
            onClick={() => alert("Notification button clicked!")}
          >
            <img
              src={notificationBellIcon}
              alt="Notification Bell"
              className="alert-icon"
            />
          </button>
          <div className="user-info">
            <div className="right-section">
              <p className="user-email">Logged in as: {email}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="container">
        <aside className="sidebar">
          <nav className="menu">
            <a
              href="#"
              onClick={() => {
                navigate("/UserProfiles");
              }}
            >
              <img src={dashboardIcon} alt="Dashboard" className="menu-icon" />
              Dashboard
            </a>
            <a href="#" onClick={() => navigate("/NewsAndInsights")}>
              <img
                src={activityTrackerIcon}
                alt="NewsAndInsights"
                className="menu-icon"
              />
              News And Insights
            </a>
            <a href="#" onClick={() => navigate("/InteractiveTools")}>
              <img
                src={calculater}
                alt="InteractiveTools"
                className="menu-icon"
              />
              Interactive Tools
            </a>
            <a href="#" onClick={() => navigate("/contact-us")}>
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
          <div className="actions">
            <h2 className="title">Stock Data</h2>
            <button className="delete-button" onClick={handleDeleteClick}>
              Delete Portfolio
            </button>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th data-sortable onClick={() => handleSort("companyName")}>
                  Company Name{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("companyName")}
                  </span>
                </th>
                <th data-sortable onClick={() => handleSort("marketCap")}>
                  Current Market Cap{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("marketCap")}
                  </span>
                </th>
                <th data-sortable onClick={() => handleSort("priceBuy")}>
                  Price Buy{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("priceBuy")}
                  </span>
                </th>
                <th data-sortable onClick={() => handleSort("price")}>
                  Current Price{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("price")}
                  </span>
                </th>
                <th data-sortable onClick={() => handleSort("changePercent")}>
                  Change %{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("changePercent")}
                  </span>
                </th>
                <th
                  data-sortable
                  onClick={() => handleSort("weightInPortfolio")}
                >
                  Weight in Portfolio{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("weightInPortfolio")}
                  </span>
                </th>
                <th
                  data-sortable
                  onClick={() => handleSort("weightedChangeUSD")}
                >
                  Weighted Change in USD{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("weightedChangeUSD")}
                  </span>
                </th>
                <th data-sortable onClick={() => handleSort("unitsOwned")}>
                  Units Owned{" "}
                  <span className="sort-indicator">
                    {getSortIndicator("unitsOwned")}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length >= 1 ? (
                sortedData.map((stock, index) => (
                  <tr key={index}>
                    <td>
                      <button
                        className="stock-button"
                        onClick={() => handleRowClick(stock.symbol)}
                      >
                        {stock.companyName}
                      </button>
                    </td>
                    <td>{stock.marketCap?.toFixed(2) || "N/A"}</td>
                    <td>{priceBuy[stock.symbol]?.toFixed(2) || "N/A"}</td>
                    <td>{stock.price?.toFixed(2) || "N/A"}</td>
                    <td>{stock.changePercent?.toFixed(2) || "N/A"}</td>
                    <td>{stock.weightInPortfolio}</td>
                    <td>{stock.weightedChangeUSD}</td>
                    <td>{stock.unitsOwned || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data-cell">
                    <button
                      className="generate-portfolio-button"
                      onClick={() => navigate("/user-preferences")}
                    >
                      Generate Portfolio
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
}

export default StockBoard;
