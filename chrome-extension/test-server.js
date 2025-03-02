// Simple test server to help with testing the extension
// This is useful if you want to test the extension without running your full application

const http = require("http");

const PORT = 3000;

// Create a simple server that responds to POST requests to /api/notes
const server = http.createServer((req, res) => {
  // Set CORS headers to allow requests from the extension
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only handle requests to /api/notes
  if (req.url === "/api/notes") {
    if (req.method === "POST") {
      let body = "";

      // Collect the request body
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      // Process the request
      req.on("end", () => {
        try {
          const data = JSON.parse(body);

          if (!data.content) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Content is required" }));
            return;
          }

          // Log the note content
          console.log("Received note:", data.content);

          // Return a success response
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              id: Date.now().toString(),
              content: data.content,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          );
        } catch (error) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    } else {
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log("Ready to receive notes at http://localhost:3000/api/notes");
  console.log("Press Ctrl+C to stop the server");
});
