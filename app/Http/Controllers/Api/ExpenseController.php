<?php

// app/Http/Controllers/Api/ExpenseController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Income;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator; // Import Validator
use Illuminate\Support\Facades\Session; // Tambahkan ini
use Illuminate\Support\Facades\Log; // Tambahkan ini jika belum ada
use Illuminate\Support\Facades\DB; // PENTING: Tambahkan ini untuk query DB::raw

class ExpenseController extends Controller
{
    private function getActiveUserId()
    {
        $sessionId = Session::getId();
        Log::info("getActiveUserId() dipanggil. Session ID saat ini: " . $sessionId);
        Log::info("Session 'active_user_id' SEBELUM pengecekan: " . Session::get('active_user_id'));
        Log::info("Session 'active_user_name' SEBELUM pengecekan: " . Session::get('active_user_name'));

        if (!Session::has('active_user_id')) {
            Log::info("Session 'active_user_id' KOSONG. Mencoba set pengguna default.");
            $defaultUser = \App\Models\SimpleUser::where('name', 'Dava')->orderBy('id', 'asc')->first(); // Sesuaikan dengan model dan user default Anda
            if ($defaultUser) {
                Session::put('active_user_id', $defaultUser->id);
                Session::put('active_user_name', $defaultUser->name);
                Log::info("Pengguna default DISETEL di session (via getActiveUserId): ID = " . $defaultUser->id . ", Nama = " . $defaultUser->name);
            } else {
                Log::error("Pengguna default (misal Dava) TIDAK DITEMUKAN di database.");
                return null;
            }
        }
        $activeUserId = Session::get('active_user_id');
        Log::info("getActiveUserId() akan MENGEMBALIKAN user ID: " . $activeUserId);
        return $activeUserId;
    }

