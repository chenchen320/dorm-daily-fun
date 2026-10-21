import type { Room, Member } from '../types';

export interface IStorageAdapter {
  // 寝室操作
  getRoom(dormId: string): Promise<Room | null>;
  getRoomByCode(roomCode: string): Promise<Room | null>;
  createRoom(room: Room): Promise<Room>;
  updateRoom(dormId: string, updates: Partial<Room>): Promise<Room>;

  // 成员操作
  getMembers(dormId: string): Promise<Member[]>;
  getMemberByOpenId(openid: string): Promise<Member | null>;
  addMember(member: Member): Promise<Member>;
  removeMember(dormId: string, memberId: string): Promise<boolean>;

  // 本地活跃会话
  getActiveSession(): { openid: string; dormId: string } | null;
  setActiveSession(session: { openid: string; dormId: string } | null): void;
}
