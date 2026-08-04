select p."createdAt", i.name, p.state, p."publishDate",
       left(p.content,42) as preview
from "Post" p
left join "Integration" i on p."integrationId"=i.id
where p."deletedAt" is null
  and p.state in ('QUEUE','PUBLISHED','ERROR')
order by p."publishDate" desc
limit 14;
