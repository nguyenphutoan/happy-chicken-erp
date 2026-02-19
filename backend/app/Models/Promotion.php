<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    protected $fillable = [
        'name',
        'content',
        'promotion_intensity',
        'type',
        'min_order_value',
        'required_product_id',
        'discount_type',
        'percentage_disc',
        'max_disc',
        'active_from',
        'active_to',
        'condition_rules'
    ];

    protected $casts = [
        'min_order_value' => 'decimal:2',
        'max_disc' => 'decimal:2',
        'active_from' => 'date',
        'active_to' => 'date',
        'condition_rules' => 'array', // 2. Tự động ép kiểu JSON thành Array
    ];

    public function requiredProduct(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'required_product_id');
    }

    public function orderPromotions(): HasMany
    {
        return $this->hasMany(OrderPromotion::class);
    }
}