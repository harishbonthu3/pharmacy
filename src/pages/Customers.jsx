import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

import PermissionGate from "../auth/PermissionGate";
import { PERMS } from "../auth/permissions";
import api from "../api/api";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [editId, setEditId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
    address: "",
    points: 0,
    notes: "",
  });

  // purchase history modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // demo purchase data (unchanged UI logic)
  const purchaseHistory = [
    { id: 1, customerId: 1, invoice: "INV-1001", date: "2026-03-01", items: 3, amount: 350 },
    { id: 2, customerId: 1, invoice: "INV-1005", date: "2026-03-03", items: 2, amount: 210 },
    { id: 3, customerId: 2, invoice: "INV-1010", date: "2026-03-04", items: 5, amount: 680 },
  ];

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("customers/");
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;

    return customers.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
        String(c.phone || "").includes(search)
    );
  }, [customers, search]);

  const openAdd = () => {
    setMode("add");
    setEditId(null);
    setForm({
      name: "",
      phone: "",
      email: "",
      gender: "",
      dob: "",
      address: "",
      points: 0,
      notes: "",
    });
    setOpen(true);
  };

  const openEdit = (c) => {
    setMode("edit");
    setEditId(c.id);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      gender: c.gender || "",
      dob: c.dob || "",
      address: c.address || "",
      points: c.points ?? 0,
      notes: c.notes || "",
    });
    setOpen(true);
  };

  const saveCustomer = async () => {
    if (!form.name.trim()) return alert("Customer name required");
    if (!form.phone.trim()) return alert("Phone number required");

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      gender: form.gender.trim() || null,
      dob: form.dob || null,
      address: form.address.trim() || null,
      points: Number(form.points || 0),
      notes: form.notes.trim() || null,
    };

    try {
      setSaving(true);

      if (mode === "add") {
        const res = await api.post("customers/", payload);
        setCustomers((prev) => [res.data, ...prev]);
      } else {
        const res = await api.put(`customers/${editId}/`, payload);
        setCustomers((prev) => prev.map((c) => (c.id === editId ? res.data : c)));
      }

      setOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save customer");
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (id) => {
    if (!confirm("Delete this customer?")) return;

    try {
      await api.delete(`customers/${id}/`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete customer");
    }
  };

  const openHistory = (customer) => {
    setSelectedCustomer(customer);
    setHistoryOpen(true);
  };

  const historyData = purchaseHistory.filter(
    (p) => p.customerId === selectedCustomer?.id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-2xl font-black text-slate-900">
            Customers
          </div>

          <div className="text-sm text-slate-600">
            Customer profile + purchase history
          </div>
        </div>

        <PermissionGate any={[PERMS.CUSTOMERS_CREATE]}>
          <Button onClick={openAdd}>
            Add Customer
          </Button>
        </PermissionGate>
      </div>

      <Card className="p-5">
        <Input
          label="Search Customer"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      {error ? (
        <Card className="p-4">
          <div className="text-sm font-semibold text-red-600">{error}</div>
        </Card>
      ) : null}

      {loading ? (
        <Card className="p-6 text-center text-slate-500">
          Loading customers...
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="text-lg font-extrabold text-slate-900">
                {c.name}
              </div>

              <div className="text-sm text-slate-600">
                📞 {c.phone}
              </div>

              <div className="text-sm text-slate-600">
                ✉️ {c.email || "-"}
              </div>

              <div className="text-sm text-slate-600">
                Address: {c.address || "-"}
              </div>

              <div className="mt-2 text-xs font-bold text-blue-700">
                Loyalty Points: {c.points ?? 0}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => openHistory(c)}
                >
                  View
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => openEdit(c)}
                >
                  Edit
                </Button>

                <PermissionGate any={[PERMS.CUSTOMERS_DELETE]}>
                  <Button
                    variant="danger"
                    onClick={() => deleteCustomer(c.id)}
                  >
                    Delete
                  </Button>
                </PermissionGate>
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <Card className="p-6 text-center text-slate-500">
              No customers found
            </Card>
          )}
        </div>
      )}

      {/* Customer Form Modal */}
      <Modal
        open={open}
        title={mode === "add" ? "Add Customer" : "Edit Customer"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={saveCustomer} disabled={saving}>
              {saving ? "Saving..." : mode === "add" ? "Add" : "Save"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Customer Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <Input
            label="Gender"
            value={form.gender}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value })
            }
          />

          <Input
            label="Date of Birth"
            type="date"
            value={form.dob}
            onChange={(e) =>
              setForm({ ...form, dob: e.target.value })
            }
          />

          <Input
            label="Address"
            value={form.address}
            onChange={(e) =>
              setForm({ ...form, address: e.target.value })
            }
          />

          <Input
            label="Loyalty Points"
            type="number"
            value={form.points}
            onChange={(e) =>
              setForm({ ...form, points: e.target.value })
            }
          />

          <label className="block">
            <div className="mb-1 text-sm font-medium text-slate-700">
              Notes
            </div>

            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </Modal>

      {/* Purchase History Modal */}
      <Modal
        open={historyOpen}
        title="Customer Purchase History"
        onClose={() => setHistoryOpen(false)}
        footer={
          <Button onClick={() => setHistoryOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedCustomer && (
          <div>
            <div className="mb-4 text-sm text-slate-600">
              Customer: <b>{selectedCustomer.name}</b>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Invoice</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Items</th>
                  <th className="p-2 text-left">Amount</th>
                </tr>
              </thead>

              <tbody>
                {historyData.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.invoice}</td>
                    <td className="p-2">{p.date}</td>
                    <td className="p-2">{p.items}</td>
                    <td className="p-2 font-bold">₹{p.amount}</td>
                  </tr>
                ))}

                {historyData.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-3 text-center text-slate-500">
                      No purchases yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}