import os
import pandas as pd
import json
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse

def home(request):
    # 엑셀 파일 경로
    excel_file_path = os.path.join(settings.BASE_DIR, 'static/data/traffic_today.xlsx')
    
    df = pd.read_excel(excel_file_path)
    
    traffic_data = df.set_index('시군구')['전일'].to_dict()

    return render(request, 'map/home.html', {'traffic_data': json.dumps(traffic_data)})


# 엑셀 파일 경로 설정
region_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/region_hour.xlsx'), index_col=0)
car_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/car_hour.xlsx'), index_col=0)
bus_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/bus_hour.xlsx'), index_col=0)
truck_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/truck_hour.xlsx'), index_col=0)

def get_data(request):
    region = request.GET.get('region')
    if region not in region_hour.columns:
        return JsonResponse({'error': 'Invalid region'}, status=400)

    data = {
        'time': list(region_hour.index),
        'car_traffic': list(car_hour[region]),
        'bus_traffic': list(bus_hour[region]),
        'truck_traffic': list(truck_hour[region]),
        'total_traffic': list(region_hour[region])
    }
    return JsonResponse(data)