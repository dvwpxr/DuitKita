<?php

namespace App\Providers;

use Illuminate\Support\Facades\App; // Tambahkan ini di atas
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (env('VERCEL_ENV')) { // VERCEL_ENV adalah variabel sistem yang diset oleh Vercel
            // Mengarahkan path penyimpanan sementara ke direktori /tmp yang writable di Vercel
            $this->app->useStoragePath(env('VERCEL_STORAGE_PATH', '/tmp'));

            // Pastikan direktori untuk view yang dikompilasi bisa ditulis
            // Anda sudah mengatur VIEW_COMPILED_PATH di vercel.json, tapi ini bisa jadi tambahan
            config(['view.compiled' => env('VIEW_COMPILED_PATH', '/tmp/views')]);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
