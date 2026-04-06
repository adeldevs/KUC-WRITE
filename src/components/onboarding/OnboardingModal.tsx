import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DEPARTMENTS } from '../../lib/utils';
import { Loader2, PenLine, CheckCircle } from 'lucide-react';
import type { OnboardingPayload } from '../../types';

const ROLES = ['Requester', 'Writer', 'Both'] as const;

const ROLE_DESC = {
  Requester: 'Post assignments and find writers',
  Writer: 'Accept gigs and showcase your work',
  Both: 'The full experience — post and write',
};

export default function OnboardingModal() {
  const { completeOnboarding, firebaseUser } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<OnboardingPayload>({
    fullName: firebaseUser?.displayName || '',
    department: '',
    phoneNumber: '',
    role: 'Both',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingPayload, string>>>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.department) e.department = 'Please select your department';
    if (!/^\d{10}$/.test(form.phoneNumber)) e.phoneNumber = 'Enter a valid 10-digit phone number';
    if (!form.role) e.role = 'Select a role';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await completeOnboarding(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[hsl(var(--background))] flex flex-col animate-fade-in">
      {/* Ambient background */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[hsl(263_70%_40%/0.12)] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[hsl(220_70%_40%/0.08)] blur-[80px] pointer-events-none" />

      {/* Progress bar */}
      <div className="w-full h-1 bg-[hsl(var(--secondary))]">
        <div
          className="h-full bg-gradient-to-r from-[hsl(263_70%_55%)] to-[hsl(220_70%_55%)] transition-all duration-500"
          style={{ width: step === 1 ? '50%' : '100%' }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[hsl(263_70%_55%)] to-[hsl(220_70%_55%)] flex items-center justify-center">
            <PenLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">
              {step === 1 ? 'Set up your profile' : 'Choose your role'}
            </h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Step {step} of 2</p>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-5 animate-fade-in">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="onb-name">Full Name</Label>
              <Input
                id="onb-name"
                placeholder="e.g. Ayaan Khan"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              {errors.fullName && <p className="text-xs text-[hsl(var(--destructive))]">{errors.fullName}</p>}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="onb-dept">Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger id="onb-dept">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && <p className="text-xs text-[hsl(var(--destructive))]">{errors.department}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="onb-phone">Phone Number</Label>
              <Input
                id="onb-phone"
                type="tel"
                placeholder="10-digit phone number"
                value={form.phoneNumber}
                maxLength={10}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm({ ...form, phoneNumber: digits });
                }}
                inputMode="numeric"
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                This will be shared with your writing partners via chat.
              </p>
              {errors.phoneNumber && <p className="text-xs text-[hsl(var(--destructive))]">{errors.phoneNumber}</p>}
            </div>

            <Button
              id="onb-next-btn"
              className="w-full mt-2"
              onClick={() => {
                const e: typeof errors = {};
                if (!form.fullName.trim()) e.fullName = 'Full name is required';
                if (!form.department) e.department = 'Please select your department';
                if (!/^\d{10}$/.test(form.phoneNumber)) e.phoneNumber = 'Enter a valid 10-digit phone number';
                setErrors(e);
                if (Object.keys(e).length === 0) setStep(2);
              }}
            >
              Continue
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
              How do you plan to use UniGig?
            </p>

            {ROLES.map((role) => (
              <button
                key={role}
                id={`role-${role.toLowerCase()}`}
                onClick={() => setForm({ ...form, role })}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  form.role === role
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--accent))]'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--secondary))] hover:border-[hsl(var(--primary)/0.5)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[hsl(var(--foreground))]">{role}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{ROLE_DESC[role]}</p>
                  </div>
                  {form.role === role && (
                    <CheckCircle className="w-5 h-5 text-[hsl(var(--primary))] shrink-0" />
                  )}
                </div>
              </button>
            ))}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                id="onb-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
