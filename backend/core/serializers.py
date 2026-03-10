from rest_framework import serializers

from .models import (
    Supplier,
    Customer,
    Medicine,
    MedicineBatch,
    Purchase,
    Sale,
    SaleItem,
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class MedicineBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicineBatch
        fields = "__all__"


class MedicineSerializer(serializers.ModelSerializer):
    batches = MedicineBatchSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = "__all__"


class PurchaseSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Purchase
        fields = "__all__"


class SaleItemReadSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source="medicine.name", read_only=True)

    class Meta:
        model = SaleItem
        fields = ["id", "medicine", "medicine_name", "qty", "price", "line_total"]


class SaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    items = SaleItemReadSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = "__all__"


class SaleCreateItemSerializer(serializers.Serializer):
    medicine_id = serializers.IntegerField()
    qty = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)


class SaleCreateSerializer(serializers.Serializer):
    invoice = serializers.CharField(max_length=100)
    customer_name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    gst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    total = serializers.DecimalField(max_digits=10, decimal_places=2)
    items = SaleCreateItemSerializer(many=True)