import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Stethoscope, Award, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { fetchDoctors } from '../../api/doctor.api.js';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function FindDoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', { search: searchTerm, specialization }],
    queryFn: async () => {
      const res = await fetchDoctors({ search: searchTerm, specialization });
      return res.data.data;
    },
  });

  const doctors = Array.isArray(data) ? data : (data?.doctors || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-xs text-gray-500 mt-1">
          Browse verified specialists and check real-time consultation availability
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search doctor by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Dermatology">Dermatology</option>
            <option value="Pediatrics">Pediatrics</option>
            <option value="General Medicine">General Medicine</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={6} />
        </div>
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try modifying your search keywords or removing filters."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((item) => {
            const doctorUser = item.userId?._id ? item.userId : item;
            const profile = item.userId?._id ? item : (item.profile || {});
            const doctorId = doctorUser._id || item._id;
            const name = doctorUser.name || 'Doctor';
            return (
              <div
                key={item._id || doctorId}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                      {name.charAt(0) || 'D'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-base truncate">{name}</h3>
                      <p className="text-xs font-semibold text-teal-600 mt-0.5">
                        {profile.specialization || 'General Specialist'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {profile.qualifications?.join(', ') || 'MBBS'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-gray-100 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{profile.experience || 0}+ Years Exp</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <span>${profile.consultationFee || 0} / visit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{profile.consultationDuration || 30} mins</span>
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{profile.bio}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link
                    to={`/patient/doctors/${doctorId}`}
                    className="flex-1 text-center py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/patient/book/${doctorId}`}
                    className="flex-1 text-center py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1"
                  >
                    Book Now <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
