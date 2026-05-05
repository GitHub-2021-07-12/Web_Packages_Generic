insert ignore `clients` (`name`, `passwordHash`)
values (:name, :passwordHash);
