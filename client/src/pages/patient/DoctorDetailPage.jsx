import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope,
  Award,
  DollarSign,
  Clock,
  ShieldCheck,
  Calendar as CalendarIcon,
  ArrowRight,
} from 'lucide-react';
import { fetchDoctorById, fetchDoctorAvailability } from '../../api/doctor.api.js';
import { useSocket } from '../../hooks/useSocket.js';
import DatePicker from '../../components/appointments/DatePicker.jsx';
import SlotPicker from '../../components/appointments/SlotPicker.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import dayjs, { formatTime } from '../../utils/dateTime.js';

export default function DoctorDetailPage() {
  const { id } = useParams();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Fetch doctor info
  const { data: doctorData, isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await fetchDoctorById(id);
      return res.data.data;
    },
  });

  // Fetch slot availability for selected date
  const { data: availabilityData, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctor', id, 'availability', selectedDate],
    queryFn: async () => {
      const res = await fetchDoctorAvailability(id, selectedDate);
      return res.data.data;
    },
    enabled: !!id && !!selectedDate,
  });

  // Real-time socket room subscription for slot updates
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('availability:join', { doctorId: id });

    const handleSlotTaken = ({ date, startTime }) => {
      if (dayjs(date).format('YYYY-MM-DD') === selectedDate) {
        queryClient.invalidateQueries({
          queryKey: ['doctor', id, 'availability', selectedDate],
        });
      }
    };

    const handleSlotReleased = ({ date, startTime }) => {
      if (dayjs(date).format('YYYY-MM-DD') === selectedDate) {
        queryClient.invalidateQueries({
          queryKey: ['doctor', id, 'availability', selectedDate],
        });
      }
    };

    socket.on('slot:taken', handleSlotTaken);
    socket.on('slot:released', handleSlotReleased);

    return () => {
      socket.emit('availability:leave', { doctorId: id });
      socket.off('slot:taken', handleSlotTaken);
      socket.off('slot:released', handleSlotReleased);
    };
  }, [socket, id, selectedDate, queryClient]);

  if (loadingDoctor) {
    return <LoadingSkeleton variant="card" count={2} />;
  }

  const doctor = doctorData?.doctor;
  const profile = doctorData?.profile || {};
  const slots = availabilityData?.slots || [];

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-blue-600 text-white font-bold text-3xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              {doctor?.name?.charAt(0) || 'D'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{doctor?.name}</h1>
              <p className="text-teal-600 font-semibold text-sm mt-0.5">
                {profile.specialization || 'Specialist Physician'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Reg No: {profile.registrationNumber || 'N/A'} • {profile.qualifications?.join(', ')}
              </p>
            </div>
          </div>

          <Link
            to={`/patient/book/${id}?date=${selectedDate}${selectedSlot ? `&slot=${selectedSlot.start}` : ''}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all self-start sm:self-center"
          >
            Proceed to Book <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 text-xs text-gray-600">
          <div>
            <span className="text-gray-400 block mb-0.5">Experience</span>
            <span className="font-semibold text-gray-800 text-sm">{profile.experience || 0} Years</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Consultation Fee</span>
            <span className="font-semibold text-gray-800 text-sm">${profile.consultationFee || 0}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Session Length</span>
            <span className="font-semibold text-gray-800 text-sm">{profile.consultationDuration || 30} mins</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Timezone</span>
            <span className="font-semibold text-gray-800 text-sm">{profile.timezone || 'UTC'}</span>
          </div>
        </div>

        {profile.bio && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">About</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Real-Time Availability & Slot Browser */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Check Available Slots</h3>
            <p className="text-xs text-gray-500">
              Live slot sync enabled via WebSocket room
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Availability
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Select Date</label>
            <DatePicker
              value={selectedDate}
              onChange={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              minDate={dayjs().format('YYYY-MM-DD')}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Available Slots for {dayjs(selectedDate).format('MMMM D, YYYY')}
            </label>
            <SlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              loading={loadingSlots}
            />

            {selectedSlot && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-900">Selected Time Slot</p>
                  <p className="text-sm font-bold text-blue-700">
                    {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)} ({selectedDate ? dayjs(selectedDate).format('ddd, MMM D') : ''})
                  </p>
                </div>
                <Link
                  to={`/patient/book/${id}?date=${selectedDate}&slot=${selectedSlot.start}`}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm"
                >
                  Book This Slot
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
