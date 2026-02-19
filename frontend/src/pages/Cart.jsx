import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
    const { cart, removeFromCart, setCart } = useCart();
    const navigate = useNavigate();

    const updateQty = (id, delta) => {
        setCart(prev => prev.map(item => 
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (cart.length === 0) return (
        <div className="container py-5 text-center">
            <h3>Giỏ hàng trống trơn! 🍗</h3>
            <Link to="/products" className="btn btn-warning mt-3">Đi mua sắm ngay</Link>
        </div>
    );

    const handleCheckout = () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (!token || !user) {
            alert('Bạn cần đăng nhập để tiến hành đặt hàng nhé!');
            navigate('/login'); // Chưa đăng nhập thì đẩy về trang Login
        } else {
            navigate('/checkout'); // Đã đăng nhập thì sang trang Thanh toán
        }
    };

    return (
        <div className="container py-5">
            <h2 className="fw-bold mb-4" style={{ color: '#fd7e14' }}>Giỏ Hàng Của Bạn</h2>
            <div className="row">
                <div className="col-lg-8">
                    {cart.map(item => (
                        <div className="card mb-3 shadow-sm border-0" key={item.id}>
                            <div className="card-body d-flex align-items-center">
                                <img src={item.img_url} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover' }} className="rounded" />
                                <div className="ms-3 flex-grow-1">
                                    <h6 className="fw-bold mb-0">{item.name}</h6>
                                    <small className="text-danger fw-bold">{Number(item.price).toLocaleString()}đ</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQty(item.id, -1)}>-</button>
                                    <span className="mx-2 fw-bold">{item.quantity}</span>
                                    <button className="btn btn-sm btn-outline-secondary" onClick={() => updateQty(item.id, 1)}>+</button>
                                </div>
                                <button className="btn btn-link text-danger ms-3" onClick={() => removeFromCart(item.id)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 bg-light p-3">
                        <h5 className="fw-bold">Tổng thanh toán</h5>
                        <hr />
                        <div className="d-flex justify-content-between mb-3">
                            <span>Tạm tính:</span>
                            <span className="fw-bold">{totalPrice.toLocaleString()}đ</span>
                        </div>
                        <button 
                            className="btn btn-warning w-100 fw-bold py-2"
                            onClick={handleCheckout}
                        >
                            TIẾN HÀNH ĐẶT HÀNG
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Cart;