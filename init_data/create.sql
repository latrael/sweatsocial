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

DROP TABLE IF EXISTS users_to_exercises CASCADE;
CREATE TABLE users_to_exercises (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    exercise_name VARCHAR(100),
    exercise_type VARCHAR(100),
    muscle_group VARCHAR(100),
    equipment VARCHAR(100),
    difficulty VARCHAR(100),
    instructions TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id)
)