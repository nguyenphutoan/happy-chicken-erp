<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Promotion;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class GuestController extends Controller
{
    public function index()
    {
        $items = Item::select(
                'items.id', 
                'items.name', 
                'items.price', 
                'items.img_url',
                'items.created_at',
                DB::raw('COALESCE(SUM(order_detail.quantity), 0) as total_sold')
            )
            ->leftJoin('order_detail', 'items.id', '=', 'order_detail.item_id')
            ->leftJoin('orders', function ($join) {
                $join->on('order_detail.order_id', '=', 'orders.id')
                    ->where('orders.status', '=', 'paid');
            })->where('items.is_active', true)

            ->groupBy('items.id', 'items.name', 'items.price', 'items.img_url', 'items.created_at')
            ->orderBy('total_sold', 'desc')       
            ->orderBy('items.created_at', 'desc') 
            ->paginate(12);

        $today = Carbon::now()->toDateString();
        $activePromotions = Promotion::whereDate('active_from', '<=', $today)
                                    ->whereDate('active_to', '>=', $today)
                                    ->get();

        return response()->json([
            'items' => $items->items(),
            'promotions' => $activePromotions
        ], 200);
    }

    public function getAllItems()
    {
        $items = \App\Models\Item::where('is_active', true)
                                 ->orderBy('created_at', 'desc')
                                 ->paginate(16);
                                 
        return response()->json($items, 200);
    }

    public function getAllPromotions()
    {
        $today = \Carbon\Carbon::now()->toDateString();
        $promotions = Promotion::whereDate('active_to', '>=', $today)
            ->orderBy('active_from', 'asc')
            ->get();

        return response()->json($promotions, 200);
    }

    public function checkItems(Request $request)
    {
        $itemIds = $request->input('ids'); // Mảng các ID sản phẩm trong giỏ
        $items = Item::whereIn('id', $itemIds)->get(['id', 'name', 'price', 'img_url']);
        
        return response()->json($items, 200);
    }

}