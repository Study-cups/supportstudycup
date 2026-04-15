// Fix: Removed self-import which caused declaration conflicts.

export interface Course {
    id: number;
    name: string;
    duration: string;
    level: string; // e.g., 'Undergraduate'
    fees: number;
    eligibility: string;
}

export interface Placements {
    highestPackage: string;
    averagePackage: string;
    placementPercentage: number;
    topRecruiters: string[];
} 



export interface College {
    id: number;
    name: string;
    location: string;
    tagline?: string;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    logoUrl: string;
    established: number;
    type: 'Private' | 'Government';
    accreditation: string[];
    description: string;
    highlights: string[];
    feesRange: {
        min: number;
        max: number;
    };
    courses: Course[];
    placements: Placements;
}
type Step =
  | "welcome"
  | "name"
  | "email"
  | "phone"
  | "city"
  | "course"
  | "done";

export type View =
  | { page: 'home' }
  | { page: 'listing', filters?: { college?: string; city?: string; course?: string } }
  | { page: 'courses' }
  | { page: 'exams' }
  | { page: 'blog' }
  | { page: 'compare' }
  | { page: 'events' }
  | { page: 'detail', collegeId: number }
  | { page: 'blog-detail', postId: number }
  | { page: 'course-detail', courseId: number }
  | { page: 'exam-detail', examId: number };


export interface Exam {
    id: number;
    name: string;
    logoUrl: string;
    conductingBody: string;
    stream: string;
    date: string;
    description: string;
    eligibility: string;
    syllabus: { subject: string; topics: string[] }[];
    importantDates: { event: string; date: string }[];
}

export interface BlogPost {
    id: number;
    title: string;
    author: string;
    date: string;
    imageUrl: string;
    excerpt: string;
    content: string; // HTML content
    category?: string;
}

export interface Testimonial {
    id: number;
    name: string;
    college: string;
    avatarUrl: string;
    quote: string;
}

export interface Event {
    id: number;
    title: string;
    category: 'Webinar' | 'Workshop' | 'College Fair' | 'Deadline';
    date: string; // ISO 8601 format: "YYYY-MM-DDTHH:mm:ssZ"
    description: string;
    imageUrl: string;
    link: string;
}

export interface FormData {
  studyLocation: string[];
  studentName: string;
  gender: string;
  mobileNumber: string;
  whatsappNumber: string;
  parentMobileNumber: string;
  email: string;
  city: string;
  courses: string[];
  event: string;
  referral1Name: string;
  referral1Mobile: string;
  referral2Name: string;
  referral2Mobile: string;
  source: string;
}

 