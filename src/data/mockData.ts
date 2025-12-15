// Mock data for dashboards

// Instructor earnings data - Daily
export const dailyEarnings = [
  { hour: '07:00', amount: 120 },
  { hour: '08:00', amount: 120 },
  { hour: '09:00', amount: 0 },
  { hour: '10:00', amount: 120 },
  { hour: '11:00', amount: 0 },
  { hour: '13:00', amount: 120 },
  { hour: '14:00', amount: 120 },
  { hour: '15:00', amount: 0 },
  { hour: '16:00', amount: 120 },
  { hour: '17:00', amount: 120 },
  { hour: '18:00', amount: 0 },
];

// Instructor earnings data - Weekly
export const weeklyEarnings = [
  { day: 'Seg', amount: 240 },
  { day: 'Ter', amount: 360 },
  { day: 'Qua', amount: 480 },
  { day: 'Qui', amount: 320 },
  { day: 'Sex', amount: 560 },
  { day: 'Sáb', amount: 720 },
  { day: 'Dom', amount: 0 },
];

export const monthlyEarnings = [
  { week: 'Sem 1', amount: 2680 },
  { week: 'Sem 2', amount: 3120 },
  { week: 'Sem 3', amount: 2890 },
  { week: 'Sem 4', amount: 3450 },
];

export const instructorMetrics = {
  grossRevenue: 12140,
  netProfit: 8498,
  lessonsCompleted: 86,
  averageRating: 4.9,
  lessonsThisMonth: 24,
  pendingRequests: 5,
};

export const upcomingLessons = [
  {
    id: '1',
    studentName: 'Maria Silva',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    date: '2024-01-15',
    time: '14:00',
    duration: 60,
    location: 'Centro, São Paulo',
    status: 'confirmed',
  },
  {
    id: '2',
    studentName: 'João Santos',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    date: '2024-01-15',
    time: '16:00',
    duration: 60,
    location: 'Pinheiros, São Paulo',
    status: 'confirmed',
  },
  {
    id: '3',
    studentName: 'Ana Costa',
    studentAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    date: '2024-01-16',
    time: '09:00',
    duration: 90,
    location: 'Moema, São Paulo',
    status: 'pending',
  },
];

export const lessonRequests = [
  {
    id: '1',
    studentName: 'Pedro Oliveira',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    message: 'Olá! Estou buscando um instrutor paciente para aulas de direção. Tenho CNH mas não dirijo há 5 anos.',
    requestedDate: '2024-01-17',
    requestedTime: '10:00',
    transmission: 'automatic',
    createdAt: '2024-01-14T10:30:00',
  },
  {
    id: '2',
    studentName: 'Carla Mendes',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    message: 'Preciso de aulas para tirar minha primeira habilitação. Disponível pela manhã.',
    requestedDate: '2024-01-18',
    requestedTime: '08:00',
    transmission: 'manual',
    createdAt: '2024-01-14T14:15:00',
  },
  {
    id: '3',
    studentName: 'Lucas Ferreira',
    studentAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    message: 'Quero melhorar minhas habilidades em estacionamento e baliza.',
    requestedDate: '2024-01-19',
    requestedTime: '15:00',
    transmission: 'automatic',
    createdAt: '2024-01-14T16:45:00',
  },
];

// Investor data
export const investorMetrics = {
  totalInvested: 185000,
  fleetRevenue: 24680,
  netProfit: 18510,
  occupancyRate: 87,
  totalCars: 6,
  activeCars: 5,
};

export const revenueDistribution = [
  { name: 'Investidor (75%)', value: 18510, color: 'hsl(222, 47%, 35%)' },
  { name: 'Domine (25%)', value: 6170, color: 'hsl(222, 47%, 60%)' },
];

export const fleetCars = [
  {
    id: '1',
    model: 'Toyota Corolla 2023',
    plate: 'ABC-1234',
    currentInstructor: 'Roberto Silva',
    status: 'in_lesson',
    currentKm: 45200,
    nextRevisionKm: 50000,
    pricePerHour: 50,
    monthlyRevenue: 4200,
  },
  {
    id: '2',
    model: 'Honda Civic 2022',
    plate: 'DEF-5678',
    currentInstructor: 'Ana Paula',
    status: 'idle',
    currentKm: 32100,
    nextRevisionKm: 40000,
    pricePerHour: 55,
    monthlyRevenue: 3800,
  },
  {
    id: '3',
    model: 'Volkswagen Golf 2023',
    plate: 'GHI-9012',
    currentInstructor: null,
    status: 'maintenance',
    currentKm: 28500,
    nextRevisionKm: 30000,
    pricePerHour: 60,
    monthlyRevenue: 4100,
  },
  {
    id: '4',
    model: 'Chevrolet Onix 2024',
    plate: 'JKL-3456',
    currentInstructor: 'Carlos Eduardo',
    status: 'in_lesson',
    currentKm: 12300,
    nextRevisionKm: 20000,
    pricePerHour: 45,
    monthlyRevenue: 3600,
  },
  {
    id: '5',
    model: 'Fiat Argo 2023',
    plate: 'MNO-7890',
    currentInstructor: 'Mariana Costa',
    status: 'idle',
    currentKm: 38900,
    nextRevisionKm: 40000,
    pricePerHour: 45,
    monthlyRevenue: 3400,
  },
  {
    id: '6',
    model: 'Hyundai HB20 2023',
    plate: 'PQR-1234',
    currentInstructor: 'Fernando Lima',
    status: 'in_lesson',
    currentKm: 21500,
    nextRevisionKm: 30000,
    pricePerHour: 48,
    monthlyRevenue: 3580,
  },
];

