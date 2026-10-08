// Seed de ejemplo: carga en PostgreSQL el mismo conjunto de datos realistas que usa el modo "mock" del panel.
// Uso:  npm run db:migrate   (crea las tablas)   y después   npm run db:seed
// Es idempotente: vacía las tablas y vuelve a cargar los datos.
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { generateDataset } from '../src/mocks/generate'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const d = (iso: string | null) => (iso ? new Date(iso) : null)

async function main() {
  const data = generateDataset()
  console.log('Vaciando tablas…')
  // Orden inverso a las dependencias.
  await prisma.$transaction([
    prisma.taskComment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.hosting.deleteMany(),
    prisma.domain.deleteMany(),
    prisma.website.deleteMany(),
    prisma.client.deleteMany(),
    prisma.user.deleteMany(),
    prisma.setting.deleteMany(),
  ])

  console.log('Cargando datos de ejemplo…')
  await prisma.user.createMany({ data: data.users.map((u) => ({ ...u, createdAt: d(u.createdAt)!, updatedAt: d(u.updatedAt)! })) })

  await prisma.client.createMany({
    data: data.clients.map(({ archived, createdAt, updatedAt, formData, ...c }) => ({ ...c, formData: formData ? { ...formData } : undefined, archivedAt: archived ? new Date() : null, createdAt: d(createdAt)!, updatedAt: d(updatedAt)! })),
  })

  await prisma.website.createMany({
    data: data.websites.map((w) => ({ ...w, startDate: d(w.startDate)!, publishDate: d(w.publishDate), createdAt: d(w.createdAt)!, updatedAt: d(w.updatedAt)! })),
  })

  await prisma.domain.createMany({
    data: data.domains.map((x) => ({ ...x, registeredAt: d(x.registeredAt)!, renewsAt: d(x.renewsAt)!, createdAt: d(x.createdAt)!, updatedAt: d(x.updatedAt)! })),
  })

  await prisma.hosting.createMany({
    data: data.hostings.map((h) => ({ ...h, contractedAt: d(h.contractedAt)!, renewsAt: d(h.renewsAt)!, createdAt: d(h.createdAt)!, updatedAt: d(h.updatedAt)! })),
  })

  await prisma.invoice.createMany({
    data: data.invoices.map((i) => ({ ...i, issuedAt: d(i.issuedAt)!, dueAt: d(i.dueAt)!, createdAt: d(i.createdAt)!, updatedAt: d(i.updatedAt)! })),
  })

  const owner = data.users.find((u) => u.role === 'OWNER')
  await prisma.task.createMany({
    data: data.tasks.map(({ comments: _comments, ...t }) => ({ ...t, dueAt: d(t.dueAt), completedAt: d(t.completedAt), createdAt: d(t.createdAt)!, updatedAt: d(t.updatedAt)! })),
  })
  await prisma.taskComment.createMany({
    data: data.tasks.flatMap((t) => t.comments.map((c) => ({ id: c.id, taskId: t.id, authorId: c.author === 'Unai' ? owner?.id : null, authorName: c.author, text: c.text, createdAt: d(c.createdAt)! }))),
  })

  await prisma.activityLog.createMany({
    data: data.activity.map((a) => ({ id: a.id, entity: a.entity.toUpperCase() as 'CLIENT', entityId: a.entityId, clientId: a.clientId, message: a.message, actorName: a.actor, createdAt: d(a.createdAt)! })),
  })

  await prisma.setting.createMany({
    data: [
      { key: 'company', value: data.settings.company },
      { key: 'taxes', value: data.settings.taxes },
      { key: 'currency', value: data.settings.currency },
      { key: 'hostingProviders', value: data.settings.hostingProviders },
      { key: 'domainRegistrars', value: data.settings.domainRegistrars },
    ],
  })

  console.log(`Listo: ${data.clients.length} clientes, ${data.websites.length} webs, ${data.domains.length} dominios, ${data.hostings.length} hostings, ${data.invoices.length} facturas, ${data.tasks.length} tareas.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
