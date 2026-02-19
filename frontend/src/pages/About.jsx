const About = () => (
    <div className="container py-5">
        <div className="row align-items-center">
            <div className="col-md-6">
                <h2 className="fw-bold mb-4" style={{ color: '#fd7e14' }}>Về Happy Chicken</h2>
                <p className="lead">Chào mừng bạn đến với thiên đường gà rán giòn tan!</p>
                <p>Với công thức bí truyền và nguyên liệu tươi sạch 100%, Happy Chicken cam kết mang đến những bữa ăn không chỉ ngon mà còn đầy đủ dinh dưỡng.</p>
                <p>Chúng tôi luôn nỗ lực để trở thành chuỗi cửa hàng gà rán được yêu thích nhất tại Việt Nam.</p>
            </div>
            <div className="col-md-6 text-center">
                <img src="/logo.png" className="img-fluid rounded-circle shadow" style={{ maxWidth: '300px' }} alt="About" />
            </div>
        </div>
    </div>
);
export default About;