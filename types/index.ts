// User Types
export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'field_worker';
    phone?: string;
    avatar?: string;
    skills?: string[];
    availability: 'available' | 'busy' | 'offline';
    currentLocation?: {
      type: string;
      coordinates: number[];
      address?: string;
      lastUpdated?: Date;
    };
    stats: {
      totalJobsCompleted: number;
      averageRating: number;
      totalRatings: number;
      onTimeCompletionRate: number;
    };
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Work Order Types
  export interface WorkOrder {
    _id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    customer: {
      name: string;
      phone: string;
      email?: string;
    };
    location: {
      type: string;
      coordinates: number[];
      address: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    assignedTo?: User;
    createdBy: User;
    scheduledDate?: Date;
    startTime?: Date;
    completionTime?: Date;
    estimatedDuration: number;
    actualDuration?: number;
    photos?: {
      before: Photo[];
      during: Photo[];
      after: Photo[];
    };
    requiredSkills?: string[];
    notes?: Note[];
    completionNotes?: string;
    rating?: number;
    feedback?: string;
    isOverdue?: boolean;
    completedOnTime?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Photo {
    url: string;
    publicId: string;
    uploadedAt: Date;
  }
  
  export interface Note {
    user: User;
    content: string;
    createdAt: Date;
  }
  
  // Message Types
  export interface Message {
    _id: string;
    conversationId: string;
    sender: User;
    receiver: User;
    messageType: 'text' | 'image' | 'file';
    content?: string;
    attachment?: {
      url: string;
      publicId: string;
      filename: string;
      fileType: string;
      fileSize: number;
    };
    workOrder?: string;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // API Response Types
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
  }
  
  export interface PaginatedResponse<T> {
    success: boolean;
    count: number;
    total: number;
    page: number;
    pages: number;
    data: T[];
  }
  
  // Auth Types
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    skills?: string[];
  }
  
  export interface AuthResponse {
    success: boolean;
    message?: string;
    data?: User;
    token?: string;
  }