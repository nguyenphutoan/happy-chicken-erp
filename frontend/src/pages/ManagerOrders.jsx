import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ManagerOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // State quản lý Popup Modal
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Mặc định hiển thị ngày hôm nay
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    // Dùng lại API lọc lịch sử của Staff (rất tiện lợi)
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`http://localhost:8000/api/staff/orders/history?start_date=${startDate}&end_date=${endDate}`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(res.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách hóa đơn:', error);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => { 
        fetchOrders(); 
    }, [fetchOrders]);

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            <h3 className="fw-bold mb-4 text-dark">🧾 QUẢN LÝ HÓA ĐƠN</h3>
            
            {/* 1. THANH CÔNG CỤ LỌC */}
            <div className="card shadow-sm border-0 mb-4 bg-white">
                <div className="card-body d-flex flex-wrap align-items-end gap-3">
                    <div>
                        <label className="form-label small fw-bold text-muted mb-1">Từ ngày:</label>
                        <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="form-label small fw-bold text-muted mb-1">Đến ngày:</label>
                        <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    <button className="btn btn-dark px-4 fw-bold" onClick={fetchOrders} disabled={loading}>
                        {loading ? 'Đang tải...' : '🔍 Lọc Dữ Liệu'}
                    </button>
                    <div className="ms-auto text-end">
                        <span className="text-muted small">Tổng số hóa đơn: </span>
                        <span className="fw-bold fs-5 text-primary">{orders.length}</span>
                    </div>
                </div>
            </div>

            {/* 2. BẢNG DANH SÁCH HÓA ĐƠN (Dành cho Manager) */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0 table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th className="px-3">Mã Đơn</th>
                                <th>Thời Gian</th>
                                <th>Khách Hàng</th>
                                <th>Loại Đơn</th>
                                <th>Tổng Tiền</th>
                                <th>Trạng Thái</th>
                                <th className="text-center">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-4 text-muted">Không có dữ liệu trong thời gian này.</td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order.id}>
                                        <td className="px-3 fw-bold">#{order.id}</td>
                                        <td>{new Date(order.created_at).toLocaleString('vi-VN')}</td>
                                        <td>
                                            {order.customer ? order.customer.full_name : 'Khách vãng lai'}
                                            <br/>
                                            <small className="text-muted">{order.customer ? order.customer.phone : ''}</small>
                                        </td>
                                        <td>
                                            <span className="badge bg-secondary me-1">{order.type}</span>
                                        </td>
                                        <td className="fw-bold text-danger">{Number(order.final_price).toLocaleString()}đ</td>
                                        <td>
                                            <span className={`badge ${order.status === 'paid' ? 'bg-success' : order.status === 'cancelled' ? 'bg-danger' : order.status === 'refunded' ? 'bg-dark' : 'bg-warning text-dark'}`}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <button 
                                                className="btn btn-sm btn-primary fw-medium"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                👁️ Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. POPUP (MODAL) CHI TIẾT HÓA ĐƠN */}
            {selectedOrder && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title fw-bold">🧾 Chi tiết Hóa đơn #{selectedOrder.id}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedOrder(null)}></button>
                            </div>
                            
                            <div className="modal-body p-4 bg-light">
                                <div className="row mb-4">
                                    <div className="col-sm-6">
                                        <h6 className="fw-bold text-muted mb-2">Thông tin Khách hàng</h6>
                                        <p className="mb-1"><b>Tên:</b> {selectedOrder.customer?.full_name || 'Khách vãng lai'}</p>
                                        <p className="mb-1"><b>SĐT:</b> {selectedOrder.customer?.phone || 'N/A'}</p>
                                        {selectedOrder.deli_address && <p className="mb-0"><b>Giao đến:</b> {selectedOrder.deli_address}</p>}
                                    </div>
                                    <div className="col-sm-6 text-sm-end">
                                        <h6 className="fw-bold text-muted mb-2">Thông tin Đơn hàng</h6>
                                        <p className="mb-1"><b>Nhân viên tạo:</b> {selectedOrder.staff_id ? `Mã NV: ${selectedOrder.staff_id}` : <span className="text-danger fw-bold">Khách đặt Online</span>}</p>
                                        <p className="mb-1"><b>Ngày giờ:</b> {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</p>
                                        <p className="mb-0"><b>Trạng thái:</b> <span className="fw-bold text-uppercase text-primary">{selectedOrder.status}</span></p>
                                    </div>
                                </div>

                                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">Danh sách Món ăn</h6>
                                <table className="table table-sm table-borderless mb-4">
                                    <thead className="border-bottom">
                                        <tr className="text-muted small">
                                            <th>Tên món</th>
                                            <th className="text-center">SL</th>
                                            <th className="text-end">Đơn giá</th>
                                            <th className="text-end">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.order_details?.map(detail => (
                                            <tr key={detail.id} className="border-bottom">
                                                <td className="py-2">{detail.item?.name || 'Sản phẩm'}</td>
                                                <td className="py-2 text-center">{detail.quantity}</td>
                                                <td className="py-2 text-end">{Number(detail.unit_price).toLocaleString()}đ</td>
                                                <td className="py-2 text-end fw-medium">{Number(detail.unit_price * detail.quantity).toLocaleString()}đ</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="row justify-content-end">
                                    <div className="col-sm-6 col-md-5">
                                        <div className="d-flex justify-content-between mb-1 text-muted">
                                            <span>Tạm tính:</span>
                                            <span>{Number(selectedOrder.temp_price).toLocaleString()}đ</span>
                                        </div>
                                        {selectedOrder.temp_price - selectedOrder.final_price > 0 && (
                                            <div className="d-flex justify-content-between mb-2 text-success">
                                                <span>Giảm giá / Điểm:</span>
                                                <span>-{Number(selectedOrder.temp_price - selectedOrder.final_price).toLocaleString()}đ</span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between border-top pt-2 mt-2">
                                            <span className="fw-bold fs-5">TỔNG CỘNG:</span>
                                            <span className="fw-bold fs-5 text-danger">{Number(selectedOrder.final_price).toLocaleString()}đ</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.note && (
                                    <div className="mt-4 p-3 bg-white border rounded border-warning">
                                        <b className="text-warning">📝 Ghi chú của khách:</b> {selectedOrder.note}
                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer bg-white border-0">
                                <button type="button" className="btn btn-secondary px-4 fw-bold" onClick={() => setSelectedOrder(null)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerOrders;