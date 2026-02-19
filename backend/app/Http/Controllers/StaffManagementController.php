<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class StaffManagementController extends Controller
{
    // 1. Lấy danh sách nhân sự (staff & manager)
    public function index()
    {
        $staff = User::whereIn('role', ['staff', 'manager'])
                     ->orderBy('id', 'desc')
                     ->get();
        return response()->json($staff, 200);
    }

    // 2. Thêm mới nhân viên
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users',
            'full_name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'role' => 'required|in:staff,manager',
            'password' => 'required|min:6|confirmed' // Bắt buộc nhập password_confirmation
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_active'] = 1; 

        User::create($validated);
        return response()->json(['success' => true, 'message' => 'Thêm nhân sự thành công!']);
    }

    // 3. Cập nhật thông tin cơ bản
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username,' . $id,
            'full_name' => 'required|string|max:100',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
            'role' => 'required|in:staff,manager',
            'member_point' => 'nullable|integer'
        ]);

        $user->update($validated);
        return response()->json(['success' => true, 'message' => 'Cập nhật thông tin thành công!']);
    }

    // 4. Đổi mật khẩu (Cần Pass cũ, Pass mới 2 lần)
    public function updatePassword(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|min:6|confirmed'
        ]);

        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Mật khẩu cũ không chính xác!'], 400);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['success' => true, 'message' => 'Đổi mật khẩu thành công!']);
    }

    // 5. Cập nhật trạng thái Đi làm / Nghỉ việc
    public function toggleActive($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save(); 

        $statusMsg = $user->is_active ? 'Khôi phục nhân sự' : 'Đã đánh dấu Nghỉ việc';
        return response()->json(['success' => true, 'message' => "$statusMsg thành công!"]);
    }
}