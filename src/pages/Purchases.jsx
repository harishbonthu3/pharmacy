import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";
import api from "../api/api";

export default function Purchases() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    invoice: "",
    supplier: "",
    date: "",
    amount: 0,
    status: "PAID",
  });

  const resetForm = () => {
    setForm({
      invoice: "",
      supplier: "",
      date: "",
      amount: 0,
      status: "PAID",
    });
  };

  const fetchPurchases = async () => {
    try {
      const res = await api.get("purchases/");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await api.get("suppliers/");
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([fetchPurchases(), fetchSuppliers()]);
    } catch (err) {
      setError("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter(
      (p) =>
        String(p.invoice || "").toLowerCase().includes(q.toLowerCase()) ||
        String(p.supplier_name || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q]);

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (p) => {
    setMode("edit");
    setEditingId(p.id);
    setForm({
      invoice: p.invoice || "",
      supplier: p.supplier || "",
      date: p.date || "",
      amount: p.amount ?? 0,
      status: p.status || "PAID",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.invoice.trim()) return alert("Invoice required");
    if (!form.supplier) return alert("Supplier required");
    if (!form.date) return alert("Date required");

    const amountNum = Number(form.amount);
    if (Number.isNaN(amountNum) || amountNum < 0) {
      return alert("Amount must be 0 or more");
    }

    const payload = {
      invoice: form.invoice.trim(),
      supplier: Number(form.supplier),
      date: form.date,
      amount: amountNum,
      status: form.status,
    };

    try {
      setSaving(true);

      if (mode === "add") {
        await api.post("purchases/", payload);
      } else {
        await api.put(`purchases/${editingId}/`, payload);
      }

      await loadData();
      setOpen(false);
      resetForm();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.supplier?.[0] ||
        err?.response?.data?.invoice?.[0] ||
        err?.response?.data?.date?.[0] ||
        err?.response?.data?.amount?.[0] ||
        "Failed to save purchase";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this purchase?")) return;

    try {
      await api.delete(`purchases/${id}/`);
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete purchase");
    }
  };

  const fmtDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Purchases</div>
          <div className="text-sm text-slate-600">
            Stock Inward • Purchase invoices • History
          </div>
        </div>

        <PermissionGate any={[PERMS.PURCHASES_CREATE]}>
          <Button onClick={openAdd}>Add Purchase</Button>
        </PermissionGate>
      </div>

      {/* Search */}
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          <div className="flex-1">
            <Input
              label="Search by Invoice / Supplier"
              placeholder="PUR-xxxx or supplier..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button variant="ghost" onClick={() => setQ("")}>
            Clear
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-6 text-center text-slate-500">
          Loading purchases...
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-bold text-slate-900">Purchase History</div>
            <div className="text-xs text-slate-500">Backend synced data</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Supplier</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {p.invoice}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {p.supplier_name || "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {fmtDate(p.date)}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      ₹{p.amount}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold ring-1",
                          p.status === "DUE"
                            ? "bg-amber-50 text-amber-800 ring-amber-100"
                            : "bg-green-50 text-green-700 ring-green-100",
                        ].join(" ")}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => alert("View details next")}
                        >
                          View
                        </Button>

                        <PermissionGate any={[PERMS.PURCHASES_EDIT]}>
                          <Button variant="ghost" onClick={() => openEdit(p)}>
                            Edit
                          </Button>
                        </PermissionGate>

                        <PermissionGate any={[PERMS.PURCHASES_DELETE]}>
                          <Button variant="danger" onClick={() => del(p.id)}>
                            Delete
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-slate-500">
                      No purchases found
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal
        open={open}
        title={mode === "add" ? "Add Purchase" : "Edit Purchase"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Invoice No"
            value={form.invoice}
            onChange={(e) => setForm((p) => ({ ...p, invoice: e.target.value }))}
          />

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Supplier</div>
            <select
              value={form.supplier}
              onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
          />

          <Input
            label="Amount"
            type="number"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">Status</div>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="PAID">PAID</option>
              <option value="DUE">DUE</option>
            </select>
          </label>
        </div>
      </Modal>
    </div>
  );
}