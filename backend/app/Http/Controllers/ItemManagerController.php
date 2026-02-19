<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use Illuminate\Support\Facades\File;

class ItemManagerController extends Controller
{
    // 1. Lấy danh sách sản phẩm
    public function index()
    {
        $items = Item::orderBy('id', 'desc')->get();
        return response()->json($items, 200);
    }

    // 2. Thêm mới sản phẩm
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048' // Tối đa 2MB
        ]);

        $item = new Item();
        $item->name = $request->name;
        $item->price = $request->price;

        // Xử lý Upload ảnh
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            // Gắn time() để chống trùng tên ảnh
            $filename = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName()); 
            $file->move(public_path('images'), $filename);
            
            // Lưu URL đầy đủ vào Database
            $item->img_url = url('http://localhost:8000/images/' . $filename);
        }

        $item->save();
        return response()->json(['success' => true, 'message' => 'Thêm sản phẩm thành công!']);
    }

    // 3. Cập nhật sản phẩm
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $item = Item::findOrFail($id);
        $item->name = $request->name;
        $item->price = $request->price;

        // Nếu có chọn ảnh mới thì mới xử lý thay đổi ảnh
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->move(public_path('images'), $filename);
            
            $item->img_url = url('images/' . $filename);
        }

        $item->save();
        return response()->json(['success' => true, 'message' => 'Cập nhật thành công!']);
    }

    //ngừng bán/bán lại
    public function toggleActive($id)
    {
        $item = Item::findOrFail($id);
        $item->is_active = !$item->is_active;
        $item->save();

        $statusName = $item->is_active ? 'Mở bán lại' : 'Ngừng bán';
        return response()->json(['success' => true, 'message' => "Đã $statusName sản phẩm thành công!"]);
    }
}