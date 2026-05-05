drop table if exists `authRecords`;
create table if not exists `authRecords` (
    `date` dateTime default current_timeStamp,
    `token` varchar(32),
    `user_id` int,

    key (`user_id`),
    unique (`token`)
);

drop table if exists `users`;
create table `users` (
    `date` dateTime default current_timeStamp,
    `id` int auto_increment,
    `name` varchar(32),
    `passwordHash` varchar(64),

    primary key (`id`),
    unique (`name`)
);
