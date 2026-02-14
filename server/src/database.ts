import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { generateId } from '@open-context/shared';
import path from 'path';
import fs from 'fs';

// Database file path
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'open-context.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created data directory');
}

let db: SqlJsDatabase;
let isInitialized = false;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('📊 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('📊 Created new database');
  }

  // Create tables
  initializeTables();
  isInitialized = true;
}

// Create tables
function initializeTables() {
  // Documents table
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      content TEXT,
      excerpt TEXT,
      author TEXT,
      site_name TEXT,
      favicon TEXT,
      word_count INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    )
  `);

  // Chunks table WITH EMBEDDING COLUMN
  db.run(`
    CREATE TABLE IF NOT EXISTS chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      char_count INTEGER,
      embedding TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS highlights (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    text TEXT NOT NULL,
    color TEXT,
    position_start INTEGER,
    position_end INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    highlight_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(highlight_id) REFERENCES highlights(id) ON DELETE CASCADE
  )
`);

// Entities table (concepts extracted from documents)
db.run(`
  CREATE TABLE IF NOT EXISTS entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  )
`);

// Document-Entity relationships
db.run(`
  CREATE TABLE IF NOT EXISTS document_entities (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    context TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    UNIQUE(document_id, entity_id)
  )
`);

// Entity relationships (concept A relates to concept B)
db.run(`
  CREATE TABLE IF NOT EXISTS entity_relationships (
    id TEXT PRIMARY KEY,
    entity_a_id TEXT NOT NULL,
    entity_b_id TEXT NOT NULL,
    relationship_type TEXT,
    strength REAL DEFAULT 0.5,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(entity_a_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY(entity_b_id) REFERENCES entities(id) ON DELETE CASCADE,
    UNIQUE(entity_a_id, entity_b_id)
  )
`);

// Workspaces/Teams table
db.exec(`
  CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'personal',
    owner_id TEXT NOT NULL,
    avatar TEXT,
    is_public BOOLEAN DEFAULT 0,
    member_limit INTEGER DEFAULT 5,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
  CREATE INDEX IF NOT EXISTS idx_workspaces_public ON workspaces(is_public);
`);

// Workspace members
db.exec(`
  CREATE TABLE IF NOT EXISTS workspace_members (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    permissions TEXT,
    joined_at INTEGER NOT NULL,
    UNIQUE(workspace_id, user_id),
    FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
`);

// Shared collections
db.exec(`
  CREATE TABLE IF NOT EXISTS shared_collections (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    workspace_id TEXT NOT NULL,
    shared_by TEXT NOT NULL,
    permissions TEXT DEFAULT 'view',
    shared_at INTEGER NOT NULL,
    UNIQUE(collection_id, workspace_id),
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_shared_collections_workspace ON shared_collections(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_shared_collections_collection ON shared_collections(collection_id);
`);

// User profiles (extended)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    last_active DATE,
    total_documents INTEGER DEFAULT 0,
    total_words_read INTEGER DEFAULT 0,
    achievements TEXT,
    preferences TEXT,
    is_public BOOLEAN DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_level ON user_profiles(level);
`);

// Achievements/Badges
db.exec(`
  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    coin_reward INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common',
    requirements TEXT NOT NULL,
    unlock_message TEXT,
    is_hidden BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
  CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);
`);

// User achievements (unlocked)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at INTEGER NOT NULL,
    progress INTEGER DEFAULT 100,
    UNIQUE(user_id, achievement_id),
    FOREIGN KEY(achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at);
`);

// Learning Goals
db.exec(`
  CREATE TABLE IF NOT EXISTS learning_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    difficulty TEXT DEFAULT 'medium',
    xp_reward INTEGER DEFAULT 0,
    deadline DATE,
    is_public BOOLEAN DEFAULT 0,
    milestones TEXT,
    resources TEXT,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_learning_goals_user ON learning_goals(user_id);
  CREATE INDEX IF NOT EXISTS idx_learning_goals_status ON learning_goals(status);
  CREATE INDEX IF NOT EXISTS idx_learning_goals_workspace ON learning_goals(workspace_id);
`);

// Daily Challenges
db.exec(`
  CREATE TABLE IF NOT EXISTS daily_challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    challenge_type TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 50,
    coin_reward INTEGER DEFAULT 10,
    active_date DATE NOT NULL,
    difficulty TEXT DEFAULT 'easy',
    icon TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(active_date);
`);

// User challenge progress
db.exec(`
  CREATE TABLE IF NOT EXISTS user_challenge_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT 0,
    completed_at INTEGER,
    UNIQUE(user_id, challenge_id),
    FOREIGN KEY(challenge_id) REFERENCES daily_challenges(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON user_challenge_progress(user_id);
`);

// Likes table
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_likes (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(activity_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_activity_likes_activity ON activity_likes(activity_id);
  CREATE INDEX IF NOT EXISTS idx_activity_likes_user ON activity_likes(user_id);
`);

// Comments table (if not exists)
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_comments (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    parent_comment_id TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY(parent_comment_id) REFERENCES activity_comments(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_activity_comments_activity ON activity_comments(activity_id);
  CREATE INDEX IF NOT EXISTS idx_activity_comments_user ON activity_comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_activity_comments_parent ON activity_comments(parent_comment_id);
`);

// Conversations table
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    participant1_id TEXT NOT NULL,
    participant2_id TEXT NOT NULL,
    last_message_id TEXT,
    last_message_at INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(participant1_id, participant2_id)
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
  CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at);
`);

// Messages table
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
`);

// Typing indicators table
db.exec(`
  CREATE TABLE IF NOT EXISTS typing_indicators (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    UNIQUE(conversation_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_typing_conversation ON typing_indicators(conversation_id);
`);

// Shares table
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_shares (
    id TEXT PRIMARY KEY,
    activity_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    platform TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_activity_shares_activity ON activity_shares(activity_id);
  CREATE INDEX IF NOT EXISTS idx_activity_shares_user ON activity_shares(user_id);
`);

// Study buddies / Learning partners
db.exec(`
  CREATE TABLE IF NOT EXISTS study_buddies (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    shared_goals TEXT,
    match_score INTEGER,
    created_at INTEGER NOT NULL,
    accepted_at INTEGER,
    UNIQUE(user1_id, user2_id)
  );

  CREATE INDEX IF NOT EXISTS idx_study_buddies_user1 ON study_buddies(user1_id);
  CREATE INDEX IF NOT EXISTS idx_study_buddies_user2 ON study_buddies(user2_id);
`);

// Live study sessions
db.exec(`
  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    host_id TEXT NOT NULL,
    workspace_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    topic TEXT NOT NULL,
    session_type TEXT DEFAULT 'focus',
    max_participants INTEGER DEFAULT 10,
    is_public BOOLEAN DEFAULT 1,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    status TEXT DEFAULT 'scheduled',
    participants_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_study_sessions_host ON study_sessions(host_id);
  CREATE INDEX IF NOT EXISTS idx_study_sessions_start ON study_sessions(start_time);
  CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions(status);
`);

// Session participants
db.exec(`
  CREATE TABLE IF NOT EXISTS session_participants (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    left_at INTEGER,
    focus_time INTEGER DEFAULT 0,
    UNIQUE(session_id, user_id),
    FOREIGN KEY(session_id) REFERENCES study_sessions(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
  CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
`);

// Leaderboards
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    leaderboard_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    rank INTEGER,
    period TEXT NOT NULL,
    period_start DATE NOT NULL,
    metadata TEXT,
    updated_at INTEGER NOT NULL,
    UNIQUE(user_id, leaderboard_type, period, period_start)
  );

  CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type, period);
  CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score);
`);

// User stories (Instagram-like)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_stories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    story_type TEXT NOT NULL,
    content TEXT NOT NULL,
    media_url TEXT,
    entity_id TEXT,
    views INTEGER DEFAULT 0,
    expires_at INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT 1,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_stories_user ON user_stories(user_id);
  CREATE INDEX IF NOT EXISTS idx_stories_expires ON user_stories(expires_at);
`);

// Notifications
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    icon TEXT,
    is_read BOOLEAN DEFAULT 0,
    priority TEXT DEFAULT 'normal',
    created_at INTEGER NOT NULL,
    read_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
`);

// Activity feed (for social features)
db.exec(`
  CREATE TABLE IF NOT EXISTS activity_feed (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workspace_id TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    metadata TEXT,
    is_public BOOLEAN DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
  CREATE INDEX IF NOT EXISTS idx_activity_feed_workspace ON activity_feed(workspace_id);
  CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at);
`);

// Comments/Discussions
db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    parent_comment_id TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY(parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
`);

