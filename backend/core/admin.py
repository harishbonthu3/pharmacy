from django.contrib import admin
from .models import Supplier, Customer, Medicine, Purchase, Sale

admin.site.register(Supplier)
admin.site.register(Customer)
admin.site.register(Medicine)
admin.site.register(Purchase)
admin.site.register(Sale)