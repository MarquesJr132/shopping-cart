export interface User {
  id: string;
  email: string;
  name: string;
  role: 'requester' | 'sales_requester' | 'manager' | 'sales_manager' | 'general_manager' | 'controller' | 'procurement';
  costCenter: string;
  managerId?: string;
}

// Initialize users from localStorage or use defaults
const initializeUsers = (): User[] => {
  const storedUsers = localStorage.getItem('users');
  if (storedUsers) {
    return JSON.parse(storedUsers);
  }
  // Return default users and save them to localStorage
  const defaultUsers: User[] = [
    { id: '1', email: 'junior.jose@mz.sika.com', name: 'Junior José', role: 'requester' as const, costCenter: 'CC001', managerId: '3' },
    { id: '2', email: 'joana.sales@mz.sika.com', name: 'Joana Sales', role: 'sales_requester' as const, costCenter: 'CC002', managerId: '4' },
    { id: '3', email: 'braganca.carla@mz.sika.com', name: 'Bragança Carla', role: 'manager' as const, costCenter: 'CC001' },
    { id: '4', email: 'miguel.saleslead@mz.sika.com', name: 'Miguel Sales Lead', role: 'sales_manager' as const, costCenter: 'CC002' },
    { id: '5', email: 'gm.sika@mz.sika.com', name: 'General Manager', role: 'general_manager' as const, costCenter: 'CC000' },
    { id: '6', email: 'control.finance@mz.sika.com', name: 'Finance Controller', role: 'controller' as const, costCenter: 'CC003' },
    { id: '7', email: 'procurement.sika@mz.sika.com', name: 'Procurement', role: 'procurement' as const, costCenter: 'CC004' },
  ];
  localStorage.setItem('users', JSON.stringify(defaultUsers));
  return defaultUsers;
};

export const mockUsers: User[] = initializeUsers();

export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
};

export const login = (email: string): User | null => {
  const user = mockUsers.find(u => u.email === email);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const canApprove = (userRole: string, currentStatus: string, requestType?: string): boolean => {
  if (currentStatus === 'pending_manager_approval') {
    return userRole === 'manager' || userRole === 'sales_manager';
  }
  if (currentStatus === 'pending_final_approval') {
    // Shopping card requests only need manager approval, skip final approval
    if (requestType === 'shopping_card') {
      return false;
    }
    return userRole === 'general_manager' || userRole === 'controller';
  }
  return false;
};

export const canComplete = (userRole: string): boolean => {
  return userRole === 'procurement';
};

export const canReject = (userRole: string): boolean => {
  return userRole === 'procurement';
};

export const isAdmin = (userId: string): boolean => {
  return userId === '1'; // Only José Junior can access admin
};

export const saveUser = (user: User): void => {
  const users = [...mockUsers];
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  // Update the mockUsers array
  mockUsers.length = 0;
  mockUsers.push(...users);
  
  // Also save to localStorage for persistence
  localStorage.setItem('users', JSON.stringify(users));
};

export const deleteUser = (userId: string): void => {
  const index = mockUsers.findIndex(u => u.id === userId);
  if (index >= 0) {
    mockUsers.splice(index, 1);
    // Also update localStorage
    localStorage.setItem('users', JSON.stringify([...mockUsers]));
  }
};

export const getAllUsers = (): User[] => {
  return [...mockUsers];
};