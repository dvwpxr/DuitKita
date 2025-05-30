<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates the 'expenses' table which will store
     * individual expense records. Each expense is associated with a user
     * through a foreign key.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {

            $table->id(); // Kolom ID auto-increment primary key

            $table->date('date'); // Tanggal pengeluaran

            $table->string('description'); // Deskripsi pengeluaran

            $table->decimal('amount', 15, 2); // Jumlah pengeluaran

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * This method is called when rolling back the migration.
     * It drops the 'expenses' table if it exists.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
