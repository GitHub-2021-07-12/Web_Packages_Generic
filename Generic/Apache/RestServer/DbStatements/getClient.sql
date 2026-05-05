select
    `clients`.`id`, `clients`.`name`, `clients`.`passwordHash`,
    `authRecords`.`token`
from
    `clients`
    left join `authRecords` on `authRecords`.`client_id` = `clients`.`id`
where `clients`.`name` = :name || `authRecords`.`token` = :token && timestampDiff(second, `authRecords`.`date`, now()) < :expiration;