// Reactions/Likes
db.exec(`
  CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    reaction_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(user_id, entity_type, entity_id, reaction_type)
  );

  CREATE INDEX IF NOT EXISTS idx_reactions_entity ON reactions(entity_type, entity_id);
  CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);
`);

// Following system (social)
db.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(follower_id, following_id)
  );

  CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
  CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
`);

// Collections table
db.exec(`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '📁',
    parent_id TEXT,
    position INTEGER DEFAULT 0,
    is_smart BOOLEAN DEFAULT 0,
    smart_rules TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    FOREIGN KEY(parent_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_collections_parent ON collections(parent_id);
  CREATE INDEX IF NOT EXISTS idx_collections_position ON collections(position);
`);

// Document-Collection relationships (many-to-many)
db.exec(`
  CREATE TABLE IF NOT EXISTS collection_documents (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    added_at INTEGER NOT NULL,
    position INTEGER DEFAULT 0,
    UNIQUE(collection_id, document_id),
    FOREIGN KEY(collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_collection_docs_collection ON collection_documents(collection_id);
  CREATE INDEX IF NOT EXISTS idx_collection_docs_document ON collection_documents(document_id);
`);

// Indexes for graph queries
db.run(`CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_doc_entities_doc ON document_entities(document_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_doc_entities_entity ON document_entities(entity_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_entity_rels_a ON entity_relationships(entity_a_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_entity_rels_b ON entity_relationships(entity_b_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_highlights_document ON highlights(document_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notes_document ON notes(document_id)`);

  // Create indexes for documents
  db.run(`CREATE INDEX IF NOT EXISTS idx_url ON documents(url)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON documents(created_at DESC)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_title ON documents(title)`);

  // Create indexes for chunks
  db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_index ON chunks(document_id, chunk_index)`);

  // Save to disk
  saveDatabase();

  console.log('✅ Database tables initialized');
}



// Near the top of database.ts, after db is created:
export { db };

// Save database to disk
function saveDatabase() {
  if (!isInitialized) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Call init and wait for it
initDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Helper to ensure DB is ready
export function ensureDbReady(): Promise<void> {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (isInitialized) {
        resolve();
      } else {
        setTimeout(checkReady, 100);
      }
    };
    checkReady();
  });
}

// ==================== DOCUMENT OPERATIONS ====================

export interface DocumentRow {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  excerpt: string | null;
  author: string | null;
  site_name: string | null;
  favicon: string | null;
  word_count: number | null;
  created_at: number;
  updated_at: number | null;
}

export interface InsertDocumentData {
  id: string;
  url: string;
  title?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  site_name?: string;
  favicon?: string;
  word_count?: number;
}

/**
 * Insert a new document
 */
export function insertDocument(data: InsertDocumentData): void {
  db.run(
    `
    INSERT INTO documents (
      id, url, title, content, excerpt, author, site_name, favicon, word_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      data.id,
      data.url,
      data.title || null,
      data.content || null,
      data.excerpt || null,
      data.author || null,
      data.site_name || null,
      data.favicon || null,
      data.word_count || null,
      Date.now(),
    ]
  );

  saveDatabase();
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  type: 'personal' | 'family' | 'team' | 'public';
  owner_id: string;
  avatar: string | null;
  is_public: number;
  member_limit: number;
  created_at: number;
  updated_at: number | null;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  permissions: string | null;
  joined_at: number;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  workspace_id: string | null;
  action_type: 'captured' | 'shared' | 'commented' | 'liked' | 'completed_goal';
  entity_type: 'document' | 'collection' | 'goal' | 'comment';
  entity_id: string;
  metadata: string | null;
  is_public: number;
  created_at: number;
}

/**
 * Create workspace
 */
export function createWorkspace(workspace: Omit<Workspace, 'updated_at'>): void {
  const stmt = db.prepare(`
    INSERT INTO workspaces (
      id, name, description, type, owner_id, avatar, is_public, member_limit, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    workspace.id,
    workspace.name,
    workspace.description,
    workspace.type,
    workspace.owner_id,
    workspace.avatar,
    workspace.is_public,
    workspace.member_limit,
    workspace.created_at,
  ]);
}

/**
 * Get all workspaces for user
 */
export function getUserWorkspaces(userId: string): Workspace[] {
  const result = db.exec(`
    SELECT DISTINCT w.* FROM workspaces w
    LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
    WHERE w.owner_id = ? OR wm.user_id = ?
    ORDER BY w.created_at DESC
  `, [userId, userId]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Workspace;
  });
}

/**
 * Add member to workspace
 */
export function addWorkspaceMember(member: WorkspaceMember): void {
  const stmt = db.prepare(`
    INSERT INTO workspace_members (id, workspace_id, user_id, role, permissions, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    member.id,
    member.workspace_id,
    member.user_id,
    member.role,
    member.permissions,
    member.joined_at,
  ]);
}

export interface UserProfile {
  user_id: string;
  username: string;
  display_name: string;
  avatar: string | null;
  bio: string | null;
  level: number;
  xp: number;
  coins: number;
  streak_days: number;
  last_active: string | null;
  total_documents: number;
  total_words_read: number;
  achievements: string | null;
  preferences: string | null;
  is_public: number;
  created_at: number;
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: string;
  unlock_message: string | null;
  is_hidden: number;
  created_at: number;
}

export interface LearningGoal {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  description: string | null;
  category: string;
  target_type: 'documents' | 'words' | 'days' | 'topics';
  target_value: number;
  current_value: number;
  status: 'active' | 'completed' | 'abandoned';
  difficulty: 'easy' | 'medium' | 'hard';
  xp_reward: number;
  deadline: string | null;
  is_public: number;
  milestones: string | null;
  resources: string | null;
  created_at: number;
  completed_at: number | null;
}

/**
 * Create or update user profile
 */
export function upsertUserProfile(profile: UserProfile): void {
  const stmt = db.prepare(`
    INSERT INTO user_profiles (
      user_id, username, display_name, avatar, bio, level, xp, coins,
      streak_days, last_active, total_documents, total_words_read,
      achievements, preferences, is_public, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      username = excluded.username,
      display_name = excluded.display_name,
      avatar = excluded.avatar,
      bio = excluded.bio,
      level = excluded.level,
      xp = excluded.xp,
      coins = excluded.coins,
      streak_days = excluded.streak_days,
      last_active = excluded.last_active,
      total_documents = excluded.total_documents,
      total_words_read = excluded.total_words_read,
      achievements = excluded.achievements,
      preferences = excluded.preferences,
      is_public = excluded.is_public
  `);

  stmt.run([
    profile.user_id,
    profile.username,
    profile.display_name,
    profile.avatar,
    profile.bio,
    profile.level,
    profile.xp,
    profile.coins,
    profile.streak_days,
    profile.last_active,
    profile.total_documents,
    profile.total_words_read,
    profile.achievements,
    profile.preferences,
    profile.is_public,
    profile.created_at,
  ]);
}

/**
 * Get user profile
 */
export function getUserProfile(userId: string): UserProfile | null {
  const result = db.exec('SELECT * FROM user_profiles WHERE user_id = ?', [userId]);
  
  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: any = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj as UserProfile;
}

/**
 * Add XP to user
 */
export function addUserXP(userId: string, xp: number): void {
  const profile = getUserProfile(userId);
  if (!profile) return;

  const newXP = profile.xp + xp;
  const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

  db.exec(
    'UPDATE user_profiles SET xp = ?, level = ? WHERE user_id = ?',
    [newXP, newLevel, userId]
  );

  // Check for level up achievement
  if (newLevel > profile.level) {
    // Trigger level up notification
    createNotification({
      user_id: userId,
      type: 'level_up',
      title: `Level Up! 🎉`,
      message: `You've reached level ${newLevel}!`,
      icon: '🎊',
      priority: 'high',
    });
  }
}

/**
 * Create learning goal
 */
export function createLearningGoal(goal: LearningGoal): void {
  const stmt = db.prepare(`
    INSERT INTO learning_goals (
      id, user_id, workspace_id, title, description, category, target_type,
      target_value, current_value, status, difficulty, xp_reward, deadline,
      is_public, milestones, resources, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    goal.id,
    goal.user_id,
    goal.workspace_id,
    goal.title,
    goal.description,
    goal.category,
    goal.target_type,
    goal.target_value,
    goal.current_value,
    goal.status,
    goal.difficulty,
    goal.xp_reward,
    goal.deadline,
    goal.is_public,
    goal.milestones,
    goal.resources,
    goal.created_at,
    goal.completed_at,
  ]);
}

/**
 * Update goal progress
 */
export function updateGoalProgress(goalId: string, newValue: number): void {
  const result = db.exec('SELECT * FROM learning_goals WHERE id = ?', [goalId]);
  
  if (result.length === 0 || result[0].values.length === 0) return;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const goal: any = {};
  columns.forEach((col, idx) => {
    goal[col] = row[idx];
  });

  const isCompleted = newValue >= goal.target_value;

  if (isCompleted && goal.status !== 'completed') {
    // Complete the goal
    db.exec(
      'UPDATE learning_goals SET current_value = ?, status = ?, completed_at = ? WHERE id = ?',
      [newValue, 'completed', Date.now(), goalId]
    );

    // Award XP
    addUserXP(goal.user_id, goal.xp_reward);

    // Create notification
    createNotification({
      user_id: goal.user_id,
      type: 'goal_completed',
      title: `Goal Completed! 🎯`,
      message: `You've completed: ${goal.title}`,
      icon: '✅',
      priority: 'high',
    });
  } else {
    db.exec('UPDATE learning_goals SET current_value = ? WHERE id = ?', [newValue, goalId]);
  }
}

