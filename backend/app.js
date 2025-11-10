
const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./config/db'); 

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/inventories', require('./routes/inventory.routes'));
app.use('/api/productTypes', require('./routes/productType.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/safety-checklists', require('./routes/checklist.routes'));




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));