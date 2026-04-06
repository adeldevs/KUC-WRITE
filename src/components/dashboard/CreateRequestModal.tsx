import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createAssignment } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '../ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter
} from '../ui/drawer';
import { Loader2, CalendarIcon } from 'lucide-react';
import type { Assignment, CreateAssignmentPayload } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (a: Assignment) => void;
  isMobile: boolean;
}

function FormFields({
  form,
  setForm,
  errors,
}: {
  form: CreateAssignmentPayload;
  setForm: (f: CreateAssignmentPayload) => void;
  errors: Partial<Record<keyof CreateAssignmentPayload, string>>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="req-title">Assignment Title</Label>
        <Input
          id="req-title"
          placeholder="e.g. Chemistry Lab Report — Titration"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        {errors.title && <p className="text-xs text-[hsl(var(--destructive))]">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="req-code">Subject Code</Label>
        <Input
          id="req-code"
          placeholder="e.g. CHEM-201"
          value={form.subjectCode}
          onChange={(e) => setForm({ ...form, subjectCode: e.target.value })}
        />
        {errors.subjectCode && <p className="text-xs text-[hsl(var(--destructive))]">{errors.subjectCode}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="req-pages">Total Pages</Label>
          <Input
            id="req-pages"
            type="number"
            min={1}
            max={200}
            placeholder="10"
            value={form.totalPages || ''}
            onChange={(e) => setForm({ ...form, totalPages: parseInt(e.target.value) || 0 })}
          />
          {errors.totalPages && <p className="text-xs text-[hsl(var(--destructive))]">{errors.totalPages}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="req-deadline">Deadline</Label>
          <div className="relative">
            <Input
              id="req-deadline"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="pr-10"
              style={{ colorScheme: 'dark' }}
            />
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))] pointer-events-none" />
          </div>
          {errors.deadline && <p className="text-xs text-[hsl(var(--destructive))]">{errors.deadline}</p>}
        </div>
      </div>
    </div>
  );
}

export default function CreateRequestModal({ open, onClose, onCreated, isMobile }: Props) {
  const { dbUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateAssignmentPayload>({
    title: '',
    subjectCode: '',
    totalPages: 0,
    deadline: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateAssignmentPayload, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.subjectCode.trim()) e.subjectCode = 'Subject code is required';
    if (!form.totalPages || form.totalPages < 1) e.totalPages = 'Enter valid page count';
    if (!form.deadline) e.deadline = 'Deadline is required';
    setErrors(e);
    const valid = Object.keys(e).length === 0;
    if (!valid) console.warn('[CreateRequestModal] Validation failed →', e);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate() || !dbUser) return;
    console.log('%c[CreateRequestModal] Submitting to Firestore →', 'color: #7c3aed; font-weight: bold;', form);
    setSubmitting(true);
    try {
      const newAssignment = await createAssignment(form);
      console.log('%c[CreateRequestModal] ✅ Assignment created in Firestore →', 'color: #16a34a; font-weight: bold;', newAssignment);
      onCreated(newAssignment);
      setForm({ title: '', subjectCode: '', totalPages: 0, deadline: '' });
      onClose();
    } catch (err) {
      console.error('[CreateRequestModal] ❌ Firestore write failed →', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="px-4 max-h-[90dvh]">
          <DrawerHeader>
            <DrawerTitle>Post a Gig</DrawerTitle>
            <DrawerDescription>Describe your assignment and find a writer.</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto pb-4">
            <FormFields form={form} setForm={setForm} errors={errors} />
          </div>
          <DrawerFooter className="border-t border-[hsl(var(--border))] pt-4">
            <Button id="create-req-submit" onClick={handleSubmit} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Assignment'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post a Gig</DialogTitle>
          <DialogDescription>Describe your assignment and find a writer.</DialogDescription>
        </DialogHeader>
        <FormFields form={form} setForm={setForm} errors={errors} />
        <Button id="create-req-submit-desktop" onClick={handleSubmit} disabled={submitting} className="w-full mt-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Assignment'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
