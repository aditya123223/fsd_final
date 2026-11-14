import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDoctorProfile, updateDoctorProfile } from '../../api/doctor.api.js';
import { useAuth } from '../../hooks/useAuth.js';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  Stethoscope,
  Award,
  DollarSign,
  Clock,
  ShieldCheck,
  Save,
  Globe,
} from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';

export default function DoctorProfilePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', 'profile'],
    queryFn: async () => {
      const res = await fetchDoctorProfile();
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
        specialization: data.profile?.specialization || '',
        qualifications: data.profile?.qualifications?.join(', ') || '',
        experience: data.profile?.experience || 0,
        consultationFee: data.profile?.consultationFee || 0,
        consultationDuration: data.profile?.consultationDuration || 30,
        registrationNumber: data.profile?.registrationNumber || '',
        timezone: data.profile?.timezone || 'UTC',
        bio: data.profile?.bio || '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        specialization: formData.specialization,
        qualifications: formData.qualifications
          ? formData.qualifications.split(',').map((s) => s.trim())
          : [],
        experience: Number(formData.experience),
        consultationFee: Number(formData.consultationFee),
        consultationDuration: Number(formData.consultationDuration),
        registrationNumber: formData.registrationNumber,
        timezone: formData.timezone,
        bio: formData.bio,
      };

      const res = await updateDoctorProfile(payload);
      toast.success('Doctor profile updated successfully');
      if (res.data?.data?.user) {
        setUser((prev) => ({ ...prev, ...res.data.data.user }));
      }
      queryClient.invalidateQueries({ queryKey: ['doctor', 'profile'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update doctor profile');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={1} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Professional Doctor Profile</h1>
        <p className="text-xs text-gray-500 mt-1">
          Maintain your clinical credentials, rates, and specialization info for patients
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 font-bold text-2xl flex items-center justify-center border border-teal-200">
              {user?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">{user?.name}</h3>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <span className="inline-block px-2 py-0.5 mt-1 bg-teal-50 text-teal-700 rounded text-[11px] font-semibold uppercase">
                Verified Medical Professional
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
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Specialization</label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  {...register('specialization', { required: 'Specialization is required' })}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {errors.specialization && (
                <p className="mt-1 text-xs text-red-500">{errors.specialization.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Medical Reg Number
              </label>
              <div className="relative">
                <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  {...register('registrationNumber')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Qualifications (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. MBBS, MD, FRCP"
              {...register('qualifications')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Experience (Years)</label>
              <div className="relative">
                <Award className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="number"
                  {...register('experience')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Consultation Fee ($)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="number"
                  {...register('consultationFee')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Slot Duration</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <select
                  {...register('consultationDuration')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value={15}>15 minutes</option>
                  <option value={20}>20 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Timezone</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="UTC or Asia/Kolkata"
                {...register('timezone')}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Professional Bio</label>
            <textarea
              rows={3}
              placeholder="Brief description of clinical background, specialties, and approach..."
              {...register('bio')}
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Updating Credentials...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
