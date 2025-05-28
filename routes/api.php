<?php

// routes/api.php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ExpenseController;
use Illuminate\Support\Facades\DB; // Import facade DB
use App\Http\Controllers\TestDbController;

Route::get('/test-db', [TestDbController::class, 'checkConnection']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Rute untuk Pengeluaran
Route::get('/expenses', [ExpenseController::class, 'index']); // GET /api/expenses
Route::post('/expenses', [ExpenseController::class, 'store']); // POST /api/expenses
Route::get('/expenses/{expense}', [ExpenseController::class, 'show']); // GET /api/expenses/{id}
Route::put('/expenses/{expense}', [ExpenseController::class, 'update']); // PUT /api/expenses/{id}
Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']); // DELETE /api/expenses/{id}
