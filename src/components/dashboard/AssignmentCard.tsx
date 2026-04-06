import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { FileText, Clock, MessageSquarePlus } from 'lucide-react';
import { formatDeadline, getInitials } from '../../lib/utils';
import type { Assignment } from '../../types';

interface AssignmentCardProps {
  assignment: Assignment;
  onOfferToWrite: (assignment: Assignment) => void;
  index?: number;
}

export default function AssignmentCard({ assignment, onOfferToWrite, index = 0 }: AssignmentCardProps) {
  const urgencyLevel = () => {
    const days = Math.ceil((new Date(assignment.deadline).getTime() - Date.now()) / 86400000);
    if (days <= 1) return 'urgent';
    if (days <= 3) return 'soon';
    return 'normal';
  };

  const urgency = urgencyLevel();

  return (
    <div
      className="glass rounded-2xl overflow-hidden hover:border-[hsl(var(--primary)/0.4)] transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(var(--primary)/0.08)] group animate-fade-in"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Urgency strip */}
      {urgency !== 'normal' && (
        <div
          className={`h-1 w-full ${
            urgency === 'urgent'
              ? 'bg-[hsl(var(--destructive))]'
              : 'bg-amber-500'
          }`}
        />
      )}

      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[hsl(var(--foreground))] text-base leading-tight truncate group-hover:text-[hsl(var(--primary))] transition-colors">
              {assignment.title}
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 font-mono">
              {assignment.subjectCode}
            </p>
          </div>
          <Badge variant={urgency === 'urgent' ? 'destructive' : urgency === 'soon' ? 'warning' : 'success'}>
            Open
          </Badge>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--secondary))] flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[hsl(var(--foreground))] font-semibold">{assignment.totalPages}</p>
              <p>pages</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                urgency === 'urgent'
                  ? 'bg-[hsl(var(--destructive)/0.15)]'
                  : urgency === 'soon'
                  ? 'bg-amber-500/15'
                  : 'bg-[hsl(var(--secondary))]'
              }`}
            >
              <Clock
                className={`w-3.5 h-3.5 ${
                  urgency === 'urgent'
                    ? 'text-[hsl(var(--destructive))]'
                    : urgency === 'soon'
                    ? 'text-amber-400'
                    : ''
                }`}
              />
            </div>
            <div>
              <p
                className={`font-semibold ${
                  urgency === 'urgent'
                    ? 'text-[hsl(var(--destructive))]'
                    : urgency === 'soon'
                    ? 'text-amber-400'
                    : 'text-[hsl(var(--foreground))]'
                }`}
              >
                {formatDeadline(assignment.deadline)}
              </p>
              <p>deadline</p>
            </div>
          </div>
        </div>

        {/* Requester + Action */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={assignment.requester.photoURL || ''} />
              <AvatarFallback className="text-[10px]">{getInitials(assignment.requester.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">{assignment.requester.fullName}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{assignment.requester.department}</p>
            </div>
          </div>

          <Button
            id={`offer-btn-${assignment._id}`}
            size="sm"
            onClick={() => onOfferToWrite(assignment)}
            className="shrink-0 gap-1.5 text-xs"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Offer to Write
          </Button>
        </div>
      </div>
    </div>
  );
}
