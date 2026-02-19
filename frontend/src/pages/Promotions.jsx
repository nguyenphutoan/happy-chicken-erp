import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Promotions = () => {
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        axios.get('http://localhost:8000/api/promotions-all').then(res => setPromos(res.data));
    }, []);

    const navigate = useNavigate();

    return (
        <div className="container py-5">
            <h2 className="text-center mb-5 fw-bold" style={{ color: '#fd7e14' }}>Ưu Đãi Đặc Biệt</h2>
            <div className="row g-4">
                {promos.map(promo => (
                    <div className="col-md-6" key={promo.id}>
                        <div className="card border-0 shadow-sm bg-warning-subtle" style={{ borderLeft: '8px solid #fd7e14' }}>
                            <div className="card-body py-4">
                                <h4 className="fw-bold text-dark">{promo.name}</h4>
                                <p className="text-muted">{promo.content}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="badge bg-danger">
                                        Hạn dùng: {promo.active_to ? promo.active_to.split('T')[0] : 'Không thời hạn'}
                                    </span>
                                    <button className="btn btn-outline-dark btn-sm fw-bold" onClick={() => navigate('/products')}>Mua ngay</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Promotions;