insert ignore `users` (`name`, `passwordHash`)
values (:name, :passwordHash);
