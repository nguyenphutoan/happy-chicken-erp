import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
    // 1. Lấy thông tin người dùng đang đăng nhập
    const user = JSON.parse(localStorage.getItem('user'));

    // 2. Nếu chưa đăng nhập -> Đuổi về trang Đăng nhập
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Nếu chức vụ (role) không nằm trong danh sách cho phép -> Đuổi về trang chủ
    if (!allowedRoles.includes(user.role)) {
        alert('⛔ BẠN KHÔNG CÓ QUYỀN TRUY CẬP TRANG NÀY!');
        return <Navigate to="/" replace />;
    }

    // 4. Nếu hợp lệ -> Mở cửa cho vào xem giao diện (children)
    return children;
};

export default ProtectedRoute;