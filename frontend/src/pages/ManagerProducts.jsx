import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const ManagerProducts = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Quản lý Modal
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    // Quản lý dữ liệu form
    const [formData, setFormData] = useState({ id: null, name: '', price: '' });
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:8000/api/manager/items', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setItems(res.data);
        } catch (error) {
            console.error('Lỗi lấy danh sách SP', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleAddNew = () => {
        setIsEditing(false);
        setFormData({ id: null, name: '', price: '' });
        setImageFile(null);
        setPreviewUrl(null);
        setShowModal(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setFormData({ id: item.id, name: item.name, price: item.price });
        setImageFile(null);
        setPreviewUrl(item.img_url); // Hiển thị ảnh cũ có sẵn
        setShowModal(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Xử lý khi chọn file ảnh (Tạo preview ngay lập tức)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file)); 
        }
    };

    //  (Ngừng bán / Mở bán lại)
    const handleToggleActive = async (id, currentStatus) => {
        const actionName = currentStatus ? "Ngừng bán" : "Mở bán lại";
        if (!window.confirm(`⚠️ Bạn có chắc muốn ${actionName} sản phẩm này?`)) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`http://localhost:8000/api/manager/items/${id}/toggle-active`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(res.data.message);
            fetchItems(); // Load lại dữ liệu để thấy trạng thái thay đổi
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Lỗi cập nhật trạng thái sản phẩm!');
        }
    };

    // 6. Gửi Form (Thêm / Sửa)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('price', formData.price);
        if (imageFile) {
            submitData.append('image', imageFile);
        }

        const token = localStorage.getItem('token');
        const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } };

        try {
            if (isEditing) {
                await axios.post(`http://localhost:8000/api/manager/items/${formData.id}`, submitData, config);
                alert('Cập nhật sản phẩm thành công!');
            } else {
                // Thêm sản phẩm mới
                if (!imageFile) return alert('Vui lòng chọn ảnh cho sản phẩm mới!');
                await axios.post('http://localhost:8000/api/manager/items', submitData, config);
                alert('Thêm sản phẩm thành công!');
            }
            setShowModal(false);
            fetchItems();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm!');
        }
    };

    return (
        <div className="container-fluid py-4 px-4 min-vh-100 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">🍔 QUẢN LÝ SẢN PHẨM</h3>
                <button className="btn btn-success fw-bold px-4 shadow-sm" onClick={handleAddNew}>
                    ➕ Thêm Sản Phẩm Mới
                </button>
            </div>

            {/* BẢNG DANH SÁCH */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0 table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th className="px-3">ID</th>
                                <th>Hình Ảnh</th>
                                <th>Tên Sản Phẩm</th>
                                <th>Đơn Giá</th>
                                <th>Trạng Thái</th>
                                <th className="text-center">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6" className="text-center py-4">Đang tải...</td></tr> : items.map(item => (
                                <tr key={item.id} className={!item.is_active ? "table-secondary" : ""}>
                                    <td className="px-3 fw-bold text-muted">#{item.id}</td>
                                    <td>
                                        <img 
                                            src={item.img_url} 
                                            alt={item.name} 
                                            className="rounded border shadow-sm" 
                                            style={{ 
                                                width: '60px', 
                                                height: '60px', 
                                                objectFit: 'cover', 
                                                filter: !item.is_active ? 'grayscale(100%)' : 'none' 
                                            }} 
                                        />
                                    </td>
                                    <td className={`fw-bold ${!item.is_active ? 'text-muted text-decoration-line-through' : ''}`}>
                                        {item.name}
                                    </td>
                                    <td className="fw-bold text-danger">{Number(item.price).toLocaleString()}đ</td>
                                    <td>
                                        {item.is_active ? (
                                            <span className="badge bg-success">Đang bán</span>
                                        ) : (
                                            <span className="badge bg-secondary">Ngừng bán</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <div className="btn-group shadow-sm">
                                            <button className="btn btn-sm btn-primary fw-bold px-3" onClick={() => handleEdit(item)}>
                                                ✏️ Sửa
                                            </button>
                                            <button 
                                                className={`btn btn-sm fw-bold ${item.is_active ? 'btn-outline-warning text-dark' : 'btn-success'}`} 
                                                onClick={() => handleToggleActive(item.id, item.is_active)}
                                            >
                                                {item.is_active ? '⏸️ Ngừng bán' : '▶️ Mở bán lại'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM/SỬA SẢN PHẨM */}
            {showModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title fw-bold">
                                    {isEditing ? '✏️ Cập Nhật Sản Phẩm' : '➕ Thêm Sản Phẩm Mới'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-light">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="fw-bold small text-muted mb-1">Tên Sản Phẩm:</label>
                                        <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="fw-bold small text-muted mb-1">Đơn Giá (VNĐ):</label>
                                        <input type="number" min="0" className="form-control" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="fw-bold small text-muted mb-1">Hình Ảnh Sản Phẩm:</label>
                                        <input type="file" className="form-control mb-2" accept="image/*" onChange={handleFileChange} ref={fileInputRef} required={!isEditing} />
                                        
                                        {/* Khung Preview Ảnh */}
                                        <div className="text-center border rounded bg-white py-3 mt-2" style={{ minHeight: '120px' }}>
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Preview" className="rounded shadow-sm" style={{ maxHeight: '100px', objectFit: 'contain' }} />
                                            ) : (
                                                <span className="text-muted small">Chưa có ảnh được chọn</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex gap-2 pt-2 border-top">
                                        <button type="button" className="btn btn-light fw-bold flex-fill" onClick={() => setShowModal(false)}>Hủy</button>
                                        <button type="submit" className="btn btn-success fw-bold flex-fill">💾 LƯU SẢN PHẨM</button>
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

export default ManagerProducts;