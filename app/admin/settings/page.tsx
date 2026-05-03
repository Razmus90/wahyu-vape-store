'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Store, CreditCard, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type Settings = {
  username?: string;
  email?: string;
  store_name?: string;
  store_contact?: string;
  store_address?: string;
  payment_gateway?: string;
  product_display?: { show_out_of_stock: boolean };
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Store info
  const [storeName, setStoreName] = useState('');
  const [storeContact, setStoreContact] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  // Display preferences
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  // Payment gateway
  const [paymentGateway, setPaymentGateway] = useState('ipaymu');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        setStoreName(data.data.store_name || '');
        setStoreContact(data.data.store_contact || '');
        setStoreAddress(data.data.store_address || '');
        setShowOutOfStock(data.data.product_display?.show_out_of_stock ?? true);
        setPaymentGateway(data.data.payment_gateway || 'ipaymu');
      }
    } catch {
      setError('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch {
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_name: storeName,
          store_contact: storeContact,
          store_address: storeAddress,
          product_display: { show_out_of_stock: showOutOfStock },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Settings saved successfully');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">General Settings</h1>
        <p className="text-gray-400 text-sm">Manage your store settings and admin account</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Change Password */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Change Password</h2>
              <p className="text-gray-400 text-sm">Update your admin password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Enter new password (min 6 chars)"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Confirm new password"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold py-2.5 px-6 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Store Information */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-semibold">Store Information</h2>
              <p className="text-gray-400 text-sm">Update your store details</p>
            </div>
          </div>

          <form onSubmit={handleSaveStoreInfo} className="space-y-4">

            {/* Payment Gateway Toggle */}
            <div className="pt-4 border-t border-gray-800">
              <h3 className="text-white font-medium mb-3">Payment Gateway</h3>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-gray-300 text-sm">Current Gateway</p>
                  <p className="text-amber-400 text-sm font-medium">
                    {paymentGateway === 'ipaymu' ? 'iPaymu QRIS (Primary)' : 'Midtrans (Fallback)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const next = paymentGateway === 'ipaymu' ? 'midtrans' : 'ipaymu';
                    setPaymentGateway(next);
                    try {
                      const res = await fetch('/api/admin/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ payment_gateway: next }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setSuccess(`Payment gateway switched to ${next}`);
                        setTimeout(() => setSuccess(''), 3000);
                      }
                    } catch (e) {
                      console.error('Failed to save gateway:', e);
                      setPaymentGateway(paymentGateway); // revert
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    paymentGateway === 'ipaymu' ? 'bg-amber-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      paymentGateway === 'ipaymu' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-gray-600 text-xs">
                {paymentGateway === 'ipaymu'
                  ? 'iPaymu QRIS is active. Customers will scan QR codes for payment.'
                  : 'Midtrans is active. Customers will use Midtrans payment page.'}
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Store Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Wahyu Vape Store"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Contact (WhatsApp/Phone)</label>
              <input
                type="text"
                value={storeContact}
                onChange={(e) => setStoreContact(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="+62 812-3456-7890"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Store Address</label>
              <textarea
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                placeholder="Enter store address..."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 font-semibold py-2.5 px-6 rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
