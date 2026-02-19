import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [period, setPeriod] = useState('month'); // Mặc định xem theo tháng
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:8000/api/manager/dashboard?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            console.error('Lỗi tải Dashboard', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading || !stats) return <div className="text-center py-5"><h5>Đang tải dữ liệu...</h5></div>;

    return (
        <div className="container-fluid py-4 px-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">📊 TỔNG QUAN KINH DOANH</h3>
                <select className="form-select w-auto fw-bold shadow-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
                    <option value="day">📅 Hôm nay</option>
                    <option value="month">📅 Tháng này</option>
                    <option value="year">📅 Năm nay</option>
                </select>
            </div>

            {/* THẺ TỔNG QUAN */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card shadow-sm border-0 border-start border-5 border-success h-100 py-2">
                        <div className="card-body">
                            <div className="text-xs fw-bold text-success text-uppercase mb-1">Tổng Doanh Thu</div>
                            <div className="h3 mb-0 fw-bold text-dark">{Number(stats.totalRevenue).toLocaleString()}đ</div>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card shadow-sm border-0 border-start border-5 border-info h-100 py-2">
                        <div className="card-body">
                            <div className="text-xs fw-bold text-info text-uppercase mb-1">Số Đơn Hàng Đã Bán</div>
                            <div className="h3 mb-0 fw-bold text-dark">{stats.totalOrders} đơn</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                {/* BIỂU ĐỒ DOANH THU */}
                <div className="col-lg-8 mb-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-bold text-primary py-3">
                            📈 Biểu đồ doanh thu ({period === 'year' ? '12 Tháng' : '7 Ngày qua'})
                        </div>
                        <div className="card-body" style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                                    <Tooltip formatter={(value) => `${Number(value).toLocaleString()}đ`} />
                                    <Bar dataKey="DoanhThu" fill="#005baa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* TOP SẢN PHẨM BÁN CHẠY */}
                <div className="col-lg-4 mb-4">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white fw-bold text-danger py-3">
                            🔥 Top 5 Sản Phẩm Bán Chạy
                        </div>
                        <div className="card-body p-0">
                            <ul className="list-group list-group-flush">
                                {stats.topProducts.length === 0 ? (
                                    <li className="list-group-item text-muted text-center py-3">Chưa có dữ liệu</li>
                                ) : (
                                    stats.topProducts.map((product, index) => (
                                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center py-3">
                                            <div className="d-flex align-items-center">
                                                <div className="badge bg-danger rounded-circle me-3 px-2 py-2">{index + 1}</div>
                                                <div>
                                                    <h6 className="mb-0 fw-bold">{product.name}</h6>
                                                    <small className="text-muted">Đã bán: {product.total_sold}</small>
                                                </div>
                                            </div>
                                            <span className="fw-bold text-success">{Number(product.revenue).toLocaleString()}đ</span>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;