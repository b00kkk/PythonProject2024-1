from django.urls import path
from . import views

urlpatterns = [
    path('', views.traffic, name='traffic'),
    path('traffic_get_data/', views.traffic_get_data, name='traffic_get_data'),
    path('month_accident_get_data/', views.month_accident_get_data, name='month_accident_get_data'),
    path('age_accident_get_data/', views.age_accident_get_data, name='age_accident_get_data'),
    path('traffic/', views.traffic, name='traffic'),
    path('accident/', views.accident, name='accident'),
    path('correlation/', views.correlation, name='correlation'),
]
