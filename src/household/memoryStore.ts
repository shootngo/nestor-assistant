import type {
  EventRecord,
  HouseholdStore,
  MaintenanceRecord,
  ShoppingRecord,
  VehicleRecord,
  VehicleTaskRecord,
} from './types';

export function createMemoryStore(seed?: {
  shopping?: ShoppingRecord[];
  events?: EventRecord[];
  maintenance?: MaintenanceRecord[];
  vehicles?: VehicleRecord[];
  vehicleTasks?: VehicleTaskRecord[];
}): HouseholdStore {
  const shopping = [...(seed?.shopping ?? [])];
  const events = [...(seed?.events ?? [])];
  const maintenance = [...(seed?.maintenance ?? [])];
  const vehicles = [...(seed?.vehicles ?? [])];
  const vehicleTasks = [...(seed?.vehicleTasks ?? [])];

  return {
    async addShopping(record) {
      const index = shopping.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        shopping[index] = record;
      } else {
        shopping.push(record);
      }
    },
    async listShopping() {
      return [...shopping];
    },
    async addEvent(record) {
      const index = events.findIndex((item) => item.id === record.id);
      if (index >= 0) {
        events[index] = record;
      } else {
        events.push(record);
      }
    },
    async listEvents() {
      return [...events];
    },
    async listMaintenance() {
      return [...maintenance];
    },
    async listVehicles() {
      return [...vehicles];
    },
    async listVehicleTasks() {
      return [...vehicleTasks];
    },
  };
}
