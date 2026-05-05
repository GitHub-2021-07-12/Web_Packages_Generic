drop table if exists `authRecords`;
create table if not exists `authRecords` (
    `client_id` int,
    `date` dateTime default current_timeStamp,
    `token` varchar(32),

    key (`client_id`),
    unique (`token`)
);

drop table if exists `clients`;
create table `clients` (
    `date` dateTime default current_timeStamp,
    `id` int auto_increment,
    `name` varchar(32),
    `passwordHash` varchar(64),

    primary key (`id`),
    unique (`name`)
);
