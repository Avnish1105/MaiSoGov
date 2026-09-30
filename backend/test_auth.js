const http = require("http");
const jwt = require("jsonwebtoken");

const API_BASE = "http://localhost:5000/api/auth";

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==========================================");
  console.log("STARTING AUTOMATED AUTHENTICATION TESTS");
  console.log("==========================================\n");

  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@example.com`;
  const testName = `Test User ${timestamp}`;
  const testPassword = "Password123!";

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`[FAIL] ${message}`);
      testFailed++;
    }
  }

  try {
    // Test 1: Validation - Missing fields in registration
    console.log("--- Test 1: Missing required fields on Register ---");
    const regResMissing = await makeRequest("POST", "/register", { name: "", email: "", password: "" });
    assert(regResMissing.status === 400, "Should return 400 Bad Request for missing fields");

    // Test 2: Validation - Invalid email format
    console.log("--- Test 2: Invalid email format on Register ---");
    const regResInvalidEmail = await makeRequest("POST", "/register", {
      name: testName,
      email: "not-an-email",
      password: testPassword,
    });
    assert(regResInvalidEmail.status === 400, "Should return 400 Bad Request for invalid email format");

    // Test 3: Validation - Short password
    console.log("--- Test 3: Short password on Register ---");
    const regResShortPass = await makeRequest("POST", "/register", {
      name: testName,
      email: testEmail,
      password: "123",
    });
    assert(regResShortPass.status === 400, "Should return 400 Bad Request for password < 6 chars");

    // Test 4: Successful Registration
    console.log("--- Test 4: Valid Registration ---");
    const regRes = await makeRequest("POST", "/register", {
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    console.log("Registration Response:", regRes.status, regRes.body);
    assert(regRes.status === 201, "Should return 201 Created on successful registration");
    assert(regRes.body.token !== undefined, "Should return JWT token in registration response");
    assert(regRes.body.user && regRes.body.user.name === testName, "Should return user object with name");

    if (!regRes.body.token) {
      console.error("No token returned, stopping test run.");
      return;
    }

    // Verify JWT Payload for Registration Token
    const regJwtPayload = jwt.decode(regRes.body.token);
    console.log("JWT Payload from Register:", regJwtPayload);
    const jwtKeys = Object.keys(regJwtPayload).filter((k) => k !== "iat" && k !== "exp");
    assert(
      jwtKeys.length === 2 && jwtKeys.includes("id") && jwtKeys.includes("name"),
      "JWT payload must contain ONLY 'id' and 'name' (excluding iat/exp)"
    );
    assert(regJwtPayload.password === undefined, "JWT payload must NOT contain password");
    assert(regJwtPayload.email === undefined, "JWT payload must NOT contain email");

    // Test 5: Duplicate Email Registration
    console.log("--- Test 5: Prevent Duplicate Email Registration ---");
    const regResDup = await makeRequest("POST", "/register", {
      name: testName,
      email: testEmail,
      password: testPassword,
    });
    assert(regResDup.status === 400, "Should return 400 Bad Request for duplicate email");

    // Test 6: Login with wrong password
    console.log("--- Test 6: Login with Wrong Password ---");
    const loginResWrongPass = await makeRequest("POST", "/login", {
      email: testEmail,
      password: "WrongPassword123",
    });
    assert(loginResWrongPass.status === 401, "Should return 401 Unauthorized for wrong password");

    // Test 7: Successful Login
    console.log("--- Test 7: Successful Login ---");
    const loginRes = await makeRequest("POST", "/login", {
      email: testEmail,
      password: testPassword,
    });
    assert(loginRes.status === 200, "Should return 200 OK on valid login");
    assert(loginRes.body.token !== undefined, "Should return JWT token on login");

    const loginJwtPayload = jwt.decode(loginRes.body.token);
    console.log("JWT Payload from Login:", loginJwtPayload);
    const loginJwtKeys = Object.keys(loginJwtPayload).filter((k) => k !== "iat" && k !== "exp");
    assert(
      loginJwtKeys.length === 2 && loginJwtKeys.includes("id") && loginJwtKeys.includes("name"),
      "Login JWT payload must contain ONLY 'id' and 'name'"
    );

    const token = loginRes.body.token;

    // Test 8: Protected Route - GET /api/auth/me with valid token
    console.log("--- Test 8: Protected GET /api/auth/me with valid Bearer token ---");
    const meRes = await makeRequest("GET", "/me", null, {
      Authorization: `Bearer ${token}`,
    });
    assert(meRes.status === 200, "Should return 200 OK for valid token on GET /api/auth/me");
    assert(meRes.body.id === regJwtPayload.id, "Returned id should match registered user id");
    assert(meRes.body.name === testName, "Returned name should match registered user name");

    // Test 9: Protected Route - Reject missing token
    console.log("--- Test 9: GET /api/auth/me without token ---");
    const meResNoToken = await makeRequest("GET", "/me");
    assert(meResNoToken.status === 401, "Should return 401 Unauthorized when Authorization header is missing");

    // Test 10: Protected Route - Reject invalid token
    console.log("--- Test 10: GET /api/auth/me with invalid token ---");
    const meResInvalidToken = await makeRequest("GET", "/me", null, {
      Authorization: "Bearer invalid.jwt.token",
    });
    assert(meResInvalidToken.status === 401, "Should return 401 Unauthorized for invalid token");

    console.log("\n==========================================");
    console.log(`TEST SUMMARY: ${testPassed} PASSED, ${testFailed} FAILED`);
    console.log("==========================================");

    process.exit(testFailed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runTests();
