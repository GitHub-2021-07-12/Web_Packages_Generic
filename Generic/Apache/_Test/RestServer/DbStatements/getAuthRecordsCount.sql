select count(*) as 'count'
from `authRecords`
where `user_id` = :user_id;
