import os
import pandas as pd
import json
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse


def traffic(request):
    # 엑셀 파일 경로
    excel_file_path = os.path.join(settings.BASE_DIR, 'static/data/traffic_today.xlsx')
    
    df = pd.read_excel(excel_file_path)
    
    traffic_data = df.set_index('시군구')['전일'].to_dict()
    print("traffic_data : ", json.dumps(traffic_data))
    
    return render(request, 'map/traffic.html', {'traffic_data': json.dumps(traffic_data)})

def accident(request):

    # 교통 사고량 파일 경로
    accident_file_path = os.path.join(settings.BASE_DIR, 'static/data/2022_accident.xlsx')
    
    df = pd.read_excel(accident_file_path)
    
    accident_data = df.set_index('시군구')['사고 건수'].to_dict()
    print("accident_data", accident_data)
    return render(request, 'map/accident.html', {'accident_data': json.dumps(accident_data)})

def correlation(request):
    # 교통량 데이터 파일 경로
    traffic_file_path = os.path.join(settings.BASE_DIR, 'static/data/traffic_all.xlsx')
    # 사고량 데이터 파일 경로
    accident_file_path = os.path.join(settings.BASE_DIR, 'static/data/accident_1.xlsx')

    # 교통량 데이터 불러오기
    traffic_data = pd.read_excel(traffic_file_path, engine='openpyxl')
    # 사고량 데이터 불러오기
    accident_data = pd.read_excel(accident_file_path, engine='openpyxl')

    # 2시간 단위로 교통량 데이터 합산
    traffic_data_hourly = pd.DataFrame()
    time_intervals = [(i, i+1) for i in range(0, 24, 2)]

    for start, end in time_intervals:
        col_name = f'{start}시-{end+1}시'
        traffic_data_hourly[col_name] = traffic_data.iloc[:, 4+start] + traffic_data.iloc[:, 4+end]

    # 자치구를 포함하여 데이터프레임 구성
    traffic_data_hourly['자치구'] = traffic_data['시군구']

    # 교통량과 사고량 데이터의 자치구 순서를 맞추기 위해 인덱스 재설정
    accident_data_reordered = accident_data.set_index('자치구별(2)').reindex(traffic_data['시군구']).reset_index()

    # 데이터 타입 점검 및 변환
    traffic_data_hourly.drop(columns='자치구', inplace=True)
    traffic_data_hourly = traffic_data_hourly.apply(pd.to_numeric, errors='coerce')
    accident_data_reordered['소계'] = pd.to_numeric(accident_data_reordered['소계'], errors='coerce')

    # 교통량과 사고량 간의 상관관계 계산
    correlation_hourly = traffic_data_hourly.corrwith(accident_data_reordered['소계'])

    # 교통량과 사고량의 전체 상관관계 계산
    traffic_data_total = traffic_data[['시군구', '전일']]
    traffic_data_total.columns = ['시군구', '교통량']  # 컬럼명을 변경합니다.
    accident_data_total = accident_data[['자치구별(2)', '소계']]
    accident_data_total.columns = ['시군구', '사고량']  # 컬럼명을 변경합니다.

    # 데이터프레임 병합
    df_merged = pd.merge(traffic_data_total, accident_data_total, on='시군구')

    # 교통량과 사고량 간의 상관관계 계산
    overall_correlation = df_merged['교통량'].astype('int').corr(df_merged['사고량'].astype('int'))

    correlation_data = {
        'time_intervals': correlation_hourly.index.tolist(),
        'correlation_values': correlation_hourly.values.tolist(),
        'overall_correlation': overall_correlation
    }

    return render(request, 'map/correlation.html', {'correlation_data': json.dumps(correlation_data)})


# 엑셀 파일 경로 설정
region_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/region_hour.xlsx'), index_col=0)
car_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/car_hour.xlsx'), index_col=0)
bus_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/bus_hour.xlsx'), index_col=0)
truck_hour = pd.read_excel(os.path.join(settings.BASE_DIR, 'static/data/truck_hour.xlsx'), index_col=0)

def traffic_get_data(request):
    region = request.GET.get('region')
    print("Requested region:", region)
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


# 엑셀 파일 경로 설정
accident_data = pd.read_csv(os.path.join(settings.BASE_DIR, 'static/data/월별+교통사고+현황_2022.csv'), index_col=0)