/**
 * Get user goals
 */
export function getUserGoals(userId: string): LearningGoal[] {
  const result = db.exec(`
    SELECT * FROM learning_goals
    WHERE user_id = ?
    ORDER BY 
      CASE status 
        WHEN 'active' THEN 1 
        WHEN 'completed' THEN 2 
        ELSE 3 
      END,
      created_at DESC
  `, [userId]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as LearningGoal;
  });
}

/**
 * Create notification
 */
interface CreateNotification {
  user_id: string;
  type: string;
  title: string;
  message: string;
  action_url?: string;
  icon?: string;
  priority?: string;
}

export function createNotification(notif: CreateNotification): void {
  const id = generateId('notif');
  
  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, action_url, icon, priority, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);

  stmt.run([
    id,
    notif.user_id,
    notif.type,
    notif.title,
    notif.message,
    notif.action_url || null,
    notif.icon || null,
    notif.priority || 'normal',
    Date.now(),
  ]);
}

/**
 * Seed achievements
 */
export function seedAchievements(): void {
  const achievements = [
    {
      key: 'first_capture',
      name: 'First Step',
      description: 'Capture your first document',
      icon: '🎯',
      category: 'beginner',
      xp_reward: 10,
      coin_reward: 5,
      rarity: 'common',
      requirements: JSON.stringify({ documents: 1 }),
    },
    {
      key: 'early_bird',
      name: 'Early Bird',
      description: 'Capture 10 documents',
      icon: '🐦',
      category: 'progress',
      xp_reward: 50,
      coin_reward: 25,
      rarity: 'common',
      requirements: JSON.stringify({ documents: 10 }),
    },
    {
      key: 'bookworm',
      name: 'Bookworm',
      description: 'Read 100,000 words',
      icon: '📚',
      category: 'reading',
      xp_reward: 200,
      coin_reward: 100,
      rarity: 'rare',
      requirements: JSON.stringify({ words: 100000 }),
    },
    {
      key: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      category: 'streak',
      xp_reward: 100,
      coin_reward: 50,
      rarity: 'rare',
      requirements: JSON.stringify({ streak: 7 }),
    },
    {
      key: 'knowledge_master',
      name: 'Knowledge Master',
      description: 'Reach level 10',
      icon: '👑',
      category: 'milestone',
      xp_reward: 500,
      coin_reward: 250,
      rarity: 'epic',
      requirements: JSON.stringify({ level: 10 }),
    },
    {
      key: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Join 5 workspaces',
      icon: '🦋',
      category: 'social',
      xp_reward: 150,
      coin_reward: 75,
      rarity: 'rare',
      requirements: JSON.stringify({ workspaces: 5 }),
    },
    {
      key: 'teacher',
      name: 'Teacher',
      description: 'Share 10 collections',
      icon: '🎓',
      category: 'sharing',
      xp_reward: 300,
      coin_reward: 150,
      rarity: 'epic',
      requirements: JSON.stringify({ shared: 10 }),
    },
    {
      key: 'legend',
      name: 'Legend',
      description: 'Reach level 50',
      icon: '⭐',
      category: 'milestone',
      xp_reward: 5000,
      coin_reward: 2500,
      rarity: 'legendary',
      requirements: JSON.stringify({ level: 50 }),
    },
  ];

  achievements.forEach(ach => {
    const id = generateId('ach');
    try {
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO achievements (
          id, key, name, description, icon, category, xp_reward, coin_reward,
          rarity, requirements, is_hidden, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);

      stmt.run([
        id,
        ach.key,
        ach.name,
        ach.description,
        ach.icon,
        ach.category,
        ach.xp_reward,
        ach.coin_reward,
        ach.rarity,
        ach.requirements,
        Date.now(),
      ]);
    } catch (error) {
      // Achievement already exists
    }
  });
}

