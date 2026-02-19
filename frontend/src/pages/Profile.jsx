import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    // Thêm State quản lý form Đổi mật khẩu
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loadingPassword, setLoadingPassword] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setFormData({
                full_name: parsedUser.full_name || '',
                email: parsedUser.email || '',
                phone: parsedUser.phone || '',
                address: parsedUser.address || ''
            });
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await axios.put('http://localhost:8000/api/profile', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert(res.data.message);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                setUser(res.data.user);
                setIsEditing(false);
            }
        } catch (error) {
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || 'Vui lòng kiểm tra lại thông tin.'));
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý Đổi Mật Khẩu
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        // Kiểm tra khớp mật khẩu ở Frontend trước khi gửi
        if (passwordData.new_password !== passwordData.confirm_password) {
            return alert('Mật khẩu xác nhận không khớp!');
        }

        setLoadingPassword(true);
        const token = localStorage.getItem('token');

        try {
            const res = await axios.put('http://localhost:8000/api/profile/password', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password,
                new_password_confirmation: passwordData.confirm_password 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('Đổi mật khẩu thành công!');
                // Xóa rỗng form sau khi đổi xong
                setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
            }
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || 'Mật khẩu cũ không đúng!'));
        } finally {
            setLoadingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không? Toàn bộ điểm tích lũy và lịch sử đơn hàng sẽ bị mất.')) {
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const res = await axios.delete('http://localhost:8000/api/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert(res.data.message);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Không thể xóa tài khoản lúc này.');
        }
    };

    if (!user) return <div className="text-center py-5">Đang tải thông tin...</div>;

    return (
        <div className="container py-5">
            <h2 className="fw-bold mb-4" style={{ color: '#fd7e14' }}>Thông Tin Cá Nhân</h2>
            
            <div className="row">
                <div className="col-md-4 mb-4">
                    <div className="card shadow-sm border-0 text-center p-4">
                        <div className="mb-3">
                            <div className="bg-warning text-white rounded-circle d-inline-flex justify-content-center align-items-center fw-bold" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                                {user.full_name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <h5 className="fw-bold mb-1">{user.username}</h5>
                        <p className="text-muted small mb-3">Vai trò: {user.role === 'customer' ? 'Khách hàng' : user.role.toUpperCase()}</p>
                        
                        <div className="p-3 bg-light rounded text-start">
                            <div className="d-flex justify-content-between mb-2">
                                <span className="fw-medium">Điểm tích lũy:</span>
                                <span className="fw-bold text-warning">⭐ {user.member_point}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="fw-medium">Trạng thái:</span>
                                <span className="badge bg-success">Đang hoạt động</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    {/*CẬP NHẬT THÔNG TIN CÁ NHÂN */}
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                            <h5 className="fw-bold mb-0">Hồ sơ của tôi</h5>
                            {!isEditing && (
                                <button className="btn btn-sm btn-outline-warning fw-bold" onClick={() => setIsEditing(true)}>
                                    ✏️ Chỉnh sửa
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdate}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label text-muted small">Họ và tên</label>
                                        <input type="text" name="full_name" className="form-control" value={formData.full_name} onChange={handleChange} disabled={!isEditing} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label text-muted small">Số điện thoại</label>
                                        <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} disabled={!isEditing} required />
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label text-muted small">Địa chỉ Email</label>
                                        <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} disabled={!isEditing} required />
                                    </div>
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label text-muted small">Địa chỉ giao hàng mặc định</label>
                                        <textarea name="address" className="form-control" rows="2" value={formData.address} onChange={handleChange} disabled={!isEditing}></textarea>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-warning fw-bold px-4" disabled={loading}>
                                            {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                                        </button>
                                        <button type="button" className="btn btn-light fw-bold px-4" onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                full_name: user.full_name, email: user.email, phone: user.phone, address: user.address || ''
                                            });
                                        }}>
                                            Hủy
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/*ĐỔI MẬT KHẨU */}
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0 text-danger">🔒 Thay Đổi Mật Khẩu</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleUpdatePassword}>
                                <div className="row">
                                    <div className="col-md-12 mb-3">
                                        <label className="form-label text-muted small">Mật khẩu hiện tại</label>
                                        <input type="password" name="old_password" className="form-control" value={passwordData.old_password} onChange={handlePasswordChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label text-muted small">Mật khẩu mới</label>
                                        <input type="password" name="new_password" className="form-control" value={passwordData.new_password} onChange={handlePasswordChange} required minLength="6" />
                                    </div>
                                    <div className="col-md-6 mb-4">
                                        <label className="form-label text-muted small">Xác nhận mật khẩu mới</label>
                                        <input type="password" name="confirm_password" className="form-control" value={passwordData.confirm_password} onChange={handlePasswordChange} required minLength="6" />
                                    </div>
                                </div>
                                <div>
                                    <button type="submit" className="btn btn-dark fw-bold px-4" disabled={loadingPassword}>
                                        {loadingPassword ? 'Đang xử lý...' : 'Cập Nhật Mật Khẩu'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="text-end mb-5">
                        <button type="button" className="btn btn-outline-danger btn-sm fw-bold" onClick={handleDeleteAccount}>
                            🗑️ Xóa tài khoản vĩnh viễn
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;