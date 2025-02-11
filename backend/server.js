const express = require("express");
const bodyParser = require("body-parser");
const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { spawnSync, execSync } = require("child_process");
const app = express();
const PORT = 3001;

const credentialsFile = path.join(__dirname, "credentials.csv");
const preferencesFile = path.join(__dirname, "user-preferences.csv");
const portfolioFilePath = path.join(__dirname, "portfolios.json");

const SECRET_KEY = "686578%&%$6$%^$";

app.use(bodyParser.json());
app.use(cors());

// Middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Helper function to read CSV
const readCSV = (filePath) => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf8");
  return data
    .trim()
    .split("\n")
    .map((line) => line.split(","));
};

// Helper function to write CSV without duplicating the header
const writeCSV = (filePath, data, includeHeader = false) => {
  try {
    let csvData = data.map((row) => row.map(String).join(",")).join("\n");
    if (includeHeader) {
      const header =
        "Email,Familiarity,Portfolio Drop, Risk Investment, Volatility, Drawdown 1 Month, Drawdown 2 Months, Drawdown 3 Months, Investment Horizon, Initial Investment, Portfolio Size";
      csvData = `${header}\n${csvData}`;
    }
    fs.writeFileSync(filePath, csvData, { encoding: "utf8" });
  } catch (error) {
    console.error("Error writing CSV:", error);
  }
};

function ensurePythonEnvironment() {
  try {
    // Check if Python is installed
    const pythonVersion = execSync("python3 --version").toString().trim();
    console.log(`Python version detected: ${pythonVersion}`);

    // Install required packages using pip
    console.log("Ensuring Python dependencies are installed...");
    execSync("python3 -m pip install --upgrade pip", { stdio: "inherit" });
    execSync("python3 -m pip install -r requirements.txt", {
      stdio: "inherit",
    });
    console.log("Python environment setup complete.");
  } catch (error) {
    console.error("Error setting up Python environment:", error.message);
    throw new Error(
      "Failed to set up Python environment. Ensure Python 3 and pip are installed."
    );
  }
}

function getPortfolio(lambda, horizon, size) {
  try {
    ensurePythonEnvironment();
    // Spawn a Python process to execute the script
    const pythonProcess = spawnSync("python3", [
      "portfolio_construction.py", // Path to your Python script
      lambda.toString(),
      horizon.toString(),
      size.toString(),
    ]);

    // Check for errors during script execution
    if (pythonProcess.error) {
      throw new Error(
        `Python script execution failed: ${pythonProcess.error.message}`
      );
    }

    // Capture and parse the script's output
    const output = pythonProcess.stdout.toString();
    const portfolio = JSON.parse(output);
    return portfolio; // Return the portfolio as a JSON object
  } catch (error) {
    console.error("Error in getPortfolio:", error.message);
    throw error; // Rethrow the error for the caller to handle
  }
}