/**
 * Share collection with workspace
 */
export function shareCollectionWithWorkspace(
  collectionId: string,
  workspaceId: string,
  sharedBy: string,
  permissions: string = 'view'
): void {
  const id = generateId('share');
  
  const stmt = db.prepare(`
    INSERT INTO shared_collections (id, collection_id, workspace_id, shared_by, permissions, shared_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run([id, collectionId, workspaceId, sharedBy, permissions, Date.now()]);
}

/**
 * Get workspace activity feed
 */
export function getWorkspaceActivity(workspaceId: string, limit: number = 50): ActivityItem[] {
  const result = db.exec(`
    SELECT * FROM activity_feed
    WHERE workspace_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [workspaceId, limit]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as ActivityItem;
  });
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_id: string | null;
  last_message_at: number | null;
  created_at: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: number;
  created_at: number;
}

/**
 * Get or create conversation between two users
 */
export function getOrCreateConversation(user1Id: string, user2Id: string): string {
  // Always order IDs consistently to avoid duplicates
  const [p1, p2] = [user1Id, user2Id].sort();

  // Try to find existing conversation
  const result = db.exec(`
    SELECT id FROM conversations
    WHERE (participant1_id = ? AND participant2_id = ?)
       OR (participant1_id = ? AND participant2_id = ?)
  `, [p1, p2, p2, p1]);

  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as string;
  }

  // Create new conversation
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  db.exec(`
    INSERT INTO conversations (id, participant1_id, participant2_id, created_at)
    VALUES (?, ?, ?, ?)
  `, [id, p1, p2, Date.now()]);

  return id;
}

