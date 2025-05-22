<?php

// app/Http/Controllers/Api/ExpenseController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator; // Import Validator

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query(); // Mulai dengan query builder

        // Jika ada parameter 'date' di URL (misalnya /api/expenses?date=2025-05-21)
        if ($request->has('date')) {
            $query->where('date', $request->date); // Filter berdasarkan tanggal
        }

        // Jika tidak ada parameter 'date', seharusnya $query->get() mengambil semua.
        // Kita urutkan berdasarkan tanggal terbaru dulu, lalu ID terbaru jika tanggal sama
        $expenses = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->get();

        return response()->json($expenses);
    }

    // app/Http/Controllers/Api/ExpenseController.php
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date' => 'required|date_format:Y-m-d',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Baris ini yang menyimpan ke database:
        $expense = Expense::create($validator->validated());

        return response()->json($expense, 201); // 201 Created
    }

    public function show(Expense $expense)
    {
        // Tambahkan otorisasi jika perlu, misalnya jika pengeluaran hanya bisa dilihat oleh pemiliknya
        // if ($expense->user_id !== auth()->id() && auth()->check()) { // auth()->check() untuk memastikan user login
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }
        return response()->json($expense);
    }

    public function update(Request $request, Expense $expense)
    {
        // Tambahkan otorisasi jika perlu
        // if ($expense->user_id !== auth()->id() && auth()->check()) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        $validator = Validator::make($request->all(), [
            'date' => 'sometimes|required|date_format:Y-m-d',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $expense->update($validator->validated());
        return response()->json($expense);
    }

    public function destroy(Expense $expense)
    {
        // Tambahkan otorisasi jika perlu
        // if ($expense->user_id !== auth()->id() && auth()->check()) {
        //     return response()->json(['message' => 'Unauthorized'], 403);
        // }

        $expense->delete();
        return response()->json(null, 204); // 204 No Content
    }
}
