INSERT INTO users (user_id, full_name, username, password) VALUES
  (91, 'Nabil Djaber', 'nabil', '$2a$10$7.MyjjL8W2LbzEwIEHUNCOqzU9rDAz2NtzABrl9u1XprYzWS3y4xS'),
  (92, 'Alen Ramic', 'alen', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S'),
  (93, 'Eldin Basic', 'deen', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S'),
  (94, 'Tim Cook', 'tim', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S'),
  (95, 'Dwayne Johnson', 'therock', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S'),
  (96, 'Riyad Mahrez', 'mahrez', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S');

INSERT INTO friends(userIDA, userIDB, status) VALUES
(91, 92, 'friends'),
(92, 91, 'friends'),
(91, 96, 'friends'),
(96, 91, 'friends'),
(93, 95, 'friends'),
(95, 93, 'friends');