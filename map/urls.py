from django.urls import path
from . import views
# from .views import seoul_map

urlpatterns = [
    path('', views.home, name='home'),
    path('get_data/', views.get_data, name='get_data'),
]