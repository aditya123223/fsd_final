import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchDoctorById, fetchDoctorAvailability } from '../../api/doctor.api.js';
import { bookAppointment } from '../../api/appointment.api.js';
import BookingSteps from '../../components/appointments/BookingSteps.jsx';
import DatePicker from '../../components/appointments/DatePicker.jsx';
import SlotPicker from '../../components/appointments/SlotPicker.jsx';
import toast from 'react-hot-toast';
import { Calendar, Clock, DollarSign, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import dayjs, { formatTime } from '../../utils/dateTime.js';

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(
    searchParams.get('date') || dayjs().format('YYYY-MM-DD')
  );
  const [selectedSlot, setSelectedSlot] = useState(
    searchParams.get('slot') ? { start: searchParams.get('slot') } : null
  );
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Doctor Info
  const { data: doctorData, isLoading: loadingDoctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      const res = await fetchDoctorById(doctorId);
      return res.data.data;
    },
    enabled: !!doctorId,
  });

  // Doctor Slots
  const { data: availabilityData, isLoading: loadingSlots } = useQuery({
    queryKey: ['doctor', doctorId, 'availability', selectedDate],
    queryFn: async () => {
      const res = await fetchDoctorAvailability(doctorId, selectedDate);
      return res.data.data;
    },
    enabled: !!doctorId && !!selectedDate,
  });

  const doctor = doctorData?.doctor;
  const profile = doctorData?.profile || {};
  const slots = availabilityData?.slots || [];

  const handleNext = () => {
    if (step === 1 && !selectedDate) {
      toast.error('Please pick a date');
      return;
    }
    if (step === 2 && !selectedSlot) {
      toast.error('Please select an available time slot');
      return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirmBooking = async () => {
    setSubmitting(true);
    try {
      const res = await bookAppointment({
        doctorId,
        date: selectedDate,
        startTime: selectedSlot.start,
        reason: reason.trim() || undefined,
      });

      const ref = res.data?.data?.appointment?.bookingReference || 'Confirmed';
      toast.success(`Appointment booked successfully! Ref: ${ref}`);
      navigate('/patient/appointments');
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to book appointment. Please select another slot.';
      toast.error(errorMsg);
      if (err.response?.status === 409) {
        // Slot conflict — push user back to step 2 to choose a different slot
        setStep(2);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
          <p className="text-xs text-gray-500 mt-1">
            Follow the 4-step wizard to secure your consultation slot
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      {/* Stepper Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <BookingSteps currentStep={step} />
      </div>

      {/* Doctor Summary Card */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-sm border border-teal-100">
            {doctor?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{doctor?.name}</h3>
            <p className="text-xs text-teal-600">{profile.specialization || 'Specialist'}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p className="font-semibold text-gray-900">${profile.consultationFee || 0}</p>
          <p>{profile.consultationDuration || 30} mins</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col justify-between">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Step 1: Choose Appointment Date</h3>
            <div className="max-w-md mx-auto">
              <DatePicker
                value={selectedDate}
                onChange={(d) => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                }}
                minDate={dayjs().format('YYYY-MM-DD')}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-sm">Step 2: Select Time Slot</h3>
              <span className="text-xs text-gray-500 font-medium">
                {dayjs(selectedDate).format('MMMM D, YYYY')}
              </span>
            </div>
            <SlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => setSelectedSlot(slot)}
              loading={loadingSlots}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-sm">Step 3: Reason for Visit (Optional)</h3>
            <p className="text-xs text-gray-500">
              Please share any symptoms or context to help your doctor prepare for the consultation.
            </p>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Chronic back pain for 2 weeks, worsening after sitting..."
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
            <p className="text-right text-[11px] text-gray-400">{reason.length}/500</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h3 className="font-bold text-gray-800 text-sm">Step 4: Review and Confirm Booking</h3>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs text-gray-700">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-900">{doctor?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Specialization</span>
                <span className="font-semibold text-gray-900">{profile.specialization}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">
                  {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Time Slot</span>
                <span className="font-semibold text-blue-600">
                  {selectedSlot?.start ? formatTime(selectedSlot.start) : 'Not selected'} ({profile.consultationDuration || 30} mins)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="text-gray-500">Consultation Fee</span>
                <span className="font-semibold text-emerald-600">${profile.consultationFee || 0}</span>
              </div>
              {reason && (
                <div className="pt-2">
                  <span className="text-gray-500 block mb-1">Reason for Visit:</span>
                  <p className="bg-white p-2.5 rounded-lg border border-gray-200 text-gray-800">
                    {reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? 'Confirming Reservation...' : 'Confirm Appointment'}
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
