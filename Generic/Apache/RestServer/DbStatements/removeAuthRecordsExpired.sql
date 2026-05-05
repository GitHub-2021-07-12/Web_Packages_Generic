delete from `authRecords`
where `client_id` = :client_id && timestampDiff(second, `date`, now()) > :expiration;
