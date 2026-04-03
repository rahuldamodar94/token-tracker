import app from "./app";
import { config } from "@token-tracker/shared";

const PORT = config.PORT || 4000;

// Start the server
app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
