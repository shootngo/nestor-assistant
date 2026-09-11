import { collection, doc, getDocs, getFirestore, setDoc, type Firestore } from 'firebase/firestore';
import { getHouseholdApp } from './firebase';
import type {
  EventRecord,
  HouseholdStore,
  MaintenanceRecord,
  ShoppingRecord,
  VehicleRecord,
  VehicleTaskRecord,
} from './types';

export { createMemoryStore } from './memoryStore';

function db(): Firestore {
  return getFirestore(getHouseholdApp());
}

function mapDocs<T extends { id: string }>(snap: { docs: { id: string; data: () => Record<string, unknown> }[] }): T[] {
  return snap.docs.map((entry) => ({ ...(entry.data() as object), id: entry.id }) as T);
}

export function createFirestoreStore(): HouseholdStore {
  return {
    async addShopping(record) {
      await setDoc(doc(db(), 'shopping', record.id), record, { merge: true });
    },
    async listShopping() {
      return mapDocs<ShoppingRecord>(await getDocs(collection(db(), 'shopping')));
    },
    async addEvent(record) {
      await setDoc(doc(db(), 'events', record.id), record, { merge: true });
    },
    async listEvents() {
      return mapDocs<EventRecord>(await getDocs(collection(db(), 'events')));
    },
    async listMaintenance() {
      return mapDocs<MaintenanceRecord>(await getDocs(collection(db(), 'maintenance')));
    },
    async listVehicles() {
      return mapDocs<VehicleRecord>(await getDocs(collection(db(), 'vehicles')));
    },
    async listVehicleTasks() {
      return mapDocs<VehicleTaskRecord>(await getDocs(collection(db(), 'vehicleTasks')));
    },
  };
}

let liveStore: HouseholdStore | null = null;

export function getLiveStore(): HouseholdStore {
  if (!liveStore) {
    liveStore = createFirestoreStore();
  }
  return liveStore;
}

export function setLiveStore(store: HouseholdStore | null): void {
  liveStore = store;
}
