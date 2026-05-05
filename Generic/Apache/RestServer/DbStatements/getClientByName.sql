select `id`, `name`, `passwordHash`
from `clients`
where `name` = :name;
