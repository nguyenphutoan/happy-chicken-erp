import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '', full_name: '', email: '', phone: '', password: '', password_confirmation: ''
    });
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            const res = await axios.post('http://localhost:8000/api/register', formData);
            if (res.data.success) {
                alert('Đăng ký thành công! Hãy đăng nhập nhé.');
                navigate('/login');
            }
        } catch (err) {
            if (err.response && err.response.data.errors) {
                setErrors(err.response.data.errors);
            }
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow border-0" style={{ borderTop: '5px solid #fd7e14' }}>
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4 fw-bold" style={{ color: '#fd7e14' }}>Đăng Ký Tài Khoản</h2>
                            <form onSubmit={handleRegister}>
                                <div className="mb-3">
                                    <label className="form-label">Họ tên</label>
                                    <input type="text" name="full_name" className="form-control" onChange={handleChange} required />
                                    {errors.full_name && <small className="text-danger">{errors.full_name[0]}</small>}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Tên đăng nhập</label>
                                    <input type="text" name="username" className="form-control" onChange={handleChange} required />
                                    {errors.username && <small className="text-danger">{errors.username[0]}</small>}
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Email</label>
                                        <input type="email" name="email" className="form-control" onChange={handleChange} required />
                                        {errors.email && <small className="text-danger">{errors.email[0]}</small>}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Số điện thoại</label>
                                        <input type="text" name="phone" className="form-control" onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Mật khẩu</label>
                                    <input type="password" name="password" className="form-control" onChange={handleChange} required />
                                    {errors.password && <small className="text-danger">{errors.password[0]}</small>}
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Xác nhận mật khẩu</label>
                                    <input type="password" name="password_confirmation" className="form-control" onChange={handleChange} required />
                                </div>
                                <button type="submit" className="btn btn-warning w-100 fw-bold py-2 shadow-sm">ĐĂNG KÝ NGAY</button>
                                <p className="text-center mt-3">Đã có tài khoản? <Link to="/login" className="text-decoration-none fw-bold" style={{ color: '#fd7e14' }}>Đăng nhập</Link></p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Register;