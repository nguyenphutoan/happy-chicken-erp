import pandas as pd
from xgboost import XGBRegressor
from sqlalchemy import create_engine
import os

# Cấu hình kết nối MySQL
db_connection_str = 'mysql+pymysql://root:@127.0.0.1:3307/fastfood_restaurant'
engine = create_engine(db_connection_str)

sql_query = """
WITH DailySales AS (
    SELECT 
        DATE(o.created_at) AS sales_date,
        od.item_id,
        SUM(od.quantity) AS total_qty,
        DAYOFWEEK(o.created_at) AS day_of_week,
        MONTH(o.created_at) AS month
    FROM Order_detail od
    JOIN Orders o ON od.order_id = o.id
    WHERE o.status = 'paid'
    GROUP BY DATE(o.created_at), od.item_id
),
ActivePromos AS (
    SELECT 
        d.sales_date,
        i.id AS item_id,
        MAX(CASE 
            WHEN p.id = 1 AND DAYOFWEEK(d.sales_date) IN (3, 5) THEN 3
            WHEN p.id = 3 AND DAYOFWEEK(d.sales_date) = 6 AND i.id = 1 THEN 2
            WHEN p.id = 2 AND DAYOFWEEK(d.sales_date) IN (1, 7) THEN 1
            ELSE 0 
        END) AS promo_intensity_score
    FROM (SELECT DISTINCT DATE(created_at) AS sales_date FROM Orders) d
    CROSS JOIN Items i
    LEFT JOIN Promotions p ON d.sales_date BETWEEN p.active_from AND p.active_to
    GROUP BY d.sales_date, i.id
)
SELECT 
    ds.sales_date,
    ds.item_id,
    ds.total_qty,
    ds.day_of_week,
    ds.month,
    CASE WHEN ds.day_of_week IN (1, 7) THEN 1 ELSE 0 END AS is_weekend,
    COALESCE(ap.promo_intensity_score, 0) AS promo_intensity_score
FROM DailySales ds
LEFT JOIN ActivePromos ap ON ds.sales_date = ap.sales_date AND ds.item_id = ap.item_id
ORDER BY ds.item_id, ds.sales_date;
"""

print("Đang tải dữ liệu từ Database...")
df = pd.read_sql(sql_query, engine)

print("Đang xử lý Feature Engineering...")
df['sales_date'] = pd.to_datetime(df['sales_date'])
df = df.sort_values(['item_id', 'sales_date'])
df['lag_1'] = df.groupby('item_id')['total_qty'].shift(1)
df['lag_7'] = df.groupby('item_id')['total_qty'].shift(7)
df.dropna(inplace=True)

features = ['item_id', 'day_of_week', 'month', 'is_weekend', 'promo_intensity_score', 'lag_1', 'lag_7']
target = 'total_qty'

X = df[features]
y = df[target]

print("Đang huấn luyện mô hình XGBoost...")
model = XGBRegressor(n_estimators=500, learning_rate=0.05, max_depth=5, random_state=42)
model.fit(X, y)

model.save_model('xgboost_inventory_model.json')
print("Huấn luyện hoàn tất! Mô hình đã được lưu tại 'xgboost_inventory_model.json'")