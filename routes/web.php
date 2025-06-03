<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log; // Pastikan ini ada
use App\Models\SimpleUser; // Ganti dengan App\Models\User jika Anda menggunakan model User bawaan
use App\Http\Controllers\Api\ExpenseController; // Sesuaikan dengan path controller Anda
use App\Http\Controllers\Api\IncomeController; // Tambahkan ini

// Rute untuk menampilkan halaman utama aplikasi catatan pengeluaran
Route::get('/', function () {
    if (!Session::has('active_user_id')) {
        $defaultUser = SimpleUser::where('name', 'Dava')->first(); // Atau user default lain
        if ($defaultUser) {
            Session::put('active_user_id', $defaultUser->id);
            Session::put('active_user_name', $defaultUser->name);
            // Set profile pic untuk default user
            $profilePic = '';
            if ($defaultUser->name == 'Dava') {
                $profilePic = asset('assets/images/profiles/dava.jpeg'); // Ganti dengan .png jika perlu
            } elseif ($defaultUser->name == 'Albella') { // Jika Albella bisa jadi default
                $profilePic = asset('assets/images/profiles/albella.jpeg'); // Ganti dengan .png jika perlu
            }
            Session::put('active_user_pic', $profilePic);
            Log::info("Pengguna default DISETEL di session (via GET /): ID = " . $defaultUser->id . ", Pic = " . $profilePic);
        }
    }
    return view('index');
})->name('home');

// Rute untuk mengatur pengguna aktif
Route::get('/set-active-user/{userName}', function ($userName) {
    $user = SimpleUser::where('name', $userName)->first();
    if ($user) {
        Session::put('active_user_id', $user->id);
        Session::put('active_user_name', $user->name);

        // Tentukan path gambar profil berdasarkan nama pengguna
        $profilePic = '';
        if ($userName == 'Dava') {
            $profilePic = asset('assets/images/profiles/dava.jpeg'); // Ganti dengan .png jika perlu
        } elseif ($userName == 'Albella') {
            $profilePic = asset('assets/images/profiles/albella.jpeg'); // Ganti dengan .png jika perlu
        }
        Session::put('active_user_pic', $profilePic); // Simpan path gambar ke session

        Log::info("Pengguna aktif DISETEL di session: ID = " . $user->id . ", Nama = " . $user->name . ", Pic = " . $profilePic . ", Session ID: " . Session::getId());
    } else {
        Log::warning("Pengguna '$userName' tidak ditemukan saat mencoba set session.");
        return redirect()->route('home')->with('error', 'Pengguna tidak ditemukan.');
    }
    return redirect()->route('home');
})->name('setActiveUser');

// Rute untuk data pengeluaran (pastikan prefix dan controller path sudah benar)
Route::prefix('app-data')->group(function () {
    Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.data.index');
    Route::get('/incomes', [IncomeController::class, 'index'])->name('incomes.data.index');
    Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.data.store');
    Route::post('/incomes', [IncomeController::class, 'store'])->name('incomes.data.store');
    Route::delete('/incomes/{income}', [IncomeController::class, 'destroy'])->name('incomes.data.destroy');
    Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.data.destroy');
    Route::get('/expenses/monthly-summary', [ExpenseController::class, 'monthlySummary'])->name('expenses.data.monthlySummary');
});
