import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ManagerStaff = () => {
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal & Trạng thái
    const [showUserModal, setShowUserModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Form Thông tin
    const initialForm = { id: null, username: '', full_name: '', phone: '', email: '', address: '', role: 'staff', member_point: 0, password: '', password_confirmation: '' };
    const [formData, setFormData] = useState(initialForm);

    // Form Đổi mật khẩu
    const [passData, setPassData] = useState({ old_password: '', new_password: '', new_password_confirmation: '' });

    const fetchStaff = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:8000/api/manager/staff', { headers: { Authorization: `Bearer ${token}` } });
            setStaffList(res.data);
        } catch (error) {
            console.error('Lỗi tải nhân sự', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);

    // Bật Modal Thêm mới
    const handleAddNew = () => {
        setIsEditing(false);
        setFormData(initialForm);
        setShowUserModal(true);
    };

    // Bật Modal Sửa thông tin
    const handleEdit = (user) => {
        setIsEditing(true);
        setFormData({ ...user, password: '', password_confirmation: '' });
        setShowUserModal(true);
    };

    // Bật Modal Đổi Mật khẩu
    const handleEditPassword = (user) => {
        setSelectedUser(user);
        setPassData({ old_password: '', new_password: '', new_password_confirmation: '' });
        setShowPassModal(true);
    };

    // Đổi trạng thái (Nghỉ việc)
    const handleToggleActive = async (id, isActive) => {
        const action = isActive ? "đánh dấu NGHỈ VIỆC" : "cho phép ĐI LÀM LẠI";
        if (!window.confirm(`Bạn có chắc muốn ${action} nhân viên này?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.patch(`http://localhost:8000/api/manager/staff/${id}/toggle-active`, {}, { headers: { Authorization: `Bearer ${token}` } });
            alert(res.data.message);
            fetchStaff();
        // eslint-disable-next-line no-unused-vars
        } catch (error) { alert('Lỗi hệ thống!'); }
    };

    // Submit Thêm / Sửa Thông tin
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if (isEditing) {
                await axios.put(`http://localhost:8000/api/manager/staff/${formData.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
                alert('Cập nhật thông tin thành công!');
            } else {
                if (formData.password !== formData.password_confirmation) return alert('Mật khẩu xác nhận không khớp!');
                await axios.post('http://localhost:8000/api/manager/staff', formData, { headers: { Authorization: `Bearer ${token}` } });
                alert('Thêm nhân sự thành công!');
            }
            setShowUserModal(false);
            fetchStaff();
        } catch (error) { alert(error.response?.data?.message || 'Có lỗi xảy ra!'); }
    };

    // Submit Đổi mật khẩu
    const handlePassSubmit = async (e) => {
        e.preventDefault();
        if (passData.new_password !== passData.new_password_confirmation) return alert('Mật khẩu mới không khớp!');
        
        const token = localStorage.getItem('token');
        try {
            await axios.put(`http://localhost:8000/api/manager/staff/${selectedUser.id}/password`, passData, { headers: { Authorization: `Bearer ${token}` } });
            alert('Đổi mật khẩu thành công!');
            setShowPassModal(false);
        } catch (error) { alert(error.response?.data?.message || 'Mật khẩu cũ không đúng!'); }
    };

    return (
        <div className="container-fluid py-4 px-4 min-vh-100 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold text-dark mb-0">👥 QUẢN LÝ NHÂN SỰ</h3>
                <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={handleAddNew}>
                    ➕ Thêm Nhân Sự
                </button>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0 table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th>Tài khoản</th>
                                <th>Thông tin</th>
                                <th>Chức vụ</th>
                                <th>Trạng thái & Thời gian</th>
                                <th className="text-center">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5" className="text-center py-4">Đang tải...</td></tr> : staffList.map(user => (
                                <tr key={user.id} className={!user.is_active ? "table-secondary" : ""}>
                                    <td>
                                        <b className="text-primary">{user.username}</b>
                                        <br/><small className="text-muted">ID: #{user.id}</small>
                                    </td>
                                    <td>
                                        <div className="fw-bold">{user.full_name}</div>
                                        <small className="text-muted">📞 {user.phone} | ✉️ {user.email || 'N/A'}</small>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === 'manager' ? 'bg-danger' : 'bg-info text-dark'}`}>
                                            {user.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        {user.is_active ? (
                                            <><span className="badge bg-success mb-1">Đang làm việc</span><br/>
                                            <small className="text-muted">Vào làm: {new Date(user.created_at).toLocaleDateString('vi-VN')}</small></>
                                        ) : (
                                            <><span className="badge bg-secondary mb-1">Đã nghỉ việc</span><br/>
                                            <small className="text-danger fw-medium">Nghỉ lúc: {new Date(user.updated_at).toLocaleDateString('vi-VN')}</small></>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <div className="btn-group shadow-sm">
                                            <button className="btn btn-sm btn-primary fw-bold" onClick={() => handleEdit(user)}>✏️ Sửa</button>
                                            <button className="btn btn-sm btn-dark fw-bold" onClick={() => handleEditPassword(user)}>🔑 Đổi Pass</button>
                                            <button 
                                                className={`btn btn-sm fw-bold ${user.is_active ? 'btn-outline-danger' : 'btn-success'}`}
                                                onClick={() => handleToggleActive(user.id, user.is_active)}
                                            >
                                                {user.is_active ? '⏸️ Báo Nghỉ' : '▶️ Làm lại'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL THÊM / SỬA THÔNG TIN */}
            {showUserModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title fw-bold">{isEditing ? '✏️ Sửa Thông Tin Nhân Sự' : '➕ Thêm Nhân Sự Mới'}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowUserModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-light">
                                <form onSubmit={handleUserSubmit}>
                                    <div className="row mb-3">
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold small mb-1">Tài khoản (Username):</label>
                                            <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required disabled={isEditing} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold small mb-1">Họ và tên:</label>
                                            <input type="text" className="form-control" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold small mb-1">Số điện thoại:</label>
                                            <input type="text" className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="fw-bold small mb-1">Email:</label>
                                            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                        </div>
                                        <div className="col-md-8 mb-3">
                                            <label className="fw-bold small mb-1">Địa chỉ:</label>
                                            <input type="text" className="form-control" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="fw-bold small mb-1 text-danger">Chức vụ:</label>
                                            <select className="form-select border-danger" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                                <option value="staff">Nhân viên (Staff)</option>
                                                <option value="manager">Quản lý (Manager)</option>
                                            </select>
                                        </div>

                                        {/* Chỉ hiện phần nhập mật khẩu khi THÊM MỚI */}
                                        {!isEditing && (
                                            <>
                                                <div className="col-md-6 mb-3">
                                                    <label className="fw-bold small mb-1 text-primary">Mật khẩu:</label>
                                                    <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required minLength="6" />
                                                </div>
                                                <div className="col-md-6 mb-3">
                                                    <label className="fw-bold small mb-1 text-primary">Xác nhận mật khẩu:</label>
                                                    <input type="password" className="form-control" value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} required minLength="6" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-light fw-bold flex-fill" onClick={() => setShowUserModal(false)}>Hủy</button>
                                        <button type="submit" className="btn btn-primary fw-bold flex-fill">💾 LƯU THÔNG TIN</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ĐỔI MẬT KHẨU */}
            {showPassModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title fw-bold">🔑 Đổi Pass: {selectedUser?.username}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPassModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 bg-light">
                                <form onSubmit={handlePassSubmit}>
                                    <div className="mb-3">
                                        <label className="fw-bold small mb-1">Mật khẩu HIỆN TẠI (Pass cũ):</label>
                                        <input type="password" className="form-control" value={passData.old_password} onChange={e => setPassData({...passData, old_password: e.target.value})} required />
                                    </div>
                                    <div className="mb-3">
                                        <label className="fw-bold small text-danger mb-1">Mật khẩu MỚI:</label>
                                        <input type="password" className="form-control border-danger" value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})} required minLength="6" />
                                    </div>
                                    <div className="mb-4">
                                        <label className="fw-bold small text-danger mb-1">Xác nhận mật khẩu MỚI:</label>
                                        <input type="password" className="form-control border-danger" value={passData.new_password_confirmation} onChange={e => setPassData({...passData, new_password_confirmation: e.target.value})} required minLength="6" />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-light fw-bold flex-fill" onClick={() => setShowPassModal(false)}>Hủy</button>
                                        <button type="submit" className="btn btn-dark fw-bold flex-fill">CẬP NHẬT MẬT KHẨU</button>
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

export default ManagerStaff;