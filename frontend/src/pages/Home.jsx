import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';

const Home = () => {
    const [items, setItems] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        // Gọi API từ Laravel Backend (mặc định Laravel chạy ở cổng 8000)
        axios.get('http://localhost:8000/api/home')
            .then(response => {
                // Cập nhật state với dữ liệu thực tế từ database
                setItems(response.data.items);
                setPromotions(response.data.promotions);
                setLoading(false);
            })
            .catch(error => {
                console.error("Lỗi khi lấy dữ liệu từ Backend:", error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="text-center py-5"><h4>Đang tải dữ liệu...</h4></div>;
    }

    return (
        <div className="container py-5">
            {/*HIỂN THỊ DANH SÁCH KHUYẾN MÃI */}
            {promotions.length > 0 && (
                <div className="mb-5">
                    <h3 className="text-center mb-4 fw-bold" style={{ color: '#fd7e14' }}>
                        🔥 Ưu Đãi Đang Diễn Ra 🔥
                    </h3>
                    
                    <div className="row g-3">
                        {promotions.map((promo) => (
                            <div className="col-12 col-md-6" key={promo.id}>
                                <div 
                                    className="alert alert-warning shadow-sm h-100 mb-0 d-flex flex-column justify-content-center border-0" 
                                    role="alert" 
                                    style={{ borderLeft: '5px solid #fd7e14' }}
                                >
                                    <h5 className="alert-heading fw-bold mb-2 text-dark">
                                        ✨ {promo.name}
                                    </h5>
                                    
                                    {/* Hiển thị cột content*/}
                                    {promo.content && (
                                        <p className="mb-2 fw-medium text-dark">{promo.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="mb-4 text-center">Sản phẩm nổi bật</h2>
            
            <div className="row g-4">
                {items.length > 0 ? (
                    items.map(item => (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={item.id}>
                            <div className="card h-100 shadow-sm border-0">
                                
                                {/* HIỂN THỊ HÌNH ẢNH SẢN PHẨM */}
                                {item.img_url ? (
                                    <img 
                                        src={item.img_url} 
                                        alt={item.name} 
                                        className="card-img-top object-fit-cover rounded-top" 
                                        style={{ height: '200px' }} 
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Lỗi+ảnh' }} // Xử lý nếu link ảnh chết
                                    />
                                ) : (
                                    <div className="bg-light text-secondary d-flex align-items-center justify-content-center rounded-top" style={{ height: '200px' }}>
                                        <span>[Chưa có hình ảnh]</span>
                                    </div>
                                )}

                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title text-truncate" title={item.name}>{item.name}</h5>
                                    
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="card-text text-danger fw-bold fs-5">
                                            {Number(item.price).toLocaleString('vi-VN')} đ
                                        </span>
                                        <span className="badge bg-warning text-dark">
                                            Đã bán {item.total_sold}
                                        </span>
                                    </div>

                                    <button 
                                        className="btn btn-warning w-100 fw-bold"
                                        onClick={() => addToCart(item)}
                                    >
                                        Thêm vào giỏ
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center text-muted">
                        <p>Hiện chưa có sản phẩm nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;