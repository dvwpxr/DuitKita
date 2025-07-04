<?php

// routes/api.php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ExpenseController;

// Rute untuk Pengeluaran
Route::get('/expenses', [ExpenseController::class, 'index']); // GET /api/expenses
Route::post('/expenses', [ExpenseController::class, 'store']); // POST /api/expenses
Route::get('/expenses/{expense}', [ExpenseController::class, 'show']); // GET /api/expenses/{id}
Route::put('/expenses/{expense}', [ExpenseController::class, 'update']); // PUT /api/expenses/{id}
Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy']); // DELETE /api/expenses/{id}
