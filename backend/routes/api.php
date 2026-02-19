<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ItemManagerController;
use App\Http\Controllers\PromotionManagerController;
use App\Http\Controllers\StaffManagementController;

Route::get('/home', [GuestController::class, 'index']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('/login', [AuthController::class, 'loginApi']);

Route::get('/items-all', [GuestController::class, 'getAllItems']);
Route::get('/promotions-all', [GuestController::class, 'getAllPromotions']);
Route::post('/register', [AuthController::class, 'registerApi']);
Route::post('/cart/check-items', [GuestController::class, 'checkItems']);

Route::get('/vnpay-return', [OrderController::class, 'vnpayReturn']);
Route::get('/promotions/valid', [OrderController::class, 'getValidPromotions']);


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/checkout', [OrderController::class, 'placeOrder']);
    Route::get('/my-orders', [OrderController::class, 'getUserOrders']); 
    Route::post('/orders/{id}/retry-payment', [OrderController::class, 'retryPayment']); 
    Route::put('/profile', [\App\Http\Controllers\AuthController::class, 'updateProfile']);
    Route::delete('/profile', [\App\Http\Controllers\AuthController::class, 'deleteAccount']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // DÀNH CHO STAFF POS
    Route::get('/staff/customer/search', [StaffController::class, 'searchCustomer']);
    Route::get('/staff/orders', [StaffController::class, 'getPendingOrders']);
    Route::post('/staff/orders/{id}/status', [StaffController::class, 'updateOrderStatus']);
    Route::get('/staff/orders/history', [StaffController::class, 'getOrderHistory']);
    Route::post('/staff/orders/{id}/vnpay', [StaffController::class, 'generateVnpayUrl']);

    //Manager
    Route::get('/manager/dashboard', [DashboardController::class, 'getStats']);
    Route::get('/manager/inventory', [InventoryController::class, 'getInventory']);
    Route::get('/manager/inventory/{id}/logs', [InventoryController::class, 'getStockLogs']);
    Route::post('/manager/inventory/action', [InventoryController::class, 'handleStockAction']);
    Route::get('/manager/items', [ItemManagerController::class, 'index']);
    Route::post('/manager/items', [ItemManagerController::class, 'store']);
    Route::post('/manager/items/{id}', [ItemManagerController::class, 'update']);
    Route::patch('/manager/items/{id}/toggle-active', [ItemManagerController::class, 'toggleActive']);
    Route::get('/manager/promotions', [PromotionManagerController::class, 'index']);
    Route::post('/manager/promotions', [PromotionManagerController::class, 'store']);
    Route::put('/manager/promotions/{id}', [PromotionManagerController::class, 'update']);
    Route::delete('/manager/promotions/{id}', [PromotionManagerController::class, 'destroy']);
    Route::get('/manager/staff', [StaffManagementController::class, 'index']);
    Route::post('/manager/staff', [StaffManagementController::class, 'store']);
    Route::put('/manager/staff/{id}', [StaffManagementController::class, 'update']);
    Route::put('/manager/staff/{id}/password', [StaffManagementController::class, 'updatePassword']);
    Route::patch('/manager/staff/{id}/toggle-active', [StaffManagementController::class, 'toggleActive']);
});

Route::get('/items', [GuestController::class, 'getAllItems']);