/**
 * Get user conversations
 */
export function getUserConversations(userId: string): any[] {
  const result = db.exec(`
    SELECT * FROM conversations
    WHERE participant1_id = ? OR participant2_id = ?
    ORDER BY last_message_at DESC NULLS LAST, created_at DESC
  `, [userId, userId]);

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

/**
 * Get messages in conversation
 */
export function getConversationMessages(conversationId: string, limit: number = 50): Message[] {
  const result = db.exec(`
    SELECT * FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [conversationId, limit]);

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Message;
  }).reverse(); // Reverse to show oldest first
}

/**
 * Send message
 */
export function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Message {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const createdAt = Date.now();

  db.exec(`
    INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `, [id, conversationId, senderId, content, createdAt]);

  // Update conversation last message
  db.exec(`
    UPDATE conversations
    SET last_message_id = ?, last_message_at = ?
    WHERE id = ?
  `, [id, createdAt, conversationId]);

  return {
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    content,
    is_read: 0,
    created_at: createdAt,
  };
}

/**
 * Mark messages as read
 */
export function markMessagesAsRead(conversationId: string, userId: string): void {
  db.exec(`
    UPDATE messages
    SET is_read = 1
    WHERE conversation_id = ? AND sender_id != ? AND is_read = 0
  `, [conversationId, userId]);
}

/**
 * Get unread message count
 */
export function getUnreadCount(userId: string): number {
  const result = db.exec(`
    SELECT COUNT(*) as count FROM messages m
    INNER JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.participant1_id = ? OR c.participant2_id = ?)
      AND m.sender_id != ?
      AND m.is_read = 0
  `, [userId, userId, userId]);

  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
}
/**
 * Add activity to feed
 */
export function addActivityToFeed(activity: Omit<ActivityItem, 'id'>): void {
  const id = generateId('activity');
  
  const stmt = db.prepare(`
    INSERT INTO activity_feed (
      id, user_id, workspace_id, action_type, entity_type, entity_id, metadata, is_public, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    id,
    activity.user_id,
    activity.workspace_id,
    activity.action_type,
    activity.entity_type,
    activity.entity_id,
    activity.metadata,
    activity.is_public,
    activity.created_at,
  ]);
}

/**
 * Get public activity feed (discover page)
 */
export function getPublicActivity(limit: number = 50): ActivityItem[] {
  const result = db.exec(`
    SELECT * FROM activity_feed
    WHERE is_public = 1
    ORDER BY created_at DESC
    LIMIT ?
  `, [limit]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as ActivityItem;
  });
}

/**
 * Update an existing document
 */
export function updateDocument(id: string, data: Partial<InsertDocumentData>): void {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value || null);
    }
  });

  values.push(Date.now(), id);

  db.run(
    `UPDATE documents SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`,
    values
  );

  saveDatabase();
}

/**
 * Get document by ID
 */
