import { Link, useNavigate, useLocation } from 'react-router-dom';

const StaffNavbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark shadow-sm sticky-top" style={{ backgroundColor: '#005baa', zIndex: 1050 }}>
            <div className="container-fluid px-4">
                <Link className="navbar-brand d-flex align-items-center fw-bold text-white text-decoration-none" to="/staff/pos">
                    <img src="/logo.png" alt="HappyChicken" height="40" className="me-2 rounded-circle bg-white" />
                    HappyChicken POS
                </Link>
                
                <div className="d-flex align-items-center gap-2">
                    <span className="text-light fw-medium d-none d-md-block me-2">
                        Nhân viên: {user.full_name || 'Nhân viên'}
                    </span>
                    <Link 
                        to="/staff/pos" 
                        className={`btn btn-sm fw-bold ${location.pathname === '/staff/pos' ? 'btn-light text-primary shadow-sm' : 'btn-outline-light'}`}
                    >
                        💻 Bán Hàng
                    </Link>
                    <Link 
                        to="/staff/orders" 
                        className={`btn btn-sm fw-bold ${location.pathname === '/staff/orders' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-warning text-light'}`}
                    >
                        📋 Chờ xử lý
                    </Link>
                    <Link 
                        to="/staff/history" 
                        className={`btn btn-sm fw-bold ${location.pathname === '/staff/history' ? 'btn-info text-dark shadow-sm' : 'btn-outline-info text-light'}`}
                    >
                        🕒 Lịch Sử Đơn
                    </Link>
                    <button onClick={handleLogout} className="btn btn-danger btn-sm fw-bold shadow-sm">🚪 Đăng xuất</button>
                </div>
            </div>
        </nav>
    );
};

export default StaffNavbar;