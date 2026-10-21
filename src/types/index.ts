// 寝室核心数据类型定义

export type PresetRole = '寝室长' | '小肥肥' | '晴晴姨' | '皇上' | '哈基' | '王晨';

export interface Room {
  id: string;              // 唯一 ID (例如: 'dorm_4_304')
  roomCode: string;        // 门牌代号 (例如: '4#304')
  secretPIN: string;       // 6位独立入寝密钥
  maxCapacity: number;     // 动态人数上限 (默认 6，可增减)
  ownerOpenId: string;     // 寝室长唯一凭证
  notice: string;          // 寝室公告/搞笑标语
  createdAt: number;       // 创建时间戳
}

export interface Member {
  id: string;              // 成员唯一 ID
  openid: string;          // 绑定的微信 OpenID / 用户设备 ID
  dormId: string;          // 强绑定的寝室 ID (多租户物理隔离核心)
  roleName: PresetRole | string; // 认领的专属角色
  customNickname?: string; // 自定义昵称
  avatarUrl: string;       // 头像 URL
  isOwner: boolean;        // 是否为寝室长
  joinedAt: number;        // 加入时间
}

export interface VerifyResult {
  success: boolean;
  message: string;
  room?: Room;
  members?: Member[];
  availableRoles?: string[];
}
