import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";
import api from "../api/api";

function money(n) {
  return `₹${Number(n || 0).toFixed(2)}`;
}

function generateInvoiceNo() {
  const ts = Date.now().toString().slice(-6);
  return `INV-${ts}`;
}

function sumQty(batches) {
  return (batches || []).reduce((s, b) => s + Number(b.qty || 0), 0);
}

export default function Billing() {
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);

  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(5);

  const [customer, setCustomer] = useState({ name: "", phone: "" });

  const [invOpen, setInvOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState("");
  const [refundReason, setRefundReason] = useState("Customer returned items");

  const fetchMedicines = async () => {
    try {
      setLoadingCatalog(true);
      setError("");
      const res = await api.get("medicines/");
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows.map((m) => ({
        id: m.id,
        name: m.name,
        price:
          m.batches && m.batches.length > 0
            ? Number(m.batches[0].sell || 0)
            : 0,
        stock: sumQty(m.batches),
        raw: m,
      }));
      setCatalog(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load medicines");
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return catalog;
    return catalog.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, catalog]);

  const addToCart = (item) => {
    if (item.stock <= 0) {
      alert("Out of stock");
      return;
    }

    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        const nextQty = found.qty + 1;
        if (nextQty > item.stock) {
          alert(`Only ${item.stock} items available in stock`);
          return prev;
        }
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: nextQty } : p
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const setQty = (id, qty) => {
    const qn = Number(qty);
    const item = catalog.find((c) => c.id === id);
    if (!item) return;
    if (Number.isNaN(qn) || qn < 1) return;
    if (qn > item.stock) {
      alert(`Only ${item.stock} items available in stock`);
      return;
    }

    setCart((prev) => prev.map((p) => (p.id === id ? { ...p, qty: qn } : p)));
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  const subtotal = cart.reduce((sum, it) => sum + Number(it.price) * Number(it.qty), 0);
  const discountAmt = (subtotal * Number(discount || 0)) / 100;
  const taxable = Math.max(0, subtotal - discountAmt);
  const gstAmt = (taxable * Number(gst || 0)) / 100;
  const total = taxable + gstAmt;

  const previewInvoice = () => {
    if (cart.length === 0) return alert("Cart is empty");
    if (!customer.name.trim()) return alert("Customer name required");
    if (!customer.phone.trim()) return alert("Customer phone required");

    const inv = {
      invoiceNo: generateInvoiceNo(),
      customer: { ...customer },
      items: cart.map((x) => ({
        ...x,
        lineTotal: Number(x.price) * Number(x.qty),
      })),
      summary: {
        subtotal,
        discountPercent: Number(discount || 0),
        discountAmt,
        gstPercent: Number(gst || 0),
        gstAmt,
        total,
      },
    };

    setInvoice(inv);
    setInvOpen(true);
  };

  const completeSale = async () => {
    if (!invoice) return;

    const payload = {
      invoice: invoice.invoiceNo,
      customer_name: invoice.customer.name,
      customer_phone: invoice.customer.phone,
      subtotal: Number(invoice.summary.subtotal.toFixed(2)),
      discount_percent: Number(invoice.summary.discountPercent),
      gst_percent: Number(invoice.summary.gstPercent),
      total: Number(invoice.summary.total.toFixed(2)),
      items: invoice.items.map((it) => ({
        medicine_id: it.id,
        qty: Number(it.qty),
        price: Number(it.price),
      })),
    };

    try {
      setSubmitting(true);
      await api.post("sales/", payload);

      alert(`Sale completed successfully: ${invoice.invoiceNo}`);
      setCart([]);
      setCustomer({ name: "", phone: "" });
      setDiscount(0);
      setGst(5);
      setInvoice(null);
      setInvOpen(false);
      await fetchMedicines();
    } catch (err) {
      console.error(err);
      const apiError = err?.response?.data;
      if (typeof apiError === "string") {
        alert(apiError);
      } else if (apiError && typeof apiError === "object") {
        const firstKey = Object.keys(apiError)[0];
        const firstValue = apiError[firstKey];
        alert(Array.isArray(firstValue) ? firstValue[0] : String(firstValue));
      } else {
        alert("Failed to complete sale");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onRefundSubmit = () => {
    if (!refundInvoice.trim()) return alert("Invoice number required");
    alert(`Refund requested for ${refundInvoice}\nReason: ${refundReason}\n(Demo flow)`);
    setRefundOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Billing / POS</div>
          <div className="text-sm text-slate-600">Medicines stock connected to sales</div>
        </div>

        <div className="flex gap-2">
          <PermissionGate any={[PERMS.BILLING_REFUND]}>
            <Button variant="ghost" onClick={() => setRefundOpen(true)}>
              Return / Refund
            </Button>
          </PermissionGate>

          <Button onClick={previewInvoice} disabled={cart.length === 0}>
            Generate Invoice
          </Button>
        </div>
      </div>

      <Card className="p-5">
        <div className="text-sm font-bold text-slate-900">Customer</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Customer Name"
            value={customer.name}
            onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            label="Phone"
            value={customer.phone}
            onChange={(e) => setCustomer((p) => ({ ...p, phone: e.target.value }))}
          />
        </div>
      </Card>

      {error ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Search Medicine"
                placeholder="Type name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setQuery("")} variant="ghost">
              Clear
            </Button>
          </div>

          {loadingCatalog ? (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
              Loading medicines...
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => addToCart(m)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                >
                  <div className="text-sm font-extrabold text-slate-900">{m.name}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Price: {money(m.price)}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Stock: {m.stock}
                  </div>
                  <div className="mt-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                    Add to Cart
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="text-lg font-extrabold text-slate-900">Cart</div>
          <div className="mt-1 text-xs text-slate-500">Sale will deduct stock batch-wise</div>

          <div className="mt-4 space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                Cart is empty. Add items from left.
              </div>
            ) : (
              cart.map((it) => (
                <div key={it.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{it.name}</div>
                      <div className="text-xs text-slate-600">{money(it.price)} each</div>
                      <div className="text-xs text-slate-500">Available: {it.stock}</div>
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      className="text-xs font-bold text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="w-24">
                      <Input
                        label="Qty"
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => setQty(it.id, e.target.value)}
                      />
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {money(Number(it.price) * Number(it.qty))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Input
              label="Discount %"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
            <Input
              label="GST %"
              type="number"
              min="0"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
            />
          </div>

          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Discount</span>
              <span>- {money(discountAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST</span>
              <span>+ {money(gstAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-900 text-base font-black">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>

          <Button className="mt-5 w-full" disabled={cart.length === 0} onClick={previewInvoice}>
            Generate Invoice
          </Button>
        </Card>
      </div>

      <Modal
        open={invOpen}
        title={invoice ? `Invoice Preview • ${invoice.invoiceNo}` : "Invoice Preview"}
        onClose={() => setInvOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInvOpen(false)}>
              Close
            </Button>
            <Button onClick={completeSale} disabled={submitting}>
              {submitting ? "Processing..." : "Complete Sale"}
            </Button>
          </>
        }
      >
        {invoice ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="text-sm font-bold text-slate-900">Customer</div>
              <div className="text-sm text-slate-700">
                {invoice.customer.name} • {invoice.customer.phone}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Item</th>
                    <th className="px-3 py-2 font-semibold">Qty</th>
                    <th className="px-3 py-2 font-semibold">Price</th>
                    <th className="px-3 py-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((it) => (
                    <tr key={it.id} className="border-t border-slate-200">
                      <td className="px-3 py-2 font-semibold text-slate-900">{it.name}</td>
                      <td className="px-3 py-2 text-slate-700">{it.qty}</td>
                      <td className="px-3 py-2 text-slate-700">{money(it.price)}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{money(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
              <div className="flex justify-between text-sm text-slate-700">
                <span>Subtotal</span><span>{money(invoice.summary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-700">
                <span>Discount ({invoice.summary.discountPercent}%)</span><span>- {money(invoice.summary.discountAmt)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-700">
                <span>GST ({invoice.summary.gstPercent}%)</span><span>+ {money(invoice.summary.gstAmt)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-black text-slate-900">
                <span>Grand Total</span><span>{money(invoice.summary.total)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-600">No invoice generated.</div>
        )}
      </Modal>

      <Modal
        open={refundOpen}
        title="Return / Refund"
        onClose={() => setRefundOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefundOpen(false)}>Cancel</Button>
            <Button onClick={onRefundSubmit}>Submit Refund</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Invoice Number"
            placeholder="INV-1001"
            value={refundInvoice}
            onChange={(e) => setRefundInvoice(e.target.value)}
          />
          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Reason</div>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="e.g., Wrong medicine / damaged pack / customer return..."
            />
          </label>
          <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-amber-100">
            Refund UI unchanged. Stock reverse logic next step lo add cheddam.
          </div>
        </div>
      </Modal>
    </div>
  );
}