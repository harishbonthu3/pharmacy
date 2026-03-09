export default function Input({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <div className="mb-1 text-sm font-medium text-slate-700">{label}</div> : null}
      <input
        {...props}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${className}`}
      />
    </label>
  );
}