export const maintenanceHistory = [
  {
    id: '1',
    carId: '1',
    carModel: 'Toyota Corolla 2023',
    type: 'Troca de Óleo',
    date: '2024-01-10',
    cost: 350,
    km: 45000,
    nextDate: '2024-04-10',
    nextKm: 50000,
  },
  {
    id: '2',
    carId: '2',
    carModel: 'Honda Civic 2022',
    type: 'Revisão Completa',
    date: '2024-01-05',
    cost: 1200,
    km: 32000,
    nextDate: '2024-07-05',
    nextKm: 40000,
  },
  {
    id: '3',
    carId: '3',
    carModel: 'Volkswagen Golf 2023',
    type: 'Troca de Pneus',
    date: '2023-12-20',
    cost: 1800,
    km: 28000,
    nextDate: '2024-12-20',
    nextKm: 68000,
  },
];

export const financialTransactions = [
  { id: '1', date: '2024-01-14', car: 'Toyota Corolla', type: 'income', description: 'Aulas (8h)', amount: 400 },
  { id: '2', date: '2024-01-14', car: 'Honda Civic', type: 'income', description: 'Aulas (6h)', amount: 330 },
  { id: '3', date: '2024-01-13', car: 'Chevrolet Onix', type: 'income', description: 'Aulas (10h)', amount: 450 },
  { id: '4', date: '2024-01-13', car: 'Volkswagen Golf', type: 'expense', description: 'Manutenção', amount: -280 },
  { id: '5', date: '2024-01-12', car: 'Fiat Argo', type: 'income', description: 'Aulas (7h)', amount: 315 },
  { id: '6', date: '2024-01-12', car: 'Hyundai HB20', type: 'income', description: 'Aulas (8h)', amount: 384 },
  { id: '7', date: '2024-01-11', car: 'Toyota Corolla', type: 'expense', description: 'Combustível', amount: -150 },
  { id: '8', date: '2024-01-10', car: 'Honda Civic', type: 'income', description: 'Aulas (9h)', amount: 495 },
];

// Student data
export const studentProgress = {
  theoryProgress: 65,
  practiceProgress: 40,
  totalLessons: 12,
  completedLessons: 5,
  upcomingLessons: 2,
};

export const studentLessons = [
  {
    id: '1',
    instructorName: 'Roberto Silva',
    instructorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    date: '2024-01-16',
    time: '10:00',
    duration: 60,
    status: 'scheduled',
    carModel: 'Toyota Corolla',
  },
  {
    id: '2',
    instructorName: 'Roberto Silva',
    instructorAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    date: '2024-01-18',
    time: '14:00',
    duration: 90,
    status: 'scheduled',
    carModel: 'Toyota Corolla',
  },
];

export const availableInstructors = [
  {
    id: '1',
    name: 'Roberto Silva',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100',
    city: 'São Paulo',
    rating: 4.9,
    totalLessons: 342,
    pricePerHour: 120,
    bio: 'Instrutor certificado há 8 anos. Especialista em alunos nervosos e primeira habilitação.',
    badges: ['Paciente', 'Pontual', 'Didático'],
    transmission: 'both',
  },
  {
    id: '2',
    name: 'Ana Paula',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
    city: 'São Paulo',
    rating: 4.8,
    totalLessons: 218,
    pricePerHour: 110,
    bio: 'Instrutora credenciada pelo DETRAN-SP. Foco em direção defensiva e segurança.',
    badges: ['Atenciosa', 'Experiente'],
    transmission: 'automatic',
  },
  {
    id: '3',
    name: 'Carlos Eduardo',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    city: 'São Paulo',
    rating: 4.7,
    totalLessons: 156,
    pricePerHour: 100,
    bio: 'Ex-piloto profissional. Especialista em câmbio manual e manobras avançadas.',
    badges: ['Técnico', 'Preciso'],
    transmission: 'manual',
  },
];

// Chat messages mock
export const chatMessages = [
  {
    id: '1',
    senderId: 'instructor-1',
    receiverId: 'student-1',
    message: 'Olá! Vi sua solicitação. Estou disponível no horário que você pediu.',
    timestamp: '2024-01-14T10:30:00',
    read: true,
  },
  {
    id: '2',
    senderId: 'student-1',
    receiverId: 'instructor-1',
    message: 'Ótimo! Podemos confirmar então?',
    timestamp: '2024-01-14T10:35:00',
    read: true,
  },
  {
    id: '3',
    senderId: 'instructor-1',
    receiverId: 'student-1',
    message: 'Confirmado! Nos vemos quarta-feira às 10h. O carro é um Corolla prata. 🚗',
    timestamp: '2024-01-14T10:40:00',
    read: false,
  },
];

export const conversations = [
  {
    id: '1',
    participantName: 'Maria Silva',
    participantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    lastMessage: 'Confirmado! Nos vemos quarta-feira às 10h.',
    lastMessageTime: '10:40',
    unreadCount: 1,
  },
  {
    id: '2',
    participantName: 'João Santos',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    lastMessage: 'Obrigado pela aula de hoje!',
    lastMessageTime: 'Ontem',
    unreadCount: 0,
  },
];
