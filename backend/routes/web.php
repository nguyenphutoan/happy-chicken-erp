<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GuestController;

// --- Public Routes (Ai cũng vào được, mặc định là giao diện Customer) ---

// Trỏ trang chủ vào hàm index của GuestController
Route::get('/', [GuestController::class, 'index'])->name('home');

// Xem chi tiết sản phẩm
Route::get('/item/{id}', [GuestController::class, 'showItem'])->name('item.show');

// Xem chi tiết sản phẩm
Route::get('/item/{id}', [GuestController::class, 'showItem'])->name('item.show');
Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// --- Protected Routes (Bắt buộc phải đăng nhập) ---
Route::middleware(['auth'])->group(function () {

    // Khu vực của Manager
    Route::middleware(['role:manager'])->prefix('manager')->name('manager.')->group(function () {
        Route::get('/dashboard', function () {
            return view('manager.dashboard');
        })->name('dashboard');
        // Thêm các route khác của manager ở đây...
    });

    // Khu vực của Staff
    Route::middleware(['role:staff'])->prefix('staff')->name('staff.')->group(function () {
        Route::get('/dashboard', function () {
            return view('staff.pos');
        })->name('dashboard');
        // Thêm các route khác của staff ở đây...
    });

    // Khu vực của Customer đã đăng nhập (để quản lý profile, xem đơn hàng, v.v.)
    Route::middleware(['role:customer'])->prefix('customer')->name('customer.')->group(function () {
        Route::get('/profile', function () {
            return view('customer.profile');
        })->name('profile');
    });

});