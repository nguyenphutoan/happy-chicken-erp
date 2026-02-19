import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("pending"); // 'pending' hoặc 'paid'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      try {
        const res = await axios.get("http://localhost:8000/api/my-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (error) {
        console.error("Lỗi tải đơn hàng", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  const handleRetryPayment = async (orderId, method) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `http://localhost:8000/api/orders/${orderId}/retry-payment`,
        { payment_method: method },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        if (method === "vnpay") {
          window.location.href = res.data.payment_url;
        } else {
          alert(res.data.message);
          window.location.reload(); // Tải lại trang để cập nhật trạng thái nếu cần
        }
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    }
  };

  const filteredOrders = orders.filter((o) => o.status === tab);

  if (loading)
    return <div className="text-center py-5">Đang tải dữ liệu...</div>;

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4" style={{ color: "#fd7e14" }}>
        Đơn Hàng Của Tôi
      </h2>

      {/* Thanh Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item cursor-pointer">
          <a
            className={`nav-link fw-bold ${tab === "pending" ? "active text-warning border-warning border-bottom-0" : "text-muted"}`}
            onClick={() => setTab("pending")}
          >
            Chờ thanh toán / Xử lý
          </a>
        </li>
        <li className="nav-item cursor-pointer">
          <a
            className={`nav-link fw-bold ${tab === "paid" ? "active text-success border-success border-bottom-0" : "text-muted"}`}
            onClick={() => setTab("paid")}
          >
            Đã thanh toán / Hoàn thành
          </a>
        </li>
      </ul>

      {/* Danh sách đơn hàng */}
      {filteredOrders.length === 0 ? (
        <div className="text-center text-muted py-5">
          Chưa có đơn hàng nào ở mục này.
        </div>
      ) : (
        filteredOrders.map((order) => (
          <div key={order.id} className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <span className="fw-bold text-secondary">
                Mã đơn: #{order.id}
              </span>
              <span className="text-muted small">
                Ngày đặt: {new Date(order.created_at).toLocaleString("vi-VN")}
              </span>
            </div>
            <div className="card-body">
              {/* Chi tiết món ăn */}
              {order.order_details.map((detail) => (
                <div
                  key={detail.id}
                  className="d-flex justify-content-between mb-2 pb-2 border-bottom"
                >
                  <div className="d-flex align-items-center">
                    <img
                      src={detail.item.img_url}
                      alt={detail.item.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                      }}
                      className="rounded me-3"
                    />
                    <div>
                      <h6 className="mb-0 fw-bold">{detail.item.name}</h6>
                      <small className="text-muted">x{detail.quantity}</small>
                    </div>
                  </div>
                  <span className="fw-medium">
                    {Number(detail.unit_price).toLocaleString()}đ
                  </span>
                </div>
              ))}

              {/* Tổng tiền & Nút Hành động */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span className="text-muted d-block small">Tổng tiền:</span>
                  <span className="fw-bold fs-5 text-danger">
                    {Number(order.final_price).toLocaleString()}đ
                  </span>
                </div>

                {tab === "pending" && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-dark btn-sm fw-bold shadow-sm"
                      onClick={() => handleRetryPayment(order.id, "cod")}
                    >
                      💵 Đổi sang COD
                    </button>
                    <button
                      className="btn btn-primary btn-sm fw-bold shadow-sm"
                      style={{ backgroundColor: "#005baa" }}
                      onClick={() => handleRetryPayment(order.id, "vnpay")}
                    >
                      💳 Thanh toán lại (VNPAY)
                    </button>
                  </div>
                )}
                {tab === "paid" && (
                  <span className="badge bg-success py-2 px-3 shadow-sm">
                    ✅ Đã thanh toán
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
