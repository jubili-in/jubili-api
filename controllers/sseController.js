// sseController.js
const clients = new Map(); // Store active SSE connections by userId

// Subscribe endpoint for frontend
function subscribeToOrderEvents (req, res) {
  const userId = req.query.userId;
  if (!userId) return res.status(400).send("Missing userId");

  // Set headers for SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Send a comment to keep connection alive
  res.write(`: connected\n\n`);

  // Save connection
  clients.set(userId, res);

  // Remove connection when client closes
  req.on("close", () => {
    clients.delete(userId);
  });
};

// Helper to push events to a specific user
function sendOrderEvent(userId, event) {
  const client = clients.get(userId);
  if (client) {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  }
};


module.exports = { 
    subscribeToOrderEvents, 
    sendOrderEvent
}