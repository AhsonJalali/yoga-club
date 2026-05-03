-- Seed curated beginner-friendly classes (Yoga With Adriene). Run after schema.sql.
-- Add or remove freely.

insert into classes (title, instructor, youtube_url, duration_minutes, tags) values
  ('Yoga For Complete Beginners', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=v7AYKMP6rOE', 20, array['beginner','foundation']),
  ('20 Minute Morning Yoga', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=4pKly2JojMw', 20, array['beginner','morning']),
  ('Gentle Yoga Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=oX6I1HHDgFI', 20, array['gentle','flow']),
  ('Yoga For Hips and Lower Back', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=hJbRpHZr_d0', 25, array['mobility','hips','back']),
  ('Yoga For Flexibility', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=L_xrDAtykMI', 20, array['flexibility','stretch']),
  ('Yoga For Balance', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=M-8FvC3GD8c', 20, array['balance','beginner']),
  ('Yoga For Stress Relief', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=hJbRpHZr_d0', 20, array['gentle','stress']),
  ('Beginner Full Body Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=149LrbqKEbk', 30, array['beginner','full-body']),
  ('Restorative Yoga', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=BiWnAOs6e_E', 35, array['restorative','gentle']),
  ('Slow Stretch Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=sTANio_2E0Q', 30, array['stretch','restorative']),
  ('Light Core Yoga', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=MZCXf9Wngc4', 20, array['core','beginner']),
  ('Yoga For Healthy Spine', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=A_Dh4SlytEQ', 25, array['mobility','spine','back']);
