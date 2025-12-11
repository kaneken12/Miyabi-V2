const DatabaseDriver = require("better-sqlite3");
const path = require("path");
const { ModelFactory } = require("./model");

class Database {
    constructor() {
        const dbPath = path.join(__dirname, "miyabi.db");
        this.db = new DatabaseDriver(dbPath);

        this.init();
    }

    init() {
        try {
            this.createTables();
            this.initializeDefaultSettings();
            this.initializeCreatorUser();
            console.log("✅ Base SQLite initialisée");
        } catch (error) {
            console.error("❌ Erreur initialisation DB:", error);
        }
    }

    connect() {
        console.log("✅ SQLite connecté (aucune connexion nécessaire)");
    }

    // ----------------------
    // TABLES
    // ----------------------
    createTables() {
        // Messages
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id TEXT UNIQUE,
                chat_id TEXT,
                sender TEXT,
                message TEXT,
                is_group INTEGER DEFAULT 0,
                is_bot INTEGER DEFAULT 0,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Conversations
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT UNIQUE,
                last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
                message_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Mood history
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS mood_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mood_name TEXT,
                duration INTEGER,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Users
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone_number TEXT UNIQUE,
                name TEXT,
                is_creator INTEGER DEFAULT 0,
                last_seen TEXT DEFAULT CURRENT_TIMESTAMP,
                interaction_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Bot settings
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS bot_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE,
                setting_value TEXT,
                setting_type TEXT DEFAULT 'string',
                description TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
    }

    // ----------------------
    // DEFAULT SETTINGS
    // ----------------------
    initializeDefaultSettings() {
        const defaults = [
            { key: "bot_name", value: "Miyabi", type: "string", description: "Nom du bot" },
            { key: "mood_change_interval_min", value: "300000", type: "number", description: "Intervalle minimum" },
            { key: "mood_change_interval_max", value: "900000", type: "number", description: "Intervalle maximum" },
            { key: "max_context_messages", value: "5", type: "number", description: "Messages de contexte" },
            { key: "response_timeout", value: "30000", type: "number", description: "Timeout réponses" }
        ];

        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO bot_settings (setting_key, setting_value, setting_type, description)
            VALUES (?, ?, ?, ?)
        `);

        defaults.forEach(s =>
            stmt.run(s.key, s.value, s.type, s.description)
        );
    }

    initializeCreatorUser() {
        const creator = process.env.CREATOR_NUMBER;
        if (!creator) return;

        this.db.prepare(`
            INSERT INTO users (phone_number, name, is_creator, interaction_count)
            VALUES (?, ?, ?, 0)
            ON CONFLICT(phone_number) DO UPDATE SET is_creator = 1, last_seen = CURRENT_TIMESTAMP
        `).run(creator, "Créateur", 1);
    }

    // ----------------------
    // SAVE MESSAGE
    // ----------------------
    saveMessage(msg) {
        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO messages 
            (message_id, chat_id, sender, message, is_group, is_bot, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            msg.message_id,
            msg.chat_id,
            msg.sender,
            msg.message,
            msg.is_group ? 1 : 0,
            msg.is_bot ? 1 : 0,
            msg.timestamp
        );

        this.updateConversation(msg.chat_id);
        this.updateUserStats(msg.sender);
    }

    // ----------------------
    // CONVERSATIONS
    // ----------------------
    updateConversation(chatId) {
        this.db.prepare(`
            INSERT INTO conversations (chat_id, last_activity, message_count)
            VALUES (?, CURRENT_TIMESTAMP, 1)
            ON CONFLICT(chat_id) DO UPDATE SET
                last_activity = CURRENT_TIMESTAMP,
                message_count = message_count + 1
        `).run(chatId);
    }

    // ----------------------
    // USERS
    // ----------------------
    updateUserStats(phone) {
        this.db.prepare(`
            INSERT INTO users (phone_number, last_seen, interaction_count)
            VALUES (?, CURRENT_TIMESTAMP, 1)
            ON CONFLICT(phone_number) DO UPDATE SET
                last_seen = CURRENT_TIMESTAMP,
                interaction_count = interaction_count + 1
        `).run(phone);
    }

    // ----------------------
    // CONTEXT
    // ----------------------
    getConversationContext(chatId, limit = 5) {
        const rows = this.db.prepare(`
            SELECT sender, message, timestamp, is_bot
            FROM messages
            WHERE chat_id = ?
            ORDER BY id DESC
            LIMIT ?
        `).all(chatId, limit);

        return rows.reverse();
    }

    // ----------------------
    // STATS
    // ----------------------
    getStats() {
        const get = sql => this.db.prepare(sql).get().n;

        return {
            totalMessages: get("SELECT COUNT(*) AS n FROM messages"),
            totalConversations: get("SELECT COUNT(*) AS n FROM conversations"),
            totalUsers: get("SELECT COUNT(*) AS n FROM users"),
            botMessages: get("SELECT COUNT(*) AS n FROM messages WHERE is_bot = 1")
        };
    }

    // ----------------------
    // MOOD
    // ----------------------
    saveMoodChange(name, duration) {
        this.db.prepare(`
            INSERT INTO mood_history (mood_name, duration)
            VALUES (?, ?)
        `).run(name, duration);
    }

    getMoodHistory(limit = 10) {
        return this.db.prepare(`
            SELECT * FROM mood_history
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(limit);
    }

    // ----------------------
    // SETTINGS
    // ----------------------
    getSetting(key) {
        const row = this.db.prepare(`
            SELECT * FROM bot_settings WHERE setting_key = ?
        `).get(key);

        return row ? ModelFactory.createBotSettings(row) : null;
    }

    updateSetting(key, value) {
        const row = this.db.prepare(`
            UPDATE bot_settings
            SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
            WHERE setting_key = ?
            RETURNING *
        `).get(value, key);

        return row ? ModelFactory.createBotSettings(row) : null;
    }

    // ----------------------
    // USERS / CONVERSATIONS (lists)
    // ----------------------
    getUser(phone) {
        const row = this.db.prepare(`
            SELECT * FROM users WHERE phone_number = ?
        `).get(phone);

        return row ? ModelFactory.createUser(row) : null;
    }

    getTopUsers(limit = 10) {
        const rows = this.db.prepare(`
            SELECT * FROM users 
            ORDER BY interaction_count DESC
            LIMIT ?
        `).all(limit);

        return ModelFactory.createMultipleFromDB("user", rows);
    }

    getRecentConversations(limit = 10) {
        const rows = this.db.prepare(`
            SELECT * FROM conversations
            ORDER BY last_activity DESC
            LIMIT ?
        `).all(limit);

        return ModelFactory.createMultipleFromDB("conversation", rows);
    }

    disconnect() {
        console.log("ℹ SQLite ne nécessite pas de déconnexion.");
    }
}

module.exports = Database;
