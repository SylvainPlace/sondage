-- Schema for Ideas Box feature (D1)
-- Run with: npx wrangler d1 execute ideas_db --local --file=./schema.sql

-- Create ideas table
CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0
);

-- Create idea_votes table to track who voted
CREATE TABLE IF NOT EXISTS idea_votes (
    idea_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idea_id, user_email),
    FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
);

-- Create index for faster sorting by upvotes
CREATE INDEX IF NOT EXISTS idx_ideas_upvotes ON ideas(upvotes DESC);

-- Create index for faster lookup by user email
CREATE INDEX IF NOT EXISTS idx_idea_votes_email ON idea_votes(user_email);