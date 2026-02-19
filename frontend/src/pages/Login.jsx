import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/api/login", {
        username,
        password,
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("role", response.data.role);

        const role = response.data.role;
        if (role === "manager") {
          navigate("/manager/dashboard");
        } else if (role === "staff") {
          navigate("/staff/pos");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      // Lấy câu thông báo lỗi từ Laravel gửi sang
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Có lỗi xảy ra, không thể kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div
            className="card shadow-sm border-0"
            style={{ borderTop: "5px solid #fd7e14" }}
          >
            <div className="card-body p-4">
              <h2
                className="text-center mb-4 fw-bold"
                style={{ color: "#fd7e14" }}
              >
                Đăng Nhập
              </h2>
              <p className="text-center mt-3 text-muted">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-decoration-none fw-bold"
                  style={{ color: "#fd7e14" }}
                >
                  Đăng ký ngay
                </Link>
              </p>

              {/* Khung hiển thị lỗi */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Tên đăng nhập</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Nhập username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-medium">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-warning btn-lg w-100 fw-bold shadow-sm"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
