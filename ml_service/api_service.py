from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
from sqlalchemy import create_engine
from datetime import datetime, timedelta

app = FastAPI()

# Cấu hình CORS để cho phép Laravel gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tải mô hình
model = xgb.Booster()
try:
    model.load_model('xgboost_inventory_model.json')
except:
    print("Chưa tìm thấy file mô hình. Hãy chạy train_model_db.py")

db_connection_str = 'mysql+pymysql://root:@127.0.0.1:3307/fastfood_restaurant'
engine = create_engine(db_connection_str)

class DemandRequest(BaseModel):
    item_id: int
    target_date: str # Format: YYYY-MM-DD
    promo_intensity_score: int 

@app.post("/predict_realtime")
def predict_demand(data: DemandRequest):
    try:
        target_dt = datetime.strptime(data.target_date, "%Y-%m-%d")
        date_lag_1 = (target_dt - timedelta(days=1)).strftime("%Y-%m-%d")
        date_lag_7 = (target_dt - timedelta(days=7)).strftime("%Y-%m-%d")
        
        # Lấy dữ liệu thực tế của lag_1 và lag_7 từ Database
        query_lags = f"""
            SELECT DATE(o.created_at) as sales_date, SUM(od.quantity) as qty
            FROM Order_detail od
            JOIN Orders o ON od.order_id = o.id
            WHERE od.item_id = {data.item_id} 
              AND DATE(o.created_at) IN ('{date_lag_1}', '{date_lag_7}')
              AND o.status = 'paid'
            GROUP BY DATE(o.created_at)
        """
        df_lags = pd.read_sql(query_lags, engine)
        
        lag_1_val = df_lags[df_lags['sales_date'].astype(str) == date_lag_1]['qty'].sum() if not df_lags.empty else 0
        lag_7_val = df_lags[df_lags['sales_date'].astype(str) == date_lag_7]['qty'].sum() if not df_lags.empty else 0

        day_of_week = target_dt.isoweekday() % 7 + 1
        is_weekend = 1 if day_of_week in (1, 7) else 0
        
        # Tạo DataFrame
        input_features = pd.DataFrame([{
            'item_id': data.item_id,
            'day_of_week': day_of_week,
            'month': target_dt.month,
            'is_weekend': is_weekend,
            'promo_intensity_score': data.promo_intensity_score,
            'lag_1': lag_1_val,
            'lag_7': lag_7_val
        }])
        
        # Dự đoán
        dmatrix = xgb.DMatrix(input_features)
        prediction = model.predict(dmatrix)
        
        return {
            "item_id": data.item_id,
            "target_date": data.target_date,
            "predicted_quantity": max(0, int(prediction[0])), # Đảm bảo không ra số âm
            "context": {
                "lag_1_actual": int(lag_1_val),
                "lag_7_actual": int(lag_7_val),
                "promo_intensity": data.promo_intensity_score
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))