def month_accident_get_data(request):
    region = request.GET.get('region').strip().lower()
    normalized_regions = [r.strip().lower() for r in accident_data['자치구별(2)']]
    
    if region not in normalized_regions:
        return JsonResponse({'error': 'Invalid region'}, status=400)
    
    region_index = normalized_regions.index(region)
    actual_region_name = accident_data['자치구별(2)'].iloc[region_index]
    
    region_data = accident_data[accident_data['자치구별(2)'].str.strip().str.lower() == actual_region_name.strip().lower()]

    print(f"Requested region: {region}")
    print(f"Actual region name: {actual_region_name}")
    print(f"Filtered region data:\n{region_data}")

    # 월별 사고 건수와 부상자수 데이터 추출
    months = [f"2022. {str(i).zfill(2)}" for i in range(1, 13)]
    accidents = []
    injuries = []

    for month in months:
        accident_count = region_data[f"{month}"].values[0]
        injury_count = region_data[f"{month}.2"].values[0]
        
        # 발생건수와 부상자수를 정수로 변환, '-' 값을 0으로 변환
        try:
            accident_count = int(accident_count) if accident_count != '-' else 0
        except ValueError:
            accident_count = 0
        
        try:
            injury_count = int(injury_count) if injury_count != '-' else 0
        except ValueError:
            injury_count = 0
        
        accidents.append(accident_count)
        injuries.append(injury_count)

    # 사고당 평균 부상자수 계산
    total_accidents = sum(accidents)
    total_injuries = sum(injuries)
    avg_injuries_per_accident = total_injuries / total_accidents if total_accidents > 0 else 0

    data = {
        'months': months,
        'accidents': accidents,
        'injuries': injuries,
        'region_stats': avg_injuries_per_accident,
        'total_accidents': total_accidents,
        'total_injuries': total_injuries
    }
    
    return JsonResponse(data)




def month_accident_get_data(request):
    region = request.GET.get('region').strip().lower()
    print("region", region)
    normalized_regions = [r.strip().lower() for r in accident_data['자치구별(2)']]
    
    if region not in normalized_regions:
        return JsonResponse({'error': 'Invalid region'}, status=400)
    
    region_index = normalized_regions.index(region)
    actual_region_name = accident_data['자치구별(2)'].iloc[region_index]
    
    region_data = accident_data[accident_data['자치구별(2)'].str.strip().str.lower() == actual_region_name.strip().lower()]

    # 월별 사고 건수와 부상자수 데이터 추출
    months = [f"2022. {str(i).zfill(2)}" for i in range(1, 13)]
    accidents = []
    injuries = []

    for month in months:
        accident_count = region_data[f"{month}"].values[0]
        injury_count = region_data[f"{month}.2"].values[0]
        
        accident_count = int(accident_count) if accident_count != '-' else 0
        injury_count = int(injury_count) if injury_count != '-' else 0
        
        accidents.append(accident_count)
        injuries.append(injury_count)

    # 사고당 평균 부상자수 계산
    total_accidents = sum(accidents)
    total_injuries = sum(injuries)
    avg_injuries_per_accident = total_injuries / total_accidents if total_accidents > 0 else 0

    data = {
        'months': months,
        'accidents': accidents,
        'injuries': injuries,
        'region_stats': avg_injuries_per_accident,
        'total_accidents': total_accidents,
        'total_injuries': total_injuries
    }
    
    return JsonResponse(data)


age_data = pd.read_csv(os.path.join(settings.BASE_DIR, 'static/data/가해운전자+연령대별+교통사고+현황_2022.csv'), index_col=0)

def age_accident_get_data(request):
    region = request.GET.get('region').strip().lower()
    print("region:", region)  # 디버그용 출력
    normalized_regions = [r.strip().lower() for r in age_data['자치구별(2)']]

    if region not in normalized_regions:
        return JsonResponse({'error': 'Invalid region'}, status=400)

    region_index = normalized_regions.index(region)
    actual_region_name = age_data['자치구별(2)'].iloc[region_index]

    region_data = age_data[age_data['자치구별(2)'].str.strip().str.lower() == actual_region_name.strip().lower()]

    # 연령대별 데이터 추출 및 전처리
    age_data_filtered = region_data.iloc[:, 3:]  # 첫 세 열(자치구별(2), 항목, 2022)을 제외하고 데이터 추출
    age_data_filtered = age_data_filtered.transpose()  # 전치하여 연령대별 데이터를 행으로 만듦
    age_data_filtered.columns = ['발생건수', '부상자수']  # 열 이름 변경
    age_data_filtered.index = ['20세 이하', '21~30세', '31~40세', '41~50세', '51~60세', '61~64세', '65세 이상', '연령불명']  # 인덱스 설정

    age_data_filtered = age_data_filtered.astype({'발생건수': int, '부상자수': int})


    data = {
        'age_groups': age_data_filtered.index.tolist(),
        'accidents': age_data_filtered['발생건수'].tolist(),
        'injuries': age_data_filtered['부상자수'].tolist(),
        'title': f"{actual_region_name} 연령대별 사고량"
    }
    
    return JsonResponse(data)