    public function index(Request $request)
    {
        $activeUserId = $this->getActiveUserId();
        Log::info("ExpenseController@index dipanggil untuk user ID: " . $activeUserId . ". Filter tanggal: " . $request->input('date', 'TIDAK ADA'));

        if (!$activeUserId) {
            Log::warning("Tidak ada pengguna aktif di ExpenseController@index, mengembalikan error.");
            return response()->json(['message' => 'Silakan pilih pengguna aktif.'], 403);
        }

        $query = \App\Models\Expense::where('user_id', $activeUserId);

        if ($request->has('date')) {
            $query->where('date', $request->date);
        }
        $expenses = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->get();
        Log::info("Mengembalikan " . $expenses->count() . " data pengeluaran untuk user ID: " . $activeUserId);
        return response()->json($expenses)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    // app/Http/Controllers/Api/ExpenseController.php
    public function store(Request $request)
    {
        $activeUserId = $this->getActiveUserId();

        if (!$activeUserId) {
            // Ini akan mencegah error SQL, tapi pengguna perlu tahu
            // Log::error('Attempted to store expense without an active user.'); // Tambahkan log
            return response()->json(['message' => 'Pengguna aktif tidak ditemukan. Silakan pilih pengguna.'], 403); // 403 Forbidden
        }

        $validator = Validator::make($request->all(), [
            'date' => 'required|date_format:Y-m-d',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $validatedData = $validator->validated();
        $validatedData['user_id'] = $activeUserId; // BARIS INI SANGAT PENTING!

        // Log::info('Data to be created for expense:', $validatedData); // Tambahkan log untuk melihat data sebelum create

        $expense = Expense::create($validatedData); // Ini yang melakukan INSERT
        return response()->json($expense, 201);
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

    public function destroy(Expense $expense) // Expense $expense akan otomatis di-resolve
    {
        $activeUserId = $this->getActiveUserId();
        if (!$activeUserId || $expense->user_id !== $activeUserId) {
            return response()->json(['message' => 'Unauthorized atau pengguna belum dipilih.'], 403);
        }
        $expense->delete();
        return response()->json(null, 204);
    }

    // public function monthlySummary(Request $request)
    // {
    //     $activeUserId = $this->getActiveUserId();
    //     if (!$activeUserId) {
    //         return response()->json(['message' => 'Pengguna aktif tidak ditemukan.'], 403);
    //     }

    //     $summaries = \App\Models\Expense::where('user_id', $activeUserId)
    //         ->select(
    //             DB::raw('YEAR(date) as year'),
    //             DB::raw('MONTH(date) as month_number'), // Nomor bulan (1-12)
    //             DB::raw('SUM(amount) as total_amount')
    //         )
    //         ->groupBy('year', 'month_number')
    //         ->orderBy('year', 'desc')
    //         ->orderBy('month_number', 'desc') // Urutkan dari bulan terbaru
    //         ->get();

    //     // Daftar nama bulan dalam Bahasa Indonesia
    //     $indonesianMonthNames = [
    //         "Januari",
    //         "Februari",
    //         "Maret",
    //         "April",
    //         "Mei",
    //         "Juni",
    //         "Juli",
    //         "Agustus",
    //         "September",
    //         "Oktober",
    //         "November",
    //         "Desember"
    //     ];

    //     // Ubah hasil query untuk menyertakan nama bulan dan format total
    //     $result = $summaries->map(function ($summary) use ($indonesianMonthNames) {
    //         return [
    //             'year' => (int)$summary->year,
    //             'month_number' => (int)$summary->month_number,
    //             'month_name' => $indonesianMonthNames[$summary->month_number - 1], // -1 karena array 0-indexed
    //             'total_amount' => (float)$summary->total_amount,
    //         ];
    //     });

    //     return response()->json($result)
    //         ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
    //         ->header('Pragma', 'no-cache')
    //         ->header('Expires', '0');
    // }

    public function combinedMonthlySummary(Request $request)
    {
        $activeUserId = $this->getActiveUserId();
        if (!$activeUserId) {
            return response()->json(['message' => 'Pengguna aktif tidak ditemukan.'], 403);
        }

        // 1. Ambil ringkasan pengeluaran
        $expenses = \App\Models\Expense::where('user_id', $activeUserId)
            ->select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('SUM(amount) as total_expenses')
            )
            ->groupBy('year', 'month')
            ->get();

        // 2. Ambil ringkasan pemasukan
        $incomes = Income::where('user_id', $activeUserId)
            ->select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('SUM(amount) as total_incomes')
            )
            ->groupBy('year', 'month')
            ->get();

        // 3. Gabungkan data
        $summary = [];
        $monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        foreach ($expenses as $expense) {
            $key = $expense->year . '-' . $expense->month;
            $summary[$key] = [
                'year' => $expense->year,
                'month' => $expense->month,
                'month_name' => $monthNames[$expense->month],
                'total_expenses' => (float)$expense->total_expenses,
                'total_incomes' => 0,
            ];
        }

        foreach ($incomes as $income) {
            $key = $income->year . '-' . $income->month;
            if (isset($summary[$key])) {
                $summary[$key]['total_incomes'] = (float)$income->total_incomes;
            } else {
                $summary[$key] = [
                    'year' => $income->year,
                    'month' => $income->month,
                    'month_name' => $monthNames[$income->month],
                    'total_expenses' => 0,
                    'total_incomes' => (float)$income->total_incomes,
                ];
            }
        }

        // 4. Hitung saldo dan urutkan
        $result = array_map(function ($item) {
            $item['balance'] = $item['total_incomes'] - $item['total_expenses'];
            return $item;
        }, array_values($summary));

        // Urutkan berdasarkan tahun dan bulan (terbaru dulu)
        usort($result, function ($a, $b) {
            if ($a['year'] == $b['year']) {
                return $b['month'] <=> $a['month'];
            }
            return $b['year'] <=> $a['year'];
        });

        return response()->json($result);
    }
}
