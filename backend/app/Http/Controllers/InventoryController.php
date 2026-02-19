<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\StockLog;

class InventoryController extends Controller
{
    // 1. Lấy danh sách sản phẩm & tính Tồn kho hiện tại
    public function getInventory()
    {
        $items = Item::all();
        
        foreach ($items as $item) {
            // Vì cột 'change' đã lưu sẵn giá trị âm/dương, chỉ cần tính tổng là ra số tồn thực tế!
            // Dùng (int) để đảm bảo nếu chưa có log nào thì trả về 0 thay vì null
            $item->current_stock = (int) StockLog::where('item_id', $item->id)->sum('change');
        }

        return response()->json($items, 200);
    }

    // 2. Lấy lịch sử Logs của 1 sản phẩm
    public function getStockLogs($itemId)
    {
        $logs = StockLog::where('item_id', $itemId)->orderBy('created_at', 'desc')->get();
        return response()->json($logs, 200);
    }

    // 3. Ghi log Nhập kho, Hủy hàng, Điều chỉnh
    public function handleStockAction(Request $request)
    {
        $request->validate([
            'item_id' => 'required|exists:items,id',
            'type' => 'required|in:stock_in,discard,adjustment',
            'change' => 'required|numeric',
            'note' => 'nullable|string'
        ]);

        $changeValue = $request->change;

        if ($request->type === 'stock_in') {
            // Nhập kho: Luôn luôn ép thành số DƯƠNG (dù frontend có gửi nhầm số âm)
            $changeValue = abs($changeValue); 
        } elseif ($request->type === 'discard') {
            // Hủy hàng: Luôn luôn ép thành số ÂM
            $changeValue = -abs($changeValue); 
        }
        // Nếu là 'adjustment', giữ nguyên giá trị Frontend gửi (vì có thể lệch âm hoặc lệch dương)

        StockLog::create([
            'item_id' => $request->item_id,
            'type' => $request->type,
            'change' => $changeValue,
            'order_id' => null,
            'note' => $request->note
        ]);

        return response()->json(['success' => true, 'message' => 'Cập nhật kho thành công!'], 200);
    }
}