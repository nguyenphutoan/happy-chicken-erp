<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

class AuthController extends Controller
{

    public function showLoginForm()
    {
    if (Auth::check()) {
    return $this->redirectBasedOnRole(Auth::user()->role);
    }

    return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
    $credentials = $request->validate([
    'username' => ['required', 'string'],
    'password' => ['required', 'string'],
    ]);

    if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password'], 'is_active' => 1])) {
    $request->session()->regenerate();

    return $this->redirectBasedOnRole(Auth::user()->role);
    }

    return back()->withErrors([
    'username' => 'Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khóa.',
    ])->onlyInput('username');
    }

    public function logout(Request $request): RedirectResponse
    {
    Auth::logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect('/');
    }

    private function redirectBasedOnRole(string $role): RedirectResponse
    {
    return match($role) {
    'manager' => redirect()->route('manager.dashboard'),
    'staff' => redirect()->route('staff.pos'),
    default => redirect()->route('home'),
    };
    }

    public function loginApi(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        // Kiểm tra đăng nhập
        if (Auth::attempt(['username' => $credentials['username'], 'password' => $credentials['password'], 'is_active' => 1])) {
           /** @var \App\Models\User $user */
            $user = Auth::user();
            
            // Tạo token bằng Laravel Sanctum (dùng để React giữ trạng thái đăng nhập)
            $token = $user->createToken('react_auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Đăng nhập thành công',
                'user' => $user,
                'token' => $token,
                'role' => $user->role
            ], 200);
        }

        // Đăng nhập thất bại
        return response()->json([
            'success' => false,
            'message' => 'Thông tin đăng nhập không chính xác hoặc tài khoản đã bị khóa.'
        ], 401);
    }

    public function registerApi(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|unique:users,username',
            'password' => 'required|string|min:6|confirmed', // password_confirmation
            'full_name' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email|unique:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'role' => 'customer', // Mặc định role là customer
            'is_active' => true,
            'member_point' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Đăng ký tài khoản thành công!',
            'user' => $user
        ], 201);
    }

    // Cập nhật thông tin cá nhân
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            // Đảm bảo email không trùng với người khác (trừ chính user hiện tại)
            'email' => 'required|email|unique:users,email,' . $user->id,
            'address' => 'nullable|string',
        ]);

        $user->update([
            'full_name' => $request->full_name,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Cập nhật thông tin thành công!',
            'user' => $user
        ], 200);
    }

    // Xóa tài khoản
    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        
        $user->delete();

        return response()->json([
            'success' => true, 
            'message' => 'Tài khoản đã được xóa vĩnh viễn.'
        ], 200);
    }

    public function changePassword(Request $request)
    {
        // 1. Kiểm tra dữ liệu gửi lên
        $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = $request->user();

        // 2. Kiểm tra mật khẩu cũ có đúng với Database không
        if (!Hash::check($request->old_password, $user->password)) {
            return response()->json([
                'success' => false, 
                'message' => 'Mật khẩu hiện tại không chính xác!'
            ], 400);
        }

        // 3. Cập nhật mật khẩu mới
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'success' => true, 
            'message' => 'Đổi mật khẩu thành công!'
        ], 200);
    }
}