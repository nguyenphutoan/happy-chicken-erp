import { useState, useEffect } from "react";
import axios from "axios";

const StaffPOS = () => {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [selectedPromo, setSelectedPromo] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [customer, setCustomer] = useState(null);
  const [pointsUsed, setPointsUsed] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [orderType, setOrderType] = useState("dine in");
  
  // 1. Thêm State để lưu Ghi chú
  const [note, setNote] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/items")
      .then((res) => setItems(res.data.data || res.data))
      .catch((err) => {
        console.error("Lỗi API lấy món ăn:", err);
        alert("Không thể tải danh sách món ăn, vui lòng kiểm tra lại Backend!");
      });

    axios
      .get("http://localhost:8000/api/promotions/valid")
      .then((res) => setPromotions(res.data))
      .catch((err) => console.error("Lỗi API lấy khuyến mãi:", err));
  }, []);


  const addToCart = (item) => {
    setCart((prev) => {
      const exist = prev.find((x) => x.id === item.id);
      if (exist)
        return prev.map((x) =>
          x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x,
        );
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(cart.filter((x) => x.id !== id));

  const handleSearchCustomer = async () => {
    if (!searchQuery) return;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:8000/api/staff/customer/search?q=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data) setCustomer(res.data);
      else {
        alert("Không tìm thấy khách hàng!");
        setCustomer(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tempPrice = cart.reduce((a, c) => a + c.price * c.quantity, 0);

  if (selectedPromo) {
        const stillEligible = selectedPromo.type === 'required_product'
            ? cart.some(item => item.id === selectedPromo.required_product_id)
            : tempPrice >= (selectedPromo.min_order_value || 0);
        
        if (!stillEligible) {
            setSelectedPromo(null); 
        }
    }

  let promoDiscount = 0;
  if (selectedPromo && tempPrice >= (selectedPromo.min_order_value || 0)) {
    promoDiscount =
      selectedPromo.discount_type === "percentage"
        ? Math.min(
            (tempPrice * selectedPromo.percentage_disc) / 100,
            selectedPromo.max_disc || Infinity,
          )
        : selectedPromo.max_disc || 0;
  }

  const safeMemberPoint = customer && customer.member_point ? Number(customer.member_point) : 0;
  
  const maxPoints = customer
    ? Math.max(0, Math.min(safeMemberPoint, Math.floor((tempPrice - promoDiscount) / 1000)))
    : 0;
    
  const actualPoints = customer
    ? Math.max(0, Math.min(Number(pointsUsed) || 0, maxPoints))
    : 0;
    
  const pointDiscount = actualPoints * 1000;

  const finalPrice = tempPrice - promoDiscount - pointDiscount;

  const handlePointChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setPointsUsed("");
    } else {
      const points = Math.min(maxPoints, Math.max(0, parseInt(value) || 0));
      setPointsUsed(points);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Giỏ hàng trống!");
    const token = localStorage.getItem("token");

    const payload = {
      type: orderType,
      payment_method: paymentMethod,
      customer_id: customer ? customer.id : null,
      items: cart,
      temp_price: tempPrice,
      final_price: finalPrice,
      member_point_used: actualPoints,
      promotion_id: selectedPromo?.id,
      discount_amount: promoDiscount,
      note: note, // 2. Truyền ghi chú xuống Backend
    };

    try {
      const res = await axios.post(
        "http://localhost:8000/api/checkout",
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        if (paymentMethod === "vnpay") {
          window.open(res.data.payment_url, "_blank");
        } else {
          alert("Tạo đơn thành công!");
        }
        // 3. Reset lại toàn bộ form sau khi đặt hàng thành công
        setCart([]);
        setCustomer(null);
        setSearchQuery("");
        setPointsUsed("");
        setSelectedPromo(null);
        setNote(""); // Reset ghi chú
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi tạo đơn");
    }
  };

  return (
    <div className="container-fluid py-4">
      <h3 className="fw-bold mb-3 text-primary">MÓN ĂN</h3>
      <div className="row">
        {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
        <div className="col-md-7">
          <div className="row g-3">
            {items.map((item) => (
              <div className="col-md-3" key={item.id}>
                <div
                  className="card h-100 shadow-sm cursor-pointer"
                  onClick={() => addToCart(item)}
                >
                  <img
                    src={item.img_url}
                    className="card-img-top"
                    alt={item.name}
                    style={{ height: "100px", objectFit: "cover" }}
                  />
                  <div className="card-body p-2 text-center">
                    <h6 className="small fw-bold mb-1">{item.name}</h6>
                    <span className="text-danger small">
                      {Number(item.price).toLocaleString()}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: HÓA ĐƠN VÀ THANH TOÁN */}
        <div className="col-md-5">
          <div className="card shadow border-0 bg-light">
            <div className="card-body">
              {/* TÌM KHÁCH HÀNG */}
              <div className="input-group mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="SĐT hoặc Email khách..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-dark" onClick={handleSearchCustomer}>
                  Tìm
                </button>
              </div>
              {customer && (
                <div className="alert alert-success py-2 d-flex justify-content-between">
                  <span>
                    👤 <b>{customer.full_name || 'Khách hàng'}</b> ({customer.phone || 'Chưa có SĐT'})
                  </span>
                  <span className="fw-bold text-warning">
                    ⭐ {safeMemberPoint}
                  </span>
                </div>
              )}

              {/* GIỎ HÀNG */}
              <div
                style={{ maxHeight: "250px", overflowY: "auto" }}
                className="mb-3 border bg-white p-2 rounded"
              >
                {cart.length === 0 ? (
                  <small className="text-muted">Chưa có món nào...</small>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-1"
                    >
                      <div>
                        <span className="badge bg-secondary me-2">
                          {item.quantity}
                        </span>
                        {item.name}
                      </div>
                      <div>
                        <span className="me-3">
                          {Number(item.price * item.quantity).toLocaleString()}đ
                        </span>
                        <button
                          className="btn btn-sm btn-danger py-0 px-2"
                          onClick={() => removeFromCart(item.id)}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* LOẠI ĐƠN HÀNG */}
              <select
                className="form-select mb-2"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
              >
                <option value="dine in">Ăn tại quán (Dine in)</option>
                <option value="take away">Mang đi (Take away)</option>
              </select>

              {/* KHUYẾN MÃI */}
              <select
                className="form-select mb-2"
                value={selectedPromo ? selectedPromo.id : ""}
                onChange={(e) =>
                  setSelectedPromo(
                    promotions.find((p) => p.id == e.target.value) || null,
                  )
                }
              >
                <option value="">Chọn Khuyến mãi</option>
                {promotions.map((p) => {
                  // LOGIC KIỂM TRA ĐIỀU KIỆN
                  const isEligible = p.type === 'required_product' 
                    ? cart.some(item => item.id === p.required_product_id)
                    : tempPrice >= (p.min_order_value || 0);

                  return (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={!isEligible}
                    >
                      {p.name} {p.type === 'order_total' ? `(Min: ${Number(p.min_order_value).toLocaleString()}đ)` : `(Yêu cầu mua món ID: ${p.required_product_id})`}
                    </option>
                  );
                })}
              </select>

              {/* DÙNG ĐIỂM (Chỉ hiện khi có khách hàng) */}
              {customer && (
                <div className="input-group mb-2">
                  <span className="input-group-text bg-white small">
                    Dùng điểm
                  </span>
                  <input
                    type="number"
                    className="form-control"
                    value={pointsUsed}
                    min="0"
                    onChange={handlePointChange}
                  />
                </div>
              )}

              {/* GHI CHÚ */}
              <div className="input-group mb-3">
                <span className="input-group-text bg-white small text-muted">
                  📝 Ghi chú
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ghi chú thêm (không bắt buộc)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <hr />
              {/* TỔNG KẾT CHI PHÍ */}
              <div className="d-flex justify-content-between mb-1 small text-muted">
                <span>Tạm tính:</span>
                <span>{tempPrice.toLocaleString()}đ</span>
              </div>
              <div className="d-flex justify-content-between mb-1 small text-success">
                <span>Khuyến mãi:</span>
                <span>-{promoDiscount.toLocaleString()}đ</span>
              </div>
              <div className="d-flex justify-content-between mb-3 small text-warning">
                <span>Dùng điểm:</span>
                <span>-{pointDiscount.toLocaleString()}đ</span>
              </div>
              <div className="d-flex justify-content-between fw-bold fs-4 text-danger mb-3">
                <span>TỔNG:</span>
                <span>{finalPrice.toLocaleString()}đ</span>
              </div>

              {/* NÚT THANH TOÁN */}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success flex-fill fw-bold py-2 d-flex align-items-center justify-content-center"
                  onClick={() => {
                    setPaymentMethod("cod");
                    handleCheckout();
                  }}
                >
                  💵 TIỀN MẶT
                </button>
                <button
                  className="btn btn-primary flex-fill fw-bold py-2 d-flex align-items-center justify-content-center"
                  style={{ backgroundColor: "#005baa", borderColor: "#005baa" }}
                  onClick={() => {
                    setPaymentMethod("vnpay");
                    handleCheckout();
                  }}
                >
                  <img
                    src="http://localhost:8000/images/vnpay_logo.png"
                    alt="vnpay"
                    height="24"
                    className="me-2"
                  />
                  QR VNPAY
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StaffPOS;