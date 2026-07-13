export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Project Manager" | "Member";
  profilePicture: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  owner: string;
  members: string[];
  status: "Planning" | "Active" | "Completed" | "On Hold";
  createdAt: string;
  ownerDetails?: User | null;
  memberDetails?: User[];
}

export interface Board {
  id: string;
  project: string;
  title: string;
  order: number;
}

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface Task {
  id: string;
  project: string;
  board: string;
  title: string;
  description: string;
  assignedTo: string | null;
  priority: "Low" | "Medium" | "High";
  dueDate: string;
  labels: string[];
  attachments: TaskAttachment[];
  status: "Todo" | "In Progress" | "Review" | "Completed";
  createdAt: string;
  assignedToDetails?: User | null;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  task: string;
  user: string;
  message: string;
  createdAt: string;
  userDetails?: User | null;
}

export interface Notification {
  id: string;
  user: string;
  message: string;
  type: "assignment" | "status" | "comment" | "deadline" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  roleCounts: {
    Admin: number;
    ProjectManager: number;
    Member: number;
  };
  projectStats: {
    active: number;
    completed: number;
    planning: number;
    onHold: number;
  };
  taskPriorityStats: {
    low: number;
    medium: number;
    high: number;
  };
  taskStatusStats: {
    todo: number;
    inProgress: number;
    review: number;
    completed: number;
  };
}
