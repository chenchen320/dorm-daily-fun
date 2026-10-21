import type { IStorageAdapter } from './IStorageAdapter';
import type { Room, Member } from '../types';

// 跨环境存储桥接 (Uni-app runtime 或 Node/Vitest runtime)
const getStorage = (key: string): string | null => {
  try {
    if (typeof uni !== 'undefined' && uni.getStorageSync) {
      const val = uni.getStorageSync(key);
      return val ? (typeof val === 'string' ? val : JSON.stringify(val)) : null;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {
    // fallback
  }
  return memoryStorage.get(key) || null;
};

const setStorage = (key: string, value: string): void => {
  try {
    if (typeof uni !== 'undefined' && uni.setStorageSync) {
      uni.setStorageSync(key, value);
      return;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
      return;
    }
  } catch (e) {
    // fallback
  }
  memoryStorage.set(key, value);
};

const memoryStorage = new Map<string, string>();

const STORAGE_KEYS = {
  ROOMS: 'dorm_mock_rooms_v1',
  MEMBERS: 'dorm_mock_members_v1',
  SESSION: 'dorm_mock_session_v1',
};

// 默认内置的 4#304 寝室种子数据
const DEFAULT_ROOM: Room = {
  id: 'dorm_4_304',
  roomCode: '4#304',
  secretPIN: '304888',
  maxCapacity: 6,
  ownerOpenId: 'openid_owner_304',
  notice: '4#304沙雕大本营：严禁熄灯后大喊大叫，除非有人选了C！',
  createdAt: 1729500000000,
};

export class MockStorageAdapter implements IStorageAdapter {
  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    const existingRooms = this.readRooms();
    if (!existingRooms.some((r) => r.roomCode === DEFAULT_ROOM.roomCode)) {
      existingRooms.push(DEFAULT_ROOM);
      this.writeRooms(existingRooms);
    }
  }

  private readRooms(): Room[] {
    const raw = getStorage(STORAGE_KEYS.ROOMS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private writeRooms(rooms: Room[]): void {
    setStorage(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }

  private readMembers(): Member[] {
    const raw = getStorage(STORAGE_KEYS.MEMBERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private writeMembers(members: Member[]): void {
    setStorage(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }

  async getRoom(dormId: string): Promise<Room | null> {
    const rooms = this.readRooms();
    return rooms.find((r) => r.id === dormId) || null;
  }

  async getRoomByCode(roomCode: string): Promise<Room | null> {
    const rooms = this.readRooms();
    return rooms.find((r) => r.roomCode.toLowerCase() === roomCode.trim().toLowerCase()) || null;
  }

  async createRoom(room: Room): Promise<Room> {
    const rooms = this.readRooms();
    rooms.push(room);
    this.writeRooms(rooms);
    return room;
  }

  async updateRoom(dormId: string, updates: Partial<Room>): Promise<Room> {
    const rooms = this.readRooms();
    const index = rooms.findIndex((r) => r.id === dormId);
    if (index === -1) throw new Error(`寝室不存在: ${dormId}`);
    rooms[index] = { ...rooms[index], ...updates };
    this.writeRooms(rooms);
    return rooms[index];
  }

  async getMembers(dormId: string): Promise<Member[]> {
    const members = this.readMembers();
    return members.filter((m) => m.dormId === dormId);
  }

  async getMemberByOpenId(openid: string): Promise<Member | null> {
    const members = this.readMembers();
    return members.find((m) => m.openid === openid) || null;
  }

  async addMember(member: Member): Promise<Member> {
    const members = this.readMembers();
    const index = members.findIndex((m) => m.id === member.id || (m.dormId === member.dormId && m.openid === member.openid));
    if (index >= 0) {
      members[index] = member;
    } else {
      members.push(member);
    }
    this.writeMembers(members);
    return member;
  }

  async removeMember(dormId: string, memberId: string): Promise<boolean> {
    const members = this.readMembers();
    const filtered = members.filter((m) => !(m.dormId === dormId && m.id === memberId));
    this.writeMembers(filtered);
    return true;
  }

  getActiveSession(): { openid: string; dormId: string } | null {
    const raw = getStorage(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setActiveSession(session: { openid: string; dormId: string } | null): void {
    if (!session) {
      setStorage(STORAGE_KEYS.SESSION, '');
    } else {
      setStorage(STORAGE_KEYS.SESSION, JSON.stringify(session));
    }
  }

  // 辅助重置测试数据
  clearAll(): void {
    memoryStorage.clear();
    setStorage(STORAGE_KEYS.ROOMS, '');
    setStorage(STORAGE_KEYS.MEMBERS, '');
    setStorage(STORAGE_KEYS.SESSION, '');
    this.seedInitialData();
  }
}
