from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    HealthView,
    SupplierViewSet,
    CustomerViewSet,
    MedicineViewSet,
    MedicineBatchViewSet,
    PurchaseViewSet,
    SaleViewSet,
    DashboardSummaryView,
    ReportsView,
)

router = DefaultRouter()
router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("customers", CustomerViewSet, basename="customer")
router.register("medicines", MedicineViewSet, basename="medicine")
router.register("batches", MedicineBatchViewSet, basename="batch")
router.register("purchases", PurchaseViewSet, basename="purchase")
router.register("sales", SaleViewSet, basename="sale")

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("dashboard-summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("reports/", ReportsView.as_view(), name="reports"),
    path("", include(router.urls)),
]