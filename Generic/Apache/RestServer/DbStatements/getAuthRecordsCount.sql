select count(*) as 'count'
from `authRecords`
where `client_id` = :client_id;