export function getDocumentById(id: string): DocumentRow | null {
  const result = db.exec('SELECT * FROM documents WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  return rowToDocument(result[0].columns, result[0].values[0]);
}

/**
 * Get document by URL
 */
export function getDocumentByUrl(url: string): DocumentRow | null {
  const result = db.exec('SELECT * FROM documents WHERE url = ?', [url]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  return rowToDocument(result[0].columns, result[0].values[0]);
}

/**
 * Get all documents (with pagination)
 */
export function getAllDocuments(limit = 100, offset = 0): DocumentRow[] {
  const result = db.exec(
    'SELECT * FROM documents ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => rowToDocument(result[0].columns, row));
}

/**
 * Get total document count
 */
export function getDocumentCount(): number {
  const result = db.exec('SELECT COUNT(*) as count FROM documents');
  if (result.length === 0) return 0;
  return Number(result[0].values[0][0]) || 0;
}

/**
 * Delete document by ID
 */
export function deleteDocument(id: string): void {
  db.run('DELETE FROM documents WHERE id = ?', [id]);
  saveDatabase();
}

/**
 * Search documents by title or content
 */
export function searchDocuments(query: string, limit = 20): DocumentRow[] {
  const searchPattern = `%${query}%`;
  const result = db.exec(
    `SELECT * FROM documents 
     WHERE title LIKE ? OR content LIKE ?
     ORDER BY created_at DESC LIMIT ?`,
    [searchPattern, searchPattern, limit]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => rowToDocument(result[0].columns, row));
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  const totalDocs = getDocumentCount();

  let totalWords = 0;
  let avgWords = 0;

  const totalResult = db.exec('SELECT SUM(word_count) as total FROM documents');
  if (totalResult.length > 0 && totalResult[0].values.length > 0) {
    totalWords = Number(totalResult[0].values[0][0]) || 0;
  }

  const avgResult = db.exec('SELECT AVG(word_count) as average FROM documents');
  if (avgResult.length > 0 && avgResult[0].values.length > 0) {
    avgWords = Math.round(Number(avgResult[0].values[0][0]) || 0);
  }

  return {
    totalDocuments: totalDocs,
    totalWords: totalWords,
    averageWords: avgWords,
  };
}

/**
 * Get documents by date range
 */
export function getDocumentsByDateRange(startDate: number, endDate: number): DocumentRow[] {
  const result = db.exec(`
    SELECT * FROM documents
    WHERE created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC
  `, [startDate, endDate]);

  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as DocumentRow;
  });
}

/**
 * Helper: Convert SQL row to DocumentRow object
 */
function rowToDocument(
  columns: string[],
  values: (string | number | null | Uint8Array)[]
): DocumentRow {
  const row: Record<string, any> = {};

  columns.forEach((col, idx) => {
    const value = values[idx];
    row[col] = value instanceof Uint8Array ? null : value;
  });

  return {
    id: row.id as string,
    url: row.url as string,
    title: row.title ?? null,
    content: row.content ?? null,
    excerpt: row.excerpt ?? null,
    author: row.author ?? null,
    site_name: row.site_name ?? null,
    favicon: row.favicon ?? null,
    word_count:
      row.word_count !== null && row.word_count !== undefined
        ? Number(row.word_count)
        : null,
    created_at: Number(row.created_at),
    updated_at:
      row.updated_at !== null && row.updated_at !== undefined
        ? Number(row.updated_at)
        : null,
  };
}


/**
 * Close database (save final state)
 */
export function closeDatabase(): void {
  saveDatabase();
  db.close();
  console.log('📊 Database connection closed');
}

// ==================== CHUNK OPERATIONS ====================

export interface ChunkRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  char_count: number | null;
  embedding: string | null; // JSON string of the embedding array
  created_at: number;
}

export interface InsertChunkData {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  char_count?: number;
  embedding?: number[]; // Array of numbers
}

/**
 * Insert a chunk
 */
export function insertChunk(data: InsertChunkData): void {
  db.run(
    `
    INSERT INTO chunks (
      id, document_id, content, chunk_index, char_count, embedding, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
    [
      data.id,
      data.document_id,
      data.content,
      data.chunk_index,
      data.char_count || null,
      data.embedding ? JSON.stringify(data.embedding) : null,
      Date.now(),
    ]
  );

  saveDatabase();
}

export function insertChunks(chunks: InsertChunkData[]): void {
  chunks.forEach((chunk) => {
    db.run(
      `
      INSERT INTO chunks (
        id, document_id, content, chunk_index, char_count, embedding, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        chunk.id,
        chunk.document_id,
        chunk.content,
        chunk.chunk_index,
        chunk.char_count || null,
        chunk.embedding ? JSON.stringify(chunk.embedding) : null,
        Date.now(),
      ]
    );
  });

  saveDatabase();
}

/**
 * Get all chunks for a document
 */
