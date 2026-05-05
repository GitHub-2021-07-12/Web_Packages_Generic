delete from `authRecords`
where `user_id` = :user_id
order by `date`
limit :count;
