import {Link} from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-dark text-white text-center py-4 mt-auto">
            <div className="container">
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <h5>Khảo sát</h5>
                        <p>Ý kiến của bạn giúp chúng tôi hoàn thiện hơn!</p>
                        <Link 
                            to="/survey" 
                            className="btn btn-warning btn-sm fw-bold shadow-sm"
                            style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14', color: 'white' }}
                        >
                            Khảo sát ngay!
                        </Link>
                    </div>
                    <div className="col-md-4 mb-3">
                        <h5>Liên hệ</h5>
                        <p>Email: contact@happychicken.com<br/>SĐT: 0123 456 789</p>
                    </div>
                    <div className="col-md-4 mb-3">
                        <h5>Theo dõi</h5>
                        <p>Facebook | Instagram | X(Twitter)</p>
                    </div>
                </div>
                <hr className="border-secondary" />
                <p className="mb-0">&copy; 2026 HappyChicken. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;