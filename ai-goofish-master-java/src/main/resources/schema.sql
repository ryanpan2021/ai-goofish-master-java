CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL UNIQUE,
    keyword VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    max_pages INT DEFAULT 3,
    personal_only BOOLEAN DEFAULT TRUE,
    min_price VARCHAR(50),
    max_price VARCHAR(50),
    ai_prompt_text TEXT,
    email_address VARCHAR(255),
    email_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    product_id VARCHAR(255) UNIQUE,
    title TEXT,
    price VARCHAR(100),
    link VARCHAR(1024) UNIQUE,
    location VARCHAR(255),
    seller_nick TEXT,
    detail_fetch_status VARCHAR(50),
    product_data TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    product_id INT,
    analysis_status VARCHAR(50),
    is_recommended BOOLEAN,
    reason TEXT,
    full_response TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cookies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cookie_value TEXT NOT NULL,
    status VARCHAR(50),
    last_used TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    level VARCHAR(50),
    message TEXT,
    details TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    product_id INT,
    email_address VARCHAR(255),
    subject TEXT,
    status VARCHAR(50),
    error_message TEXT,
    sent_at TIMESTAMP
);
