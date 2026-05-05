delete from `authRecords`
where `client_id` = :client_id
order by `date`
limit :count;
