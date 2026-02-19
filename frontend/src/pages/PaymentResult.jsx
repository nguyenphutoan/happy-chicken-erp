import { Link, useLocation } from 'react-router-dom';

const PaymentResult = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get('status');
    const orderId = queryParams.get('orderId');

    const isSuccess = status === 'success';

    // 1. Lấy thông tin user đang đăng nhập
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // 2. Xác định đường dẫn và tên nút bấm dựa trên Role
    let returnLink = "/";
    let returnText = "VỀ TRANG CHỦ";

    // Nếu là nhân viên hoặc quản lý -> Trả về màn hình máy POS
    if (['staff', 'manager'].includes(user.role)) {
        returnLink = "/staff/pos";
        returnText = "VỀ TRANG BÁN HÀNG (POS)";
    }

    return (
        <div className="container py-5 text-center">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow border-0 p-5">
                        <div className="mb-4">
                            {isSuccess ? (
                                <h1 className="text-success" style={{ fontSize: '4rem' }}>✅</h1>
                            ) : (
                                <h1 className="text-danger" style={{ fontSize: '4rem' }}>❌</h1>
                            )}
                        </div>
                        <h2 className="fw-bold mb-3">{isSuccess ? 'Thanh Toán Thành Công!' : 'Thanh Toán Thất Bại'}</h2>
                        <p className="text-muted">
                            {isSuccess 
                                ? `Cảm ơn bạn. Mã hóa đơn của giao dịch này là #${orderId || ''}.` 
                                : 'Đã có lỗi xảy ra trong quá trình thanh toán hoặc giao dịch đã bị hủy.'}
                        </p>
                        
                        {/* 3. Render nút bấm động */}
                        <div className="mt-4">
                            <Link to={returnLink} className="btn btn-warning fw-bold px-4 py-2 text-dark shadow-sm">
                                {returnText}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;