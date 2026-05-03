-- 12 verified Yoga With Adriene classes. All video IDs confirmed live via YouTube oembed.
-- Run after schema.sql. Safe to re-run after a `delete from classes;`.

insert into classes (title, instructor, youtube_url, duration_minutes, tags) values
  ('Yoga For Complete Beginners', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=v7AYKMP6rOE', 20, array['beginner','foundation']),
  ('Day 1 - Ease Into It (30 Days of Yoga)', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=oBu-pQG6sTY', 20, array['beginner','foundation']),
  ('Full Body Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=b1H3xO3x_Js', 20, array['beginner','full-body']),
  ('Yoga For Anxiety and Stress', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=hJbRpHZr_d0', 25, array['gentle','stress']),
  ('Total Body Yoga - Deep Stretch', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=GLy2rYHwUqY', 30, array['stretch','restorative','full-body']),
  ('Yoga For Neck, Shoulders, Upper Back', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=X3-gKPNyrTA', 10, array['mobility','back','spine']),
  ('Yoga At Your Desk', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=tAUf7aajBWE', 15, array['mobility','gentle']),
  ('Yoga For People Who Sit All Day', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=a-sZbOfau6c', 25, array['mobility','hips','back']),
  ('Yoga For Heavy Hearts', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=2akHh5GgzvM', 30, array['gentle','restorative']),
  ('Yoga For Neck Hump - Upper Spine Posture', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=n1E8aTKJmVg', 20, array['mobility','spine']),
  ('Yoga For When You Are Overstimulated', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=rPcBPTrPsgU', 25, array['restorative','gentle']),
  ('Mountain Flow - Hands Free Yoga', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=arydjHTU0iE', 30, array['balance','full-body']);
