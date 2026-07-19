import app from "./app.js";
import { connectDB } from "./lib/db.js";

const PORT = process.env.PORT || 3000;

// Listen on the given port for a connection request
app.listen(PORT, () => {
  connectDB();
});