// Login route with token generation
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = readCSV(credentialsFile);

  const userExists = users.some(
    ([storedEmail, storedPassword]) =>
      storedEmail === email && storedPassword === password
  );

  if (userExists) {
    // Generate a token for the authenticated user
    const token = jwt.sign({ email }, SECRET_KEY);

    res.status(200).json({
      message: "Login successful",
      token, // Return the token to the client
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// Signup route with token generation
app.post("/signup", (req, res) => {
  const { email, password } = req.body;
  const users = readCSV(credentialsFile);

  const userExists = users.some(([storedEmail]) => storedEmail === email);

  if (userExists) {
    res.status(400).json({ message: "This email is already active." });
  } else {
    users.push([email, password, 0]);
    writeCSV(credentialsFile, users, false);

    // Generate a token for the newly created user
    const token = jwt.sign({ email }, SECRET_KEY);

    res.status(200).json({
      message: "Account created successfully!",
      token, // Return the token to the client
    });
  }
});

app.get("/all-users", authenticateToken, (req, res) => {
  try {
    // Read users from the credentials CSV file
    const users = readCSV(credentialsFile);

    // Remove the first line if it contains only the word "email"
    if (users.length > 0 && users[0][0].toLowerCase() === "email") {
      users.shift(); // Remove the first row
    }

    // Load portfolios.json file
    let portfolios = {};
    if (fs.existsSync(portfolioFilePath)) {
      portfolios = JSON.parse(fs.readFileSync(portfolioFilePath, "utf8"));
    }

    // Filter out admin users and return an array of objects with email and portfolio status
    const nonAdminUsers = users
      .filter((user) => user[2] !== "1") // Exclude users with admin = 1
      .map(([email]) => ({
        email,
        hasPortfolio: portfolios.hasOwnProperty(email), // Check if user has a portfolio
      }));

    res.status(200).json(nonAdminUsers);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ message: "Failed to retrieve users." });
  }
});

app.get("/get-email", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from the Authorization header

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // Replace SECRET_KEY with your environment variable
    const email = decoded.email;
    res.status(200).json({ email });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

function generatePortfolio(preferences) {
  const email = preferences[0];
  const horizon = preferences[preferences.length - 3];
  const size = preferences[preferences.length - 1];
  const score = preferences
    .slice(1, preferences.length - 4) // Extract the subarray
    .reduce((sum, value) => sum + value, 0); // Sum up the values

  // Calculate lambda based on the score
  const lambda = 1 + 0.142857 * (score - 7);

  console.log(
    `Lambda: ${lambda}, Horizon: ${horizon}, Portfolio Size: ${size}`
  );

  let portfolio = getPortfolio(lambda, horizon, size);
  // Save the portfolio in the portfolios.json file
  savePortfolio(email, portfolio);
  return { email, score, lambda };
}

function savePortfolio(email, portfolio) {
  try {
    // Read the existing portfolios file or initialize an empty object
    let portfolios = {};
    if (fs.existsSync(portfolioFilePath)) {
      const data = fs.readFileSync(portfolioFilePath, "utf8");
      portfolios = JSON.parse(data);
    }

    // Update the portfolio for the given email
    portfolios[email] = portfolio;

    // Write the updated portfolios back to the file
    fs.writeFileSync(
      portfolioFilePath,
      JSON.stringify(portfolios, null, 2),
      "utf8"
    );
    console.log(`Portfolio saved for ${email}`);
  } catch (error) {
    console.error("Error saving portfolio:", error.message);
    throw error; // Re-throw the error for the caller to handle if necessary
  }
}

// Save preferences route
app.post("/save-preferences", authenticateToken, (req, res) => {
  const { email, ...preferences } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Initialize file with header if it doesn't exist
    if (!fs.existsSync(preferencesFile)) {
      writeCSV(preferencesFile, [], true);
    }

    const preferencesData = readCSV(preferencesFile);

    // Filter out existing data for the same email
    const updatedPreferences = preferencesData.filter(
      ([storedEmail]) => storedEmail !== email
    );

    // Add sanitized preferences
    const sanitizedRow = [
      email.trim(),
      preferences.familiar?.trim() || "",
      preferences.portfolioDrop?.trim() || "",
      preferences.riskInvestments?.trim() || "",
      preferences.volatility?.trim() || "",
      preferences.drawdown1?.trim() || "",
      preferences.drawdown2?.trim() || "",
      preferences.drawdown3?.trim() || "",
      preferences.investmentHorizon?.trim() || "",
      preferences.initialInvestment?.trim() || "",
      preferences.portfolioSize?.trim() || "",
    ];

    updatedPreferences.push(sanitizedRow);

    // Write updated data back to the CSV without duplicating the header
    writeCSV(preferencesFile, updatedPreferences, false);

    generatePortfolio(sanitizedRow);

    res.status(200).send("Preferences saved successfully");
  } catch (error) {
    console.error("Error saving preferences:", error);
    res.status(500).json({ message: "Failed to save preferences." });
  }
});

app.delete("/delete-portfolio", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.query.email; // Allow fetching for a specific email

    // Step 1: Handle Portfolio Deletion
    if (fs.existsSync(portfolioFilePath)) {
      const portfoliosData = JSON.parse(
        fs.readFileSync(portfolioFilePath, "utf8")
      );

      if (portfoliosData[userEmail]) {
        delete portfoliosData[userEmail];
        fs.writeFileSync(
          portfolioFilePath,
          JSON.stringify(portfoliosData, null, 2)
        );
      } else {
        return res
          .status(404)
          .json({ message: "Portfolio not found for the user" });
      }
    } else {
      return res.status(404).json({ message: "No portfolios found" });
    }

    // Step 2: Handle User Preferences Deletion
    if (fs.existsSync(preferencesFile)) {
      const preferencesData = [];
      const headers = [];

      // Read the CSV file and filter out the user
      const preferencesStream = fs
        .createReadStream(preferencesFile)
        .pipe(csvParser());

      for await (const row of preferencesStream) {
        if (headers.length === 0) {
          headers.push(...Object.keys(row)); // Store headers
        }
        if (row.Email !== userEmail) {
          preferencesData.push(row); // Store only non-deleted users
        }
      }

      // Write back the filtered data with headers
      if (preferencesData.length > 0) {
        const csvContent = parse(preferencesData, { fields: headers }); // json2csv
        fs.writeFileSync(preferencesFile, csvContent, "utf8");
      } else {
        fs.writeFileSync(preferencesFile, headers.join(",") + "\n", "utf8"); // Keep just the header if empty
      }
    } else {
      console.warn("User preferences file not found");
    }

    res
      .status(200)
      .json({ message: "Portfolio and preferences deleted successfully" });
  } catch (error) {
    console.error("Error deleting portfolio or preferences:", error);
    res
      .status(500)
      .json({ message: "Failed to delete portfolio or preferences" });
  }
});

