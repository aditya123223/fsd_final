import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPatientProfile, updatePatientProfile } from '../../api/patient.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, Heart, Save } from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import dayjs from 'dayjs';

export default function PatientProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['patient', 'profile'],
    queryFn: async () => {
      const res = await fetchPatientProfile();
      return res.data.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (data) {
      reset({
        name: data.user?.name || '',
        phone: data.user?.phone || '',
        gender: data.profile?.gender || 'prefer_not_to_say',
        dateOfBirth: data.profile?.dateOfBirth
          ? dayjs(data.profile.dateOfBirth).format('YYYY-MM-DD')
          : '',
        bloodGroup: data.profile?.bloodGroup || '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const res = await updatePatientProfile(formData);
      toast.success('Profile updated successfully');
      if (res.data?.data?.user) {
        setUser((prev) => ({ ...prev, ...res.data.data.user }));
      }
      queryClient.invalidateQueries({ queryKey: ['patient', 'profile'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={1} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your personal details, emergency info, and medical preferences
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 font-bold text-2xl flex items-center justify-center border border-blue-200">
              {user?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{user?.name}</h3>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <span className="inline-block px-2 py-0.5 mt-1 bg-blue-50 text-blue-600 rounded text-[11px] font-semibold uppercase">
                Patient Account
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
              <div className="relative">
                <Heart className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. O+, A-"
                  {...register('bloodGroup')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
