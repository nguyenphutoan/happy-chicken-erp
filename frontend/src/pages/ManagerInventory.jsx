import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ManagerInventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Quản lý Modal & Dữ liệu đang chọn
    const [activeModal, setActiveModal] = useState(null); // 'logs', 'stock_in', 'discard', 'adjustment'
    const [selectedItem, setSelectedItem] = useState(null);
    const [stockLogs, setStockLogs] = useState([]);

    // Form states
    const [actionQty, setActionQty] = useState('');
    const [note, setNote] = useState('');
    const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
    const [promoScore, setPromoScore] = useState(0);
    
    // ML states
    const [predictedDemand, setPredictedDemand] = useState(null);
    const [mlWarnings, setMlWarnings] = useState({}); // Lưu cảnh báo tồn kho thấp cho từng món

    const fetchInventory = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://localhost:8000/api/manager/inventory', { 
                headers: { Authorization: `Bearer ${token}` }
            });
            const fetchedItems = res.data;
            setItems(fetchedItems);

            // Fetch ML prediction cho HÔM NAY để hiển thị Badge cảnh báo
            const today = new Date().toISOString().split('T')[0];
            const warnings = {};
            
            await Promise.all(fetchedItems.map(async (item) => {
                try {
                    const mlRes = await axios.post('http://localhost:8001/predict_realtime', {
                        item_id: item.id,
                        target_date: today,
                        promo_intensity_score: 0
                    });
                    
                    const aiResult = mlRes.data.predicted_demand || mlRes.data.prediction || mlRes.data.predicted_quantity || mlRes.data.predicted_qty || mlRes.data.qty || 0;
                    const demand = Math.round(Number(aiResult));
                    const currentStock = Number(item.current_stock) || 0;
                    
                    if (currentStock < demand) {
                        warnings[item.id] = demand;
                    }
                // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    console.error('Không kết nối được ML Service cho item:', item.id);
                }
            }));
            setMlWarnings(warnings);

        } catch (error) {
            console.error('Lỗi lấy dữ liệu kho:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // Gọi API Python dự đoán khi đang ở Modal Nhập Kho
    const handlePredictDemand = async () => {
        try {
            const res = await axios.post('http://localhost:8001/predict_realtime', {
                item_id: selectedItem.id,
                target_date: targetDate,
                promo_intensity_score: Number(promoScore) || 0
            });
            
            const aiResult = res.data.predicted_demand || res.data.prediction || res.data.predicted_quantity || res.data.predicted_qty || res.data.qty || 0;
            
            const demand = Math.round(Number(aiResult));
            setPredictedDemand(demand);
            
            // Tính số gợi ý nhập
            const currentStock = Number(selectedItem.current_stock) || 0;
            const suggest = Math.max(0, demand - currentStock);
            setActionQty(suggest); 
            
        } catch (e) {
            console.error("Lỗi AI:", e);
            alert("Lỗi kết nối đến ML Service Python. Hãy kiểm tra tab Console (F12).");
        }
    };

    // Mở Modal Xem Logs
    const handleOpenLogs = async (item) => {
        setSelectedItem(item);
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:8000/api/manager/inventory/${item.id}/logs`, { 
            headers: { Authorization: `Bearer ${token}` }
        });
        setStockLogs(res.data);
        setActiveModal('logs');
    };

    // Mở Modal thao tác
    const handleOpenAction = (item, type) => {
        setSelectedItem(item);
        setActiveModal(type);
        setActionQty('');
        setNote('');
        setPredictedDemand(null);
    };

    // Submit thao tác kho
    const handleSubmitAction = async (e) => {
        e.preventDefault();
        
        let changeValue = Number(actionQty);
        let finalNote = note;

        // Xử lý riêng logic cho Kiểm kho (Adjustment)
        if (activeModal === 'adjustment') {
            const actualCount = Number(actionQty);
            if (actualCount === selectedItem.current_stock) {
                alert("Tồn kho thực tế khớp với hệ thống. Không cần điều chỉnh!");
                return setActiveModal(null);
            }
            if (!note) {
                return alert("Tồn kho bị lệch! Vui lòng bắt buộc nhập Ghi chú nguyên nhân.");
            }
            changeValue = actualCount - selectedItem.current_stock; // Nếu đếm < hệ thống => số âm. Nếu đếm > hệ thống => số dương.
            finalNote = `[Lệch ${changeValue}] ` + note;
        }

        const token = localStorage.getItem('token');
        try {
            await axios.post('http://localhost:8000/api/manager/inventory/action', {
                item_id: selectedItem.id,
                type: activeModal,
                change: changeValue,
                note: finalNote
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            alert('Cập nhật kho thành công!');
            setActiveModal(null);
            fetchInventory();
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert('Lỗi cập nhật kho!');
        }
    };

    return (
        <div className="container-fluid py-4 px-4 min-vh-100 bg-light">
            <h3 className="fw-bold mb-4 text-dark">📦 QUẢN LÝ TỒN KHO & DỰ ĐOÁN AI</h3>
            
            <div className="card shadow-sm border-0">
                <div className="card-body p-0 table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-dark">
                            <tr>
                                <th className="px-3">ID</th>
                                <th>Sản Phẩm</th>
                                <th className="text-center">Tồn Kho HT</th>
                                <th>Cảnh Báo AI (Hôm nay)</th>
                                <th className="text-center">Thao Tác Kho</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5" className="text-center py-4">Đang tải...</td></tr> : items.map(item => (
                                <tr key={item.id}>
                                    <td className="px-3 fw-bold">#{item.id}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <img src={item.img_url} alt={item.name} style={{width: 40, height: 40, objectFit: 'cover', borderRadius: 4}} />
                                            <span className="fw-bold">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="text-center fw-bold fs-5 text-primary">{item.current_stock}</td>
                                    <td>
                                        {mlWarnings[item.id] ? (
                                            <span className="badge bg-danger p-2">
                                                ⚠️ AI Dự đoán bán: {mlWarnings[item.id]} (Thiếu hàng!)
                                            </span>
                                        ) : (
                                            <span className="badge bg-success p-2">✅ Đủ cung ứng</span>
                                        )}
                                    </td>
                                    <td className="text-center">
                                        <div className="btn-group shadow-sm">
                                            <button className="btn btn-sm btn-primary fw-bold" onClick={() => handleOpenAction(item, 'stock_in')}>📥 Nhập</button>
                                            <button className="btn btn-sm btn-danger fw-bold" onClick={() => handleOpenAction(item, 'discard')}>🗑️ Hủy</button>
                                            <button className="btn btn-sm btn-warning fw-bold text-dark" onClick={() => handleOpenAction(item, 'adjustment')}>⚖️ Kiểm đếm</button>
                                            <button className="btn btn-sm btn-dark fw-bold" onClick={() => handleOpenLogs(item)}>🕒 Logs</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {activeModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className={`modal-dialog modal-dialog-centered ${activeModal === 'logs' ? 'modal-lg' : ''}`}>
                        <div className="modal-content border-0 shadow">
                            
                            <div className={`modal-header border-0 text-white ${activeModal === 'stock_in' ? 'bg-primary' : activeModal === 'discard' ? 'bg-danger' : activeModal === 'adjustment' ? 'bg-warning text-dark' : 'bg-dark'}`}>
                                <h5 className="modal-title fw-bold">
                                    {activeModal === 'stock_in' && '📥 NHẬP KHO'}
                                    {activeModal === 'discard' && '🗑️ HỦY SẢN PHẨM'}
                                    {activeModal === 'adjustment' && '⚖️ KIỂM KHO THỰC TẾ'}
                                    {activeModal === 'logs' && '🕒 LỊCH SỬ KHO'}
                                </h5>
                                <button type="button" className={`btn-close ${activeModal !== 'adjustment' && 'btn-close-white'}`} onClick={() => setActiveModal(null)}></button>
                            </div>
                            
                            <div className="modal-body p-4">
                                {activeModal !== 'logs' ? (
                                    <form onSubmit={handleSubmitAction}>
                                        <div className="mb-3">
                                            <label className="text-muted small">Sản phẩm đang chọn:</label>
                                            <input type="text" className="form-control fw-bold" value={selectedItem?.name} disabled />
                                        </div>
                                        
                                        <div className="mb-3">
                                            <label className="text-muted small">Tồn kho hiện tại trong máy:</label>
                                            <input type="text" className="form-control text-primary fw-bold" value={selectedItem?.current_stock} disabled />
                                        </div>

                                        {/* GIAO DIỆN RIÊNG CHO TỪNG TYPE */}
                                        
                                        {/* 1. GIAO DIỆN NHẬP KHO */}
                                        {activeModal === 'stock_in' && (
                                            <div className="card bg-light border-primary mb-3">
                                                <div className="card-body">
                                                    <h6 className="fw-bold text-primary mb-3">🤖 AI Gợi ý nhập hàng</h6>
                                                    <div className="row g-2 mb-2">
                                                        <div className="col-8">
                                                            <label className="small">Nhập hàng cho ngày</label>
                                                            <input type="date" className="form-control" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} required />
                                                        </div>
                                                        <div className="col-4">
                                                            <label className="small">Mức độ KM (0-3):</label>
                                                            <input type="number" min="0" max="3" className="form-control" value={promoScore} onChange={(e) => setPromoScore(e.target.value)} required />
                                                        </div>
                                                    </div>
                                                    <button type="button" className="btn btn-outline-primary btn-sm w-100 fw-bold mb-2" onClick={handlePredictDemand}>
                                                        ✨ Bấm để AI Dự đoán nhu cầu
                                                    </button>
                                                    <p>Mức độ KM: <br/>
                                                        0: Ngày hôm đó không có khuyến mãi. <br/>
                                                        1-3: Ngày hôm đó có chương trình khuyến mãi nhỏ-mạnh.
                                                    </p>
                                                    {predictedDemand !== null && (
                                                        <div className="alert alert-success py-2 mb-0 small">
                                                            Dự đoán bán được: <b>{predictedDemand} sp</b>.<br/>
                                                            AI Gợi ý nhập thêm: <b className="text-danger">{Math.max(0, predictedDemand - selectedItem.current_stock)} sp</b>.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* FORM NHẬP SỐ LƯỢNG & GHI CHÚ CHUNG */}
                                        <div className="mb-3">
                                            <label className="fw-bold">
                                                {activeModal === 'stock_in' && 'Số lượng CHỐT NHẬP:'}
                                                {activeModal === 'discard' && 'Số lượng HỦY BỎ:'}
                                                {activeModal === 'adjustment' && 'Số lượng ĐẾM THỰC TẾ:'}
                                            </label>
                                            <input type="number" min="0" className="form-control form-control-lg fw-bold" value={actionQty} onChange={(e) => setActionQty(e.target.value)} required />
                                        </div>

                                        <div className="mb-4">
                                            <label className="fw-bold text-muted small">Ghi chú (Lý do):</label>
                                            <textarea className="form-control" rows="2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhập ghi chú..."></textarea>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <button type="submit" className={`btn fw-bold w-100 ${activeModal === 'stock_in' ? 'btn-primary' : activeModal === 'discard' ? 'btn-danger' : 'btn-warning'}`}>
                                                XÁC NHẬN LƯU
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* 2. GIAO DIỆN LỊCH SỬ LOGS */
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="table table-sm small table-bordered">
                                            <thead className="table-light sticky-top">
                                                <tr>
                                                    <th>Thời gian</th>
                                                    <th>Hành động</th>
                                                    <th>Biến động</th>
                                                    <th>Ghi chú / Order ID</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stockLogs.length === 0 ? <tr><td colSpan="4" className="text-center">Chưa có lịch sử.</td></tr> : stockLogs.map(log => (
                                                    <tr key={log.id}>
                                                        <td>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                                                        <td>
                                                            <span className={`badge ${log.type === 'stock_in' ? 'bg-primary' : log.type === 'sale' ? 'bg-success' : log.type === 'discard' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                                {log.type.toUpperCase()}
                                                            </span>
                                                        </td>
                                                        <td className={`fw-bold ${log.change < 0 ? 'text-danger' : 'text-success'}`}>
                                                            {log.change > 0 ? `+${log.change}` : log.change}
                                                        </td>
                                                        <td className="text-muted">{log.note || (log.order_id ? `Đơn hàng #${log.order_id}` : '')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerInventory;