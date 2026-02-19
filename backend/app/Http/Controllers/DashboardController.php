<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        // Lọc theo khoảng thời gian: day (hôm nay), month (tháng này), year (năm nay)
        $period = $request->query('period', 'month'); 
        $now = Carbon::now();

        if ($period === 'day') {
            $startDate = $now->copy()->startOfDay();
        } elseif ($period === 'year') {
            $startDate = $now->copy()->startOfYear();
        } else {
            $startDate = $now->copy()->startOfMonth(); // Mặc định là tháng này
        }

        // 1. Tổng doanh thu (Chỉ tính đơn đã thanh toán)
        $totalRevenue = Order::where('status', 'paid')->where('created_at', '>=', $startDate)->sum('final_price');

        // 2. Tổng số đơn hàng
        $totalOrders = Order::where('status', 'paid')->where('created_at', '>=', $startDate)->count();

        // 3. Các món bán chạy nhất
        $topProducts = OrderDetail::join('orders', 'order_detail.order_id', '=', 'orders.id')
            ->join('items', 'order_detail.item_id', '=', 'items.id')
            ->where('orders.status', 'paid')
            ->where('orders.created_at', '>=', $startDate)
            ->select('items.name', DB::raw('SUM(order_detail.quantity) as total_sold'), DB::raw('SUM(order_detail.unit_price * order_detail.quantity) as revenue'))
            ->groupBy('items.id', 'items.name')
            ->orderBy('total_sold', 'desc')
            ->take(5) // Lấy top 5
            ->get();

        // 4. Dữ liệu vẽ biểu đồ
        $chartData = [];
        if ($period === 'year') {
            // Biểu đồ 12 tháng
            for ($i = 1; $i <= 12; $i++) {
                $rev = Order::where('status', 'paid')->whereYear('created_at', $now->year)->whereMonth('created_at', $i)->sum('final_price');
                $chartData[] = ['name' => "Tháng $i", 'DoanhThu' => $rev];
            }
        } else {
            // Biểu đồ 7 ngày gần nhất
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i);
                $rev = Order::where('status', 'paid')->whereDate('created_at', $date)->sum('final_price');
                $chartData[] = ['name' => $date->format('d/m'), 'DoanhThu' => $rev];
            }
        }

        return response()->json([
            'totalRevenue' => $totalRevenue,
            'totalOrders' => $totalOrders,
            'topProducts' => $topProducts,
            'chartData' => $chartData
        ]);
    }
}