app.get("/get-portfolio", authenticateToken, (req, res) => {
  try {
    const requestedEmail = req.query.email; // Allow fetching for a specific email
    console.log(`Fetching portfolio for: ${requestedEmail}`);

    if (!requestedEmail) {
      return res
        .status(400)
        .json({ message: "Email query parameter is required." });
    }

    // Check if the portfolios file exists
    if (!fs.existsSync(portfolioFilePath)) {
      return res.status(404).json({ message: "Portfolio file not found" });
    }

    // Read and parse the portfolios file
    const portfoliosData = JSON.parse(
      fs.readFileSync(portfolioFilePath, "utf8")
    );

    // Check if the requested user's portfolio exists
    if (!portfoliosData[requestedEmail]) {
      return res
        .status(404)
        .json({ message: `Portfolio not found for ${requestedEmail}` });
    }

    // Return the requested user's portfolio
    return res.status(200).json(portfoliosData[requestedEmail]);
  } catch (error) {
    console.error("Error retrieving portfolio:", error.message);
    return res.status(500).json({ message: "Failed to retrieve portfolio" });
  }
});

app.get("/user-preferences", authenticateToken, (req, res) => {
  let userEmail = req.query.email || req.user.email; // Use query param or authenticated user email

  try {
    // Check if the preferences file exists
    if (!fs.existsSync(preferencesFile)) {
      return res.status(404).json({ message: "Preferences file not found" });
    }

    // Read and parse the preferences file
    const preferencesData = fs
      .readFileSync(preferencesFile, "utf8")
      .trim()
      .split("\n")
      .map((line) => line.split(","));

    // Extract the header and rows
    const [header, ...rows] = preferencesData;

    // Find the user's row based on the email
    const userRow = rows.find((row) => row[0].trim() === userEmail);

    if (!userRow) {
      return res
        .status(404)
        .json({ message: "User preferences not found for this email" });
    }

    // Map the row to the header to form a JSON object
    const userPreferences = {};
    header.forEach((key, index) => {
      userPreferences[key.trim()] = userRow[index]?.trim() || "";
    });

    return res.status(200).json(userPreferences);
  } catch (error) {
    console.error("Error retrieving user preferences:", error.message);
    return res
      .status(500)
      .json({ message: "Failed to retrieve user preferences" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
