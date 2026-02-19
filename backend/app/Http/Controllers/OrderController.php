<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\OrderPromotion;
use App\Models\StockLog;
use App\Models\Promotion;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // Hàm tạo đơn hàng
    public function placeOrder(Request $request)
    {
        $request->validate([
            'type' => 'required|in:dine in,take away,delivery',
            'payment_method' => 'required|in:cod,vnpay',
            'items' => 'required|array',
            'temp_price' => 'required|numeric',
            'final_price' => 'required|numeric',
            'member_point_used' => 'nullable|integer|min:0'
        ]);

        try {
            DB::beginTransaction();
            $user = $request->user();
            $isStaff = in_array($user->role, ['staff', 'admin']);

            // Xác định Khách hàng và Nhân viên
            $customerId = $isStaff ? $request->customer_id : $user->id; // Nhân viên truyền id khách lên, hoặc null (khách vãng lai)
            $staffId = $isStaff ? $user->id : null;

            // 1. KIỂM TRA TỒN KHO TRƯỚC KHI TẠO ĐƠN
            foreach ($request->items as $item) {
                // Tính tổng số lượng thay đổi trong kho của item này
                $currentStock = StockLog::where('item_id', $item['id'])->sum('change');
                
                if ($currentStock < $item['quantity']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Sản phẩm '{$item['name']}' đã hết hàng hoặc không đủ số lượng. (Còn lại: {$currentStock})"
                    ], 400);
                }
            }

            // 2. TẠO ĐƠN HÀNG
            $order = Order::create([
                'customer_id' => $customerId ?? $user->id,
                'staff_id' => null,
                'type' => $request->type,
                'deli_address' => $request->type === 'delivery' ? $request->deli_address : null,
                'temp_price' => $request->temp_price,
                'member_point_used' => $request->member_point_used ?? 0,
                'final_price' => $request->final_price,
                'note' => $request->note,
                'status' => 'pending'
            ]);

            // 3. LƯU CHI TIẾT ĐƠN HÀNG (order_detail) VÀ TRỪ KHO (stock_logs)
            foreach ($request->items as $item) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'item_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'] // Giá tại thời điểm mua
                ]);

                StockLog::create([
                    'item_id' => $item['id'],
                    'type' => 'sale',
                    'change' => -abs($item['quantity']), // Trừ kho (số âm)
                    'order_id' => $order->id,
                    'note' => 'Order ID: ' . $order->id
                ]);
            }

            // 4. LƯU KHUYẾN MÃI (order_promotions) NẾU CÓ
            if ($request->promotion_id && $request->discount_amount > 0) {
                OrderPromotion::create([
                    'order_id' => $order->id,
                    'promotion_id' => $request->promotion_id,
                    'discount_amount' => $request->discount_amount
                ]);
            }

            // 5. CẬP NHẬT ĐIỂM THÀNH VIÊN (users)
            $pointsUsed = $request->member_point_used ?? 0;
            $pointsEarned = floor($request->final_price / 10000); // 10.000đ = 1 điểm
            
            // Công thức: Điểm mới = Điểm cũ - Điểm đã dùng + Điểm tích lũy từ đơn này
            $user->member_point = $user->member_point - $pointsUsed + $pointsEarned;
            $user->save();

            DB::commit();

            // 6. XỬ LÝ THANH TOÁN (VNPAY / COD)
            if ($request->payment_method === 'vnpay') {
                $vnp_Url = env('VNP_URL');
                $vnp_Returnurl = env('VNP_RETURN_URL');
                $vnp_TmnCode = env('VNP_TMN_CODE');
                $vnp_HashSecret = env('VNP_HASH_SECRET');

                $vnp_TxnRef = $order->id;
                $vnp_OrderInfo = "Thanh toan don hang Happy Chicken #" . $order->id;
                $vnp_OrderType = 'billpayment';
                $vnp_Amount = $request->final_price * 100; // VNPAY nhận final_price
                $vnp_Locale = 'vn';
                $vnp_IpAddr = $request->ip();

                $inputData = array(
                    "vnp_Version" => "2.1.0",
                    "vnp_TmnCode" => $vnp_TmnCode,
                    "vnp_Amount" => $vnp_Amount,
                    "vnp_Command" => "pay",
                    "vnp_CreateDate" => date('YmdHis'),
                    "vnp_CurrCode" => "VND",
                    "vnp_IpAddr" => $vnp_IpAddr,
                    "vnp_Locale" => $vnp_Locale,
                    "vnp_OrderInfo" => $vnp_OrderInfo,
                    "vnp_OrderType" => $vnp_OrderType,
                    "vnp_ReturnUrl" => $vnp_Returnurl,
                    "vnp_TxnRef" => $vnp_TxnRef
                );

                ksort($inputData);
                $query = "";
                $i = 0;
                $hashdata = "";
                foreach ($inputData as $key => $value) {
                    if ($i == 1) {
                        $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
                    } else {
                        $hashdata .= urlencode($key) . "=" . urlencode($value);
                        $i = 1;
                    }
                    $query .= urlencode($key) . "=" . urlencode($value) . '&';
                }

                $vnp_Url = $vnp_Url . "?" . $query;
                if (isset($vnp_HashSecret)) {
                    $vnpSecureHash = hash_hmac('sha512', $hashdata, $vnp_HashSecret);
                    $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;
                }

                return response()->json(['success' => true, 'payment_url' => $vnp_Url], 200);
            }

            return response()->json(['success' => true, 'message' => 'Tạo đơn hàng thành công!', 'order_id' => $order->id], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Có lỗi: ' . $e->getMessage()], 500);
        }
    }

    // Hàm xử lý kết quả VNPAY trả về
    public function vnpayReturn(Request $request)
    {
        $vnp_SecureHash = $request->vnp_SecureHash;
        $inputData = array();
        foreach ($request->all() as $key => $value) {
            if (substr($key, 0, 4) == "vnp_") {
                $inputData[$key] = $value;
            }
        }
        
        unset($inputData['vnp_SecureHash']);
        ksort($inputData);
        $i = 0;
        $hashData = "";
        foreach ($inputData as $key => $value) {
            if ($i == 1) {
                $hashData = $hashData . '&' . urlencode($key) . "=" . urlencode($value);
            } else {
                $hashData = $hashData . urlencode($key) . "=" . urlencode($value);
                $i = 1;
            }
        }

        $secureHash = hash_hmac('sha512', $hashData, env('VNP_HASH_SECRET'));
        
        $orderId = explode('_', $request->vnp_TxnRef)[0];

        // Kiểm tra chữ ký hợp lệ
        if ($secureHash == $vnp_SecureHash) {
            if ($request->vnp_ResponseCode == '00') {
                // Thanh toán thành công -> Cập nhật status
                Order::where('id', $orderId)->update(['status' => 'paid']);
                // Chuyển hướng về React kèm thông báo thành công
                return redirect('http://localhost:5173/payment-result?status=success&orderId=' . $orderId);
            }
        }
        // Thất bại hoặc hủy thanh toán
        return redirect('http://localhost:5173/payment-result?status=failed&orderId=' . $orderId);
    }

    public function getValidPromotions()
    {
        $today = now()->format('Y-m-d');
        $currentDayOfWeek = now()->dayOfWeek; // Carbon: 0 (CN), 1 (T2), 2 (T3)...

        // Lấy các mã thỏa mãn điều kiện thời gian (active_from <= hôm nay <= active_to)
        $promotions = \App\Models\Promotion::where(function ($query) use ($today) {
            $query->whereNull('active_from')->orWhere('active_from', '<=', $today);
        })->where(function ($query) use ($today) {
            $query->whereNull('active_to')->orWhere('active_to', '>=', $today);
        })->get();

        $validPromotions = [];

        foreach ($promotions as $promo) {
            $isValid = true;

            // Kiểm tra condition_rules (cột JSON)
            if ($promo->condition_rules) {
                $rules = $promo->condition_rules;
                
                // Kiểm tra luật theo thứ trong tuần
                if (isset($rules['allowed_days'])) {
                    if (!in_array($currentDayOfWeek, $rules['allowed_days'])) {
                        $isValid = false;
                    }
                }
            }

            if ($isValid) {
                $validPromotions[] = $promo;
            }
        }

        return response()->json($validPromotions, 200);
    }

    // 1. API Lấy danh sách đơn hàng của User đang đăng nhập
    public function getUserOrders(Request $request)
    {
        $orders = Order::with('orderDetails.item') // Lấy kèm chi tiết món ăn
            ->where('customer_id', $request->user()->id)
            ->orderBy('id', 'desc')
            ->get();
            
        return response()->json($orders, 200);
    }

    // 2. API Xử lý Thanh toán lại / Đổi phương thức
    public function retryPayment(Request $request, $id)
    {
        $order = Order::where('customer_id', $request->user()->id)->find($id);

        if (!$order) return response()->json(['success' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        if ($order->status === 'paid') return response()->json(['success' => false, 'message' => 'Đơn hàng đã thanh toán'], 400);

        if ($request->payment_method === 'vnpay') {
            $vnp_Url = env('VNP_URL');
            $vnp_Returnurl = env('VNP_RETURN_URL');
            $vnp_TmnCode = env('VNP_TMN_CODE');
            $vnp_HashSecret = env('VNP_HASH_SECRET');

            //Thêm time() vào mã đơn để VNPAY không báo lỗi "Giao dịch trùng lặp" khi quét lại
            $vnp_TxnRef = $order->id . '_' . time(); 
            $vnp_Amount = $order->final_price * 100;
            $vnp_Locale = 'vn';
            $vnp_IpAddr = $request->ip();

            $inputData = array(
                "vnp_Version" => "2.1.0",
                "vnp_TmnCode" => $vnp_TmnCode,
                "vnp_Amount" => $vnp_Amount,
                "vnp_Command" => "pay",
                "vnp_CreateDate" => date('YmdHis'),
                "vnp_CurrCode" => "VND",
                "vnp_IpAddr" => $vnp_IpAddr,
                "vnp_Locale" => $vnp_Locale,
                "vnp_OrderInfo" => "Thanh toan lai don hang #" . $order->id,
                "vnp_OrderType" => "billpayment",
                "vnp_ReturnUrl" => $vnp_Returnurl,
                "vnp_TxnRef" => $vnp_TxnRef
            );

            ksort($inputData);
            $query = "";
            $i = 0;
            $hashdata = "";
            foreach ($inputData as $key => $value) {
                if ($i == 1) { $hashdata .= '&' . urlencode($key) . "=" . urlencode($value); } 
                else { $hashdata .= urlencode($key) . "=" . urlencode($value); $i = 1; }
                $query .= urlencode($key) . "=" . urlencode($value) . '&';
            }

            $vnp_Url = $vnp_Url . "?" . $query;
            if (isset($vnp_HashSecret)) {
                $vnp_Url .= 'vnp_SecureHash=' . hash_hmac('sha512', $hashdata, $vnp_HashSecret);
            }
            return response()->json(['success' => true, 'payment_url' => $vnp_Url], 200);
        }

        // Nếu khách đổi ý sang chọn COD
        return response()->json(['success' => true, 'message' => 'Đã xác nhận phương thức Tiền mặt (COD)! Quán sẽ sớm chuẩn bị món.'], 200);
    }
}