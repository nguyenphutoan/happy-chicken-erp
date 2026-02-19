import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import StaffNavbar from "./components/StaffNavbar";
import ManagerNavbar from './components/ManagerNavbar';
import ProtectedRoute from './components/ProtectedRoute'; 

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Promotions from "./pages/Promotions";
import About from "./pages/About";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentResult from "./pages/PaymentResult";
import MyOrders from "./pages/MyOrders";
import Profile from "./pages/Profile";
import StaffPOS from "./pages/StaffPOS";
import StaffOrders from "./pages/StaffOrders";
import StaffHistory from "./pages/StaffHistory";
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerOrders from './pages/ManagerOrders';
import ManagerInventory from './pages/ManagerInventory';
import ManagerProducts from './pages/ManagerProducts';
import ManagerPromotions from './pages/ManagerPromotions';
import ManagerStaff from './pages/ManagerStaff';
import Survey from "./pages/Survey";

const AppLayout = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

 //Manager cũng sẽ dùng được thanh Navbar của Staff khi vào trang POS
  const isStaffRoute = location.pathname.startsWith('/staff') || 
    (location.pathname.startsWith('/payment-result') && ['staff', 'manager'].includes(user.role));
  
  const isManagerRoute = location.pathname.startsWith('/manager');

  // Logic hiển thị Navbar tùy theo loại route
  const renderNavbar = () => {
    if (isManagerRoute) return <ManagerNavbar />;
    if (isStaffRoute) return <StaffNavbar />;
    return <Header />;
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {renderNavbar()}

      <main className="flex-grow-1 bg-light">
        <Routes>
          {/* TRANG KHÁCH HÀNG (Ai cũng vào được) */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/survey" element={<Survey />} />

          {/* 2. TRANG NHÂN VIÊN */}
          <Route path="/staff/pos" element={
            <ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}>
              <StaffPOS />
            </ProtectedRoute>
          } />
          
          <Route path="/staff/orders" element={
            <ProtectedRoute allowedRoles={['staff', 'manager']}>
              <StaffOrders />
            </ProtectedRoute>
          } />
          
          <Route path="/staff/history" element={
            <ProtectedRoute allowedRoles={['staff', 'manager']}>
              <StaffHistory />
            </ProtectedRoute>
          } />

          {/* 3. TRANG QUẢN LÝ (Chỉ Manager mới được vào) */}
          <Route path="/manager/dashboard" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager/orders" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerOrders />
            </ProtectedRoute>
          } />
          <Route path="/manager/profile" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/manager/inventory" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerInventory />
            </ProtectedRoute>
          } />
          <Route path="/manager/products" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerProducts />
            </ProtectedRoute>
          } />
          <Route path="/manager/promotions" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerPromotions />
            </ProtectedRoute>
          } />
          <Route path="/manager/staff" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']}>
              <ManagerStaff />
            </ProtectedRoute>
          } />

        </Routes>
      </main>

      {/* CHỈ HIỆN FOOTER CHO KHÁCH HÀNG */}
      {!isStaffRoute && !isManagerRoute && <Footer />}
    </div>
  );
};

// Khởi tạo App
function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;