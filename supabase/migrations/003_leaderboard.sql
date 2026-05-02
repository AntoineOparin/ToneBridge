create or replace view leaderboard as
select id, username, xp, elo, streak
from users
order by elo desc;
