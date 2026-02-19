<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Order;
use App\Models\StockLog;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    // 1. Tìm kiếm khách hàng bằng SĐT hoặc Email
    public function searchCustomer(Request $request)
    {
        $keyword = $request->query('q');
        if (!$keyword) return response()->json(null);

        $customer = User::where('role', 'customer')
            ->where(function($query) use ($keyword) {
                $query->where('phone', $keyword)->orWhere('email', $keyword);
            })->select('id', 'full_name', 'phone', 'email', 'member_point')->first();

        return response()->json($customer, 200);
    }

    // 2. Lấy danh sách đơn pending & đơn online
    public function getPendingOrders(Request $request)
    {
        $orders = Order::with(['orderDetails.item', 'customer'])
            ->whereIn('status', ['pending', 'paid'])
            ->where(function($query) {
                $query->whereNull('staff_id') // Đơn khách tự đặt online chưa ai xử lý
                      ->orWhere('status', 'pending'); // Hoặc đơn đang chờ xử lý
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders, 200);
    }

    // 3. Cập nhật trạng thái đơn (Xác nhận, Hủy, Hoàn tiền)
    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:paid,pending,cancelled,refunded']);
        $newStatus = $request->status;
        $staffId = $request->user()->id;

        try {
            DB::beginTransaction();
            $order = Order::with('orderDetails')->findOrFail($id);

            // Nếu đơn đã hủy/hoàn tiền thì không cho đổi nữa
            if (in_array($order->status, ['cancelled', 'refunded'])) {
                return response()->json(['success' => false, 'message' => 'Đơn hàng này đã bị hủy hoặc hoàn tiền trước đó.'], 400);
            }

            // NẾU HỦY HOẶC HOÀN TIỀN: Trả lại tồn kho và trả lại điểm
            if (in_array($newStatus, ['cancelled', 'refunded'])) {
                // 1. Hoàn lại kho
                foreach ($order->orderDetails as $detail) {
                    StockLog::create([
                        'item_id' => $detail->item_id,
                        'type' => 'stock_in',
                        'change' => $detail->quantity, // Số dương (cộng lại kho)
                        'order_id' => $order->id,
                        'note' => "Order {$newStatus}. Order ID: {$order->id}"
                    ]);
                }

                // 2. Hoàn lại điểm cho khách (nếu có khách)
                if ($order->customer_id) {
                    $customer = User::find($order->customer_id);
                    $pointsUsed = $order->member_point_used;
                    $pointsEarned = floor($order->final_price / 10000);
                    // Lấy lại điểm đã dùng, trừ đi điểm đã cộng ảo
                    $customer->member_point = $customer->member_point + $pointsUsed - $pointsEarned;
                    $customer->save();
                }
            }

            // Cập nhật đơn hàng
            $order->status = $newStatus;
            $order->staff_id = $staffId; // Ghi nhận nhân viên xử lý
            $order->save();

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Cập nhật đơn hàng thành công!'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // 4. Lấy lịch sử toàn bộ đơn hàng (có lọc theo ngày)
    public function getOrderHistory(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $query = Order::with(['orderDetails.item', 'customer']);

        // Nếu có truyền ngày, thì lọc theo ngày (từ 00:00:00 của start_date đến 23:59:59 của end_date)
        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        } elseif ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        } elseif ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        } else {
            // Mặc định nếu không chọn ngày thì lấy đơn của ngày hôm nay
            $query->whereDate('created_at', now()->toDateString());
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json($orders, 200);
    }

    // 5. Tạo link thanh toán VNPAY cho đơn đang chờ
    public function generateVnpayUrl(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        if ($order->status === 'paid') {
            return response()->json(['success' => false, 'message' => 'Đơn hàng này đã được thanh toán!'], 400);
        }

        $vnp_Url = env('VNP_URL');
        $vnp_Returnurl = env('VNP_RETURN_URL');
        $vnp_TmnCode = env('VNP_TMN_CODE');
        $vnp_HashSecret = env('VNP_HASH_SECRET');

        // Thêm time() để tránh lỗi trùng lặp mã giao dịch nếu tạo lại nhiều lần
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
            "vnp_OrderInfo" => "Thanh toan don hang #" . $order->id,
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
}