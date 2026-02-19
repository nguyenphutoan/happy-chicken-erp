import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ManagerPromotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Quản lý Modal
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const initialForm = {
        id: null,
        name: '',
        content: '', 
        promotion_intensity: 'low',
        type: 'order_total',
        min_order_value: '',
        required_product_id: '',
        discount_type: 'percentage',
        percentage_disc: '',
        max_disc: '',
        active_from: '',
        active_to: '',
        allowed_days: []
    };
    const [formData, setFormData] = useState(initialForm);

    const DAYS_OF_WEEK = [
        { label: 'CN', value: 0 }, { label: 'T2', value: 1 }, { label: 'T3', value: 2 },
        { label: 'T4', value: 3 }, { label: 'T5', value: 4 }, { label: 'T6', value: 5 }, { label: 'T7', value: 6 }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const resPromo = await axios.get('http://localhost:8000/api/manager/promotions', { headers: { Authorization: `Bearer ${token}` } });
            setPromotions(resPromo.data);

            const resItems = await axios.get('http://localhost:8000/api/items');
            setItems(resItems.data.data || resItems.data);
        } catch (error) {
            console.error('Lỗi tải dữ liệu', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAddNew = () => {
        setIsEditing(false);
        setFormData(initialForm);
        setShowModal(true);
    };

    const handleEdit = (promo) => {
        setIsEditing(true);
        let days = [];
        if (promo.condition_rules && promo.condition_rules.allowed_days) {
            days = promo.condition_rules.allowed_days;
        }

        setFormData({
            id: promo.id,
            name: promo.name,
            content: promo.content || '', 
            promotion_intensity: promo.promotion_intensity,
            type: promo.type,
            min_order_value: promo.min_order_value || '',
            required_product_id: promo.required_product_id || '',
            discount_type: promo.discount_type,
            percentage_disc: promo.percentage_disc || '',
            max_disc: promo.max_disc || '',
            active_from: promo.active_from,
            active_to: promo.active_to,
            allowed_days: days
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ Bạn có chắc muốn xóa vĩnh viễn khuyến mãi này?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8000/api/manager/promotions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            alert('Đã xóa thành công!');
            fetchData();
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Lỗi xóa khuyến mãi!');
        }
    };

    const handleDayCheckbox = (val) => {
        setFormData(prev => {
            const currentDays = prev.allowed_days;
            if (currentDays.includes(val)) {
                return { ...prev, allowed_days: currentDays.filter(d => d !== val) };
            } else {
                return { ...prev, allowed_days: [...currentDays, val] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalDays = formData.allowed_days;
        if (finalDays.length === 0) {
            finalDays = [0, 1, 2, 3, 4, 5, 6]; 
        }

        const payload = {
            name: formData.name,
            content: formData.content,
            promotion_intensity: formData.promotion_intensity,
            type: formData.type,
            discount_type: formData.discount_type,
            max_disc: formData.max_disc,
            active_from: formData.active_from,
            active_to: formData.active_to,
            condition_rules: { allowed_days: finalDays }
        };

        if (payload.type === 'order_total') payload.min_order_value = formData.min_order_value;
        if (payload.type === 'required_product') payload.required_product_id = formData.required_product_id;
        if (payload.discount_type === 'percentage') payload.percentage_disc = formData.percentage_disc;

        const token = localStorage.getItem('token');
        try {
            if (isEditing) {
                await axios.put(`http://localhost:8000/api/manager/promotions/${formData.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                alert('Cập nhật thành công!');
            } else {
                await axios.post('http://localhost:8000/api/manager/promotions', payload, { headers: { Authorization: `Bearer ${token}` } });
                alert('Thêm khuyến mãi thành công!');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra!');
        }
    };

    return (
        <div className="container-fluid py-4 px-4 min-vh-100 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">🎁 QUẢN LÝ KHUYẾN MÃI</h3>
                <button className="btn btn-warning fw-bold px-4 shadow-sm text-dark" onClick={handleAddNew}>
                    ➕ Tạo Khuyến Mãi Mới
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0 table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                        <thead className="table-dark">
                            <tr>
                                <th style={{width: '25%'}}>Tên & Nội dung</th>
                                <th>Điều kiện</th>
                                <th>Mức Giảm</th>
                                <th>Thời Gian</th>
                                <th>Cường độ</th>
                                <th className="text-center">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6" className="text-center py-4">Đang tải...</td></tr> : promotions.map(promo => (
                                <tr key={promo.id}>
                                    <td>
                                        <div className="fw-bold text-primary mb-1">{promo.name}</div>
                                        {/* Hiển thị một đoạn ngắn của nội dung ở ngoài bảng */}
                                        {promo.content && (
                                            <div className="text-muted fst-italic text-truncate" style={{ maxWidth: '200px', fontSize: '0.8rem' }}>
                                                {promo.content}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        {promo.type === 'order_total' ? (
                                            <span>Đơn từ <b className="text-danger">{Number(promo.min_order_value).toLocaleString()}đ</b></span>
                                        ) : (
                                            <span>Mua SP: <b className="text-success">{promo.required_product?.name || 'Lỗi SP'}</b></span>
                                        )}
                                    </td>
                                    <td>
                                        {promo.discount_type === 'percentage' 
                                            ? <span>Giảm <b>{promo.percentage_disc}%</b><br/>(Tối đa: {Number(promo.max_disc).toLocaleString()}đ)</span>
                                            : <span>Giảm <b>{Number(promo.max_disc).toLocaleString()}đ</b></span>
                                        }
                                    </td>
                                    <td>
                                        {new Date(promo.active_from).toLocaleDateString('vi-VN')} <br/> 
                                        đến {new Date(promo.active_to).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td>
                                        <span className={`badge ${promo.promotion_intensity === 'high' ? 'bg-danger' : promo.promotion_intensity === 'medium' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                            {promo.promotion_intensity.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="btn-group shadow-sm">
                                            <button className="btn btn-sm btn-primary fw-bold" onClick={() => handleEdit(promo)}>✏️</button>
                                            <button className="btn btn-sm btn-outline-danger fw-bold" onClick={() => handleDelete(promo.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM / SỬA KHUYẾN MÃI */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title fw-bold">
                                    {isEditing ? '✏️ Cập Nhật Khuyến Mãi' : '➕ Tạo Khuyến Mãi'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-light">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        {/* CỘT TRÁI: THÔNG TIN CƠ BẢN */}
                                        <div className="col-md-6 mb-3 border-end">
                                            <h6 className="fw-bold text-primary mb-3">1. Thông tin & Điều kiện</h6>
                                            <div className="mb-3">
                                                <label className="fw-bold small mb-1">Tên chương trình:</label>
                                                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                            </div>

                                            {/* Thêm ô nhập Nội dung */}
                                            <div className="mb-3">
                                                <label className="fw-bold small mb-1">Nội dung / Mô tả khuyến mãi:</label>
                                                <textarea className="form-control" rows="3" value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Nhập chi tiết về chương trình khuyến mãi..."></textarea>
                                            </div>
                                            
                                            <div className="row">
                                                <div className="col-6 mb-3">
                                                    <label className="fw-bold small mb-1">Mức độ KM:</label>
                                                    <select className="form-select" value={formData.promotion_intensity} onChange={(e) => setFormData({...formData, promotion_intensity: e.target.value})}>
                                                        <option value="low">Thấp (Low)</option>
                                                        <option value="medium">Vừa (Medium)</option>
                                                        <option value="high">Mạnh (High)</option>
                                                    </select>
                                                </div>
                                                <div className="col-6 mb-3">
                                                    <label className="fw-bold small mb-1">Loại điều kiện:</label>
                                                    <select className="form-select border-primary" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                                        <option value="order_total">Tổng hóa đơn</option>
                                                        <option value="required_product">Mua món chỉ định</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {formData.type === 'order_total' ? (
                                                <div className="mb-3">
                                                    <label className="fw-bold small text-danger mb-1">Giá trị đơn tối thiểu (VNĐ):</label>
                                                    <input type="number" min="0" className="form-control" value={formData.min_order_value} onChange={(e) => setFormData({...formData, min_order_value: e.target.value})} required />
                                                </div>
                                            ) : (
                                                <div className="mb-3">
                                                    <label className="fw-bold small text-success mb-1">Sản phẩm yêu cầu mua:</label>
                                                    <select className="form-select" value={formData.required_product_id} onChange={(e) => setFormData({...formData, required_product_id: e.target.value})} required>
                                                        <option value="">-- Chọn món ăn --</option>
                                                        {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* CỘT PHẢI: MỨC GIẢM & THỜI GIAN */}
                                        <div className="col-md-6 mb-3">
                                            <h6 className="fw-bold text-primary mb-3">2. Mức giảm & Hiệu lực</h6>
                                            
                                            <div className="mb-3">
                                                <label className="fw-bold small mb-1">Hình thức giảm:</label>
                                                <select className="form-select border-warning" value={formData.discount_type} onChange={(e) => setFormData({...formData, discount_type: e.target.value})}>
                                                    <option value="percentage">Giảm theo %</option>
                                                    <option value="fixed_amount">Giảm thẳng tiền (VNĐ)</option>
                                                </select>
                                            </div>

                                            <div className="row mb-3">
                                                {formData.discount_type === 'percentage' && (
                                                    <div className="col-6">
                                                        <label className="fw-bold small mb-1">% Giảm:</label>
                                                        <input type="number" min="1" max="100" className="form-control" value={formData.percentage_disc} onChange={(e) => setFormData({...formData, percentage_disc: e.target.value})} required />
                                                    </div>
                                                )}
                                                <div className={formData.discount_type === 'percentage' ? "col-6" : "col-12"}>
                                                    <label className="fw-bold small mb-1">{formData.discount_type === 'percentage' ? 'Giảm tối đa (VNĐ)' : 'Số tiền giảm (VNĐ)'}:</label>
                                                    <input type="number" min="0" className="form-control" value={formData.max_disc} onChange={(e) => setFormData({...formData, max_disc: e.target.value})} required />
                                                </div>
                                            </div>

                                            <div className="row mb-3">
                                                <div className="col-6">
                                                    <label className="fw-bold small mb-1">Từ ngày:</label>
                                                    <input type="date" className="form-control" value={formData.active_from} onChange={(e) => setFormData({...formData, active_from: e.target.value})} required />
                                                </div>
                                                <div className="col-6">
                                                    <label className="fw-bold small mb-1">Đến ngày:</label>
                                                    <input type="date" className="form-control" value={formData.active_to} onChange={(e) => setFormData({...formData, active_to: e.target.value})} required />
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <label className="fw-bold small mb-2 d-block">Ngày áp dụng trong tuần (Bỏ trống = Cả tuần):</label>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {DAYS_OF_WEEK.map(day => (
                                                        <div key={day.value} className="form-check form-check-inline m-0 bg-white border rounded px-2 py-1">
                                                            <input className="form-check-input ms-0 me-1" type="checkbox" id={`day-${day.value}`}
                                                                checked={formData.allowed_days.includes(day.value)}
                                                                onChange={() => handleDayCheckbox(day.value)}
                                                            />
                                                            <label className="form-check-label small" htmlFor={`day-${day.value}`}>{day.label}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 pt-3 border-top mt-2">
                                        <button type="button" className="btn btn-light fw-bold flex-fill" onClick={() => setShowModal(false)}>Hủy</button>
                                        <button type="submit" className="btn btn-warning text-dark fw-bold flex-fill shadow-sm">💾 LƯU KHUYẾN MÃI</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerPromotions;