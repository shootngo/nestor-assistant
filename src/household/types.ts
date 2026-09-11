export type Actor = {
  uid: string;
  email: string;
  displayName: string;
};

export type ShoppingRecord = {
  id: string;
  text: string;
  aisle: string;
  notes: string;
  checked: boolean;
  createdBy: Actor;
  createdAt: string;
  updatedBy: Actor;
  updatedAt: string;
};

export type EventRecord = {
  id: string;
  title: string;
  date: string;
  notes: string;
  billId: string;
  createdBy: Actor;
  createdAt: string;
  updatedBy: Actor;
  updatedAt: string;
};

export type MaintenanceRecord = {
  id: string;
  name: string;
  notes?: string;
  nextDue?: string;
  lastCompleted?: string;
};

export type VehicleRecord = {
  id: string;
  name?: string;
  year?: string;
  make?: string;
  model?: string;
};

export type VehicleTaskRecord = {
  id: string;
  vehicleId: string;
  name: string;
  nextDue?: string;
  lastCompleted?: string;
};

export type CalendarItem = {
  date: string;
  title: string;
  kind: 'event' | 'reminder';
};

export type ToolResult = {
  ok: boolean;
  spoken?: string;
  error?: string;
  data?: Record<string, unknown>;
};

export type HouseholdStore = {
  addShopping(record: ShoppingRecord): Promise<void>;
  listShopping(): Promise<ShoppingRecord[]>;
  addEvent(record: EventRecord): Promise<void>;
  listEvents(): Promise<EventRecord[]>;
  listMaintenance(): Promise<MaintenanceRecord[]>;
  listVehicles(): Promise<VehicleRecord[]>;
  listVehicleTasks(): Promise<VehicleTaskRecord[]>;
};
