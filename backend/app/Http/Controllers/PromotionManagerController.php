<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Promotion;

class PromotionManagerController extends Controller
{
    // 1. Lấy danh sách khuyến mãi
    public function index()
    {
        // Load kèm thông tin sản phẩm (nếu có) thông qua relationship requiredProduct
        $promotions = Promotion::with('requiredProduct')->orderBy('id', 'desc')->get();
        return response()->json($promotions, 200);
    }

    // 2. Thêm mới khuyến mãi
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'nullable|string',
            'promotion_intensity' => 'required|in:low,medium,high',
            'type' => 'required|in:order_total,required_product',
            'min_order_value' => 'nullable|numeric',
            'required_product_id' => 'nullable|exists:items,id',
            'discount_type' => 'required|in:percentage,fixed_amount',
            'percentage_disc' => 'nullable|integer',
            'max_disc' => 'required|numeric',
            'active_from' => 'required|date',
            'active_to' => 'required|date',
            'condition_rules' => 'nullable|array' // Laravel tự chuyển thành JSON
        ]);

        Promotion::create($validated);
        return response()->json(['success' => true, 'message' => 'Thêm khuyến mãi thành công!']);
    }

    // 3. Cập nhật khuyến mãi
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'content' => 'nullable|string',
            'promotion_intensity' => 'required|in:low,medium,high',
            'type' => 'required|in:order_total,required_product',
            'min_order_value' => 'nullable|numeric',
            'required_product_id' => 'nullable|exists:items,id',
            'discount_type' => 'required|in:percentage,fixed_amount',
            'percentage_disc' => 'nullable|integer',
            'max_disc' => 'required|numeric',
            'active_from' => 'required|date',
            'active_to' => 'required|date',
            'condition_rules' => 'nullable|array'
        ]);

        $promo = Promotion::findOrFail($id);
        $promo->update($validated);
        return response()->json(['success' => true, 'message' => 'Cập nhật khuyến mãi thành công!']);
    }

    // 4. Xóa khuyến mãi
    public function destroy($id)
    {
        $promo = Promotion::findOrFail($id);
        $promo->delete();
        return response()->json(['success' => true, 'message' => 'Xóa khuyến mãi thành công!']);
    }
}