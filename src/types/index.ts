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

export type PostTag =
  | '宿舍搞笑日常'
  | '黑话梗合集'
  | '来吐槽吧'
  | '梦话暴论'
  | '外卖奇遇'
  | '打呼连环'
  | '破防时刻';

export interface Post {
  id: string;              // 事件唯一 ID
  dormId: string;          // 强关联的寝室 ID (多租户隔离主键)
  authorId: string;        // 发起人 ID
  authorName: string;      // 发起人角色名 (匿名模式下为 "神秘室友")
  authorAvatar: string;    // 发起人头像 (匿名模式下为预设黑衣图标)
  isAnonymous: boolean;    // 是否为匿名树洞 (由 [来吐槽吧] 触发)
  targetGuyRoles: string[];// @当事人室友角色列表 (如: ['王晨', '皇上'])
  content: string;         // 事件文本描述
  images: string[];        // 现场配图 (0~9 张)
  funnyLevel: number;      // 沙雕指数 (1~5 星)
  tag: PostTag;            // 核心分类标签
  reactions: Record<string, number>; // 表态数据 (例如: { '🤣': 3, '🤯': 1 })
  reactedUsers: Record<string, string[]>; // 防重记录 (例如: { '🤣': ['user_1'] })
  commentCount: number;    // 评论数量
  createdAt: number;       // 记录时间戳
}

export interface Comment {
  id: string;
  postId: string;          // 所属事件 ID
  dormId: string;          // 寝室隔离 ID
  authorId: string;
  authorName: string;      // 匿名模式下为 "神秘室友"
  authorAvatar: string;
  isAnonymous: boolean;
  content: string;         // 评论内容 (支持原生 Emoji)
  createdAt: number;
}

export interface SlangQuote {
  id: string;
  dormId: string;
  content: string;         // 金句/黑话内容
  speakerRole: string;     // 说话人/当事人
  explanation?: string;    // 出处典故/释义
  originPostId?: string;   // 关联的原始事件 ID
  likesCount: number;      // 崇拜/点赞数
  createdAt: number;
}