export function getChunksByDocumentId(documentId: string): ChunkRow[] {
  const result = db.exec(
    'SELECT * FROM chunks WHERE document_id = ? ORDER BY chunk_index ASC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => rowToChunk(result[0].columns, row));
}

/**
 * Get chunk count for a document
 */
export function getChunkCountByDocumentId(documentId: string): number {
  const result = db.exec('SELECT COUNT(*) as count FROM chunks WHERE document_id = ?', [
    documentId,
  ]);
  if (result.length === 0) return 0;
  return Number(result[0].values[0][0]) || 0;
}

/**
 * Get total chunk count
 */
export function getTotalChunkCount(): number {
  const result = db.exec('SELECT COUNT(*) as count FROM chunks');
  if (result.length === 0) return 0;
  return Number(result[0].values[0][0]) || 0;
}

/**
 * Delete all chunks for a document
 */
export function deleteChunksByDocumentId(documentId: string): void {
  db.run('DELETE FROM chunks WHERE document_id = ?', [documentId]);
  saveDatabase();
}

/**
 * Helper: Convert SQL row to ChunkRow object
 */
function rowToChunk(
  columns: string[],
  values: (string | number | null | Uint8Array)[]
): ChunkRow {
  const chunk: Record<string, string | number | null> = {};
  columns.forEach((col, idx) => {
    const value = values[idx];
    chunk[col] = value instanceof Uint8Array ? null : value;
  });
  return chunk as unknown as ChunkRow;
}

/**
 * Execute raw SQL (read-only use recommended)
 */
export function exec(sql: string, params?: any[]) {
  return db.exec(sql, params);
}

// ==================== HIGHLIGHTS OPERATIONS ====================

export interface HighlightRow {
  id: string;
  document_id: string;
  text: string;
  color: string | null;
  position_start: number;
  position_end: number;
  created_at: number;
}

export interface InsertHighlightData {
  id: string;
  document_id: string;
  text: string;
  color?: string;
  position_start: number;
  position_end: number;
}

// ============= COLLECTIONS =============

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  parent_id: string | null;
  position: number;
  is_smart: number;
  smart_rules: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface InsertCollection {
  id: string;
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  parent_id?: string | null;
  position?: number;
  is_smart?: number;
  smart_rules?: string | null;
  created_at: number;
}

export interface CollectionDocument {
  id: string;
  collection_id: string;
  document_id: string;
  added_at: number;
  position: number;
}

/**
 * Insert a new collection
 */
export function insertCollection(collection: InsertCollection): void {
  const stmt = db.prepare(`
    INSERT INTO collections (
      id, name, description, color, icon, parent_id, position, 
      is_smart, smart_rules, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([
    collection.id,
    collection.name,
    collection.description || null,
    collection.color || '#6366f1',
    collection.icon || '📁',
    collection.parent_id || null,
    collection.position || 0,
    collection.is_smart || 0,
    collection.smart_rules || null,
    collection.created_at,
  ]);
}

/**
 * Get all collections
 */
export function getAllCollections(): Collection[] {
  const result = db.exec('SELECT * FROM collections ORDER BY position ASC, created_at DESC');
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Collection;
  });
}

/**
 * Get collection by ID
 */
export function getCollectionById(id: string): Collection | null {
  const result = db.exec('SELECT * FROM collections WHERE id = ?', [id]);
  
  if (result.length === 0 || result[0].values.length === 0) return null;

  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj: any = {};
  columns.forEach((col, idx) => {
    obj[col] = row[idx];
  });
  return obj as Collection;
}

/**
 * Get child collections (subcollections)
 */
export function getChildCollections(parentId: string | null): Collection[] {
  const query = parentId 
    ? 'SELECT * FROM collections WHERE parent_id = ? ORDER BY position ASC'
    : 'SELECT * FROM collections WHERE parent_id IS NULL ORDER BY position ASC';
  
  const result = parentId 
    ? db.exec(query, [parentId])
    : db.exec(query);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Collection;
  });
}

/**
 * Update collection
 */
export function updateCollection(id: string, updates: Partial<Collection>): void {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return;

  fields.push('updated_at = ?');
  values.push(Date.now());
  values.push(id);

  const stmt = db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(values);
}

/**
 * Delete collection (and all subcollections)
 */
export function deleteCollection(id: string): void {
  db.exec('DELETE FROM collections WHERE id = ?', [id]);
}

/**
 * Add document to collection
 */

/**
 * Generate unique ID with prefix
 */

export function addDocumentToCollection(collectionId: string, documentId: string): void {
  const id = generateId('col_doc');
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO collection_documents (id, collection_id, document_id, added_at, position)
    VALUES (?, ?, ?, ?, 0)
  `);

  stmt.run([id, collectionId, documentId, Date.now()]);
}

/**
 * Remove document from collection
 */
export function removeDocumentFromCollection(collectionId: string, documentId: string): void {
  db.exec(
    'DELETE FROM collection_documents WHERE collection_id = ? AND document_id = ?',
    [collectionId, documentId]
  );
}

/**
 * Get documents in a collection
 */
export function getCollectionDocuments(collectionId: string): Document[] {
  const result = db.exec(`
    SELECT d.* FROM documents d
    INNER JOIN collection_documents cd ON d.id = cd.document_id
    WHERE cd.collection_id = ?
    ORDER BY cd.position ASC, cd.added_at DESC
  `, [collectionId]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Document;
  });
}

/**
 * Get collections containing a document
 */
export function getDocumentCollections(documentId: string): Collection[] {
  const result = db.exec(`
    SELECT c.* FROM collections c
    INNER JOIN collection_documents cd ON c.id = cd.collection_id
    WHERE cd.document_id = ?
    ORDER BY c.name ASC
  `, [documentId]);
  
  if (result.length === 0) return [];

  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as Collection;
  });
}

/**
 * Get collection statistics
 */
export function getCollectionStats(collectionId: string): {
  documentCount: number;
  totalWords: number;
  lastUpdated: number | null;
} {
  const countResult = db.exec(
    'SELECT COUNT(*) as count FROM collection_documents WHERE collection_id = ?',
    [collectionId]
  );

  const wordsResult = db.exec(`
    SELECT SUM(d.word_count) as total_words, MAX(cd.added_at) as last_updated
    FROM documents d
    INNER JOIN collection_documents cd ON d.id = cd.document_id
    WHERE cd.collection_id = ?
  `, [collectionId]);

  const documentCount = countResult[0]?.values[0]?.[0] as number || 0;
  const totalWords = wordsResult[0]?.values[0]?.[0] as number || 0;
  const lastUpdated = wordsResult[0]?.values[0]?.[1] as number || null;

  return {
    documentCount,
    totalWords,
    lastUpdated,
  };
}

export function insertHighlight(data: InsertHighlightData): void {
  db.run(
    `INSERT INTO highlights (id, document_id, text, color, position_start, position_end, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.document_id,
      data.text,
      data.color || 'yellow',
      data.position_start,
      data.position_end,
      Date.now(),
    ]
  );
  saveDatabase();
}

export function getHighlightsByDocumentId(documentId: string): HighlightRow[] {
  const result = db.exec(
    'SELECT * FROM highlights WHERE document_id = ? ORDER BY position_start ASC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as HighlightRow;
  });
}

export function deleteHighlight(id: string): void {
  db.run('DELETE FROM highlights WHERE id = ?', [id]);
  saveDatabase();
}

// ==================== NOTES OPERATIONS ====================

export interface NoteRow {
  id: string;
  document_id: string;
  content: string;
  highlight_id: string | null;
  created_at: number;
  updated_at: number | null;
}

export interface InsertNoteData {
  id: string;
  document_id: string;
  content: string;
  highlight_id?: string;
}

export function insertNote(data: InsertNoteData): void {
  db.run(
    `INSERT INTO notes (id, document_id, content, highlight_id, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [data.id, data.document_id, data.content, data.highlight_id || null, Date.now()]
  );
  saveDatabase();
}

export function getNotesByDocumentId(documentId: string): NoteRow[] {
  const result = db.exec(
    'SELECT * FROM notes WHERE document_id = ? ORDER BY created_at DESC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as NoteRow;
  });
}

