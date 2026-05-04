-- Beginner-friendly yoga class library. Verified live via YouTube oembed.
-- Mix of Yoga With Adriene, Yoga With Kassandra, SarahBeth Yoga, Brett Larkin,
-- Yoga With Bird, Travis Eliot, Boho Beautiful, Five Parks Yoga, Charlie Follows.
-- Run after schema.sql. Safe to re-run (does delete first).

delete from classes;

insert into classes (title, instructor, youtube_url, duration_minutes, tags) values
  -- Yoga With Adriene · Foundation / beginner
  ('Yoga For Complete Beginners', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=v7AYKMP6rOE', 24, array['foundation','beginner']),
  ('20 Min Yoga For Beginners - Start Here', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=vNyJuQuuMC8', 22, array['foundation','beginner']),
  ('Yoga For Beginners - A Little Goes a Long Way', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=M7JfqOfqSmI', 19, array['foundation','beginner']),
  ('Foundations of Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=1p-ayBIRRHs', 20, array['foundation','beginner']),
  ('Yoga Flow For Beginners - Intro To Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=4TLHLNX65-4', 25, array['foundation','beginner']),
  ('Morning Yoga Flow - 20 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=LqXZ628YNj4', 22, array['morning','beginner','gentle']),
  ('Morning Yoga for Beginners - Gentle', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=GnHTeHAZQhM', 22, array['morning','beginner','gentle']),
  ('Early Morning Yoga and Meditation', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=mMSsHji8LDA', 20, array['morning','gentle']),
  ('Gentle, Relaxing, Cozy Flow - 20 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=jHZPtn15agE', 21, array['gentle','beginner']),
  -- Yoga With Adriene · Mobility / Wednesday
  ('Yoga For Neck, Shoulders, Upper Back', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=X3-gKPNyrTA', 11, array['mobility','back','spine']),
  ('Yoga for People Who Sit All Day', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=a-sZbOfau6c', 9, array['mobility','hips']),
  ('Hip Mobility - Open Your Hips', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=GffXQl3zvUI', 14, array['mobility','hips']),
  ('20 Min Yoga For Hips - Feel Good Flow', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=zwoVcrdmLOE', 24, array['hips','mobility']),
  ('Yoga For Hips & Lower Back Release', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=Ho9em79_0qg', 23, array['hips','back','mobility']),
  ('Brain + Body Balance - 22 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=XN3JB67-a_k', 23, array['balance','mobility']),
  ('Yoga For Lower Back Pain', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=XeXz8fIZDCE', 16, array['back','mobility']),
  ('Disciplined Core - 15 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=yqRqRURB9IE', 15, array['core']),
  ('Morning Mobility Yoga', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=2IcWJobNDck', 22, array['mobility','morning']),
  -- Yoga With Adriene · Stretch / Restorative / Friday
  ('Full Body Flow - 20 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=b1H3xO3x_Js', 19, array['full-body','flexibility']),
  ('Yoga Flow - 20 Min Vinyasa Sequence', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=xmeNZI8inWI', 19, array['full-body','flexibility']),
  ('Fill Your Cup Yoga - 20 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=H4dVbaLqg84', 21, array['full-body','gentle']),
  ('Yoga To Feel Your Best - 22 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=BPK9WNtpBgk', 23, array['full-body','gentle']),
  ('Yoga For Anxiety and Stress', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=hJbRpHZr_d0', 25, array['gentle','restorative']),
  ('Yoga for Heavy Hearts', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=2akHh5GgzvM', 19, array['gentle','restorative']),
  ('Yoga For When You Are Overstimulated', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=rPcBPTrPsgU', 17, array['restorative','gentle']),
  ('Bedtime Yoga - 20 Min Practice', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=v7SN-d4qXx0', 19, array['restorative','gentle']),
  ('Yoga For Flexibility - 16 Min', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=Yzm3fA2HhkQ', 16, array['flexibility','stretch']),
  ('Yoga Stretch', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=AF9d2Icl4fA', 21, array['stretch','flexibility','full-body']),
  ('Yoga For Hamstrings', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=-Mirm7LKvKk', 23, array['stretch','flexibility']),
  ('Mountain Flow - Hands Free Yoga', 'Yoga With Adriene', 'https://www.youtube.com/watch?v=arydjHTU0iE', 10, array['balance','full-body']),
  -- Yoga With Kassandra
  ('15 Min Gentle Morning Yoga for Beginners', 'Yoga With Kassandra', 'https://www.youtube.com/watch?v=QyHO_BkBUp8', 15, array['foundation','beginner','gentle','morning']),
  ('Rise and Shine - 10 Min Morning Yoga Flow', 'Yoga With Kassandra', 'https://www.youtube.com/watch?v=CBdpJUKeIYc', 10, array['foundation','morning','beginner']),
  ('10 Min Morning Yoga Flow - Spine Mobility', 'Yoga With Kassandra', 'https://www.youtube.com/watch?v=dyTpgGgVcwg', 10, array['mobility','spine','morning']),
  ('20 Min Yoga for Flexibility & Relaxation', 'Yoga With Kassandra', 'https://www.youtube.com/watch?v=4Lq5Sf9FDpY', 20, array['stretch','flexibility','restorative']),
  -- SarahBeth Yoga
  ('10 Min Full Body Morning Yoga Stretch', 'SarahBeth Yoga', 'https://www.youtube.com/watch?v=jVgTcVEQSNw', 10, array['morning','foundation','gentle']),
  ('10 Min Morning Yoga Stretch in Bed', 'SarahBeth Yoga', 'https://www.youtube.com/watch?v=neRDhPokIWg', 10, array['morning','gentle','beginner']),
  ('10 Min Full Body Yoga for Mobility & Flexibility', 'SarahBeth Yoga', 'https://www.youtube.com/watch?v=XVTk6wL1yrI', 10, array['mobility','full-body']),
  ('10 Min Yoga for Back & Posture', 'SarahBeth Yoga', 'https://www.youtube.com/watch?v=dWcORvu-jtU', 10, array['back','spine','core']),
  ('10 Min Yoga for Flexibility & Balance Flow', 'SarahBeth Yoga', 'https://www.youtube.com/watch?v=9El6tx56Q2g', 10, array['balance','full-body','mobility']),
  ('10 Min Yoga Stretch for Neck, Shoulder & Upper Back', 'SarahBeth Yoga', 'https://www.youtube.com/watch?v=fDzJbizG0cQ', 10, array['back','mobility']),
  -- Brett Larkin Yoga
  ('5 Min Morning Yoga for Energy', 'Brett Larkin Yoga', 'https://www.youtube.com/watch?v=_Jsv8xeLlX4', 5, array['morning','beginner','foundation']),
  -- Yoga With Bird
  ('15 Min Morning Yoga Stretch', 'Yoga With Bird', 'https://www.youtube.com/watch?v=au4g9pWygJY', 15, array['morning','gentle','beginner']),
  ('12 Min Yoga for Hips', 'Yoga With Bird', 'https://www.youtube.com/watch?v=SoYieueub6w', 12, array['hips','mobility']),
  ('20 Min Full Body Yoga to Recharge', 'Yoga With Bird', 'https://www.youtube.com/watch?v=lT_dNUpDvUE', 20, array['full-body','stretch']),
  ('8 Min Gentle Yoga Stretch for Tension Relief', 'Yoga With Bird', 'https://www.youtube.com/watch?v=IpvkMS-cX1c', 8, array['stretch','restorative']),
  -- Travis Eliot
  ('20 Min Morning Yoga for Energy', 'Travis Eliot', 'https://www.youtube.com/watch?v=q-BkzP-AXRo', 20, array['morning','foundation']),
  ('5 Yoga Poses to Improve Spinal Mobility', 'Travis Eliot', 'https://www.youtube.com/watch?v=Q2mfA6gemLM', 10, array['spine','mobility','back']),
  ('20 Min Yoga for Flexibility - Full Body Stretch', 'Travis Eliot', 'https://www.youtube.com/watch?v=fyVjVAiWno8', 20, array['stretch','flexibility','full-body']),
  -- Boho Beautiful
  ('20 Min Yoga Workout For Mobility', 'Boho Beautiful', 'https://www.youtube.com/watch?v=x53Ua6mJbg4', 20, array['mobility','full-body']),
  -- Five Parks Yoga
  -- Charlie Follows
  ('20 Min Daily Yoga Flow - Everyday Full Body', 'Charlie Follows', 'https://www.youtube.com/watch?v=AkVJtluZLTo', 20, array['full-body','flexibility']);
