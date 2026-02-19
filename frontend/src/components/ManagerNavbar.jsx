import { Link, useNavigate, useLocation } from 'react-router-dom';

const ManagerNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getLinkClass = (path) => {
        return location.pathname === path ? 'nav-link active fw-bold text-warning' : 'nav-link fw-medium text-white';
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm" style={{ backgroundColor: '#1a202c', zIndex: 1050 }}>
            <div className="container-fluid px-3">
                <Link className="navbar-brand d-flex align-items-center fw-bold text-white me-4" to="/manager/dashboard">
                    <img src="/logo.png" alt="HappyChicken" height="35" className="me-2 rounded-circle bg-white" />
                    MANAGER SYSTEM
                </Link>
                
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item"><Link className={getLinkClass('/manager/dashboard')} to="/manager/dashboard">📊 Dashboard</Link></li>
                        <li className="nav-item"><Link className={getLinkClass('/manager/orders')} to="/manager/orders">🧾 Quản lý Hóa đơn</Link></li>
                        <li className="nav-item"><Link className={getLinkClass('/manager/inventory')} to="/manager/inventory">📦 Quản lý Kho</Link></li>
                        <li className="nav-item"><Link className={getLinkClass('/manager/products')} to="/manager/products">🍔 Sản phẩm</Link></li>
                        <li className="nav-item"><Link className={getLinkClass('/manager/promotions')} to="/manager/promotions">🎁 Khuyến mãi</Link></li>
                        <li className="nav-item"><Link className={getLinkClass('/manager/staff')} to="/manager/staff">👥 Nhân viên</Link></li>
                    </ul>
                    
                    <div className="d-flex align-items-center gap-3">
                        <Link to="/manager/profile" className="text-light text-decoration-none fw-medium d-flex align-items-center">
                            <span className="me-2">👋 Chào, {user.full_name || 'Manager'}</span>
                        </Link>
                        <button onClick={handleLogout} className="btn btn-outline-danger btn-sm fw-bold">🚪 Đăng xuất</button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default ManagerNavbar;