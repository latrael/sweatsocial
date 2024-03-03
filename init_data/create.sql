DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users(
	user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
	username VARCHAR(50) UNIQUE NOT NULL,
 	password VARCHAR(255) NOT NULL
);


DROP TABLE IF EXISTS friends CASCADE;
CREATE TABLE friends (
    friendshipID SERIAL PRIMARY KEY,
    userIDA INTEGER,
    userIDB INTEGER,
    status VARCHAR(40),
    FOREIGN KEY (userIDA) REFERENCES users(user_id),
    FOREIGN KEY (userIDB) REFERENCES users(user_id)
);