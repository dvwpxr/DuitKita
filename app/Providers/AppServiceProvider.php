<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth as FirebaseAuth; // Import FirebaseAuth

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ... (registrasi lainnya) ...

        $this->app->singleton(FirebaseAuth::class, function ($app) {
            $credentialsPath = env('FIREBASE_CREDENTIALS');
            if (!$credentialsPath || !file_exists(base_path($credentialsPath))) {
                throw new \InvalidArgumentException('Firebase credentials file not found. Set FIREBASE_CREDENTIALS in .env');
            }

            $factory = (new Factory)
                ->withServiceAccount(base_path($credentialsPath));
            return $factory->createAuth();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
