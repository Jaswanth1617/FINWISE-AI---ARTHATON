import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, ShieldCheck, Briefcase, Phone, Save, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: user?.profile?.full_name || user?.username || '',
    phone_number: user?.profile?.phone_number || '',
    occupation: user?.profile?.occupation || 'Software Engineer',
    annual_income: user?.profile?.annual_income || 1200000,
    risk_tolerance: user?.profile?.risk_tolerance || 'Moderate',
    currency: user?.profile?.currency || 'INR'
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.put('/auth/profile', profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert("Error updating profile: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal & Financial Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your financial baseline and risk tolerance preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-finwise-navy text-white text-xl font-bold flex items-center justify-center uppercase shadow-sm">
            {user?.username ? user.username.slice(0, 2) : 'FW'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{profile.full_name || user?.username}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="mt-1.5 inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Role: {user?.role || 'Individual'}
            </span>
          </div>
        </div>

        {saved && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Profile attributes successfully updated.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Occupation</label>
              <input
                type="text"
                value={profile.occupation}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={profile.phone_number}
                onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Annual CTC Income (₹)</label>
              <input
                type="number"
                value={profile.annual_income}
                onChange={(e) => setProfile({ ...profile, annual_income: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Investment Risk Appetite</label>
              <select
                value={profile.risk_tolerance}
                onChange={(e) => setProfile({ ...profile, risk_tolerance: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
              >
                <option value="Conservative">Conservative (Capital Preservation)</option>
                <option value="Moderate">Moderate (Index Funds + Balanced)</option>
                <option value="Aggressive">Aggressive (High Equity Growth)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
