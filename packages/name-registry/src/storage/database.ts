import Database from 'better-sqlite3';
import type { ContentMetrics, Challenge } from '../types.js';

export class MetricsDatabase {
    private db: Database.Database;
    
    constructor(dbPath: string) {
        this.db = new Database(dbPath);
        this.initialize();
    }
    
    private initialize(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS metrics (
                public_key TEXT PRIMARY KEY,
                name TEXT,
                legitimacy_score REAL,
                usage_score REAL,
                last_activity INTEGER,
                metrics_json TEXT,
                collected_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS challenges (
                challenge_id TEXT PRIMARY KEY,
                name TEXT,
                current_owner TEXT,
                challenger TEXT,
                status TEXT,
                created INTEGER,
                response_deadline INTEGER,
                evaluation_deadline INTEGER,
                resolved INTEGER,
                challenge_json TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
            CREATE INDEX IF NOT EXISTS idx_challenges_name ON challenges(name);
            CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
        `);
    }
    
    saveMetrics(metrics: ContentMetrics): void {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO metrics 
            (public_key, name, legitimacy_score, usage_score, last_activity, metrics_json, collected_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            metrics.publicKey,
            metrics.name,
            metrics.legitimacyScore,
            metrics.usageScore,
            metrics.lastActivity,
            JSON.stringify(metrics, (_key, value) => 
                value instanceof Set ? Array.from(value) : value
            ),
            Date.now()
        );
    }
    
    getMetrics(publicKey: string): ContentMetrics | null {
        const stmt = this.db.prepare('SELECT metrics_json FROM metrics WHERE public_key = ?');
        const row = stmt.get(publicKey) as { metrics_json: string } | undefined;
        
        if (!row) return null;
        
        const parsed = JSON.parse(row.metrics_json);
        parsed.uniquePeerIds = new Set(parsed.uniquePeerIds || []);
        return parsed;
    }
    
    saveChallenge(challenge: Challenge): void {
        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO challenges 
            (challenge_id, name, current_owner, challenger, status, created, 
             response_deadline, evaluation_deadline, resolved, challenge_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            challenge.challengeId,
            challenge.name,
            challenge.currentOwner,
            challenge.challenger,
            challenge.status,
            challenge.timestamps.created,
            challenge.timestamps.responseDeadline,
            challenge.timestamps.evaluationDeadline,
            challenge.timestamps.resolved || null,
            JSON.stringify(challenge, (_key, value) => 
                typeof value === 'bigint' ? value.toString() : value
            )
        );
    }
    
    getChallenge(challengeId: string): Challenge | null {
        const stmt = this.db.prepare('SELECT challenge_json FROM challenges WHERE challenge_id = ?');
        const row = stmt.get(challengeId) as { challenge_json: string } | undefined;
        
        if (!row) return null;
        
        return JSON.parse(row.challenge_json, (_key, value) => {
            if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
                return BigInt(value);
            }
            return value;
        });
    }
    
    listChallenges(filter?: { owner?: string; challenger?: string; status?: string }): Challenge[] {
        let query = 'SELECT challenge_json FROM challenges WHERE 1=1';
        const params: any[] = [];
        
        if (filter?.owner) {
            query += ' AND current_owner = ?';
            params.push(filter.owner);
        }
        
        if (filter?.challenger) {
            query += ' AND challenger = ?';
            params.push(filter.challenger);
        }
        
        if (filter?.status) {
            query += ' AND status = ?';
            params.push(filter.status);
        }
        
        query += ' ORDER BY created DESC';
        
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params) as { challenge_json: string }[];
        
        return rows.map(row => JSON.parse(row.challenge_json, (_key, value) => {
            if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
                return BigInt(value);
            }
            return value;
        }));
    }
    
    close(): void {
        this.db.close();
    }
}
