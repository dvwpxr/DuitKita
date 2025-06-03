<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo; // Tambahkan ini

class Income extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'description',
        'amount',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    // Relasi ke model pengguna Anda (SimpleUser atau User)
    public function user(): BelongsTo
    {
        return $this->belongsTo(SimpleUser::class, 'user_id'); // Sesuaikan nama model jika perlu
    }
}
