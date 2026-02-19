import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://localhost:8000/api/staff/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const handleAction = async (id, status, customMessage) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ${customMessage} đơn #${id} không?`)) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:8000/api/staff/orders/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Thành công!");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi xử lý!");
    }
  };

  // Hàm gọi API tạo mã VNPAY
  const handleVnpayPayment = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:8000/api/staff/orders/${id}/vnpay`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Mở trang VNPAY ở một tab mới cho khách quét
        window.open(res.data.payment_url, "_blank");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo link thanh toán!");
    }
  };

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-primary mb-0">📋 QUẢN LÝ ĐƠN HÀNG VÀ BẾP</h3>
        <button className="btn btn-outline-secondary btn-sm fw-bold" onClick={fetchOrders}>
          🔄 Làm mới
        </button>
      </div>
      
      <div className="row">
        {sortedOrders.length === 0 ? (
          <p>đang tải đơn...</p>
        ) : (
          sortedOrders.map((order) => (
            <div className="col-md-6 border-bottom py-3" key={order.id}>
              {/* HEADER ĐƠN HÀNG */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0 fw-bold">
                  #{order.id} -{" "}
                  <span className="text-danger">
                    {Number(order.final_price).toLocaleString()}đ
                  </span>
                </h5>
                <span
                  className={`badge ${order.status === "paid" ? "bg-success" : order.status === "cancelled" ? "bg-danger" : "bg-warning text-dark"}`}
                >
                  {order.status === "paid" ? "ĐÃ THANH TOÁN" : "CHỜ THU TIỀN"}
                </span>
              </div>
              <p className="small mb-1">
                <b>Khách:</b>{" "}
                {order.customer ? order.customer.full_name : "Khách vãng lai"}
                {!order.staff_id && (
                  <span className="ms-2 text-danger fw-bold">(ĐƠN MỚI!)</span>
                )}
              </p>
              <p className="small text-muted mb-2">
                <b>Thời gian:</b>{" "}
                {new Date(order.created_at).toLocaleString("vi-VN")} <br />
                <b>Loại:</b> {order.type} | <b>Thanh toán:</b>{" "}
                {order.payment_method === "vnpay" ? "VNPAY" : "TIỀN MẶT"}
              </p>

              {/* NÚT XEM CHI TIẾT */}
              <button
                className="btn btn-sm btn-outline-secondary mb-3 w-100 fw-medium"
                onClick={() =>
                  setExpandedOrder(expandedOrder === order.id ? null : order.id)
                }
              >
                {expandedOrder === order.id
                  ? "▲ Ẩn chi tiết hóa đơn"
                  : "▼ Xem chi tiết hóa đơn"}
              </button>

              {/* BẢNG CHI TIẾT */}
              {expandedOrder === order.id && (
                <div className="bg-white border rounded p-3 mb-3 shadow-sm">
                  <h6 className="fw-bold border-bottom pb-2">
                    Danh sách món ăn
                  </h6>
                  <ul className="list-group list-group-flush mb-2">
                    {order.order_details &&
                      order.order_details.map((detail) => (
                        <li
                          key={detail.id}
                          className="list-group-item px-0 py-1 d-flex justify-content-between small border-0"
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

                  <div className="border-top pt-2 mt-2 small">
                    <div className="d-flex justify-content-between text-muted">
                      <span>Tạm tính:</span>
                      <span>{Number(order.temp_price).toLocaleString()}đ</span>
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
                    <div className="mt-2 pt-2 border-top small">
                      <b>📍 Giao đến:</b> {order.deli_address}
                    </div>
                  )}
                  {order.note && (
                    <div className="mt-1 small text-danger">
                      <b>📝 Ghi chú:</b> {order.note}
                    </div>
                  )}
                </div>
              )}

              {/* CÁC NÚT HÀNH ĐỘNG */}
              <div className="d-flex gap-2">
                {/* HIỂN THỊ 3 NÚT NẾU CHƯA THANH TOÁN */}
                {order.status === "pending" && (
                  <>
                    <button
                      className="btn btn-sm btn-success fw-bold flex-fill"
                      onClick={() => handleAction(order.id, "paid", "Xác nhận ĐÃ THU TIỀN MẶT và Hoàn thành")}
                    >
                      💵 Tiền Mặt
                    </button>
                    
                    <button
                      className="btn btn-sm btn-primary fw-bold flex-fill d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: "#005baa", borderColor: "#005baa" }}
                      onClick={() => handleVnpayPayment(order.id)}
                    >
                      <img
                        src="http://localhost:8000/images/vnpay_logo.png"
                        alt="vnpay"
                        height="20"
                        className="me-1"
                      />
                      VNPAY
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger fw-bold flex-fill"
                      onClick={() => handleAction(order.id, "cancelled", "HỦY")}
                    >
                      ❌ Hủy
                    </button>
                  </>
                )}

                {/* Nút cho đơn VNPAY Đã trả tiền, chờ làm món */}
                {order.status === "paid" && !order.staff_id && (
                  <button
                    className="btn btn-sm btn-info fw-bold flex-fill"
                    onClick={() => handleAction(order.id, "paid", "Xác nhận ĐÃ LÀM XONG MÓN")}
                  >
                    ✅ Hoàn thành đơn
                  </button>
                )}

                {/* Nút Hoàn tiền */}
                {order.status === "paid" && (
                  <button
                    className="btn btn-sm btn-danger fw-bold flex-fill"
                    onClick={() => handleAction(order.id, "refunded", "HOÀN TIỀN & Hủy")}
                  >
                    💸 Hoàn tiền & Hủy
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffOrders;