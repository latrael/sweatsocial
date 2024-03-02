INSERT INTO users (user_id, full_name, username, password) VALUES
  (91, 'Nabil Djaber', 'nabil', '$2a$12$XSHJPtIFcTQi4Qlbb5ov/O2I9nfeUNtOEjf3fwlYvpBmRhUG5pcxq'),
  (92, 'Alen Ramic', 'alen', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S'),
  (93, 'Eldin Basic', 'deen', '$2a$10$kZW6xd2Vxc2ueuChmT4BLetTs1u99DiAWldsKS/DPxexHgzDRP76S');

INSERT INTO friends(userIDA, userIDB, status) VALUES
(91, 92, 'friends'),
(92, 91, 'friends');