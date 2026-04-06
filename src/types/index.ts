export interface User {
  uid: string;
  fullName: string;
  email: string;
  photoURL?: string;
  department: string;
  phoneNumber: string;
  role: 'Requester' | 'Writer' | 'Both';
  portfolio: PortfolioItem[];
  createdAt: string;
}

export interface PortfolioItem {
  _id?: string;
  imgUrl: string;
  category: 'Handwriting' | 'Drawing';
  uploadedAt?: string;
}

export interface WriterProfile {
  uid: string;
  fullName: string;
  photoURL?: string;
  department: string;
  role?: string;
}

export interface Assignment {
  _id: string;
  title: string;
  subjectCode: string;
  totalPages: number;
  deadline: string;
  status: 'open' | 'in-progress' | 'completed';
  requester: {
    uid: string;
    fullName: string;
    department: string;
    photoURL?: string;
  };
  createdAt: string;
  participants?: string[];
  writers?: Record<string, WriterProfile>;
}

export interface Message {
  _id: string;
  sender: {
    uid: string;
    fullName: string;
    photoURL?: string;
  };
  content: string;
  createdAt: string;
}

export interface CreateAssignmentPayload {
  title: string;
  subjectCode: string;
  totalPages: number;
  deadline: string;
}

export interface OnboardingPayload {
  fullName: string;
  department: string;
  phoneNumber: string;
  role: 'Requester' | 'Writer' | 'Both';
}

export type Department =
  | 'Computer Science'
  | 'Electrical Engineering'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Business Administration'
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Economics'
  | 'Psychology'
  | 'English Literature'
  | 'History'
  | 'Law'
  | 'Medicine'
  | 'Architecture'
  | 'Fine Arts'
  | 'Other';
