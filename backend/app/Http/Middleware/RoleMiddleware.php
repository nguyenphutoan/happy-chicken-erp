<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Xử lý request. Cho phép nhận nhiều role cùng lúc.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Kiểm tra xem người dùng đã đăng nhập chưa
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // Lấy role của người dùng hiện tại
        $userRole = Auth::user()->role;

        // Nếu role của user không nằm trong danh sách các role được phép truy cập
        if (!in_array($userRole, $roles)) {
            // Trả về lỗi 403 - Forbidden (Không có quyền truy cập)
            abort(403, 'Bạn không có quyền truy cập vào khu vực này.');
        }

        return $next($request);
    }
}