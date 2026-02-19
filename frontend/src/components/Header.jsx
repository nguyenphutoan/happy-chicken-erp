import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Header = () => {
    const navigate = useNavigate();
    
    // Lấy thông tin user từ localStorage
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    const handleLogout = () => {
        localStorage.clear(); // Xóa sạch token và thông tin user
        navigate('/login');
    };

    const { getCartCount } = useCart();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
            <div className="container">
                <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
                    <img src="/logo.png" alt="logo" height="30" width="30" className="me-2 rounded-circle" />
                    Happy Chicken
                </Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/">Trang chủ</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/products">Sản phẩm</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/promotions">Khuyến mãi</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink className="nav-link" to="/about">Về chúng tôi</NavLink>
                        </li>
                    </ul>
                    <div className="d-flex align-items-center">
                        {user ? (
                            <div className="dropdown">
                                <button className="btn btn-warning dropdown-toggle fw-bold" type="button" data-bs-toggle="dropdown">
                                    Chào, {user.full_name || user.username}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><Link className="dropdown-item fw-medium" to="/profile">Thông tin cá nhân</Link></li>
                                    <li><Link className="dropdown-item fw-medium" to="/my-orders">Đơn hàng của tôi</Link></li>
                                    {user.role === 'manager' && <li><Link className="dropdown-item" to="/manager/dashboard">Quản lý</Link></li>}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={handleLogout}>Đăng xuất</button></li>
                                </ul>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-outline-warning fw-bold">Đăng nhập</Link>
                        )}
                        <Link to="/cart" className="btn btn-light ms-2 shadow-sm position-relative">
                            🛒
                            {getCartCount() > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    {getCartCount()}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;