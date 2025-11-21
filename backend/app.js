const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/db");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/v1/api/auth", require("./routes/auth.routes"));
app.use("/v1/api/users", require("./routes/user.routes"));
app.use("/v1/api/categories", require("./routes/categories.routes"));
app.use("/v1/api/products", require("./routes/product.routes"));
app.use("/v1/api/inventories", require("./routes/inventory.routes"));
app.use("/v1/api/productTypes", require("./routes/productType.routes"));
app.use("/v1/api/orders", require("./routes/orders.routes"));
app.use("/v1/api/safety-checklists", require("./routes/checklist.routes"));
app.use("/v1/api/customers", require("./routes/customer.routes"));
app.use("/v1/api/swms", require("./routes/swms.routes"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
