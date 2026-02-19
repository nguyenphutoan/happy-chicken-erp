import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const StaffHistory = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lấy ngày hôm nay làm mặc định (Format: YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const fetchOrderHistory = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(
        `http://localhost:8000/api/staff/orders/history?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setOrders(res.data);
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Chạy lần đầu khi vào trang
  useEffect(() => {
    fetchOrderHistory();
  }, [fetchOrderHistory]);

  // Xử lý Hủy/Hoàn tiền
  const handleAction = async (id, status) => {
    const actionName =
      status === "paid"
        ? "Xác nhận Đã thanh toán"
        : status === "cancelled"
          ? "Hủy đơn hàng"
          : "Hoàn tiền";
    if (
      !window.confirm(`Bạn có chắc chắn muốn ${actionName} đơn #${id} không?`)
    )
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:8000/api/staff/orders/${id}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("Thành công!");
      fetchOrderHistory(); // Load lại danh sách sau khi sửa
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi xử lý!");
    }
  };

  return (
    <div className="container py-4">
      <h3 className="fw-bold mb-4 text-info text-dark">🕒 LỊCH SỬ ĐƠN HÀNG</h3>

      {/* THANH CÔNG CỤ LỌC NGÀY */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body d-flex align-items-end gap-3">
          <div>
            <label className="form-label small fw-bold text-muted mb-1">
              Từ ngày:
            </label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label small fw-bold text-muted mb-1">
              Đến ngày:
            </label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            className="btn btn-dark px-4 fw-bold"
            onClick={fetchOrderHistory}
            disabled={loading}
          >
            {loading ? "Đang tìm..." : "🔍 Lọc Hóa Đơn"}
          </button>
          <div className="ms-auto text-end">
            <span className="text-muted small">Tổng số: </span>
            <span className="fw-bold fs-5 text-primary">
              {orders.length} đơn
            </span>
          </div>
        </div>
      </div>

      {/* DANH SÁCH HÓA ĐƠN */}
      <div className="row">
        {orders.length === 0 ? (
          <p className="text-center text-muted">
            Không có đơn hàng nào trong khoảng thời gian này.
          </p>
        ) : (
          orders.map((order) => (
            <div className="col-md-6 mb-4" key={order.id}>
              <div className="card h-100 shadow-sm border-0 border-top border-4 border-info">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0 fw-bold">
                      #{order.id} -{" "}
                      <span className="text-danger">
                        {Number(order.final_price).toLocaleString()}đ
                      </span>
                    </h5>
                    <span
                      className={`badge ${order.status === "paid" ? "bg-success" : order.status === "cancelled" ? "bg-danger" : order.status === "refunded" ? "bg-secondary" : "bg-warning text-dark"}`}
                    >
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="small mb-1">
                    <b>👤 Khách:</b>{" "}
                    {order.customer
                      ? order.customer.full_name
                      : "Khách vãng lai"}
                    {order.staff_id ? (
                      <span className="ms-2 text-info">
                        (Staff ID: {order.staff_id})
                      </span>
                    ) : (
                      <span className="ms-2 text-danger fw-bold">(Online)</span>
                    )}
                  </p>
                  <p className="small text-muted mb-3">
                    <b>⏰ Thời gian:</b>{" "}
                    {new Date(order.created_at).toLocaleString("vi-VN")} <br />
                    <b>🏷️ Loại:</b> {order.type} | <b>💳 TT:</b>{" "}
                    {order.payment_method
                      ? order.payment_method.toUpperCase()
                      : order.status === "paid"
                        ? "VNPAY / ĐÃ THU"
                        : "TIỀN MẶT"}
                  </p>

                  {/* NÚT XEM CHI TIẾT */}
                  <button
                    className="btn btn-sm btn-outline-info text-dark mb-3 w-100 fw-medium"
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === order.id ? null : order.id,
                      )
                    }
                  >
                    {expandedOrder === order.id
                      ? "▲ Ẩn chi tiết"
                      : "▼ Xem chi tiết"}
                  </button>

                  {/* BẢNG CHI TIẾT (Collapse) */}
                  {expandedOrder === order.id && (
                    <div className="bg-light border rounded p-3 mb-3 small">
                      <h6 className="fw-bold border-bottom pb-2">
                        Danh sách món ăn
                      </h6>
                      <ul className="list-group list-group-flush mb-2">
                        {order.order_details &&
                          order.order_details.map((detail) => (
                            <li
                              key={detail.id}
                              className="list-group-item bg-transparent px-0 py-1 d-flex justify-content-between border-0"
                            >
                              <span>
                                {detail.quantity}x{" "}
                                {detail.item ? detail.item.name : "Sản phẩm"}
                              </span>
                              <span className="fw-medium">
                                {Number(
                                  detail.unit_price * detail.quantity,
                                ).toLocaleString()}
                                đ
                              </span>
                            </li>
                          ))}
                      </ul>

                      <div className="border-top pt-2 mt-2">
                        <div className="d-flex justify-content-between text-muted">
                          <span>Tạm tính:</span>
                          <span>
                            {Number(order.temp_price).toLocaleString()}đ
                          </span>
                        </div>
                        {order.temp_price - order.final_price > 0 && (
                          <div className="d-flex justify-content-between text-success">
                            <span>Giảm giá/Dùng điểm:</span>
                            <span>
                              -
                              {Number(
                                order.temp_price - order.final_price,
                              ).toLocaleString()}
                              đ
                            </span>
                          </div>
                        )}
                      </div>

                      {order.deli_address && (
                        <div className="mt-2 pt-2 border-top">
                          <b>📍 Giao đến:</b> {order.deli_address}
                        </div>
                      )}
                      {order.note && (
                        <div className="mt-1 text-danger">
                          <b>📝 Ghi chú:</b> {order.note}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CÁC NÚT HÀNH ĐỘNG (Ẩn nếu đã hủy/hoàn tiền) */}
                  {["pending", "paid"].includes(order.status) && (
                    <div className="d-flex gap-2">
                      {order.status === "pending" && (
                        <button
                          className="btn btn-sm btn-success fw-bold flex-fill"
                          onClick={() => handleAction(order.id, "paid")}
                        >
                          ✅ Thu Tiền
                        </button>
                      )}
                      {order.status === "pending" && (
                        <button
                          className="btn btn-sm btn-outline-danger fw-bold flex-fill"
                          onClick={() => handleAction(order.id, "cancelled")}
                        >
                          ❌ Hủy đơn
                        </button>
                      )}
                      {order.status === "paid" && (
                        <button
                          className="btn btn-sm btn-danger fw-bold flex-fill"
                          onClick={() => handleAction(order.id, "refunded")}
                        >
                          💸 Hoàn tiền
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffHistory;
