import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5 max-w-md w-full">
        <div className="text-2xl font-black text-slate-900">Access Denied</div>
        <div className="mt-2 text-sm text-slate-600">
          You don't have permission to view this page.
        </div>
        <Link
          to="/app/dashboard"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}