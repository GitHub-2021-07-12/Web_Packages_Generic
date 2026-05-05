select
    `users`.`id`, `users`.`name`, `users`.`passwordHash`,
    `authRecords`.`token`
from
    `users`
    left join `authRecords` on `authRecords`.`user_id` = `users`.`id`
where `authRecords`.`token` = :token || `users`.`name` = :name
limit 1;
