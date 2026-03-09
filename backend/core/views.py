from datetime import timedelta, datetime

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Supplier,
    Customer,
    Medicine,
    MedicineBatch,
    Purchase,
    Sale,
    SaleItem,
)
from .serializers import (
    SupplierSerializer,
    CustomerSerializer,
    MedicineSerializer,
    MedicineBatchSerializer,
    PurchaseSerializer,
    SaleSerializer,
    SaleCreateSerializer,
)


def safe_local_date(dt_value):
    if not dt_value:
        return None

    try:
        if isinstance(dt_value, datetime):
            if timezone.is_aware(dt_value):
                dt_value = timezone.localtime(dt_value)
            return dt_value.date()
        return dt_value
    except Exception:
        return None


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by("-id")
    serializer_class = SupplierSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("-id")
    serializer_class = CustomerSerializer


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all().prefetch_related("batches").order_by("-id")
    serializer_class = MedicineSerializer


class MedicineBatchViewSet(viewsets.ModelViewSet):
    queryset = MedicineBatch.objects.select_related("medicine").all().order_by("-id")
    serializer_class = MedicineBatchSerializer


class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.select_related("supplier").all().order_by("-id")
    serializer_class = PurchaseSerializer


class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related("customer").prefetch_related("items__medicine").all().order_by("-id")
    serializer_class = SaleSerializer

    def create(self, request, *args, **kwargs):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        invoice = data["invoice"]
        customer_name = data.get("customer_name", "").strip()
        customer_phone = data.get("customer_phone", "").strip()
        subtotal = data["subtotal"]
        discount_percent = data.get("discount_percent", 0)
        gst_percent = data.get("gst_percent", 0)
        total = data["total"]
        items = data["items"]

        if Sale.objects.filter(invoice=invoice).exists():
            return Response(
                {"invoice": ["Invoice already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            customer = None
            if customer_phone:
                customer, created = Customer.objects.get_or_create(
                    phone=customer_phone,
                    defaults={
                        "name": customer_name or customer_phone,
                        "points": 0,
                    },
                )
                if not created and customer_name and customer.name != customer_name:
                    customer.name = customer_name
                    customer.save(update_fields=["name"])

            sale = Sale.objects.create(
                invoice=invoice,
                customer=customer,
                subtotal=subtotal,
                discount_percent=discount_percent,
                gst_percent=gst_percent,
                total=total,
            )

            for item in items:
                medicine_id = item["medicine_id"]
                qty_needed = item["qty"]
                price = item["price"]

                medicine = Medicine.objects.filter(id=medicine_id).first()
                if not medicine:
                    transaction.set_rollback(True)
                    return Response(
                        {"items": [f"Medicine with id {medicine_id} not found."]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                available_stock = sum(batch.qty for batch in medicine.batches.all())
                if available_stock < qty_needed:
                    transaction.set_rollback(True)
                    return Response(
                        {
                            "items": [
                                f"Not enough stock for {medicine.name}. Available: {available_stock}, Requested: {qty_needed}."
                            ]
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                remaining = qty_needed
                batches = medicine.batches.all().order_by("expiry", "id")

                for batch in batches:
                    if remaining <= 0:
                        break

                    if batch.qty <= 0:
                        continue

                    deduct = min(batch.qty, remaining)
                    batch.qty -= deduct
                    batch.save(update_fields=["qty"])
                    remaining -= deduct

                if remaining > 0:
                    transaction.set_rollback(True)
                    return Response(
                        {"items": [f"Unable to fully deduct stock for {medicine.name}."]},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                SaleItem.objects.create(
                    sale=sale,
                    medicine=medicine,
                    qty=qty_needed,
                    price=price,
                    line_total=price * qty_needed,
                )

            read_serializer = SaleSerializer(sale)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)


class DashboardSummaryView(APIView):
    def get(self, request, *args, **kwargs):
        try:
            today = timezone.localdate()
            expiry_limit = today + timedelta(days=30)

            # today sales - Python side calculation to avoid SQLite date function issues
            today_sales_total = 0.0
            all_sales = Sale.objects.all().prefetch_related("items__medicine")
            for sale in all_sales:
                sale_date = safe_local_date(sale.date)
                if sale_date == today:
                    today_sales_total += float(sale.total or 0)

            # low stock count
            low_stock_count = 0
            medicines = Medicine.objects.prefetch_related("batches").all()
            for medicine in medicines:
                total_qty = sum(int(batch.qty or 0) for batch in medicine.batches.all())
                if total_qty <= 10:
                    low_stock_count += 1

            # expiry soon
            expiry_soon_count = 0
            batches = MedicineBatch.objects.filter(qty__gt=0)
            for batch in batches:
                if batch.expiry and today <= batch.expiry <= expiry_limit:
                    expiry_soon_count += 1

            # top selling
            top_map = {}
            sale_items = SaleItem.objects.select_related("medicine").all()
            for item in sale_items:
                med_name = item.medicine.name if item.medicine else "Unknown"
                if med_name not in top_map:
                    top_map[med_name] = {"name": med_name, "qty": 0, "amount": 0.0}

                top_map[med_name]["qty"] += int(item.qty or 0)
                top_map[med_name]["amount"] += float(item.line_total or 0)

            top_selling = sorted(
                top_map.values(),
                key=lambda x: (x["qty"], x["amount"]),
                reverse=True,
            )[:5]

            total_customers = Customer.objects.count()
            total_suppliers = Supplier.objects.count()
            total_medicines = Medicine.objects.count()

            return Response(
                {
                    "today_sales": float(today_sales_total),
                    "low_stock_alerts": low_stock_count,
                    "expiry_soon_alerts": expiry_soon_count,
                    "top_selling": top_selling,
                    "total_customers": total_customers,
                    "total_suppliers": total_suppliers,
                    "total_medicines": total_medicines,
                }
            )
        except Exception as e:
            return Response({"detail": str(e)}, status=500)


class ReportsView(APIView):
    def get_date_range(self, request):
        today = timezone.localdate()
        start_str = request.GET.get("start")
        end_str = request.GET.get("end")

        try:
            start_date = datetime.strptime(start_str, "%Y-%m-%d").date() if start_str else today.replace(day=1)
            end_date = datetime.strptime(end_str, "%Y-%m-%d").date() if end_str else today
        except ValueError:
            return None, None, Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=400,
            )

        if start_date > end_date:
            return None, None, Response(
                {"detail": "Start date cannot be after end date."},
                status=400,
            )

        return start_date, end_date, None

    def get(self, request, *args, **kwargs):
        report_type = request.GET.get("type", "sales")
        start_date, end_date, error_response = self.get_date_range(request)
        if error_response:
            return error_response

        if report_type == "sales":
            rows = []
            total_sales = 0.0

            sales = Sale.objects.select_related("customer").all().order_by("-date")
            for s in sales:
                sale_date = safe_local_date(s.date)
                if not sale_date:
                    continue
                if not (start_date <= sale_date <= end_date):
                    continue

                total_sales += float(s.total or 0)
                rows.append({
                    "invoice": s.invoice,
                    "date": sale_date.strftime("%Y-%m-%d"),
                    "customer": s.customer.name if s.customer else "-",
                    "subtotal": float(s.subtotal or 0),
                    "discount_percent": float(s.discount_percent or 0),
                    "gst_percent": float(s.gst_percent or 0),
                    "total": float(s.total or 0),
                })

            return Response({
                "type": "sales",
                "summary": {
                    "count": len(rows),
                    "total_sales": total_sales,
                },
                "rows": rows,
            })

        if report_type == "profit":
            rows = []
            total_profit = 0.0

            items = SaleItem.objects.select_related("medicine", "sale").all()
            for item in items:
                sale_date = safe_local_date(item.sale.date if item.sale else None)
                if not sale_date:
                    continue
                if not (start_date <= sale_date <= end_date):
                    continue

                medicine = item.medicine
                batch = medicine.batches.order_by("expiry", "id").first() if medicine else None
                cost_price = float(batch.cost) if batch else 0.0
                sell_price = float(item.price or 0)
                qty = int(item.qty or 0)
                profit = (sell_price - cost_price) * qty
                total_profit += profit

                rows.append({
                    "invoice": item.sale.invoice if item.sale else "-",
                    "medicine": medicine.name if medicine else "-",
                    "qty": qty,
                    "cost_price": cost_price,
                    "sell_price": sell_price,
                    "profit": profit,
                })

            return Response({
                "type": "profit",
                "summary": {
                    "count": len(rows),
                    "total_profit": total_profit,
                },
                "rows": rows,
            })

        if report_type == "expiry":
            data = []
            rows = MedicineBatch.objects.select_related("medicine").filter(qty__gt=0).order_by("expiry")

            for row in rows:
                if row.expiry and start_date <= row.expiry <= end_date:
                    data.append({
                        "medicine": row.medicine.name,
                        "batch_no": row.batch_no,
                        "expiry": row.expiry.strftime("%Y-%m-%d"),
                        "qty": row.qty,
                        "mrp": float(row.mrp or 0),
                    })

            return Response({
                "type": "expiry",
                "summary": {
                    "count": len(data),
                },
                "rows": data,
            })

        if report_type == "low-stock":
            data = []
            medicines = Medicine.objects.prefetch_related("batches").all()

            for medicine in medicines:
                total_qty = sum(int(batch.qty or 0) for batch in medicine.batches.all())
                if total_qty <= 10:
                    data.append({
                        "medicine": medicine.name,
                        "category": medicine.category,
                        "stock": total_qty,
                        "barcode": medicine.barcode or "-",
                    })

            return Response({
                "type": "low-stock",
                "summary": {
                    "count": len(data),
                },
                "rows": data,
            })

        return Response({"detail": "Invalid report type."}, status=400)