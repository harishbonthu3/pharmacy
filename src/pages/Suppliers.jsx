import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";
import api from "../api/api";

export default function Suppliers() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    due: 0,
  });

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      email: "",
      address: "",
      due: 0,
    });
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("suppliers/");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    return items.filter((s) =>
      String(s.name || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [items, q]);

  const openAdd = () => {
    setMode("add");
    setEditingId(null);
    resetForm();
    setOpen(true);
  };

  const openEdit = (s) => {
    setMode("edit");
    setEditingId(s.id);
    setForm({
      name: s.name || "",
      phone: s.phone || "",
      email: s.email || "",
      address: s.address || "",
      due: s.due ?? 0,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return alert("Supplier name required");
    if (!form.phone.trim()) return alert("Phone required");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      due: Number(form.due || 0),
    };

    try {
      setSaving(true);

      if (mode === "add") {
        await api.post("suppliers/", payload);
      } else {
        await api.put(`suppliers/${editingId}/`, payload);
      }

      await fetchSuppliers();
      setOpen(false);
      resetForm();
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this supplier?")) return;

    try {
      await api.delete(`suppliers/${id}/`);
      await fetchSuppliers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete supplier");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">Suppliers</div>
          <div className="text-sm text-slate-600">Supplier details • Due tracking</div>
        </div>

        <PermissionGate any={[PERMS.SUPPLIERS_CREATE]}>
          <Button onClick={openAdd}>Add Supplier</Button>
        </PermissionGate>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search supplier name..."
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
          Loading suppliers...
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{s.name}</div>
                  <div className="mt-1 text-sm text-slate-600">📞 {s.phone}</div>
                  <div className="text-sm text-slate-600">✉️ {s.email || "-"}</div>
                  <div className="text-sm text-slate-600">📍 {s.address || "-"}</div>
                </div>

                <div
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold ring-1 whitespace-nowrap",
                    Number(s.due) > 0
                      ? "bg-red-50 text-red-700 ring-red-100"
                      : "bg-green-50 text-green-700 ring-green-100",
                  ].join(" ")}
                >
                  {Number(s.due) > 0 ? `Due ₹${s.due}` : "No Due"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  onClick={() => alert("Supplier details next")}
                >
                  View
                </Button>

                <PermissionGate any={[PERMS.SUPPLIERS_EDIT]}>
                  <Button variant="ghost" onClick={() => openEdit(s)}>
                    Edit
                  </Button>
                </PermissionGate>

                <PermissionGate any={[PERMS.SUPPLIERS_DELETE]}>
                  <Button variant="danger" onClick={() => del(s.id)}>
                    Delete
                  </Button>
                </PermissionGate>
              </div>
            </Card>
          ))}

          {filtered.length === 0 ? (
            <Card className="p-6 text-center text-slate-500">
              No suppliers found
            </Card>
          ) : null}
        </div>
      )}

      <Modal
        open={open}
        title={mode === "add" ? "Add Supplier" : "Edit Supplier"}
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
            label="Supplier Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />

          <Input
            label="Email (optional)"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />

          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />

          <Input
            label="Due Amount"
            type="number"
            min="0"
            value={form.due}
            onChange={(e) => setForm((p) => ({ ...p, due: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}