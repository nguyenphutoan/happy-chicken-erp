import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const Checkout = () => {
    const { cart, getCartCount, clearCart } = useCart();
    const navigate = useNavigate();
    
    const [user, setUser] = useState({ member_point: 0 });
    const [orderType, setOrderType] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [address, setAddress] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [promotions, setPromotions] = useState([]);
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [pointsUsed, setPointsUsed] = useState('');
    const [showPromoList, setShowPromoList] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setAddress(parsedUser.address || ''); 
        } else {
            navigate('/login');
        }

        const fetchPromotions = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/promotions/valid');
                setPromotions(res.data);
            } catch (error) {
                console.error('Lỗi tải khuyến mãi', error);
            }
        };
        fetchPromotions();
    }, [navigate]);

    const tempPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
        if (selectedPromo.discount_type === 'percentage') {
            promoDiscount = (tempPrice * selectedPromo.percentage_disc) / 100;
            if (selectedPromo.max_disc) {
                promoDiscount = Math.min(promoDiscount, selectedPromo.max_disc);
            }
        } else if (selectedPromo.discount_type === 'fixed_amount') {
            promoDiscount = selectedPromo.max_disc || 0;
        }
    }

    const safeUserPoint = user && user.member_point ? Number(user.member_point) : 0;

    const maxPointsUsable = Math.max(0, Math.min(safeUserPoint, Math.floor((tempPrice - promoDiscount) / 1000)));
    const actualPointsUsed = Math.max(0, Math.min(Number(pointsUsed) || 0, maxPointsUsable));
    const pointDiscount = actualPointsUsed * 1000;

    // 3. Giá cuối cùng
    const finalPrice = tempPrice - promoDiscount - pointDiscount;

    const handlePointChange = (e) => {
        const value = e.target.value;
        if (value === '') {
            setPointsUsed('');
        } else {
            const points = Math.min(maxPointsUsable, Math.max(0, parseInt(value) || 0));
            setPointsUsed(points);
        }
    };

    const handleConfirmOrder = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setLoading(true);

        const token = localStorage.getItem('token');
        const orderData = {
            type: orderType,
            payment_method: paymentMethod,
            deli_address: orderType === 'delivery' ? address : null,
            note: note,
            items: cart,
            temp_price: tempPrice,
            final_price: finalPrice,
            member_point_used: actualPointsUsed,
            promotion_id: selectedPromo ? selectedPromo.id : null,
            discount_amount: promoDiscount
        };

        try {
            const res = await axios.post('http://localhost:8000/api/checkout', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                clearCart();
                const updatedUser = { ...user, member_point: user.member_point - actualPointsUsed + Math.floor(finalPrice / 10000) };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                if (paymentMethod === 'vnpay') {
                    window.location.href = res.data.payment_url;
                } else {
                    alert(res.data.message);
                    navigate('/payment-result?status=success');
                }
            }
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || 'Không thể kết nối máy chủ'));
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) return <div className="container py-5 text-center"><h5>Giỏ hàng đang trống!</h5></div>;

    return (
        <div className="container py-5">
            <h2 className="fw-bold mb-4" style={{ color: '#fd7e14' }}>Xác Nhận Đơn Hàng</h2>
            <div className="row">
                <div className="col-md-7 mb-4">
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-warning text-dark fw-bold">1. Hình thức nhận hàng</div>
                        <div className="card-body">
                            <div className="d-flex gap-4 mb-3">
                                <div className="form-check cursor-pointer" onClick={() => setOrderType('delivery')}>
                                    <input className="form-check-input" type="radio" checked={orderType === 'delivery'} readOnly />
                                    <label className="form-check-label fw-medium">🏍️ Giao hàng</label>
                                </div>
                                <div className="form-check cursor-pointer" onClick={() => setOrderType('take away')}>
                                    <input className="form-check-input" type="radio" checked={orderType === 'take away'} readOnly />
                                    <label className="form-check-label fw-medium">🏬 Đến lấy</label>
                                </div>
                            </div>
                            {orderType === 'delivery' && (
                                <div className="mb-3">
                                    <label className="form-label text-muted small">Địa chỉ nhận hàng</label>
                                    <textarea className="form-control" rows="2" value={address} onChange={(e) => setAddress(e.target.value)} required></textarea>
                                </div>
                            )}
                            <div className="mb-3">
                                <label className="form-label text-muted small">Ghi chú cho quán</label>
                                <input type="text" className="form-control" value={note} onChange={(e) => setNote(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-warning text-dark fw-bold">2. Ưu đãi & Điểm thưởng</div>
                        <div className="card-body">
                            <div className="mb-4">
                                <button className="btn btn-outline-success w-100 d-flex justify-content-between align-items-center" onClick={() => setShowPromoList(!showPromoList)}>
                                    <span className="fw-bold">🏷️ {selectedPromo ? `Đã chọn: ${selectedPromo.name}` : 'Bấm để chọn mã giảm giá'}</span>
                                    <span>{showPromoList ? '▲' : '▼'}</span>
                                </button>
                                
                                {showPromoList && (
                                    <div className="mt-3 border rounded p-2 bg-light">
                                        {promotions.length === 0 ? <p className="text-muted text-center mb-0 small">Không có mã nào khả dụng</p> : 
                                            promotions.map(promo => {
                                                const isEligible = promo.type === 'required_product' 
                                                ? cart.some(item => item.id === promo.required_product_id)
                                                : tempPrice >= (promo.min_order_value || 0);
                                                return (
                                                    <div key={promo.id} className={`form-check mb-2 p-2 border rounded bg-white ${isEligible ? 'cursor-pointer' : 'opacity-50'}`} 
                                                        onClick={() => isEligible && setSelectedPromo(promo)}>
                                                        <input className="form-check-input ms-1 me-2" type="radio" checked={selectedPromo?.id === promo.id} readOnly disabled={!isEligible} />
                                                        <div className="d-inline-block align-middle">
                                                            <span className="fw-bold d-block text-success">{promo.name}</span>
                                                            <small className="text-muted d-block">
                                                                {promo.type === 'order_total' 
                                                                    ? `Đơn tối thiểu ${Number(promo.min_order_value).toLocaleString()}đ` 
                                                                    : 'Áp dụng khi mua món quy định'}
                                                            </small>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                        {selectedPromo && <button className="btn btn-sm btn-danger mt-2" onClick={() => setSelectedPromo(null)}>Bỏ chọn mã</button>}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border rounded bg-light">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="fw-medium">Điểm hiện có của bạn:</span>
                                    <span className="fw-bold text-warning fs-5">⭐ {user.member_point}</span>
                                </div>
                                <div className="input-group">
                                    <span className="input-group-text bg-white small">Dùng điểm</span>
                                    <input type="number" className="form-control" placeholder={`Tối đa ${maxPointsUsable}`} value={pointsUsed} onChange={handlePointChange} min="0" />
                                    <span className="input-group-text bg-white">điểm = -{(actualPointsUsed * 1000).toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-warning text-dark fw-bold">3. Phương thức thanh toán</div>
                        <div className="card-body d-flex gap-3">
                            <div className="form-check flex-fill p-3 border rounded d-flex align-items-center cursor-pointer" onClick={() => setPaymentMethod('cod')} style={{ borderColor: paymentMethod === 'cod' ? '#fd7e14' : '' }}>
                                <input className="form-check-input ms-1 me-2" type="radio" checked={paymentMethod === 'cod'} readOnly />
                                <label className="form-check-label fw-bold">Tiền mặt (COD)</label>
                            </div>
                            <div className="form-check flex-fill p-3 border rounded d-flex align-items-center cursor-pointer" onClick={() => setPaymentMethod('vnpay')} style={{ borderColor: paymentMethod === 'vnpay' ? '#005baa' : '' }}>
                                <input className="form-check-input ms-1 me-2" type="radio" checked={paymentMethod === 'vnpay'} readOnly />
                                <img src="http://localhost:8000/images/vnpay_logo.png" alt="VNPAY" height="24" className="me-2" />
                                <label className="form-check-label fw-bold text-primary" style={{ color: '#005baa' }}>VNPAY</label>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="col-md-5">
                    <div className="card shadow-sm border-0 bg-light sticky-top" style={{ top: '80px', zIndex: 1 }}>
                        <div className="card-body">
                            <h5 className="fw-bold border-bottom pb-2">Hóa đơn ({getCartCount()} món)</h5>
                            <ul className="list-group list-group-flush mb-3">
                                {cart.map(item => (
                                    <li className="list-group-item bg-transparent d-flex justify-content-between px-0" key={item.id}>
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>{Number(item.price * item.quantity).toLocaleString()}đ</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <hr />
                            <div className="d-flex justify-content-between text-muted mb-2">
                                <span>Tạm tính</span>
                                <span>{tempPrice.toLocaleString()}đ</span>
                            </div>
                            {promoDiscount > 0 && (
                                <div className="d-flex justify-content-between text-success mb-2">
                                    <span>Khuyến mãi ({selectedPromo.name})</span>
                                    <span>- {promoDiscount.toLocaleString()}đ</span>
                                </div>
                            )}
                            {pointDiscount > 0 && (
                                <div className="d-flex justify-content-between text-warning mb-2">
                                    <span>Dùng điểm (⭐ {actualPointsUsed})</span>
                                    <span>- {pointDiscount.toLocaleString()}đ</span>
                                </div>
                            )}
                            
                            <div className="d-flex justify-content-between fw-bold fs-5 text-danger border-top pt-3 mb-1">
                                <span>Tổng thanh toán</span>
                                <span>{finalPrice.toLocaleString()}đ</span>
                            </div>
                            <div className="text-end text-success small mb-3">
                                Bạn sẽ được cộng thêm <b>+{Math.floor(finalPrice / 10000)} điểm</b> sau khi đơn hoàn tất!
                            </div>

                            <button className="btn btn-warning w-100 fw-bold py-3 fs-5 shadow" onClick={handleConfirmOrder} disabled={loading}>
                                {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;