import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';

const Products = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        axios.get('http://localhost:8000/api/items-all')
            .then(res => { setItems(res.data.data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-center py-5">Đang tải sản phẩm...</div>;

    return (
        <div className="container py-5">
            <h2 className="text-center mb-5 fw-bold" style={{ color: '#fd7e14' }}>Thực Đơn Happy Chicken</h2>
            <div className="row g-4">
                {items.map(item => (
                    <div className="col-6 col-md-4 col-lg-3" key={item.id}>
                        <div className="card h-100 shadow-sm border-0">
                            <img src={item.img_url} className="card-img-top object-fit-cover" style={{ height: '180px' }} alt={item.name} />
                            <div className="card-body">
                                <h6 className="card-title fw-bold text-truncate">{item.name}</h6>
                                <p className="text-danger fw-bold mb-2">{Number(item.price).toLocaleString('vi-VN')} đ</p>
                                <button 
                                    className="btn btn-warning w-100 fw-bold"
                                    onClick={() => addToCart(item)} // Gọi hàm khi nhấn
                                >
                                    Thêm vào giỏ
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Products;