<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'description',
        'amount',
        'user_id', // Jika menggunakan user_id
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];
    public function user() // atau simpleUser() agar lebih jelas
    {
        return $this->belongsTo(SimpleUser::class, 'user_id'); // Sesuaikan nama model
    }
}
