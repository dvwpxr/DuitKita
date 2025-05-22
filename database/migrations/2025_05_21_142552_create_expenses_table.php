<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id(); // Kolom ID auto-increment primary key
            $table->date('date'); // Tanggal pengeluaran
            $table->string('description'); // Deskripsi pengeluaran
            $table->decimal('amount', 15, 2); // Jumlah pengeluaran
            // $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Opsional
            $table->timestamps(); // Kolom created_at dan updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
