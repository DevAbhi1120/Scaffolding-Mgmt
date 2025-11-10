import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import UserList from "./pages/Users/UserList"
import AddUser from "./pages/Users/AddUser"
import EditProfile from "./pages/Users/EditProfile"
import LoginIn from "./pages/Login"
import AddCategory from "./pages/Category/AddCategory";
import CategoryList from "./pages/Category/CategoryList";
import EditCategory from "./pages/Category/EditCategory";
import ProductList from "./pages/Products/ListProducts";
import AddProduct from "./pages/Products/AddProduct";
import EditProduct from "./pages/Products/EditProducts";
import AddInventory from "./pages/Inventory/AddInventory";
import InventoryList from "./pages/Inventory/InventoryList";
import EditInventory from "./pages/Inventory/EditInventory";
import AddProductType from "./pages/ProductType/AddProductType";
import ProductTypeList from "./pages/ProductType/ProductTypeList";
import EditProductType from "./pages/ProductType/EditProductType";
import AddOrder from "./pages/Orders/AddOrder";
import OrderList from "./pages/Orders/OrderList";
import EditOrder from "./pages/Orders/EditOrder";
import ViewOrder from "./pages/Orders/ViewOrder";
import AddSafetyChecklist from "./pages/Checklist/AddSafetyChecklist";
import SafetyChecklistList from "./pages/Checklist/SafetyChecklistList";
import EditSafetyChecklist from "./pages/Checklist/EditSafetyChecklist";


export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            <Route index path="/users" element={<UserList />} />
            <Route index path="/add-user" element={<AddUser />} />
            <Route path="/edit-user/:id" element={<EditProfile />} />

            <Route path="/add-category" element={<AddCategory />} />
            <Route path="/category-list" element={<CategoryList />} />
            <Route path="/edit-category/:id" element={<EditCategory />} />

            <Route path="/product-list" element={<ProductList />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />

            <Route path="/add-inventory" element={<AddInventory />} />
            <Route path="/inventory-list" element={<InventoryList />} />
            <Route path="/edit-inventory/:id" element={<EditInventory />} />

            <Route path="/add-product-type" element={<AddProductType />} />
            <Route path="/product-type-list" element={<ProductTypeList />} />
            <Route path="/edit-product-type/:id" element={<EditProductType />} />

            <Route path="/add-order" element={<AddOrder />} />
            <Route path="/order-list" element={<OrderList />} />
            <Route path="/edit-order/:id" element={<EditOrder />} />
            <Route path="/view-order/:id" element={<ViewOrder />} />

            <Route path="/add-safety-checklists" element={<AddSafetyChecklist />} />
            <Route path="/safety-checklists" element={<SafetyChecklistList />} />
            <Route path="/edit-safety-checklists/:id" element={<EditSafetyChecklist />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<LoginIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