export function updateNote(id: string, content: string): void {
  db.run('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?', [
    content,
    Date.now(),
    id,
  ]);
  saveDatabase();
}

export function deleteNote(id: string): void {
  db.run('DELETE FROM notes WHERE id = ?', [id]);
  saveDatabase();
}

// ==================== ENTITIES OPERATIONS ====================

export interface EntityRow {
  id: string;
  name: string;
  type: string;
  frequency: number;
  created_at: number;
}

export interface InsertEntityData {
  id: string;
  name: string;
  type: string;
  frequency?: number;
}

export function insertEntity(data: InsertEntityData): void {
  db.run(
    `INSERT OR IGNORE INTO entities (id, name, type, frequency, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [data.id, data.name, data.type, data.frequency || 1, Date.now()]
  );
  saveDatabase();
}

export function getEntityByName(name: string): EntityRow | null {
  const result = db.exec('SELECT * FROM entities WHERE LOWER(name) = LOWER(?)', [name]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  const obj: any = {};
  result[0].columns.forEach((col, i) => {
    obj[col] = row[i];
  });
  return obj as EntityRow;
}

export function getAllEntities(limit: number = 1000): EntityRow[] {
  const result = db.exec(
    `SELECT * FROM entities ORDER BY frequency DESC LIMIT ?`,
    [limit]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as EntityRow;
  });
}

export function incrementEntityFrequency(entityId: string): void {
  db.run('UPDATE entities SET frequency = frequency + 1 WHERE id = ?', [entityId]);
  saveDatabase();
}

// ==================== DOCUMENT-ENTITY RELATIONSHIPS ====================

export interface DocumentEntityRow {
  id: string;
  document_id: string;
  entity_id: string;
  frequency: number;
  context: string | null;
  created_at: number;
}

export interface InsertDocumentEntityData {
  id: string;
  document_id: string;
  entity_id: string;
  frequency?: number;
  context?: string;
}

export function insertDocumentEntity(data: InsertDocumentEntityData): void {
  db.run(
    `INSERT OR REPLACE INTO document_entities (id, document_id, entity_id, frequency, context, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.document_id,
      data.entity_id,
      data.frequency || 1,
      data.context || null,
      Date.now(),
    ]
  );
  saveDatabase();
}

export function getDocumentEntities(documentId: string): DocumentEntityRow[] {
  const result = db.exec(
    'SELECT * FROM document_entities WHERE document_id = ? ORDER BY frequency DESC',
    [documentId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as DocumentEntityRow;
  });
}

export function getEntityDocuments(entityId: string): DocumentEntityRow[] {
  const result = db.exec(
    'SELECT * FROM document_entities WHERE entity_id = ? ORDER BY frequency DESC',
    [entityId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as DocumentEntityRow;
  });
}

// ==================== ENTITY RELATIONSHIPS ====================

export interface EntityRelationshipRow {
  id: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type: string | null;
  strength: number;
  created_at: number;
}

export interface InsertEntityRelationshipData {
  id: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type?: string;
  strength?: number;
}

export function insertEntityRelationship(data: InsertEntityRelationshipData): void {
  db.run(
    `INSERT OR REPLACE INTO entity_relationships (id, entity_a_id, entity_b_id, relationship_type, strength, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.entity_a_id,
      data.entity_b_id,
      data.relationship_type || 'related_to',
      data.strength || 0.5,
      Date.now(),
    ]
  );
  saveDatabase();
}

export function getEntityRelationships(entityId: string): EntityRelationshipRow[] {
  const result = db.exec(
    `SELECT * FROM entity_relationships 
     WHERE entity_a_id = ? OR entity_b_id = ?
     ORDER BY strength DESC`,
    [entityId, entityId]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as EntityRelationshipRow;
  });
}

export function getAllEntityRelationships(limit: number = 1000): EntityRelationshipRow[] {
  const result = db.exec(
    `SELECT * FROM entity_relationships ORDER BY strength DESC LIMIT ?`,
    [limit]
  );

  if (result.length === 0) return [];

  return result[0].values.map((row) => {
    const obj: any = {};
    result[0].columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as EntityRelationshipRow;
  });
}

// Update exports
export default {
  insertDocument,
  updateDocument,
  getDocumentById,
  getDocumentByUrl,
  getAllDocuments,
  getDocumentCount,
  deleteDocument,
  searchDocuments,
  getDatabaseStats,
  closeDatabase,
  insertChunk,
  insertChunks,
  getChunksByDocumentId,
  getChunkCountByDocumentId,
  getTotalChunkCount,
  deleteChunksByDocumentId,
  insertHighlight,
  getHighlightsByDocumentId,
  deleteHighlight,
  insertNote,
  getNotesByDocumentId,
  updateNote,
  deleteNote,
  insertEntity,
  getEntityByName,
  getAllEntities,
  incrementEntityFrequency,
  insertDocumentEntity,
  getDocumentEntities,
  getEntityDocuments,
  insertEntityRelationship,
  getEntityRelationships,
  getAllEntityRelationships,
};
