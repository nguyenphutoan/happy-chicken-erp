import { Link } from 'react-router-dom';

const Survey = () => {
    return (
        <div className="container py-5 text-center d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <h1 className="display-1 mb-4">🚧</h1>
            <h2 className="fw-bold mb-3 text-dark">Tính Năng Đang Phát Triển</h2>
            <p className="text-muted mb-4 fs-5">
                Xin lỗi bạn, trang Khảo sát hiện tại đang trong quá trình xây dựng và hoàn thiện. <br />
                Vui lòng quay lại sau nhé. Cảm ơn bạn đã luôn ủng hộ Happy Chicken!
            </p>
            <Link to="/" className="btn btn-warning fw-bold px-4 py-2 text-dark shadow-sm">
                ⬅️ QUAY VỀ TRANG CHỦ
            </Link>
        </div>
    );
};

export default Survey;